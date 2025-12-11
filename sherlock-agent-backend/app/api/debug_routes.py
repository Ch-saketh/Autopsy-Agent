# app/api/debug_routes.py
from flask import Blueprint, jsonify, current_app

debug_bp = Blueprint("debug_bp", __name__)

@debug_bp.route("/_routes", methods=["GET"])
def list_routes():
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({"rule": str(rule), "endpoint": rule.endpoint, "methods": sorted(list(rule.methods))})
    return jsonify(sorted(routes, key=lambda r: r["rule"]))
