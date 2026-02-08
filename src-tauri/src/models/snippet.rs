use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::db::schema::snippets;

/// Shell types supported by the application
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ShellType {
	Bash,
	Zsh,
	Fish,
}

impl ShellType {
	pub fn as_str(&self) -> &'static str {
		match self {
			ShellType::Bash => "bash",
			ShellType::Zsh => "zsh",
			ShellType::Fish => "fish",
		}
	}

	pub fn file_extension(&self) -> &'static str {
		match self {
			ShellType::Fish => "fish",
			_ => "sh",
		}
	}

	pub fn all() -> Vec<ShellType> {
		vec![ShellType::Bash, ShellType::Zsh, ShellType::Fish]
	}
}

impl From<String> for ShellType {
	fn from(s: String) -> Self {
		match s.to_lowercase().as_str() {
			"bash" => ShellType::Bash,
			"zsh" => ShellType::Zsh,
			"fish" => ShellType::Fish,
			_ => ShellType::Bash,
		}
	}
}

impl From<&str> for ShellType {
	fn from(s: &str) -> Self {
		ShellType::from(s.to_string())
	}
}

/// Snippet model for querying (full record from DB)
#[derive(
	Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize,
)]
#[diesel(table_name = snippets)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Snippet {
	pub id: i32,
	pub name: String,
	pub content: String,
	pub shell_type: String,
	pub description: Option<String>,
	pub enabled: i32,
	pub sort_order: i32,
	pub created_at: String,
	pub updated_at: String,
}

impl Snippet {
	pub fn is_enabled(&self) -> bool {
		self.enabled != 0
	}

	pub fn get_shell_type(&self) -> ShellType {
		self.shell_type.clone().into()
	}
}

/// Struct for creating new snippets
#[derive(Debug, Clone, Insertable, Deserialize)]
#[diesel(table_name = snippets)]
pub struct NewSnippet {
	pub name: String,
	pub content: String,
	pub shell_type: String,
	#[serde(default)]
	pub description: Option<String>,
	#[serde(default = "default_enabled")]
	pub enabled: i32,
	#[serde(default)]
	pub sort_order: i32,
}

fn default_enabled() -> i32 {
	1
}

/// Struct for updating snippets
#[derive(Debug, Clone, AsChangeset, Deserialize, Default)]
#[diesel(table_name = snippets)]
pub struct UpdateSnippet {
	pub name: Option<String>,
	pub content: Option<String>,
	pub shell_type: Option<String>,
	pub description: Option<Option<String>>,
	pub enabled: Option<i32>,
	pub sort_order: Option<i32>,
}

/// DTO for frontend responses (with proper boolean)
#[derive(Debug, Clone, Serialize)]
pub struct SnippetResponse {
	pub id: i32,
	pub name: String,
	pub content: String,
	pub shell_type: String,
	pub description: Option<String>,
	pub enabled: bool,
	pub sort_order: i32,
	pub created_at: String,
	pub updated_at: String,
}

impl SnippetResponse {
	pub fn from_snippet(snippet: Snippet) -> Self {
		let enabled = snippet.is_enabled();
		SnippetResponse {
			id: snippet.id,
			name: snippet.name,
			content: snippet.content,
			shell_type: snippet.shell_type,
			description: snippet.description,
			enabled,
			sort_order: snippet.sort_order,
			created_at: snippet.created_at,
			updated_at: snippet.updated_at,
		}
	}
}
