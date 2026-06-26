import os
import uuid
from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from .models import SessionLocal, User, Course, CourseContent, Purchase

marketplace_bp = Blueprint('marketplace', __name__, url_prefix='/marketplace/api')

SECRET_KEY = os.environ.get('MARKETPLACE_SECRET_KEY', 'marketplace-secret-key-change-in-production')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'marketplace_uploads')
ALLOWED_EXTENSIONS = {'pdf', 'mp4', 'mov', 'avi', 'mkv', 'webm', 'png', 'jpg', 'jpeg', 'docx', 'pptx'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated


def teacher_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            if data.get('role') != 'teacher':
                return jsonify({'error': 'Teacher access required'}), 403
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated


def get_db():
    return SessionLocal()


def make_token(user_id, role):
    return jwt.encode(
        {'user_id': user_id, 'role': role, 'exp': datetime.utcnow() + timedelta(days=7)},
        SECRET_KEY,
        algorithm='HS256',
    )


# ── AUTH ──────────────────────────────────────────────────────────────

@marketplace_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    required = ['email', 'password', 'name', 'role']
    if not all(k in data for k in required):
        return jsonify({'error': 'فیلدهای ضروری وارد نشده‌اند'}), 400
    if data['role'] not in ('teacher', 'student'):
        return jsonify({'error': 'نقش باید teacher یا student باشد'}), 400

    db = get_db()
    try:
        if db.query(User).filter(User.email == data['email'].lower().strip()).first():
            return jsonify({'error': 'این ایمیل قبلاً ثبت شده است'}), 409

        user = User(
            email=data['email'].lower().strip(),
            password_hash=generate_password_hash(data['password']),
            name=data['name'].strip(),
            role=data['role'],
            bio=data.get('bio', ''),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return jsonify({
            'token': make_token(user.id, user.role),
            'user': {'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role},
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'ایمیل و رمز عبور ضروری است'}), 400

    db = get_db()
    try:
        user = db.query(User).filter(User.email == data['email'].lower().strip()).first()
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'ایمیل یا رمز عبور اشتباه است'}), 401

        return jsonify({
            'token': make_token(user.id, user.role),
            'user': {'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role, 'bio': user.bio},
        })
    finally:
        db.close()


@marketplace_bp.route('/auth/me', methods=['GET'])
@token_required
def get_me(current_user_id):
    db = get_db()
    try:
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            return jsonify({'error': 'کاربر یافت نشد'}), 404
        return jsonify({
            'id': user.id, 'email': user.email, 'name': user.name,
            'role': user.role, 'bio': user.bio,
            'created_at': user.created_at.isoformat(),
        })
    finally:
        db.close()


# ── COURSES (public) ──────────────────────────────────────────────────

@marketplace_bp.route('/courses', methods=['GET'])
def list_courses():
    db = get_db()
    try:
        query = db.query(Course).filter(Course.is_published == True)

        if cat := request.args.get('category'):
            query = query.filter(Course.category == cat)
        if search := request.args.get('search', '').strip():
            query = query.filter(Course.title.ilike(f'%{search}%'))

        courses = query.order_by(Course.created_at.desc()).all()
        result = []
        for c in courses:
            teacher = db.query(User).filter(User.id == c.teacher_id).first()
            result.append({
                'id': c.id,
                'title': c.title,
                'description': c.description,
                'price': c.price,
                'category': c.category,
                'teacher_name': teacher.name if teacher else '---',
                'content_count': db.query(CourseContent).filter(CourseContent.course_id == c.id).count(),
                'enrollment_count': db.query(Purchase).filter(Purchase.course_id == c.id).count(),
                'created_at': c.created_at.isoformat(),
            })
        return jsonify(result)
    finally:
        db.close()


@marketplace_bp.route('/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404

        teacher = db.query(User).filter(User.id == course.teacher_id).first()
        contents = db.query(CourseContent).filter(
            CourseContent.course_id == course_id
        ).order_by(CourseContent.sort_order).all()

        has_purchased = False
        is_teacher = False
        token = request.headers.get('Authorization', '')
        if token:
            try:
                t = token[7:] if token.startswith('Bearer ') else token
                d = jwt.decode(t, SECRET_KEY, algorithms=['HS256'])
                uid = d['user_id']
                is_teacher = uid == course.teacher_id
                if not is_teacher:
                    has_purchased = db.query(Purchase).filter(
                        Purchase.user_id == uid, Purchase.course_id == course_id
                    ).first() is not None
                else:
                    has_purchased = True
            except Exception:
                pass

        content_list = []
        for c in contents:
            item = {
                'id': c.id,
                'title': c.title,
                'content_type': c.content_type,
                'description': c.description,
                'is_preview': c.is_preview,
                'sort_order': c.sort_order,
            }
            if has_purchased or c.is_preview:
                item['file_path'] = c.file_path
            content_list.append(item)

        return jsonify({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'price': course.price,
            'category': course.category,
            'is_published': course.is_published,
            'teacher_name': teacher.name if teacher else '---',
            'teacher_bio': teacher.bio if teacher else '',
            'teacher_id': course.teacher_id,
            'contents': content_list,
            'enrollment_count': db.query(Purchase).filter(Purchase.course_id == course_id).count(),
            'has_purchased': has_purchased,
            'created_at': course.created_at.isoformat(),
        })
    finally:
        db.close()


# ── COURSES (teacher) ─────────────────────────────────────────────────

@marketplace_bp.route('/courses', methods=['POST'])
@teacher_required
def create_course(current_user_id):
    data = request.get_json() or {}
    if not all(k in data for k in ['title', 'description', 'price']):
        return jsonify({'error': 'عنوان، توضیحات و قیمت ضروری است'}), 400

    db = get_db()
    try:
        course = Course(
            title=data['title'].strip(),
            description=data['description'].strip(),
            price=float(data['price']),
            teacher_id=current_user_id,
            category=data.get('category', 'سایر'),
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return jsonify({
            'id': course.id, 'title': course.title, 'description': course.description,
            'price': course.price, 'category': course.category, 'is_published': course.is_published,
            'created_at': course.created_at.isoformat(),
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/courses/<int:course_id>', methods=['PUT'])
@teacher_required
def update_course(current_user_id, course_id):
    data = request.get_json() or {}
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404
        for field in ('title', 'description', 'category'):
            if field in data:
                setattr(course, field, data[field].strip())
        if 'price' in data:
            course.price = float(data['price'])
        db.commit()
        return jsonify({'id': course.id, 'title': course.title, 'price': course.price, 'is_published': course.is_published})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/courses/<int:course_id>/publish', methods=['POST'])
@teacher_required
def toggle_publish(current_user_id, course_id):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404
        course.is_published = not course.is_published
        db.commit()
        return jsonify({'is_published': course.is_published})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@teacher_required
def delete_course(current_user_id, course_id):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404
        db.query(CourseContent).filter(CourseContent.course_id == course_id).delete()
        db.query(Purchase).filter(Purchase.course_id == course_id).delete()
        db.delete(course)
        db.commit()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ── CONTENT ───────────────────────────────────────────────────────────

@marketplace_bp.route('/courses/<int:course_id>/content', methods=['POST'])
@teacher_required
def add_content(current_user_id, course_id):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404

        file_path = None
        if 'file' in request.files:
            f = request.files['file']
            if f and f.filename and allowed_file(f.filename):
                filename = secure_filename(f.filename)
                unique_name = f"{uuid.uuid4()}_{filename}"
                course_dir = os.path.join(UPLOAD_FOLDER, str(course_id))
                os.makedirs(course_dir, exist_ok=True)
                f.save(os.path.join(course_dir, unique_name))
                file_path = f"/marketplace/api/files/{course_id}/{unique_name}"

        title = request.form.get('title', '').strip()
        if not title:
            return jsonify({'error': 'عنوان محتوا ضروری است'}), 400

        content = CourseContent(
            course_id=course_id,
            title=title,
            content_type=request.form.get('content_type', 'pdf'),
            file_path=file_path,
            description=request.form.get('description', ''),
            is_preview=request.form.get('is_preview', 'false').lower() == 'true',
            sort_order=int(request.form.get('sort_order', 0)),
        )
        db.add(content)
        db.commit()
        db.refresh(content)
        return jsonify({
            'id': content.id, 'title': content.title, 'content_type': content.content_type,
            'is_preview': content.is_preview, 'file_path': content.file_path, 'sort_order': content.sort_order,
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/content/<int:content_id>', methods=['DELETE'])
@teacher_required
def delete_content(current_user_id, content_id):
    db = get_db()
    try:
        content = db.query(CourseContent).filter(CourseContent.id == content_id).first()
        if not content:
            return jsonify({'error': 'محتوا یافت نشد'}), 404
        course = db.query(Course).filter(Course.id == content.course_id, Course.teacher_id == current_user_id).first()
        if not course:
            return jsonify({'error': 'دسترسی رد شد'}), 403
        if content.file_path:
            parts = content.file_path.rstrip('/').split('/')
            if len(parts) >= 2:
                fp = os.path.join(UPLOAD_FOLDER, parts[-2], parts[-1])
                if os.path.exists(fp):
                    os.remove(fp)
        db.delete(content)
        db.commit()
        return jsonify({'status': 'deleted'})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@marketplace_bp.route('/files/<int:course_id>/<path:filename>', methods=['GET'])
@token_required
def serve_file(current_user_id, course_id, filename):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد'}), 404

        if course.teacher_id != current_user_id:
            purchase = db.query(Purchase).filter(
                Purchase.user_id == current_user_id,
                Purchase.course_id == course_id,
            ).first()
            if not purchase:
                content = db.query(CourseContent).filter(
                    CourseContent.course_id == course_id,
                    CourseContent.file_path.like(f'%{filename}'),
                ).first()
                if not content or not content.is_preview:
                    return jsonify({'error': 'برای دسترسی ابتدا دوره را خریداری کنید'}), 403

        course_dir = os.path.join(UPLOAD_FOLDER, str(course_id))
        return send_from_directory(course_dir, filename)
    finally:
        db.close()


# ── PURCHASE ──────────────────────────────────────────────────────────

@marketplace_bp.route('/courses/<int:course_id>/purchase', methods=['POST'])
@token_required
def purchase_course(current_user_id, course_id):
    db = get_db()
    try:
        course = db.query(Course).filter(Course.id == course_id, Course.is_published == True).first()
        if not course:
            return jsonify({'error': 'دوره یافت نشد یا منتشر نشده است'}), 404
        if course.teacher_id == current_user_id:
            return jsonify({'error': 'شما نمی‌توانید دوره خودتان را خریداری کنید'}), 400
        if db.query(Purchase).filter(Purchase.user_id == current_user_id, Purchase.course_id == course_id).first():
            return jsonify({'error': 'این دوره قبلاً خریداری شده است'}), 409

        purchase = Purchase(user_id=current_user_id, course_id=course_id, amount_paid=course.price)
        db.add(purchase)
        db.commit()
        return jsonify({'status': 'success', 'message': 'دوره با موفقیت خریداری شد', 'course_id': course_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ── STUDENT ───────────────────────────────────────────────────────────

@marketplace_bp.route('/student/purchases', methods=['GET'])
@token_required
def get_purchases(current_user_id):
    db = get_db()
    try:
        purchases = db.query(Purchase).filter(
            Purchase.user_id == current_user_id
        ).order_by(Purchase.purchased_at.desc()).all()

        result = []
        for p in purchases:
            course = db.query(Course).filter(Course.id == p.course_id).first()
            if course:
                teacher = db.query(User).filter(User.id == course.teacher_id).first()
                result.append({
                    'purchase_id': p.id,
                    'purchased_at': p.purchased_at.isoformat(),
                    'amount_paid': p.amount_paid,
                    'course': {
                        'id': course.id,
                        'title': course.title,
                        'description': course.description,
                        'category': course.category,
                        'teacher_name': teacher.name if teacher else '---',
                        'content_count': db.query(CourseContent).filter(CourseContent.course_id == course.id).count(),
                    },
                })
        return jsonify(result)
    finally:
        db.close()


# ── TEACHER ───────────────────────────────────────────────────────────

@marketplace_bp.route('/teacher/courses', methods=['GET'])
@teacher_required
def get_teacher_courses(current_user_id):
    db = get_db()
    try:
        courses = db.query(Course).filter(Course.teacher_id == current_user_id).order_by(Course.created_at.desc()).all()
        result = []
        for course in courses:
            purchases = db.query(Purchase).filter(Purchase.course_id == course.id, Purchase.status == 'completed').all()
            contents = db.query(CourseContent).filter(CourseContent.course_id == course.id).order_by(CourseContent.sort_order).all()
            result.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'price': course.price,
                'category': course.category,
                'is_published': course.is_published,
                'content_count': len(contents),
                'enrollment_count': len(purchases),
                'total_revenue': sum(p.amount_paid for p in purchases),
                'created_at': course.created_at.isoformat(),
                'contents': [{
                    'id': c.id, 'title': c.title, 'content_type': c.content_type,
                    'is_preview': c.is_preview, 'file_path': c.file_path, 'sort_order': c.sort_order,
                } for c in contents],
            })
        return jsonify(result)
    finally:
        db.close()


@marketplace_bp.route('/teacher/stats', methods=['GET'])
@teacher_required
def get_teacher_stats(current_user_id):
    db = get_db()
    try:
        courses = db.query(Course).filter(Course.teacher_id == current_user_id).all()
        course_ids = [c.id for c in courses]
        purchases = db.query(Purchase).filter(Purchase.course_id.in_(course_ids), Purchase.status == 'completed').all()
        return jsonify({
            'total_courses': len(courses),
            'published_courses': sum(1 for c in courses if c.is_published),
            'total_enrollments': len(purchases),
            'total_revenue': sum(p.amount_paid for p in purchases),
        })
    finally:
        db.close()


# ── MISC ──────────────────────────────────────────────────────────────

@marketplace_bp.route('/categories', methods=['GET'])
def get_categories():
    return jsonify([
        'ریاضیات', 'فیزیک', 'شیمی', 'زیست شناسی', 'برنامه نویسی',
        'طراحی', 'بازرگانی', 'زبان انگلیسی', 'تاریخ', 'جغرافیا',
        'هنر', 'موسیقی', 'ورزش', 'سایر',
    ])
