import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    Text, DateTime, ForeignKey, UniqueConstraint,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'marketplace.db')
engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={'check_same_thread': False})
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class User(Base):
    __tablename__ = 'marketplace_users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # 'teacher' or 'student'
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Course(Base):
    __tablename__ = 'marketplace_courses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    teacher_id = Column(Integer, ForeignKey('marketplace_users.id'), nullable=False)
    category = Column(String(50), nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CourseContent(Base):
    __tablename__ = 'marketplace_course_contents'

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey('marketplace_courses.id'), nullable=False)
    title = Column(String(200), nullable=False)
    content_type = Column(String(20), nullable=False)  # 'video', 'pdf', 'note'
    file_path = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    is_preview = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Purchase(Base):
    __tablename__ = 'marketplace_purchases'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('marketplace_users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('marketplace_courses.id'), nullable=False)
    amount_paid = Column(Float, nullable=False)
    status = Column(String(20), default='completed')
    purchased_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('user_id', 'course_id', name='unique_purchase'),)


def init_db():
    Base.metadata.create_all(engine)
