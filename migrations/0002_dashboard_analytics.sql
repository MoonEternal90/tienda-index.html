ALTER TABLE orders ADD COLUMN stripe_livemode INTEGER NOT NULL DEFAULT 0;
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
