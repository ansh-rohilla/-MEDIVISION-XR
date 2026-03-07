import os
import sqlite3
import time
from flask import Blueprint, request, jsonify, session, current_app
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'app.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def ensure_tables():
    os.makedirs(BASE_DIR, exist_ok=True)
    with get_db() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                name TEXT,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )


ensure_tables()


def serialize_user(row):
    return {"id": row["id"], "email": row["email"], "name": row["name"]}


def get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt='auth-token')


def uid_from_request():
    uid = session.get('user_id')
    if uid:
        return uid
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1].strip()
        try:
            data = get_serializer().loads(token, max_age=60*60*24*7)
            return data.get('uid')
        except Exception:
            return None
    return None

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    name = (data.get('name') or '').strip()
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    pw_hash = generate_password_hash(password)
    try:
        with get_db() as db:
            cur = db.execute(
                'INSERT INTO users (email, name, password_hash, created_at) VALUES (?,?,?,?)',
                (email, name, pw_hash, int(time.time()))
            )
            user_id = cur.lastrowid
            cur = db.execute('SELECT id, email, name FROM users WHERE id=?', (user_id,))
            row = cur.fetchone()
            session['user_id'] = row['id']
            token = get_serializer().dumps({"uid": row['id']})
            return jsonify({"user": serialize_user(row), "token": token})
    except sqlite3.IntegrityError:
        return jsonify({"error": "email already registered"}), 409


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    with get_db() as db:
        cur = db.execute('SELECT id, email, name, password_hash FROM users WHERE email=?', (email,))
        row = cur.fetchone()
        if not row or not check_password_hash(row['password_hash'], password):
            return jsonify({"error": "invalid credentials"}), 401
        session['user_id'] = row['id']
        token = get_serializer().dumps({"uid": row['id']})
        return jsonify({"user": {"id": row['id'], "email": row['email'], "name": row['name']}, "token": token})


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"ok": True})


@auth_bp.route('/auth/me', methods=['GET'])
def me():
    uid = uid_from_request()
    if not uid:
        return jsonify({"error": "unauthenticated"}), 401
    with get_db() as db:
        cur = db.execute('SELECT id, email, name FROM users WHERE id=?', (uid,))
        row = cur.fetchone()
        if not row:
            session.pop('user_id', None)
            return jsonify({"error": "unauthenticated"}), 401
        return jsonify({"user": serialize_user(row)})
