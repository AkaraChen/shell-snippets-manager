CREATE TABLE snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    shell_type TEXT NOT NULL DEFAULT 'bash',
    description TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_snippets_shell_type_enabled ON snippets(shell_type, enabled);
CREATE INDEX idx_snippets_sort_order ON snippets(sort_order);

CREATE TRIGGER update_snippets_updated_at
    AFTER UPDATE ON snippets
    FOR EACH ROW
BEGIN
    UPDATE snippets SET updated_at = datetime('now') WHERE id = OLD.id;
END;
