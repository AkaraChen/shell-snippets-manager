use std::collections::HashSet;

use diesel::prelude::*;
use diesel::SqliteConnection;
use serde::Serialize;
use tauri::State;

use crate::config::AppPaths;
use crate::db::schema::snippet_tags::dsl as st_dsl;
use crate::db::schema::tags::dsl as tags_dsl;
use crate::db::DbConnection;
use crate::error::AppError;
use crate::models::{
    NewSnippet, NewTag, ShellType, SnippetResponse, TagResponse, UpdateSnippet, Tag,
};
use crate::services::{snippet_service, sync_service, tag_service};

type DbState<'a> = State<'a, DbConnection>;

// ============================================================================
// Snippet Commands
// ============================================================================

/// Get all snippets
#[tauri::command]
pub fn get_snippets(db: DbState) -> Result<Vec<SnippetResponse>, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::get_all_snippets(&mut conn)
}

/// Get a single snippet by ID
#[tauri::command]
pub fn get_snippet(db: DbState, id: i32) -> Result<SnippetResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::get_snippet_by_id(&mut conn, id)
}

/// Create a new snippet
#[tauri::command]
pub fn create_snippet(db: DbState, snippet: NewSnippet) -> Result<SnippetResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::create_snippet(&mut conn, snippet)
}

/// Update an existing snippet
#[tauri::command]
pub fn update_snippet(
    db: DbState,
    id: i32,
    updates: UpdateSnippet,
) -> Result<SnippetResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::update_snippet(&mut conn, id, updates)
}

/// Delete a snippet
#[tauri::command]
pub fn delete_snippet(db: DbState, id: i32) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::delete_snippet(&mut conn, id)
}

/// Toggle snippet enabled status
#[tauri::command]
pub fn toggle_snippet(db: DbState, id: i32) -> Result<SnippetResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::toggle_snippet(&mut conn, id)
}

/// Reorder snippets
#[tauri::command]
pub fn reorder_snippets(db: DbState, order: Vec<(i32, i32)>) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::reorder_snippets(&mut conn, order)
}

// ============================================================================
// Tag Commands
// ============================================================================

/// Get all tags
#[tauri::command]
pub fn get_tags(db: DbState) -> Result<Vec<TagResponse>, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    tag_service::get_all_tags(&mut conn)
}

/// Create a new tag
#[tauri::command]
pub fn create_tag(db: DbState, tag: NewTag) -> Result<TagResponse, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    tag_service::create_tag(&mut conn, tag)
}

/// Delete a tag
#[tauri::command]
pub fn delete_tag(db: DbState, id: i32) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    tag_service::delete_tag(&mut conn, id)
}

/// Add a tag to a snippet
#[tauri::command]
pub fn add_tag_to_snippet(
    db: DbState,
    snippet_id: i32,
    tag_id: i32,
) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::add_tag_to_snippet(&mut conn, snippet_id, tag_id)
}

/// Remove a tag from a snippet
#[tauri::command]
pub fn remove_tag_from_snippet(
    db: DbState,
    snippet_id: i32,
    tag_id: i32,
) -> Result<(), AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    snippet_service::remove_tag_from_snippet(&mut conn, snippet_id, tag_id)
}

// ============================================================================
// Sync Commands
// ============================================================================

/// Sync enabled snippets to a shell-specific file
#[tauri::command]
pub fn sync_to_file(
    paths: State<'_, AppPaths>,
    db: DbState,
    shell_type: String,
) -> Result<String, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    let shell: ShellType = shell_type.into();
    let output_dir = paths.output_dir();

    let snippets = snippet_service::get_enabled_snippets_by_shell(&mut conn, shell.as_str())?;

    // Get tags for each snippet
    let snippets_with_tags: Vec<sync_service::SnippetWithTags> = snippets
        .into_iter()
        .map(|snippet| {
            let tags = get_tag_names_for_snippet(&mut conn, snippet.id).unwrap_or_default();
            sync_service::SnippetWithTags { snippet, tags }
        })
        .collect();

    let output_path = sync_service::sync_to_file(snippets_with_tags, shell, output_dir.to_path_buf())?;

    Ok(output_path.display().to_string())
}

/// Sync all shell types at once
#[tauri::command]
pub fn sync_all_shells(
    paths: State<'_, AppPaths>,
    db: DbState,
) -> Result<Vec<String>, AppError> {
    let mut conn = db.lock().map_err(|_| AppError::LockError)?;
    let output_dir = paths.output_dir().to_path_buf();

    let shells = vec![
        ShellType::Bash,
        ShellType::Zsh,
        ShellType::Fish,
        ShellType::Sh,
    ];

    let mut output_paths = Vec::new();

    for shell in shells {
        let snippets =
            snippet_service::get_enabled_snippets_by_shell(&mut conn, shell.as_str())?;

        if !snippets.is_empty() {
            let snippets_with_tags: Vec<sync_service::SnippetWithTags> = snippets
                .into_iter()
                .map(|snippet| {
                    let tags = get_tag_names_for_snippet(&mut conn, snippet.id).unwrap_or_default();
                    sync_service::SnippetWithTags { snippet, tags }
                })
                .collect();

            let path =
                sync_service::sync_to_file(snippets_with_tags, shell, output_dir.clone())?;
            output_paths.push(path.display().to_string());
        }
    }

    Ok(output_paths)
}

