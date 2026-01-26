use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::db::schema::{snippet_tags, tags};

/// Tag model for querying
#[derive(Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = tags)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Tag {
    pub id: i32,
    pub name: String,
    pub color: Option<String>,
}

/// Struct for creating new tags
#[derive(Debug, Clone, Insertable, Deserialize)]
#[diesel(table_name = tags)]
pub struct NewTag {
    pub name: String,
    #[serde(default)]
    pub color: Option<String>,
}

/// DTO for frontend responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagResponse {
    pub id: i32,
    pub name: String,
    pub color: Option<String>,
}

impl From<Tag> for TagResponse {
    fn from(t: Tag) -> Self {
        TagResponse {
            id: t.id,
            name: t.name,
            color: t.color,
        }
    }
}

/// Junction table for snippet-tag many-to-many relationship
#[derive(Debug, Clone, Queryable, Selectable, Insertable, Identifiable, Associations)]
#[diesel(belongs_to(super::snippet::Snippet))]
#[diesel(belongs_to(Tag))]
#[diesel(table_name = snippet_tags)]
#[diesel(primary_key(snippet_id, tag_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct SnippetTag {
    pub snippet_id: i32,
    pub tag_id: i32,
}

/// Struct for creating snippet-tag associations
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = snippet_tags)]
pub struct NewSnippetTag {
    pub snippet_id: i32,
    pub tag_id: i32,
}
