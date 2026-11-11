import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import config
from backend.database import init_db, seed_demo_data

from backend.routes.auth_routes import auth_bp
from backend.routes.expense_routes import expense_bp
from backend.routes.analytics_routes import analytics_bp
from backend.routes.ai_routes import ai_bp
from backend.routes.paypal_routes import paypal_bp

def create_app():
    # Frontend dist directory
    dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    
    app = Flask(__name__, static_folder=str(dist_dir), static_url_path="/")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Auto initialize and seed database on startup
    init_db()
    seed_demo_data()

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(expense_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(paypal_bp)

    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "healthy",
            "app": "FinWise AI – Smart Financial Assistant",
            "version": "1.0.0",
            "environment": config.FLASK_ENV,
            "paypal_configured": bool(config.PAYPAL_CLIENT_ID and config.PAYPAL_CLIENT_SECRET)
        }), 200

    # Serve React static assets
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if dist_dir.exists() and (dist_dir / path).is_file():
            return send_from_directory(str(dist_dir), path)
        elif dist_dir.exists() and (dist_dir / "index.html").is_file():
            return send_from_directory(str(dist_dir), "index.html")
        else:
            return jsonify({
                "message": "FinWise AI Backend API is running.",
                "docs": "/api/health",
                "frontend": "Frontend development server running on port 5173"
            }), 200

    @app.errorhandler(404)
    def not_found(e):
        if dist_dir.exists() and (dist_dir / "index.html").is_file():
            return send_from_directory(str(dist_dir), "index.html")
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=config.PORT, debug=config.DEBUG)
