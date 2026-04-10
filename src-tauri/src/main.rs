// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
	// GUI-launched apps often miss the user's shell PATH, which breaks terminal previews.
	let _ = fix_path_env::fix();
	shell_snippets_manager_lib::run()
}
