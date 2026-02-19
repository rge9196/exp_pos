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

# --- DB bootstrap
def init_db():
    db.execute("""
        CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            is_active INTEGER NOT NULL DEFAULT 1
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subtotal_cents INTEGER NOT NULL,
            total_paid_cents INTEGER NOT NULL,
            change_cents INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS order_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            unit_price_cents INTEGER NOT NULL,
            line_total_cents INTEGER NOT NULL,
            comment TEXT
        )
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            payment_method_id INTEGER NOT NULL,
            amount_cents INTEGER NOT NULL
        )
    """)

    db.execute("INSERT OR IGNORE INTO payment_methods (name) VALUES (?)", "Cash")
    db.execute("INSERT OR IGNORE INTO payment_methods (name) VALUES (?)", "Deposit")
    db.execute("INSERT OR IGNORE INTO payment_methods (name) VALUES (?)", "Card")


init_db()

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


@app.get("/api/payment-methods")
@jwt_required()
def get_payment_methods():
    rows = db.execute("""
        SELECT id, name
        FROM payment_methods
        WHERE is_active = 1
        ORDER BY id
    """)
    methods = [{"id": r["id"], "name": r["name"]} for r in rows]
    return jsonify({"methods": methods})


@app.post("/api/orders")
@jwt_required()
def create_order():
    data = request.get_json(silent=True) or {}
    raw_lines = data.get("lines") or []
    raw_payments = data.get("payments") or []

    if not raw_lines:
        return jsonify({"ok": False, "error": "no order lines"}), 400

    user_id = int(get_jwt_identity())

    # Load payment methods for validation
    method_rows = db.execute("SELECT id, name FROM payment_methods WHERE is_active = 1")
    methods = {int(r["id"]): r["name"] for r in method_rows}

    cleaned_lines = []
    subtotal_cents = 0
    for l in raw_lines:
        try:
            product_id = int(l.get("productId") or 0)
            name = (l.get("name") or "").strip()
            qty = int(l.get("qty") or 0)
            unit_price_cents = int(l.get("priceCents") or l.get("listPriceCents") or 0)
            comment = (l.get("comment") or "").strip()
        except Exception:
            return jsonify({"ok": False, "error": "invalid line item"}), 400

        if product_id <= 0 or not name or qty <= 0 or unit_price_cents < 0:
            return jsonify({"ok": False, "error": "invalid line item"}), 400

        line_total_cents = qty * unit_price_cents
        subtotal_cents += line_total_cents
        cleaned_lines.append({
            "product_id": product_id,
            "name": name,
            "qty": qty,
            "unit_price_cents": unit_price_cents,
            "line_total_cents": line_total_cents,
            "comment": comment,
        })

    cleaned_payments = []
    total_paid_cents = 0
    for p in raw_payments:
        try:
            method_id = int(p.get("methodId") or 0)
            amount_cents = int(p.get("amountCents") or 0)
        except Exception:
            return jsonify({"ok": False, "error": "invalid payment"}), 400

        if method_id <= 0 or amount_cents < 0:
            return jsonify({"ok": False, "error": "invalid payment"}), 400
        if method_id not in methods:
            return jsonify({"ok": False, "error": "payment method not found"}), 400

        total_paid_cents += amount_cents
        if amount_cents > 0:
            cleaned_payments.append({
                "method_id": method_id,
                "method_name": methods[method_id],
                "amount_cents": amount_cents,
            })

    if total_paid_cents < subtotal_cents:
        return jsonify({"ok": False, "error": "insufficient payment"}), 400

    change_cents = max(0, total_paid_cents - subtotal_cents)

    try:
        db.execute("BEGIN")
        order_id = db.execute(
            "INSERT INTO orders (user_id, subtotal_cents, total_paid_cents, change_cents) VALUES (?, ?, ?, ?)",
            user_id, subtotal_cents, total_paid_cents, change_cents
        )

        for l in cleaned_lines:
            db.execute(
                """
                INSERT INTO order_lines (order_id, product_id, name, qty, unit_price_cents, line_total_cents, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                order_id, l["product_id"], l["name"], l["qty"], l["unit_price_cents"], l["line_total_cents"], l["comment"] or None
            )

        for p in cleaned_payments:
            db.execute(
                """
                INSERT INTO payments (order_id, payment_method_id, amount_cents)
                VALUES (?, ?, ?)
                """,
                order_id, p["method_id"], p["amount_cents"]
            )

        db.execute("COMMIT")
    except Exception:
        db.execute("ROLLBACK")
        return jsonify({"ok": False, "error": "database error"}), 500

    order_row = db.execute(
        "SELECT id, subtotal_cents, total_paid_cents, change_cents, created_at FROM orders WHERE id = ?",
        order_id
    )
    order = order_row[0] if order_row else None

    response = {
        "id": order_id,
        "subtotalCents": subtotal_cents,
        "totalPaidCents": total_paid_cents,
        "changeCents": change_cents,
        "createdAt": order["created_at"] if order else None,
        "lines": [
            {
                "id": i + 1,
                "productId": l["product_id"],
                "name": l["name"],
                "qty": l["qty"],
                "unitPriceCents": l["unit_price_cents"],
                "lineTotalCents": l["line_total_cents"],
                "comment": l["comment"],
            }
            for i, l in enumerate(cleaned_lines)
        ],
        "payments": [
            {
                "id": i + 1,
                "methodId": p["method_id"],
                "methodName": p["method_name"],
                "amountCents": p["amount_cents"],
            }
            for i, p in enumerate(cleaned_payments)
        ],
    }

    return jsonify({"ok": True, "order": response}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