/// Get the source line to add to shell rc file
#[tauri::command]
pub fn get_source_line(
    paths: State<'_, AppPaths>,
    shell_type: String,
) -> Result<String, AppError> {
    let shell: ShellType = shell_type.into();
    let output_dir = paths.output_dir();
    Ok(sync_service::get_source_line(&shell, &output_dir))
}

/// Get the output directory path
#[tauri::command]
pub fn get_output_directory(paths: State<'_, AppPaths>) -> Result<String, AppError> {
    let output_dir = paths.output_dir();
    Ok(output_dir.display().to_string())
}

/// Open the output directory in the system's file manager
#[tauri::command]
pub fn open_output_directory(paths: State<'_, AppPaths>) -> Result<(), AppError> {
    let output_dir = paths.output_dir();

    #[cfg(target_os = "macos")]
    let command = "open";

    #[cfg(target_os = "linux")]
    let command = "xdg-open";

    #[cfg(target_os = "windows")]
    let command = "explorer";

    std::process::Command::new(command)
        .arg(output_dir)
        .spawn()
        .map_err(|e| AppError::IoError(e))?;

    Ok(())
}

/// Open a file in the user's default editor ($EDITOR)
#[tauri::command]
pub fn open_file_in_editor(file_path: String) -> Result<(), AppError> {
    // Expand ~ to home directory
    let expanded_path = if file_path.starts_with("~/") {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        file_path.replacen("~", &home, 1)
    } else {
        file_path
    };

    // Get editor from $EDITOR, fallback to system defaults
    let editor = std::env::var("EDITOR").unwrap_or_else(|_| {
        #[cfg(target_os = "macos")]
        return "vim".to_string();

        #[cfg(target_os = "linux")]
        return "vim".to_string();

        #[cfg(target_os = "windows")]
        return "notepad".to_string();
    });

    // Check if we need to use a terminal for terminal editors
    let terminal_editors = ["vim", "vi", "nano", "emacs", "nvim"];
    let needs_terminal = terminal_editors.iter().any(|&e| editor.contains(e));

    if needs_terminal {
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("open")
                .arg("-a")
                .arg("Terminal")
                .arg(&expanded_path)
                .spawn()
                .map_err(|e| AppError::IoError(e))?;
        }

        #[cfg(target_os = "linux")]
        {
            // Try common terminal emulators
            let terminals = ["x-terminal-emulator", "gnome-terminal", "konsole", "xterm"];
            let mut success = false;

            for terminal in &terminals {
                if let Ok(mut child) = std::process::Command::new(terminal)
                    .arg("-e")
                    .arg(&editor)
                    .arg(&expanded_path)
                    .spawn()
                {
                    success = true;
                    break;
                }
            }

            if !success {
                return Err(AppError::IoError(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "No terminal emulator found"
                )));
            }
        }

        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("cmd")
                .args(["/c", "start", &editor, &expanded_path])
                .spawn()
                .map_err(|e| AppError::IoError(e))?;
        }
    } else {
        // GUI editor or default system editor
        std::process::Command::new(&editor)
            .arg(&expanded_path)
            .spawn()
            .map_err(|e| AppError::IoError(e))?;
    }

    Ok(())
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Get tag names for a snippet (helper for sync)
fn get_tag_names_for_snippet(conn: &mut SqliteConnection, snippet_id: i32) -> Result<Vec<String>, AppError> {
    let tags: Vec<Tag> = st_dsl::snippet_tags
        .filter(st_dsl::snippet_id.eq(snippet_id))
        .inner_join(tags_dsl::tags)
        .select(Tag::as_select())
        .load(conn)?;

    Ok(tags.into_iter().map(|t| t.name).collect())
}

// ============================================================================
// Shell Info Commands
// ============================================================================

#[derive(Debug, Clone, Serialize)]
pub struct ShellInfo {
    pub available_shells: Vec<String>,
    pub default_shell: String,
}

/// Get available shells from /etc/shells and detect user's default shell
#[tauri::command]
pub fn get_shell_info() -> ShellInfo {
    let available_shells: Vec<String> = std::fs::read_to_string("/etc/shells")
        .unwrap_or_default()
        .lines()
        .filter(|line| !line.trim().is_empty() && !line.starts_with('#'))
        .filter_map(|path| path.rsplit('/').next().map(String::from))
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let default_shell = std::env::var("SHELL")
        .ok()
        .and_then(|s| s.rsplit('/').next().map(String::from))
        .unwrap_or_else(|| "bash".to_string());

    ShellInfo {
        available_shells,
        default_shell,
    }
}
