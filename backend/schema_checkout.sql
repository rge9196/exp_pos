-- Non-destructive checkout schema migration
-- Apply with:
-- sqlite3 backend/pos.db < backend/schema_checkout.sql

BEGIN;

CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    total_paid_cents INTEGER NOT NULL,
    change_cents INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    line_total_cents INTEGER NOT NULL,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

INSERT OR IGNORE INTO payment_methods (code, name) VALUES ('cash', 'Cash');
INSERT OR IGNORE INTO payment_methods (code, name) VALUES ('deposit', 'Deposit');
INSERT OR IGNORE INTO payment_methods (code, name) VALUES ('card', 'Card');

COMMIT;
