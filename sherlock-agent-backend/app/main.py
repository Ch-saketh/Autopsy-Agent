# app/main.py
from flask import Flask, jsonify
from flask_cors import CORS
from app.api.upload import upload_bp
from app.api.cases import cases_bp
from app.api.artifacts import artifacts_bp
from app.api.analysis import analysis_bp
from app.api.debug_routes import debug_bp


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(cases_bp, url_prefix="/api")
    app.register_blueprint(artifacts_bp, url_prefix="/api")
    app.register_blueprint(analysis_bp, url_prefix="/api")
    app.register_blueprint(debug_bp, url_prefix="/api")

    return app

if __name__ == "__main__":
    app = create_app()
    # dev port 8000 to match your earlier runs
    app.run(host="127.0.0.1", port=8000, debug=True)
