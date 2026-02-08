use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::db::schema::{aliases, snippet_aliases};
use crate::models::SnippetResponse;

/// Alias model for querying (full record from DB)
#[derive(
	Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize,
)]
#[diesel(table_name = aliases)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Alias {
	pub id: i32,
	pub name: String,
	pub command: String,
	pub description: Option<String>,
	pub created_at: String,
	pub updated_at: String,
}

/// Struct for creating new aliases
#[derive(Debug, Clone, Insertable, Deserialize)]
#[diesel(table_name = aliases)]
pub struct NewAlias {
	pub name: String,
	pub command: String,
	#[serde(default)]
	pub description: Option<String>,
}

/// Struct for updating aliases
#[derive(Debug, Clone, AsChangeset, Deserialize, Default)]
#[diesel(table_name = aliases)]
pub struct UpdateAlias {
	pub name: Option<String>,
	pub command: Option<String>,
	pub description: Option<Option<String>>,
}

/// DTO for frontend responses (with associated snippets)
#[derive(Debug, Clone, Serialize)]
pub struct AliasResponse {
	pub id: i32,
	pub name: String,
	pub command: String,
	pub description: Option<String>,
	pub snippets: Vec<SnippetResponse>,
	pub created_at: String,
	pub updated_at: String,
}

impl AliasResponse {
	pub fn from_alias(alias: Alias, snippets: Vec<SnippetResponse>) -> Self {
		AliasResponse {
			id: alias.id,
			name: alias.name,
			command: alias.command,
			description: alias.description,
			snippets,
			created_at: alias.created_at,
			updated_at: alias.updated_at,
		}
	}
}

/// Junction table model for querying
#[derive(Debug, Clone, Queryable, Selectable, Identifiable)]
#[diesel(table_name = snippet_aliases)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct SnippetAlias {
	pub id: i32,
	pub snippet_id: i32,
	pub alias_id: i32,
}

/// Struct for creating new snippet-alias associations
#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = snippet_aliases)]
pub struct NewSnippetAlias {
	pub snippet_id: i32,
	pub alias_id: i32,
}
