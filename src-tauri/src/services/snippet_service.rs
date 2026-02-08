use diesel::prelude::*;

use crate::db::schema::snippets::dsl::*;
use crate::error::{AppError, AppResult};
use crate::models::{NewSnippet, Snippet, SnippetResponse, UpdateSnippet};

/// Get all snippets ordered by sort_order
pub fn get_all_snippets(conn: &mut SqliteConnection) -> AppResult<Vec<SnippetResponse>> {
    snippets
        .order(sort_order.asc())
        .load::<Snippet>(conn)?
        .into_iter()
        .map(|snippet| Ok(SnippetResponse::from_snippet(snippet)))
        .collect()
}

/// Get a single snippet by ID
pub fn get_snippet_by_id(conn: &mut SqliteConnection, snippet_id: i32) -> AppResult<SnippetResponse> {
    let snippet: Snippet = snippets
        .find(snippet_id)
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::SnippetNotFound(snippet_id),
            _ => AppError::from(e),
        })?;

    Ok(SnippetResponse::from_snippet(snippet))
}

/// Get all enabled snippets for a specific shell type, ordered by sort_order
pub fn get_enabled_snippets_by_shell(
    conn: &mut SqliteConnection,
    target_shell: &str,
) -> AppResult<Vec<Snippet>> {
    let result = snippets
        .filter(shell_type.eq(target_shell))
        .filter(enabled.eq(1))
        .order(sort_order.asc())
        .load::<Snippet>(conn)?;

    Ok(result)
}

/// Create a new snippet
pub fn create_snippet(conn: &mut SqliteConnection, new: NewSnippet) -> AppResult<SnippetResponse> {
    diesel::insert_into(snippets)
        .values(&new)
        .returning(Snippet::as_returning())
        .get_result(conn)
        .map(SnippetResponse::from_snippet)
        .map_err(AppError::from)
}

/// Update an existing snippet
pub fn update_snippet(
    conn: &mut SqliteConnection,
    snippet_id: i32,
    updates: UpdateSnippet,
) -> AppResult<SnippetResponse> {
    let updated: Snippet = diesel::update(snippets.find(snippet_id))
        .set(&updates)
        .returning(Snippet::as_returning())
        .get_result(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::SnippetNotFound(snippet_id),
            _ => AppError::from(e),
        })?;

    Ok(SnippetResponse::from_snippet(updated))
}

/// Delete a snippet
pub fn delete_snippet(conn: &mut SqliteConnection, snippet_id: i32) -> AppResult<()> {
    let deleted = diesel::delete(snippets.find(snippet_id)).execute(conn)?;

    if deleted == 0 {
        Err(AppError::SnippetNotFound(snippet_id))
    } else {
        Ok(())
    }
}

/// Toggle snippet enabled status
pub fn toggle_snippet(conn: &mut SqliteConnection, snippet_id: i32) -> AppResult<SnippetResponse> {
    let snippet: Snippet = snippets
        .find(snippet_id)
        .first(conn)
        .map_err(|_| AppError::SnippetNotFound(snippet_id))?;

    let new_enabled = if snippet.is_enabled() { 0 } else { 1 };

    let updated: Snippet = diesel::update(snippets.find(snippet_id))
        .set(enabled.eq(new_enabled))
        .returning(Snippet::as_returning())
        .get_result(conn)?;

    Ok(SnippetResponse::from_snippet(updated))
}

