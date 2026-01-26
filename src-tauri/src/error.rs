use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] diesel::result::Error),

    #[error("Snippet not found with id: {0}")]
    SnippetNotFound(i32),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Lock error: failed to acquire database lock")]
    LockError,

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Path error: {0}")]
    PathError(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
