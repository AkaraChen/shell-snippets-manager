use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use diesel_migrations::MigrationHarness;

use crate::db::connection::MIGRATIONS;

/// Create an in-memory SQLite connection for testing.
/// Each call creates a fresh database with all migrations applied.
pub fn create_test_connection() -> SqliteConnection {
	let mut conn = SqliteConnection::establish(":memory:")
		.expect("Failed to create in-memory database");

	conn.run_pending_migrations(MIGRATIONS)
		.expect("Failed to run migrations");

	conn
}
