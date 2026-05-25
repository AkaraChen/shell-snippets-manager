mod commands;
mod config;
mod db;
mod error;
mod models;
mod services;

use std::sync::Mutex;

use commands::{
	// Alias CRUD
	add_snippet_to_alias,
	create_alias,
	// Snippet CRUD
	create_snippet,
	delete_alias,
	delete_snippet,
	format_shell_script,
	get_alias,
	get_aliases,
	// Sync & system
	get_output_directory,
	get_shell_info,
	get_snippet,
	get_snippets,
	get_source_line,
	open_file_in_editor,
	open_output_directory,
	remove_snippet_from_alias,
	reorder_snippets,
	sync_all_shells,
	sync_to_file,
	toggle_snippet,
	update_alias,
	update_snippet,
	// Environment CRUD
	get_environments,
	get_environment,
	create_environment,
	update_environment,
	delete_environment,
	toggle_environment,
	add_environment_variable,
	update_environment_variable,
	delete_environment_variable,
	generate_environment_exports,
	// PTY
	close_pty_session,
	create_pty_session,
	resize_pty,
	write_to_pty,
};
use config::AppPaths;
use db::connection::{establish_connection, run_migrations};
use services::pty_service;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{Emitter, Manager};

fn build_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
	let file = Submenu::with_items(
		app,
		"File",
		true,
		&[
			&MenuItem::with_id(app, "new-snippet", "New Snippet", true, Some("CmdOrCtrl+N"))?,
			&MenuItem::with_id(app, "new-alias", "New Alias", true, Some("CmdOrCtrl+Shift+N"))?,
			&PredefinedMenuItem::separator(app)?,
			&MenuItem::with_id(app, "sync", "Sync", true, Some("CmdOrCtrl+Shift+S"))?,
			&PredefinedMenuItem::separator(app)?,
			&PredefinedMenuItem::close_window(app, None)?,
		],
	)?;
	let edit = Submenu::with_items(
		app,
		"Edit",
		true,
		&[
			&PredefinedMenuItem::undo(app, None)?,
			&PredefinedMenuItem::redo(app, None)?,
			&PredefinedMenuItem::separator(app)?,
			&PredefinedMenuItem::cut(app, None)?,
			&PredefinedMenuItem::copy(app, None)?,
			&PredefinedMenuItem::paste(app, None)?,
			&PredefinedMenuItem::select_all(app, None)?,
		],
	)?;
	let view = Submenu::with_items(
		app,
		"View",
		true,
		&[
			&MenuItem::with_id(app, "focus-search", "Search", true, Some("CmdOrCtrl+F"))?,
			&MenuItem::with_id(
				app,
				"toggle-inspector",
				"Toggle Inspector",
				true,
				Some("CmdOrCtrl+Option+I"),
			)?,
		],
	)?;

	Menu::with_items(app, &[&file, &edit, &view])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_opener::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_window_state::Builder::default().build())
		.menu(build_menu)
		.on_menu_event(|app, event| {
			let id = event.id().0.clone();
			if matches!(
				id.as_str(),
				"new-snippet" | "new-alias" | "sync" | "focus-search" | "toggle-inspector"
			) {
				let _ = app.emit("menu-command", id);
			}
		})
		.setup(|app| {
			// Initialize XDG-compliant paths
			let paths = AppPaths::new()
				.expect("Failed to initialize application paths");

			// Establish database connection using new paths
			let mut conn = establish_connection(&paths)
				.expect("Failed to establish database connection");

			// Run migrations on startup
			run_migrations(&mut conn)
				.expect("Failed to run database migrations");

			// Store both connection and paths in app state
			app.manage(Mutex::new(conn));
			app.manage(paths);
			app.manage(pty_service::create_session_map());

			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			// Snippet CRUD
			get_snippets,
			get_snippet,
			create_snippet,
			update_snippet,
			delete_snippet,
			toggle_snippet,
			reorder_snippets,
			format_shell_script,
			// Alias CRUD
			get_aliases,
			get_alias,
			create_alias,
			update_alias,
			delete_alias,
			add_snippet_to_alias,
			remove_snippet_from_alias,
			// Environment CRUD
			get_environments,
			get_environment,
			create_environment,
			update_environment,
			delete_environment,
			toggle_environment,
			add_environment_variable,
			update_environment_variable,
			delete_environment_variable,
			generate_environment_exports,
			// Sync operations
			sync_to_file,
			sync_all_shells,
			get_source_line,
			get_output_directory,
			open_output_directory,
			open_file_in_editor,
			// Shell info
			get_shell_info,
			// PTY
			create_pty_session,
			write_to_pty,
			resize_pty,
			close_pty_session,
		])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
