"""
Standalone server for the educational marketplace.
Run with: python marketplace_server.py
Does NOT require Redis, MongoDB, or AI/ML packages.
"""
from flask import Flask
from marketplace import marketplace_bp
from marketplace.models import init_db

app = Flask(__name__)
app.register_blueprint(marketplace_bp)
init_db()


@app.after_request
def cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response


if __name__ == '__main__':
    print("\n✅ Marketplace server running at http://localhost:5002")
    print("   Frontend should proxy /marketplace/api → http://localhost:5002\n")
    app.run(debug=True, port=5002)
