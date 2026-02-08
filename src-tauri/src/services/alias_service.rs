use diesel::prelude::*;

use crate::db::schema::aliases::dsl::*;
use crate::db::schema::snippet_aliases::dsl as sa;
use crate::db::schema::snippets::dsl as sn;
use crate::error::{AppError, AppResult};
use crate::models::{
    Alias, AliasResponse, NewAlias, NewSnippetAlias, Snippet, SnippetResponse, UpdateAlias,
};

/// Load an alias and its associated snippets into an AliasResponse
fn load_alias_with_snippets(
    conn: &mut SqliteConnection,
    alias: Alias,
) -> AppResult<AliasResponse> {
    let snippet_list: Vec<Snippet> = sa::snippet_aliases
        .inner_join(sn::snippets)
        .filter(sa::alias_id.eq(alias.id))
        .select(Snippet::as_select())
        .load(conn)?;

    let snippet_responses: Vec<SnippetResponse> = snippet_list
        .into_iter()
        .map(SnippetResponse::from_snippet)
        .collect();

    Ok(AliasResponse::from_alias(alias, snippet_responses))
}

/// Get all aliases with their associated snippets
pub fn get_all_aliases(conn: &mut SqliteConnection) -> AppResult<Vec<AliasResponse>> {
    let alias_list: Vec<Alias> = aliases.order(name.asc()).load(conn)?;

    alias_list
        .into_iter()
        .map(|alias| load_alias_with_snippets(conn, alias))
        .collect()
}

/// Get a single alias by ID with its associated snippets
pub fn get_alias_by_id(conn: &mut SqliteConnection, alias_id: i32) -> AppResult<AliasResponse> {
    let alias: Alias = aliases.find(alias_id).first(conn).map_err(|e| match e {
        diesel::result::Error::NotFound => AppError::AliasNotFound(alias_id),
        _ => AppError::from(e),
    })?;

    load_alias_with_snippets(conn, alias)
}

/// Create a new alias
pub fn create_alias(conn: &mut SqliteConnection, new: NewAlias) -> AppResult<AliasResponse> {
    let alias: Alias = diesel::insert_into(aliases)
        .values(&new)
        .returning(Alias::as_returning())
        .get_result(conn)?;

    Ok(AliasResponse::from_alias(alias, vec![]))
}

/// Update an existing alias
pub fn update_alias(
    conn: &mut SqliteConnection,
    alias_id: i32,
    updates: UpdateAlias,
) -> AppResult<AliasResponse> {
    let updated: Alias = diesel::update(aliases.find(alias_id))
        .set(&updates)
        .returning(Alias::as_returning())
        .get_result(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::AliasNotFound(alias_id),
            _ => AppError::from(e),
        })?;

    load_alias_with_snippets(conn, updated)
}

/// Delete an alias
pub fn delete_alias(conn: &mut SqliteConnection, alias_id: i32) -> AppResult<()> {
    let deleted = diesel::delete(aliases.find(alias_id)).execute(conn)?;

    if deleted == 0 {
        Err(AppError::AliasNotFound(alias_id))
    } else {
        Ok(())
    }
}

/// Add a snippet to an alias
pub fn add_snippet_to_alias(
    conn: &mut SqliteConnection,
    target_alias_id: i32,
    target_snippet_id: i32,
) -> AppResult<()> {
    // Verify both exist
    aliases
        .find(target_alias_id)
        .first::<Alias>(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::AliasNotFound(target_alias_id),
            _ => AppError::from(e),
        })?;

    sn::snippets
        .find(target_snippet_id)
        .first::<Snippet>(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::SnippetNotFound(target_snippet_id),
            _ => AppError::from(e),
        })?;

    let new_assoc = NewSnippetAlias {
        snippet_id: target_snippet_id,
        alias_id: target_alias_id,
    };

    diesel::insert_into(sa::snippet_aliases)
        .values(&new_assoc)
        .execute(conn)?;

    Ok(())
}

