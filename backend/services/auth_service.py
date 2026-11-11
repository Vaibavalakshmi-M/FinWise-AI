import os
import re
import secrets
import time
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import get_db

# Simple in-memory token store for session management
ACTIVE_SESSIONS = {}

def validate_email(email):
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(pattern, email) is not None

def register_user(username, email, password, monthly_income=3200.0, currency="USD"):
    if not username or len(username.strip()) < 3:
        return {"success": False, "error": "Username must be at least 3 characters long."}
    
    if not email or not validate_email(email.strip()):
        return {"success": False, "error": "Please provide a valid email address."}
    
    if not password or len(password) < 6:
        return {"success": False, "error": "Password must be at least 6 characters long."}

    try:
        monthly_income = float(monthly_income)
        if monthly_income < 0:
            return {"success": False, "error": "Monthly income must be non-negative."}
    except ValueError:
        return {"success": False, "error": "Invalid monthly income value."}

    conn = get_db()
    cursor = conn.cursor()

    # Check if username or email already exists
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username.strip(), email.strip().lower()))
    if cursor.fetchone():
        conn.close()
        return {"success": False, "error": "Username or email is already registered."}

    hashed_pw = generate_password_hash(password)
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, monthly_income, currency)
        VALUES (?, ?, ?, ?, ?)
    """, (username.strip(), email.strip().lower(), hashed_pw, monthly_income, currency.upper()))
    
    user_id = cursor.lastrowid
    conn.commit()

    # Create default budgets for new user
    cursor.execute("SELECT id, name FROM categories WHERE type = 'expense'")
    categories = cursor.fetchall()
    now_month = time.strftime("%Y-%m")

    default_budgets = {
        "Food & Dining": 500.0,
        "Rent & Housing": 900.0,
        "Transportation": 150.0,
        "Entertainment": 120.0,
        "Shopping & Tech": 180.0,
        "Healthcare": 80.0,
        "Education & Career": 100.0,
        "Subscriptions": 50.0,
        "Miscellaneous": 80.0,
    }

    for cat in categories:
        limit = default_budgets.get(cat["name"], 100.0)
        cursor.execute("""
            INSERT OR IGNORE INTO budgets (user_id, category_id, monthly_limit, month_year)
            VALUES (?, ?, ?, ?)
        """, (user_id, cat["id"], limit, now_month))

    conn.commit()
    conn.close()

    token = secrets.token_hex(24)
    ACTIVE_SESSIONS[token] = {"user_id": user_id, "username": username.strip(), "created_at": time.time()}

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user_id,
            "username": username.strip(),
            "email": email.strip().lower(),
            "monthly_income": monthly_income,
            "currency": currency.upper()
        }
    }

def login_user(username_or_email, password):
    if not username_or_email or not password:
        return {"success": False, "error": "Username/email and password are required."}

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, password_hash, monthly_income, currency
        FROM users
        WHERE username = ? OR email = ?
    """, (username_or_email.strip(), username_or_email.strip().lower()))
    
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return {"success": False, "error": "Invalid username or password."}

    token = secrets.token_hex(24)
    ACTIVE_SESSIONS[token] = {
        "user_id": user["id"],
        "username": user["username"],
        "created_at": time.time()
    }

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "monthly_income": user["monthly_income"],
            "currency": user["currency"]
        }
    }

def get_current_user_from_request():
    """Extracts user from Bearer token, or defaults to the demo user for development ease."""
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    if token and token in ACTIVE_SESSIONS:
        session_info = ACTIVE_SESSIONS[token]
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, monthly_income, currency FROM users WHERE id = ?", (session_info["user_id"],))
        user = cursor.fetchone()
        conn.close()
        if user:
            return dict(user)

    # Fallback to demo user (alex_student) if no token or expired, to keep dev / demo frictionless
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, monthly_income, currency FROM users WHERE username = 'alex_student'")
    demo_user = cursor.fetchone()
    conn.close()
    if demo_user:
        return dict(demo_user)
    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        return f(user, *args, **kwargs)
    return decorated
