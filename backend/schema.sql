CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    username TEXT NOT NULL UNIQUE 
    hash TEXT NOT NULL
);
CREATE TABLE sqlite_sequence(name seq);
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    name TEXT NOT NULL 
    alias TEXT NOT NULL 
    category TEXT NOT NULL 
    list_price INTEGER NOT NULL 
    image_url TEXT 
    is_active INTEGER DEFAULT 1
);
CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    code TEXT NOT NULL UNIQUE 
    name TEXT NOT NULL UNIQUE 
    is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    user_id INTEGER NOT NULL 
    subtotal_cents INTEGER NOT NULL 
    total_paid_cents INTEGER NOT NULL 
    change_cents INTEGER NOT NULL 
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  status TEXT NOT NULL DEFAULT 'paid'  voided_at TEXT NULL  void_reason TEXT NULL  original_order_id INTEGER NULL);
CREATE TABLE order_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    order_id INTEGER NOT NULL 
    product_id INTEGER NOT NULL 
    name TEXT NOT NULL 
    qty INTEGER NOT NULL 
    unit_price_cents INTEGER NOT NULL 
    line_total_cents INTEGER NOT NULL 
    comment TEXT
);
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT 
    order_id INTEGER NOT NULL 
    payment_method_id INTEGER NOT NULL 
    amount_cents INTEGER NOT NULL
);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);