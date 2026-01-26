mod commands;
mod db;
mod error;
mod models;
mod services;

use std::sync::Mutex;

use commands::{
    add_tag_to_snippet, create_snippet, create_tag, delete_snippet, delete_tag,
    get_output_directory, get_shell_info, get_snippet, get_snippets, get_source_line, get_tags,
    remove_tag_from_snippet, reorder_snippets, sync_all_shells, sync_to_file, toggle_snippet,
    update_snippet,
};
use db::connection::{establish_connection, run_migrations};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Establish database connection using app handle
            let mut conn = establish_connection(app.handle())
                .expect("Failed to establish database connection");

            // Run migrations on startup
            run_migrations(&mut conn).expect("Failed to run database migrations");

            // Store connection in app state
            app.manage(Mutex::new(conn));

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
            // Tag operations
            get_tags,
            create_tag,
            delete_tag,
            add_tag_to_snippet,
            remove_tag_from_snippet,
            // Sync operations
            sync_to_file,
            sync_all_shells,
            get_source_line,
            get_output_directory,
            // Shell info
            get_shell_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
