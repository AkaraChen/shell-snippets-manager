CREATE TABLE tags (
id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
name TEXT NOT NULL UNIQUE,
color TEXT
) ;

CREATE TABLE snippet_tags (
snippet_id INTEGER NOT NULL REFERENCES snippets (id) ON DELETE CASCADE,
tag_id INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
PRIMARY KEY (snippet_id, tag_id)
) ;

CREATE INDEX idx_snippet_tags_snippet_id ON snippet_tags (snippet_id) ;
CREATE INDEX idx_snippet_tags_tag_id ON snippet_tags (tag_id) ;
