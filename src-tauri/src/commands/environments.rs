use tauri::State;

use crate::db::DbConnection;
use crate::error::AppError;
use crate::models::{
	EnvironmentResponse, EnvironmentVariable, NewEnvironment, UpdateEnvironment,
};
use crate::services::environment_service;

type DbState<'a> = State<'a, DbConnection>;

#[tauri::command]
pub fn get_environments(db: DbState) -> Result<Vec<EnvironmentResponse>, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::get_all_environments(&mut conn)
}

#[tauri::command]
pub fn get_environment(
	db: DbState,
	id: i32,
) -> Result<EnvironmentResponse, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::get_environment_by_id(&mut conn, id)
}

#[tauri::command]
pub fn create_environment(
	db: DbState,
	data: NewEnvironment,
	variables: Vec<(String, String)>,
) -> Result<EnvironmentResponse, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::create_environment(&mut conn, data, variables)
}

#[tauri::command]
pub fn update_environment(
	db: DbState,
	id: i32,
	updates: UpdateEnvironment,
) -> Result<EnvironmentResponse, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::update_environment(&mut conn, id, updates)
}

#[tauri::command]
pub fn delete_environment(db: DbState, id: i32) -> Result<(), AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::delete_environment(&mut conn, id)
}

#[tauri::command]
pub fn toggle_environment(
	db: DbState,
	id: i32,
) -> Result<EnvironmentResponse, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::toggle_environment(&mut conn, id)
}

#[tauri::command]
pub fn add_environment_variable(
	db: DbState,
	env_id: i32,
	key: String,
	value: String,
) -> Result<EnvironmentVariable, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::add_variable(&mut conn, env_id, key, value)
}

#[tauri::command]
pub fn update_environment_variable(
	db: DbState,
	var_id: i32,
	key: String,
	value: String,
) -> Result<EnvironmentVariable, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::update_variable(&mut conn, var_id, key, value)
}

#[tauri::command]
pub fn delete_environment_variable(
	db: DbState,
	var_id: i32,
) -> Result<(), AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::delete_variable(&mut conn, var_id)
}

#[tauri::command]
pub fn generate_environment_exports(
	db: DbState,
	shell_type: String,
	environment_id: i32,
) -> Result<String, AppError> {
	let mut conn = db.lock().map_err(|_| AppError::LockError)?;
	environment_service::generate_exports(&mut conn, &shell_type, environment_id)
}