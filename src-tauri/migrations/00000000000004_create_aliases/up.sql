CREATE TABLE aliases (
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
name TEXT NOT NULL,
command TEXT NOT NULL,
description TEXT,
created_at TEXT NOT NULL DEFAULT (datetime ('now')),
updated_at TEXT NOT NULL DEFAULT (datetime ('now'))
) ;

CREATE INDEX idx_aliases_name ON aliases (name) ;

CREATE TABLE snippet_aliases (
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
snippet_id INTEGER NOT NULL REFERENCES snippets (id) ON DELETE CASCADE,
alias_id INTEGER NOT NULL REFERENCES aliases (id) ON DELETE CASCADE,
UNIQUE (snippet_id, alias_id)
) ;

CREATE INDEX idx_snippet_aliases_snippet_id ON snippet_aliases (snippet_id) ;
CREATE INDEX idx_snippet_aliases_alias_id ON snippet_aliases (alias_id) ;

CREATE TRIGGER update_aliases_updated_at
AFTER UPDATE ON aliases
BEGIN
UPDATE aliases SET updated_at = datetime ('now') WHERE id = NEW.id ;
END ;
