use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::db::schema::{environments, environment_variables};

/// Environment model for querying (full record from DB)
#[derive(
    Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize,
)]
#[diesel(table_name = environments)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Environment {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub enabled: i32,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

impl Environment {
    pub fn is_enabled(&self) -> bool {
        self.enabled != 0
    }
}

/// Struct for creating new environments
#[derive(Debug, Clone, Insertable, Deserialize)]
#[diesel(table_name = environments)]
pub struct NewEnvironment {
    pub name: String,
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

/// Struct for updating environments
#[derive(Debug, Clone, AsChangeset, Deserialize, Default)]
#[diesel(table_name = environments)]
pub struct UpdateEnvironment {
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub enabled: Option<i32>,
    pub sort_order: Option<i32>,
}

/// EnvironmentVariable model for querying
#[derive(
    Debug, Clone, Queryable, Selectable, Identifiable, Serialize, Deserialize,
)]
#[diesel(table_name = environment_variables)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct EnvironmentVariable {
    pub id: i32,
    pub environment_id: i32,
    pub key: String,
    pub value: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// Struct for creating new environment variables
#[derive(Debug, Clone, Insertable, Deserialize)]
#[diesel(table_name = environment_variables)]
pub struct NewEnvironmentVariable {
    pub environment_id: i32,
    pub key: String,
    pub value: String,
    #[serde(default)]
    pub sort_order: i32,
}

/// Struct for updating environment variables
#[derive(Debug, Clone, AsChangeset, Deserialize, Default)]
#[diesel(table_name = environment_variables)]
pub struct UpdateEnvironmentVariable {
    pub key: Option<String>,
    pub value: Option<String>,
    pub sort_order: Option<i32>,
}

/// DTO for frontend responses (with proper boolean and nested variables)
#[derive(Debug, Clone, Serialize)]
pub struct EnvironmentResponse {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub enabled: bool,
    pub sort_order: i32,
    pub env_vars: Vec<EnvironmentVariable>,
    pub created_at: String,
    pub updated_at: String,
}

impl EnvironmentResponse {
    pub fn from_environment(env: Environment, vars: Vec<EnvironmentVariable>) -> Self {
        let enabled = env.is_enabled();
        EnvironmentResponse {
            id: env.id,
            name: env.name,
            description: env.description,
            enabled,
            sort_order: env.sort_order,
            env_vars: vars,
            created_at: env.created_at,
            updated_at: env.updated_at,
        }
    }
}