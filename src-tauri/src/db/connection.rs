use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::path::PathBuf;
use std::sync::Mutex;

use crate::config::AppPaths;
use crate::error::{AppError, AppResult};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

pub type DbConnection = Mutex<SqliteConnection>;

/// Get the full database file path
pub fn get_database_path(paths: &AppPaths) -> PathBuf {
    paths.database_path()
}

/// Establish database connection
pub fn establish_connection(paths: &AppPaths) -> AppResult<SqliteConnection> {
    let database_path = get_database_path(paths);
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
