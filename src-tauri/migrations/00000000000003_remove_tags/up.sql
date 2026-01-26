-- Drop indexes first
DROP INDEX IF EXISTS idx_snippet_tags_tag_id;
DROP INDEX IF EXISTS idx_snippet_tags_snippet_id;

-- Drop junction table (has foreign keys)
DROP TABLE IF EXISTS snippet_tags;

-- Drop tags table
DROP TABLE IF EXISTS tags;
