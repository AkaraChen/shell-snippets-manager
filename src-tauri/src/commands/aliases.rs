use tauri::State;

use crate::db::DbConnection;
use crate::error::AppError;
use crate::models::{AliasResponse, NewAlias, UpdateAlias};
use crate::services::alias_service;

type DbState<'a> = State<'a, DbConnection>;

/// Get all aliases with their associated snippets
#[tauri::command]
pub fn get_aliases(db: DbState) -> Result<Vec<AliasResponse>, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::get_all_aliases(&mut conn)
}

/// Get a single alias by ID
#[tauri::command]
pub fn get_alias(db: DbState, id: i32) -> Result<AliasResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::get_alias_by_id(&mut conn, id)
}

/// Create a new alias
#[tauri::command]
pub fn create_alias(db: DbState, alias: NewAlias) -> Result<AliasResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::create_alias(&mut conn, alias)
}

/// Update an existing alias
#[tauri::command]
pub fn update_alias(
    db: DbState,
    id: i32,
    updates: UpdateAlias,
) -> Result<AliasResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::update_alias(&mut conn, id, updates)
}

/// Delete an alias
#[tauri::command]
pub fn delete_alias(db: DbState, id: i32) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::delete_alias(&mut conn, id)
}

/// Add a snippet to an alias
#[tauri::command]
pub fn add_snippet_to_alias(
    db: DbState,
    alias_id: i32,
    snippet_id: i32,
) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::add_snippet_to_alias(&mut conn, alias_id, snippet_id)
}

/// Remove a snippet from an alias
#[tauri::command]
pub fn remove_snippet_from_alias(
    db: DbState,
    alias_id: i32,
    snippet_id: i32,
) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    alias_service::remove_snippet_from_alias(&mut conn, alias_id, snippet_id)
}