/// Reorder snippets - updates sort_order for multiple snippets
pub fn reorder_snippets(
    conn: &mut SqliteConnection,
    order_updates: Vec<(i32, i32)>,
) -> AppResult<()> {
    conn.transaction(|conn| {
        for (snippet_id, new_order) in order_updates {
            diesel::update(snippets.find(snippet_id))
                .set(sort_order.eq(new_order))
                .execute(conn)?;
        }
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::create_test_connection;

    fn create_test_snippet(conn: &mut SqliteConnection, name_str: &str, shell: &str) -> SnippetResponse {
        let new_snippet = NewSnippet {
            name: name_str.to_string(),
            content: format!("alias {}='echo {}'", name_str, name_str),
            shell_type: shell.to_string(),
            description: Some(format!("Test snippet: {}", name_str)),
            enabled: 1,
            sort_order: 0,
        };
        create_snippet(conn, new_snippet).expect("Failed to create test snippet")
    }

    #[test]
    fn test_create_snippet() {
        let mut conn = create_test_connection();

        let new_snippet = NewSnippet {
            name: "Test Alias".to_string(),
            content: "alias test='echo test'".to_string(),
            shell_type: "bash".to_string(),
            description: Some("A test alias".to_string()),
            enabled: 1,
            sort_order: 0,
        };

        let result = create_snippet(&mut conn, new_snippet);
        assert!(result.is_ok());

        let snippet = result.unwrap();
        assert_eq!(snippet.name, "Test Alias");
        assert_eq!(snippet.shell_type, "bash");
        assert_eq!(snippet.content, "alias test='echo test'");
        assert!(snippet.enabled);
    }

    #[test]
    fn test_get_snippet_by_id() {
        let mut conn = create_test_connection();
        let created = create_test_snippet(&mut conn, "get_test", "bash");

        let result = get_snippet_by_id(&mut conn, created.id);
        assert!(result.is_ok());

        let snippet = result.unwrap();
        assert_eq!(snippet.id, created.id);
        assert_eq!(snippet.name, "get_test");
    }

    #[test]
    fn test_get_snippet_not_found() {
        let mut conn = create_test_connection();

        let result = get_snippet_by_id(&mut conn, 999);
        assert!(matches!(result, Err(AppError::SnippetNotFound(999))));
    }

    #[test]
    fn test_get_all_snippets_empty() {
        let mut conn = create_test_connection();

        let result = get_all_snippets(&mut conn);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_get_all_snippets_with_sort() {
        let mut conn = create_test_connection();

        // Create snippets with different sort orders
        let s1 = NewSnippet {
            name: "Second".to_string(),
            content: "echo second".to_string(),
            shell_type: "bash".to_string(),
            description: None,
            enabled: 1,
            sort_order: 2,
        };
        let s2 = NewSnippet {
            name: "First".to_string(),
            content: "echo first".to_string(),
            shell_type: "bash".to_string(),
            description: None,
            enabled: 1,
            sort_order: 1,
        };
        let s3 = NewSnippet {
            name: "Third".to_string(),
            content: "echo third".to_string(),
            shell_type: "bash".to_string(),
            description: None,
            enabled: 1,
            sort_order: 3,
        };

        create_snippet(&mut conn, s1).unwrap();
        create_snippet(&mut conn, s2).unwrap();
        create_snippet(&mut conn, s3).unwrap();

        let result = get_all_snippets(&mut conn).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].name, "First");
        assert_eq!(result[1].name, "Second");
        assert_eq!(result[2].name, "Third");
    }

    #[test]
    fn test_update_snippet() {
        let mut conn = create_test_connection();
        let created = create_test_snippet(&mut conn, "update_test", "bash");

        let updates = UpdateSnippet {
            name: Some("Updated Name".to_string()),
            content: None,
            shell_type: None,
            description: None,
            enabled: None,
            sort_order: None,
        };

        let result = update_snippet(&mut conn, created.id, updates);
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.content, created.content); // unchanged
    }

    #[test]
    fn test_delete_snippet() {
        let mut conn = create_test_connection();
        let created = create_test_snippet(&mut conn, "delete_test", "bash");

        let result = delete_snippet(&mut conn, created.id);
        assert!(result.is_ok());

        // Verify it's gone
        let get_result = get_snippet_by_id(&mut conn, created.id);
        assert!(matches!(get_result, Err(AppError::SnippetNotFound(_))));
    }

    #[test]
    fn test_delete_snippet_not_found() {
        let mut conn = create_test_connection();

        let result = delete_snippet(&mut conn, 999);
        assert!(matches!(result, Err(AppError::SnippetNotFound(999))));
    }

    #[test]
    fn test_toggle_snippet() {
        let mut conn = create_test_connection();
        let created = create_test_snippet(&mut conn, "toggle_test", "bash");
        assert!(created.enabled);

        // Toggle off
        let toggled = toggle_snippet(&mut conn, created.id).unwrap();
        assert!(!toggled.enabled);

        // Toggle back on
        let toggled_again = toggle_snippet(&mut conn, created.id).unwrap();
        assert!(toggled_again.enabled);
    }

    #[test]
    fn test_reorder_snippets() {
        let mut conn = create_test_connection();

        let s1 = create_test_snippet(&mut conn, "reorder1", "bash");
        let s2 = create_test_snippet(&mut conn, "reorder2", "bash");
        let s3 = create_test_snippet(&mut conn, "reorder3", "bash");

        // Reorder: s3 first, s1 second, s2 third
        let order = vec![(s3.id, 1), (s1.id, 2), (s2.id, 3)];
        let result = reorder_snippets(&mut conn, order);
        assert!(result.is_ok());

        let all = get_all_snippets(&mut conn).unwrap();
        assert_eq!(all[0].name, "reorder3");
        assert_eq!(all[1].name, "reorder1");
        assert_eq!(all[2].name, "reorder2");
    }

    #[test]
    fn test_get_enabled_snippets_by_shell() {
        let mut conn = create_test_connection();

        // Create bash snippets
        create_test_snippet(&mut conn, "bash1", "bash");
        create_test_snippet(&mut conn, "bash2", "bash");

        // Create zsh snippet
        create_test_snippet(&mut conn, "zsh1", "zsh");

        // Create disabled bash snippet
        let disabled = NewSnippet {
            name: "bash_disabled".to_string(),
            content: "echo disabled".to_string(),
            shell_type: "bash".to_string(),
            description: None,
            enabled: 0,
            sort_order: 0,
        };
        create_snippet(&mut conn, disabled).unwrap();

        // Get enabled bash snippets
        let bash_snippets = get_enabled_snippets_by_shell(&mut conn, "bash").unwrap();
        assert_eq!(bash_snippets.len(), 2);

        // Get enabled zsh snippets
        let zsh_snippets = get_enabled_snippets_by_shell(&mut conn, "zsh").unwrap();
        assert_eq!(zsh_snippets.len(), 1);

        // Get fish snippets (none)
        let fish_snippets = get_enabled_snippets_by_shell(&mut conn, "fish").unwrap();
        assert!(fish_snippets.is_empty());
    }
}
