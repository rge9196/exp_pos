from flask import Flask, request, jsonify
from cs50 import SQL
from werkzeug.security import generate_password_hash, check_password_hash

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity
)

app = Flask(__name__)
db = SQL("sqlite:///pos.db")

# JWT cookie setup (minimal)
app.config["JWT_SECRET_KEY"] = (
    "Yz3k9pXfR4mT8sQwL2bAqHnVjK7rS5dP"
    "mN6cLxZ8wBvR2tHjP9kQyA1sD4fWz"
)

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False          # True on HTTPS
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False    # baby steps

jwt = JWTManager(app)


def validate_register(data):
    data = data or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    confirmation = data.get("confirmation") or ""

    if not username:
        return False, "must provide username", None
    if not password:
        return False, "must provide password", None
    if not confirmation:
        return False, "must confirm password", None
    if password != confirmation:
        return False, "passwords must match", None

    return True, None, {"username": username, "password": password}


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}

    ok, error, cleaned = validate_register(data)
    if not ok:
        return jsonify({"ok": False, "error": error}), 400

    username = cleaned["username"]
    pw_hash = generate_password_hash(cleaned["password"])

    try:
        user_id = db.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?)",
            username, pw_hash
        )
    except Exception as e:
        msg = str(e).lower()
        if "unique" in msg or "constraint" in msg:
            return jsonify({"ok": False, "error": "username already exists"}), 400
        return jsonify({"ok": False, "error": "database error"}), 500

    # REGISTER == LOGIN: set JWT cookie
    token = create_access_token(identity=str(user_id))  # MUST be string
    resp = jsonify({"ok": True})
    set_access_cookies(resp, token)
    return resp, 200


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username:
        return jsonify({"ok": False, "error": "must provide username"}), 400
    if not password:
        return jsonify({"ok": False, "error": "must provide password"}), 400

    rows = db.execute("SELECT id, username, hash FROM users WHERE username = ?", username)
    if len(rows) != 1:
        return jsonify({"ok": False, "error": "invalid username and/or password"}), 400

    user = rows[0]
    if not check_password_hash(user["hash"], password):
        return jsonify({"ok": False, "error": "invalid username and/or password"}), 400

    token = create_access_token(identity=str(user["id"]))  # MUST be string
    resp = jsonify({"ok": True})
    set_access_cookies(resp, token)
    return resp, 200


@app.get("/api/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()  # string
    rows = db.execute("SELECT id, username FROM users WHERE id = ?", int(user_id))
    if len(rows) != 1:
        return jsonify({"ok": False, "error": "user not found"}), 404
    return jsonify({"ok": True, "user": rows[0]}), 200


@app.post("/api/logout")
def logout():
    resp = jsonify({"ok": True})
    unset_jwt_cookies(resp)
    return resp, 200

@app.get("/api/products")
@jwt_required()
def get_products():
    rows = db.execute("""
        SELECT id, name, alias, category, list_price, image_url, is_active
        FROM products
        WHERE is_active = 1
        ORDER BY name
    """)

    # Convert snake_case DB -> camelCase JSON
    products = [
        {
            "id": r["id"],
            "name": r["name"],
            "alias": r["alias"],
            "category": r["category"],
            "listPrice": r["list_price"],
            "imageUrl": r["image_url"],
            "isActive": bool(r["is_active"]),
        }
        for r in rows
    ]

    return jsonify({"products": products})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
