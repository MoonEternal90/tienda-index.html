CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  items_json TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_livemode INTEGER NOT NULL DEFAULT 0,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_json TEXT,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE TABLE IF NOT EXISTS visit_stats (
  day TEXT NOT NULL,
  page_path TEXT NOT NULL,
  source TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page_path, source)
);
CREATE TRIGGER IF NOT EXISTS purge_old_visit_stats AFTER INSERT ON visit_stats BEGIN
  DELETE FROM visit_stats WHERE day < date('now', '-24 months');
END;
CREATE TABLE IF NOT EXISTS product_costs (
  product_id INTEGER PRIMARY KEY,
  cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0),
  updated_at TEXT NOT NULL
);
