use diesel::prelude::*;

use crate::db::schema::environments::dsl::*;
use crate::db::schema::environment_variables::dsl as ev;
use crate::error::{AppError, AppResult};
use crate::models::{
	Environment, EnvironmentResponse, EnvironmentVariable, NewEnvironment,
	NewEnvironmentVariable, UpdateEnvironment,
};

/// Load an environment and its associated variables into an EnvironmentResponse
fn load_environment_with_vars(
	conn: &mut SqliteConnection,
	env: Environment,
) -> AppResult<EnvironmentResponse> {
	let vars: Vec<EnvironmentVariable> = ev::environment_variables
		.filter(ev::environment_id.eq(env.id))
		.order(ev::sort_order.asc())
		.load(conn)?;

	Ok(EnvironmentResponse::from_environment(env, vars))
}

/// Get all environments with their associated variables
pub fn get_all_environments(
	conn: &mut SqliteConnection,
) -> AppResult<Vec<EnvironmentResponse>> {
	let env_list: Vec<Environment> = environments
		.order(sort_order.asc())
		.load(conn)?;

	env_list
		.into_iter()
		.map(|env| load_environment_with_vars(conn, env))
		.collect()
}

/// Get a single environment by ID with its associated variables
pub fn get_environment_by_id(
	conn: &mut SqliteConnection,
	env_id: i32,
) -> AppResult<EnvironmentResponse> {
	let env: Environment = environments
		.find(env_id)
		.first(conn)
		.map_err(|e| match e {
			diesel::result::Error::NotFound => AppError::EnvironmentNotFound(env_id),
			_ => AppError::from(e),
		})?;

	load_environment_with_vars(conn, env)
}

/// Create a new environment with variables
pub fn create_environment(
	conn: &mut SqliteConnection,
	new_env: NewEnvironment,
	variables: Vec<(String, String)>,
) -> AppResult<EnvironmentResponse> {
	conn.transaction(|conn| {
		// Create environment
		let env: Environment = diesel::insert_into(environments)
			.values(&new_env)
			.returning(Environment::as_returning())
			.get_result(conn)?;

		// Create variables
		for (idx, (key, value)) in variables.into_iter().enumerate() {
			let new_var = NewEnvironmentVariable {
				environment_id: env.id,
				key,
				value,
				sort_order: idx as i32,
			};
			diesel::insert_into(ev::environment_variables)
				.values(&new_var)
				.execute(conn)?;
		}

		load_environment_with_vars(conn, env)
	})
}

/// Update an environment (metadata only, not variables)
pub fn update_environment(
	conn: &mut SqliteConnection,
	env_id: i32,
	updates: UpdateEnvironment,
) -> AppResult<EnvironmentResponse> {
	let env: Environment = diesel::update(environments.find(env_id))
		.set(&updates)
		.returning(Environment::as_returning())
		.get_result(conn)
		.map_err(|e| match e {
			diesel::result::Error::NotFound => AppError::EnvironmentNotFound(env_id),
			_ => AppError::from(e),
		})?;

	load_environment_with_vars(conn, env)
}

/// Delete an environment (cascade deletes variables)
pub fn delete_environment(
	conn: &mut SqliteConnection,
	env_id: i32,
) -> AppResult<()> {
	let deleted = diesel::delete(environments.find(env_id)).execute(conn)?;

	if deleted == 0 {
		return Err(AppError::EnvironmentNotFound(env_id));
	}

	Ok(())
}

/// Toggle environment enabled status
pub fn toggle_environment(
	conn: &mut SqliteConnection,
	env_id: i32,
) -> AppResult<EnvironmentResponse> {
	let env: Environment = environments
		.find(env_id)
		.first(conn)
		.map_err(|e| match e {
			diesel::result::Error::NotFound => AppError::EnvironmentNotFound(env_id),
			_ => AppError::from(e),
		})?;

	let new_enabled = if env.enabled == 1 { 0 } else { 1 };

	let updated_env: Environment = diesel::update(environments.find(env_id))
		.set(enabled.eq(new_enabled))
		.returning(Environment::as_returning())
		.get_result(conn)?;

	load_environment_with_vars(conn, updated_env)
}

/// Add a variable to an environment
pub fn add_variable(
	conn: &mut SqliteConnection,
	env_id: i32,
	key: String,
	value: String,
) -> AppResult<EnvironmentVariable> {
	// Check if environment exists
	let _env: Environment = environments
		.find(env_id)
		.first(conn)
		.map_err(|e| match e {
			diesel::result::Error::NotFound => AppError::EnvironmentNotFound(env_id),
			_ => AppError::from(e),
		})?;

	// Get max sort_order for this environment
	let max_order: Option<i32> = ev::environment_variables
		.filter(ev::environment_id.eq(env_id))
		.select(diesel::dsl::max(ev::sort_order))
		.first(conn)?;

	let new_var = NewEnvironmentVariable {
		environment_id: env_id,
		key,
		value,
		sort_order: max_order.unwrap_or(-1) + 1,
	};

	let var: EnvironmentVariable = diesel::insert_into(ev::environment_variables)
		.values(&new_var)
		.returning(EnvironmentVariable::as_returning())
		.get_result(conn)?;

	Ok(var)
}

/// Update a variable
pub fn update_variable(
	conn: &mut SqliteConnection,
	var_id: i32,
	key: String,
	value: String,
) -> AppResult<EnvironmentVariable> {
	let var: EnvironmentVariable = diesel::update(ev::environment_variables.find(var_id))
		.set((ev::key.eq(key), ev::value.eq(value)))
		.returning(EnvironmentVariable::as_returning())
		.get_result(conn)
		.map_err(|e| match e {
			diesel::result::Error::NotFound => AppError::EnvironmentVariableNotFound(var_id),
			_ => AppError::from(e),
		})?;

	Ok(var)
}

/// Delete a variable
pub fn delete_variable(
	conn: &mut SqliteConnection,
	var_id: i32,
) -> AppResult<()> {
	let deleted = diesel::delete(ev::environment_variables.find(var_id)).execute(conn)?;

	if deleted == 0 {
		return Err(AppError::EnvironmentVariableNotFound(var_id));
	}

	Ok(())
}

/// Get all key-value pairs from enabled environments, ordered by env sort_order then var sort_order.
/// Used by the sync service to inject exports into generated shell files.
pub fn get_enabled_env_vars(
	conn: &mut SqliteConnection,
) -> AppResult<Vec<(String, String)>> {
	let enabled_envs: Vec<Environment> = environments
		.filter(enabled.eq(1))
		.order(sort_order.asc())
		.load(conn)?;

	let mut result = Vec::new();
	for env in enabled_envs {
		let vars: Vec<EnvironmentVariable> = ev::environment_variables
			.filter(ev::environment_id.eq(env.id))
			.order(ev::sort_order.asc())
			.load(conn)?;
		for var in vars {
			result.push((var.key, var.value));
		}
	}

	Ok(result)
}

/// Generate shell-specific export statements for an environment
pub fn generate_exports(
	conn: &mut SqliteConnection,
	shell_type: &str,
	env_id: i32,
) -> AppResult<String> {
	let vars: Vec<EnvironmentVariable> = ev::environment_variables
		.filter(ev::environment_id.eq(env_id))
		.order(ev::sort_order.asc())
		.load(conn)?;

	let exports: Vec<String> = vars
		.into_iter()
		.map(|var| match shell_type {
			"fish" => format!("set -x {} \"{}\"", var.key, var.value),
			_ => format!("export {}=\"{}\"", var.key, var.value),
		})
		.collect();

	Ok(exports.join("\n"))
}
