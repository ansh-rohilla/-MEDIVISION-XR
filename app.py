import os
from flask import Flask, jsonify
from flask_cors import CORS
from routes.upload import api_bp
from routes.auth import auth_bp


def create_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, 'static')
    os.makedirs(os.path.join(static_dir, 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(static_dir, 'processed'), exist_ok=True)

    app = Flask(__name__, static_folder=static_dir, static_url_path='/static')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-me')
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    # In dev, do not force Secure; in prod behind HTTPS set this to True
    app.config['SESSION_COOKIE_SECURE'] = False
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    r"http://localhost:\d+",
                    r"http://127\.0\.0\.1:\d+",
                ]
            },
            r"/static/*": {"origins": "*"},
        },
        supports_credentials=True,
    )

    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')

    # Ensure SSL cert bundle is available for urllib downloads (e.g., torchvision weights)
    try:
        import certifi
        if not os.environ.get('SSL_CERT_FILE'):
            os.environ['SSL_CERT_FILE'] = certifi.where()
    except Exception:
        pass

    @app.get('/')
    def root():
        return (
            '<html><head><title>Medivision XR API</title></head>'
            '<body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px">'
            '<h1>Medivision XR API</h1>'
            '<p>Backend is running on port 5050.</p>'
            '<p>Open the frontend at <a href="http://localhost:3000">http://localhost:3000</a>.</p>'
            '<p>Health check: <a href="/api/health">/api/health</a></p>'
            '</body></html>'
        )

    @app.get('/api/health')
    def health():
        return jsonify({"ok": True})
    return app


app = create_app()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5050'))
    app.run(host='0.0.0.0', port=port, debug=True)
