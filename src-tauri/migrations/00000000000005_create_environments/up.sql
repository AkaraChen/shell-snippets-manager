-- environments 表（环境变量组）
CREATE TABLE environments (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_environments_enabled ON environments(enabled);
CREATE INDEX idx_environments_sort_order ON environments(sort_order);

CREATE TRIGGER update_environments_updated_at
AFTER UPDATE ON environments
FOR EACH ROW
BEGIN
  UPDATE environments SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- environment_variables 表（具体键值对）
CREATE TABLE environment_variables (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  environment_id INTEGER NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_env_vars_environment_id ON environment_variables(environment_id);
CREATE INDEX idx_env_vars_key ON environment_variables(key);

CREATE TRIGGER update_env_vars_updated_at
AFTER UPDATE ON environment_variables
FOR EACH ROW
BEGIN
  UPDATE environment_variables SET updated_at = datetime('now') WHERE id = OLD.id;
END;