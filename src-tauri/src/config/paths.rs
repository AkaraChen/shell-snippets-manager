use crate::error::{AppError, AppResult};
use std::fs;
use std::path::{Path, PathBuf};

#[cfg(target_os = "linux")]
use etcetera::base_strategy::BaseStrategy;
#[cfg(target_os = "linux")]
use etcetera::base_strategy::Xdg;

#[cfg(target_os = "macos")]
use etcetera::base_strategy::Apple;
#[cfg(target_os = "macos")]
use etcetera::base_strategy::BaseStrategy;

/// Manages application file paths following XDG Base Directory Specification on Linux
/// and Apple conventions on macOS.
///
/// On Linux:
/// - Database stored in XDG_DATA_HOME/shell-snippets-manager/
/// - Generated shell files in XDG_CONFIG_HOME/shell-snippets-manager/generated/
///
/// On macOS:
/// - Both stored in ~/Library/Application Support/com.akrc.shell-snippets-manager/
pub struct AppPaths {
    data_dir: PathBuf,
    config_dir: PathBuf,
}

impl AppPaths {
    /// Initialize application paths using platform-specific directory strategies.
    ///
    /// On Linux, respects XDG_DATA_HOME and XDG_CONFIG_HOME environment variables.
    /// On macOS, uses Apple's standard application support directory.
    pub fn new() -> AppResult<Self> {
        let (data_dir, config_dir) = Self::initialize_dirs()?;

        // Ensure directories exist
        fs::create_dir_all(&data_dir).map_err(|e| {
            AppError::PathError(format!("Failed to create data directory: {}", e))
        })?;

        fs::create_dir_all(&config_dir).map_err(|e| {
            AppError::PathError(format!("Failed to create config directory: {}", e))
        })?;

        Ok(Self {
            data_dir,
            config_dir,
        })
    }

    #[cfg(target_os = "linux")]
    fn initialize_dirs() -> AppResult<(PathBuf, PathBuf)> {
        let strategy = Xdg::new().map_err(|e| {
            AppError::PathError(format!("Failed to initialize XDG strategy: {}", e))
        })?;

        let data_dir = strategy
            .data_dir()
            .join("shell-snippets-manager");

        let config_dir = strategy
            .config_dir()
            .join("shell-snippets-manager");

        Ok((data_dir, config_dir))
    }

    #[cfg(target_os = "macos")]
    fn initialize_dirs() -> AppResult<(PathBuf, PathBuf)> {
        let strategy = Apple::new().map_err(|e| {
            AppError::PathError(format!("Failed to initialize Apple strategy: {}", e))
        })?;

        // On macOS, use the same directory for both data and config
        let app_dir = strategy
            .data_dir()
            .join("com.akrc.shell-snippets-manager");

        Ok((app_dir.clone(), app_dir))
    }

    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    fn initialize_dirs() -> AppResult<(PathBuf, PathBuf)> {
        Err(AppError::PathError(
            "Unsupported platform. Only Linux and macOS are supported.".to_string(),
        ))
    }

    /// Returns the data directory path.
    ///
    /// On Linux: $XDG_DATA_HOME/shell-snippets-manager (default: ~/.local/share/shell-snippets-manager)
    /// On macOS: ~/Library/Application Support/com.akrc.shell-snippets-manager
    pub fn data_dir(&self) -> &Path {
        &self.data_dir
    }

    /// Returns the config directory path.
    ///
    /// On Linux: $XDG_CONFIG_HOME/shell-snippets-manager (default: ~/.config/shell-snippets-manager)
    /// On macOS: ~/Library/Application Support/com.akrc.shell-snippets-manager (same as data_dir)
    pub fn config_dir(&self) -> &Path {
        &self.config_dir
    }

    /// Returns the full path to the database file.
    pub fn database_path(&self) -> PathBuf {
        self.data_dir.join("snippets.db")
    }

    /// Returns the directory path for generated shell files.
    pub fn output_dir(&self) -> PathBuf {
        self.config_dir.join("generated")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_paths_initialization() {
        let paths = AppPaths::new();
        assert!(paths.is_ok(), "AppPaths should initialize successfully");
    }

    #[test]
    fn test_database_path() {
        let paths = AppPaths::new().expect("Failed to create AppPaths");
        let db_path = paths.database_path();
        assert!(
            db_path.ends_with("snippets.db"),
            "Database path should end with snippets.db"
        );
    }

    #[test]
    fn test_output_dir() {
        let paths = AppPaths::new().expect("Failed to create AppPaths");
        let output_dir = paths.output_dir();
        assert!(
            output_dir.ends_with("generated"),
            "Output directory should end with 'generated'"
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn test_xdg_separation() {
        let paths = AppPaths::new().expect("Failed to create AppPaths");
        // On Linux, data_dir and config_dir should be different
        // unless user has set XDG vars to the same location
        let data_parent = paths.data_dir().parent();
        let config_parent = paths.config_dir().parent();

        // At minimum, they should both contain shell-snippets-manager
        assert!(
            paths.data_dir().ends_with("shell-snippets-manager"),
            "Data dir should end with shell-snippets-manager"
        );
        assert!(
            paths.config_dir().ends_with("shell-snippets-manager"),
            "Config dir should end with shell-snippets-manager"
        );
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn test_single_dir_macos() {
        let paths = AppPaths::new().expect("Failed to create AppPaths");
        // On macOS, data_dir and config_dir should be the same
        assert_eq!(
            paths.data_dir(),
            paths.config_dir(),
            "On macOS, data_dir and config_dir should be identical"
        );
        assert!(
            paths.data_dir().ends_with("com.akrc.shell-snippets-manager"),
            "Directory should end with com.akrc.shell-snippets-manager"
        );
    }

    #[test]
    fn test_paths_are_absolute() {
        let paths = AppPaths::new().expect("Failed to create AppPaths");
        assert!(
            paths.data_dir().is_absolute(),
            "Data directory should be absolute path"
        );
        assert!(
            paths.config_dir().is_absolute(),
            "Config directory should be absolute path"
        );
    }
}
