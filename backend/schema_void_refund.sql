-- Non-destructive migration for void/refund fields
-- Apply with:
-- sqlite3 backend/pos.db < backend/schema_void_refund.sql

BEGIN;

ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE orders ADD COLUMN voided_at TEXT NULL;
ALTER TABLE orders ADD COLUMN void_reason TEXT NULL;
ALTER TABLE orders ADD COLUMN original_order_id INTEGER NULL;

COMMIT;
