#!/usr/bin/env python3
"""
Quick deployment script for MEDIVISION-XR backend
"""
import os
import json
from flask import Flask, jsonify
from flask_cors import CORS
from routes.upload import api_bp
from routes.auth import auth_bp
from routes.labels import labels_bp

def create_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, 'static')
    os.makedirs(os.path.join(static_dir, 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(static_dir, 'processed'), exist_ok=True)

    app = Flask(__name__, static_folder=static_dir, static_url_path='/static')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-me')
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(static_dir, 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    CORS(app, origins=["*"], supports_credentials=True)

    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(labels_bp, url_prefix='/api')

    @app.route('/')
    def index():
        return jsonify({
            'status': 'healthy',
            'message': 'MEDIVISION-XR Backend API',
            'version': '1.0.0',
            'endpoints': [
                '/api/labels/<body_part>',
                '/api/upload',
                '/api/evaluate'
            ]
        })

    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'})

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting MEDIVISION-XR backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