/// Remove a snippet from an alias
pub fn remove_snippet_from_alias(
    conn: &mut SqliteConnection,
    target_alias_id: i32,
    target_snippet_id: i32,
) -> AppResult<()> {
    let deleted = diesel::delete(
        sa::snippet_aliases
            .filter(sa::alias_id.eq(target_alias_id))
            .filter(sa::snippet_id.eq(target_snippet_id)),
    )
    .execute(conn)?;

    if deleted == 0 {
        Err(AppError::AliasNotFound(target_alias_id))
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::create_test_connection;
    use crate::models::NewSnippet;
    use crate::services::snippet_service;

    fn create_test_alias(conn: &mut SqliteConnection, alias_name: &str) -> AliasResponse {
        let new = NewAlias {
            name: alias_name.to_string(),
            command: format!("echo {}", alias_name),
            description: Some(format!("Test alias: {}", alias_name)),
        };
        create_alias(conn, new).expect("Failed to create test alias")
    }

    fn create_test_snippet(
        conn: &mut SqliteConnection,
        snippet_name: &str,
        shell: &str,
    ) -> SnippetResponse {
        let new = NewSnippet {
            name: snippet_name.to_string(),
            content: format!("alias {}='echo {}'", snippet_name, snippet_name),
            shell_type: shell.to_string(),
            description: Some(format!("Test snippet: {}", snippet_name)),
            enabled: 1,
            sort_order: 0,
        };
        snippet_service::create_snippet(conn, new).expect("Failed to create test snippet")
    }

    #[test]
    fn test_create_alias() {
        let mut conn = create_test_connection();

        let new = NewAlias {
            name: "ll".to_string(),
            command: "ls -la".to_string(),
            description: Some("List all files".to_string()),
        };

        let result = create_alias(&mut conn, new);
        assert!(result.is_ok());

        let alias = result.unwrap();
        assert_eq!(alias.name, "ll");
        assert_eq!(alias.command, "ls -la");
        assert_eq!(alias.description, Some("List all files".to_string()));
        assert!(alias.snippets.is_empty());
    }

    #[test]
    fn test_get_alias_by_id() {
        let mut conn = create_test_connection();
        let created = create_test_alias(&mut conn, "test_get");

        let result = get_alias_by_id(&mut conn, created.id);
        assert!(result.is_ok());

        let alias = result.unwrap();
        assert_eq!(alias.id, created.id);
        assert_eq!(alias.name, "test_get");
    }

    #[test]
    fn test_get_alias_not_found() {
        let mut conn = create_test_connection();

        let result = get_alias_by_id(&mut conn, 999);
        assert!(matches!(result, Err(AppError::AliasNotFound(999))));
    }

    #[test]
    fn test_get_all_aliases_empty() {
        let mut conn = create_test_connection();

        let result = get_all_aliases(&mut conn);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_get_all_aliases_sorted() {
        let mut conn = create_test_connection();

        create_test_alias(&mut conn, "zz_last");
        create_test_alias(&mut conn, "aa_first");
        create_test_alias(&mut conn, "mm_middle");

        let result = get_all_aliases(&mut conn).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].name, "aa_first");
        assert_eq!(result[1].name, "mm_middle");
        assert_eq!(result[2].name, "zz_last");
    }

    #[test]
    fn test_update_alias() {
        let mut conn = create_test_connection();
        let created = create_test_alias(&mut conn, "update_test");

        let updates = UpdateAlias {
            name: Some("updated_name".to_string()),
            command: None,
            description: None,
        };

        let result = update_alias(&mut conn, created.id, updates);
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "updated_name");
        assert_eq!(updated.command, created.command);
    }

    #[test]
    fn test_delete_alias() {
        let mut conn = create_test_connection();
        let created = create_test_alias(&mut conn, "delete_test");

        let result = delete_alias(&mut conn, created.id);
        assert!(result.is_ok());

        let get_result = get_alias_by_id(&mut conn, created.id);
        assert!(matches!(get_result, Err(AppError::AliasNotFound(_))));
    }

    #[test]
    fn test_delete_alias_not_found() {
        let mut conn = create_test_connection();

        let result = delete_alias(&mut conn, 999);
        assert!(matches!(result, Err(AppError::AliasNotFound(999))));
    }

    #[test]
    fn test_add_snippet_to_alias() {
        let mut conn = create_test_connection();
        let alias = create_test_alias(&mut conn, "with_snippet");
        let snippet = create_test_snippet(&mut conn, "bash_impl", "bash");

        let result = add_snippet_to_alias(&mut conn, alias.id, snippet.id);
        assert!(result.is_ok());

        // Verify the association
        let loaded = get_alias_by_id(&mut conn, alias.id).unwrap();
        assert_eq!(loaded.snippets.len(), 1);
        assert_eq!(loaded.snippets[0].id, snippet.id);
    }

    #[test]
    fn test_add_multiple_snippets_to_alias() {
        let mut conn = create_test_connection();
        let alias = create_test_alias(&mut conn, "multi_shell");
        let bash = create_test_snippet(&mut conn, "bash_impl", "bash");
        let zsh = create_test_snippet(&mut conn, "zsh_impl", "zsh");
        let fish = create_test_snippet(&mut conn, "fish_impl", "fish");

        add_snippet_to_alias(&mut conn, alias.id, bash.id).unwrap();
        add_snippet_to_alias(&mut conn, alias.id, zsh.id).unwrap();
        add_snippet_to_alias(&mut conn, alias.id, fish.id).unwrap();

        let loaded = get_alias_by_id(&mut conn, alias.id).unwrap();
        assert_eq!(loaded.snippets.len(), 3);
    }

    #[test]
    fn test_remove_snippet_from_alias() {
        let mut conn = create_test_connection();
        let alias = create_test_alias(&mut conn, "remove_test");
        let snippet = create_test_snippet(&mut conn, "to_remove", "bash");

        add_snippet_to_alias(&mut conn, alias.id, snippet.id).unwrap();

        let result = remove_snippet_from_alias(&mut conn, alias.id, snippet.id);
        assert!(result.is_ok());

        let loaded = get_alias_by_id(&mut conn, alias.id).unwrap();
        assert!(loaded.snippets.is_empty());
    }

    #[test]
    fn test_delete_alias_cascades_junction() {
        let mut conn = create_test_connection();
        let alias = create_test_alias(&mut conn, "cascade_test");
        let snippet = create_test_snippet(&mut conn, "cascade_snippet", "bash");

        add_snippet_to_alias(&mut conn, alias.id, snippet.id).unwrap();
        delete_alias(&mut conn, alias.id).unwrap();

        // Snippet should still exist
        let snippet_result = snippet_service::get_snippet_by_id(&mut conn, snippet.id);
        assert!(snippet_result.is_ok());
    }
}
