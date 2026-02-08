mod commands;
mod config;
mod db;
mod error;
mod models;
mod services;

use std::sync::Mutex;

use config::AppPaths;
use commands::{
    // Snippet CRUD
    create_snippet, delete_snippet, get_snippet, get_snippets, reorder_snippets, toggle_snippet,
    update_snippet,
    // Alias CRUD
    add_snippet_to_alias, create_alias, delete_alias, get_alias, get_aliases,
    remove_snippet_from_alias, update_alias,
    // Sync & system
    get_output_directory, get_shell_info, get_source_line, open_file_in_editor,
    open_output_directory, sync_all_shells, sync_to_file,
};
use db::connection::{establish_connection, run_migrations};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            // Alias CRUD
            get_aliases,
            get_alias,
            create_alias,
            update_alias,
            delete_alias,
            add_snippet_to_alias,
            remove_snippet_from_alias,
            // Sync operations
            sync_to_file,
            sync_all_shells,
            get_source_line,
            get_output_directory,
            open_output_directory,
            open_file_in_editor,
            // Shell info
            get_shell_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
