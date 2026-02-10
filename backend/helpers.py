from flask import session, jsonify
from functools import wraps
from werkzeug.security import generate_password_hash

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get("user_id") is None:
            return jsonify({"error": "login required"}), 401
        return f(*args, **kwargs)
    return decorated


def validate_register_payload(data: dict):
    """
    Returns: (ok: bool, error: str|None, cleaned: dict)
    cleaned contains trimmed username and original password fields.
    """
    data = data or {}

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    confirmation = data.get("confirmation") or ""

    if not username:
        return False, "must provide username", {}
    if not password:
        return False, "must provide password", {}
    if not confirmation:
        return False, "must confirm password", {}
    if password != confirmation:
        return False, "passwords must match", {}

    cleaned = {
        "username": username,
        "password": password,
        "confirmation": confirmation,
    }
    return True, None, cleaned

def create_user(db, username: str, password: str):
    """
    Returns: (ok: bool, error: str|None, user_id: int|None)
    - Hashes password
    - Inserts user into SQLite
    - Handles duplicate username
    """
    pw_hash = generate_password_hash(password)

    try:
        # NOTE: your users table column is named "hash"
        user_id = db.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?)",
            username, pw_hash
        )
        return True, None, user_id

    except Exception as e:
        # Minimalist handling: if username already exists, SQLite raises constraint error.
        msg = str(e).lower()
        if "unique" in msg or "constraint" in msg:
            return False, "username already exists", None
        return False, "database error", None
