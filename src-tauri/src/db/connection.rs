use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

use crate::error::{AppError, AppResult};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

pub type DbConnection = Mutex<SqliteConnection>;

/// Get the database directory path using Tauri's app data directory
pub fn get_database_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e: tauri::Error| AppError::PathError(e.to_string()))?;

    // Ensure directory exists
    fs::create_dir_all(&app_data_dir)?;

    Ok(app_data_dir)
}

/// Get the full database file path
pub fn get_database_path(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    let db_dir = get_database_dir(app_handle)?;
    Ok(db_dir.join("snippets.db"))
}

/// Establish database connection
pub fn establish_connection(app_handle: &tauri::AppHandle) -> AppResult<SqliteConnection> {
    let database_path = get_database_path(app_handle)?;
    let database_url = format!("file:{}", database_path.display());

    SqliteConnection::establish(&database_url)
        .map_err(|e| AppError::DatabaseError(diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )))
}

/// Run embedded migrations on startup
pub fn run_migrations(conn: &mut SqliteConnection) -> AppResult<()> {
    conn.run_pending_migrations(MIGRATIONS)
        .map_err(|e| AppError::DatabaseError(diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::Unknown,
            Box::new(e.to_string()),
        )))?;
    Ok(())
}

/// Get the output directory for generated shell files
pub fn get_output_dir(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    let app_data_dir = get_database_dir(app_handle)?;
    let output_dir = app_data_dir.join("generated");
    fs::create_dir_all(&output_dir)?;
    Ok(output_dir)
}
