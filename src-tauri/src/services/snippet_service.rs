use diesel::prelude::*;

use crate::db::schema::snippet_tags::dsl as st_dsl;
use crate::db::schema::snippets::dsl::*;
use crate::db::schema::tags::dsl as tags_dsl;
use crate::error::{AppError, AppResult};
use crate::models::{
    NewSnippet, NewSnippetTag, Snippet, SnippetResponse, SnippetTag, Tag, TagResponse,
    UpdateSnippet,
};

/// Get all snippets with their tags, ordered by sort_order
pub fn get_all_snippets(conn: &mut SqliteConnection) -> AppResult<Vec<SnippetResponse>> {
    let all_snippets: Vec<Snippet> = snippets.order(sort_order.asc()).load(conn)?;

    let all_tags: Vec<(SnippetTag, Tag)> = SnippetTag::belonging_to(&all_snippets)
        .inner_join(tags_dsl::tags)
        .select((SnippetTag::as_select(), Tag::as_select()))
        .load(conn)?;

    let tags_per_snippet = all_tags.grouped_by(&all_snippets);

    let result = all_snippets
        .into_iter()
        .zip(tags_per_snippet)
        .map(|(snippet, snippet_tags)| {
            let tag_responses: Vec<TagResponse> = snippet_tags
                .into_iter()
                .map(|(_, tag)| TagResponse::from(tag))
                .collect();
            SnippetResponse::from_snippet(snippet, tag_responses)
        })
        .collect();

    Ok(result)
}

/// Get a single snippet by ID with its tags
pub fn get_snippet_by_id(conn: &mut SqliteConnection, snippet_id: i32) -> AppResult<SnippetResponse> {
    let snippet: Snippet = snippets
        .find(snippet_id)
        .first(conn)
        .map_err(|e| match e {
            diesel::result::Error::NotFound => AppError::SnippetNotFound(snippet_id),
            _ => AppError::from(e),
        })?;

    let snippet_tags: Vec<Tag> = st_dsl::snippet_tags
        .filter(st_dsl::snippet_id.eq(snippet_id))
        .inner_join(tags_dsl::tags)
        .select(Tag::as_select())
        .load(conn)?;

    let tag_responses: Vec<TagResponse> = snippet_tags.into_iter().map(TagResponse::from).collect();

    Ok(SnippetResponse::from_snippet(snippet, tag_responses))
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
        .map(|s| SnippetResponse::from_snippet(s, vec![]))
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

    // Fetch tags for the updated snippet
    let snippet_tags: Vec<Tag> = st_dsl::snippet_tags
        .filter(st_dsl::snippet_id.eq(snippet_id))
        .inner_join(tags_dsl::tags)
        .select(Tag::as_select())
        .load(conn)?;

    let tag_responses: Vec<TagResponse> = snippet_tags.into_iter().map(TagResponse::from).collect();

    Ok(SnippetResponse::from_snippet(updated, tag_responses))
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

    // Fetch tags
    let snippet_tags: Vec<Tag> = st_dsl::snippet_tags
        .filter(st_dsl::snippet_id.eq(snippet_id))
        .inner_join(tags_dsl::tags)
        .select(Tag::as_select())
        .load(conn)?;

    let tag_responses: Vec<TagResponse> = snippet_tags.into_iter().map(TagResponse::from).collect();

    Ok(SnippetResponse::from_snippet(updated, tag_responses))
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

/// Get tags for a specific snippet
pub fn get_tags_for_snippet(conn: &mut SqliteConnection, snippet_id: i32) -> AppResult<Vec<TagResponse>> {
    let snippet_tags: Vec<Tag> = st_dsl::snippet_tags
        .filter(st_dsl::snippet_id.eq(snippet_id))
        .inner_join(tags_dsl::tags)
        .select(Tag::as_select())
        .load(conn)?;

    Ok(snippet_tags.into_iter().map(TagResponse::from).collect())
}

/// Add a tag to a snippet
pub fn add_tag_to_snippet(
    conn: &mut SqliteConnection,
    target_snippet_id: i32,
    target_tag_id: i32,
) -> AppResult<()> {
    // Verify snippet exists
    snippets
        .find(target_snippet_id)
        .first::<Snippet>(conn)
        .map_err(|_| AppError::SnippetNotFound(target_snippet_id))?;

    // Verify tag exists
    tags_dsl::tags
        .find(target_tag_id)
        .first::<Tag>(conn)
        .map_err(|_| AppError::TagNotFound(target_tag_id))?;

    let new_association = NewSnippetTag {
        snippet_id: target_snippet_id,
        tag_id: target_tag_id,
    };

    diesel::insert_into(st_dsl::snippet_tags)
        .values(&new_association)
        .on_conflict_do_nothing()
        .execute(conn)?;

    Ok(())
}

/// Remove a tag from a snippet
pub fn remove_tag_from_snippet(
    conn: &mut SqliteConnection,
    target_snippet_id: i32,
    target_tag_id: i32,
) -> AppResult<()> {
    diesel::delete(
        st_dsl::snippet_tags
            .filter(st_dsl::snippet_id.eq(target_snippet_id))
            .filter(st_dsl::tag_id.eq(target_tag_id)),
    )
    .execute(conn)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::create_test_connection;
    use crate::models::NewTag;
    use crate::services::tag_service;

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

    fn create_test_tag(conn: &mut SqliteConnection, name_str: &str) -> TagResponse {
        let new_tag = NewTag {
            name: name_str.to_string(),
            color: None,
        };
        tag_service::create_tag(conn, new_tag).expect("Failed to create test tag")
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
        assert!(snippet.tags.is_empty());
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

    #[test]
    fn test_add_tag_to_snippet() {
        let mut conn = create_test_connection();

        let snippet = create_test_snippet(&mut conn, "tag_test", "bash");
        let tag = create_test_tag(&mut conn, "test-tag");

        let result = add_tag_to_snippet(&mut conn, snippet.id, tag.id);
        assert!(result.is_ok());

        // Verify the tag is associated
        let fetched = get_snippet_by_id(&mut conn, snippet.id).unwrap();
        assert_eq!(fetched.tags.len(), 1);
        assert_eq!(fetched.tags[0].name, "test-tag");
    }

    #[test]
    fn test_add_tag_to_nonexistent_snippet() {
        let mut conn = create_test_connection();

        let tag = create_test_tag(&mut conn, "orphan-tag");

        let result = add_tag_to_snippet(&mut conn, 999, tag.id);
        assert!(matches!(result, Err(AppError::SnippetNotFound(999))));
    }

    #[test]
    fn test_add_tag_with_nonexistent_tag() {
        let mut conn = create_test_connection();

        let snippet = create_test_snippet(&mut conn, "tag_test2", "bash");

        let result = add_tag_to_snippet(&mut conn, snippet.id, 999);
        assert!(matches!(result, Err(AppError::TagNotFound(999))));
    }

    #[test]
    fn test_remove_tag_from_snippet() {
        let mut conn = create_test_connection();

        let snippet = create_test_snippet(&mut conn, "remove_tag_test", "bash");
        let tag = create_test_tag(&mut conn, "removable-tag");

        // Add then remove
        add_tag_to_snippet(&mut conn, snippet.id, tag.id).unwrap();
        let result = remove_tag_from_snippet(&mut conn, snippet.id, tag.id);
        assert!(result.is_ok());

        // Verify tag is removed
        let fetched = get_snippet_by_id(&mut conn, snippet.id).unwrap();
        assert!(fetched.tags.is_empty());
    }

    #[test]
    fn test_snippet_with_multiple_tags() {
        let mut conn = create_test_connection();

        let snippet = create_test_snippet(&mut conn, "multi_tag", "bash");
        let tag1 = create_test_tag(&mut conn, "tag-a");
        let tag2 = create_test_tag(&mut conn, "tag-b");
        let tag3 = create_test_tag(&mut conn, "tag-c");

        add_tag_to_snippet(&mut conn, snippet.id, tag1.id).unwrap();
        add_tag_to_snippet(&mut conn, snippet.id, tag2.id).unwrap();
        add_tag_to_snippet(&mut conn, snippet.id, tag3.id).unwrap();

        let fetched = get_snippet_by_id(&mut conn, snippet.id).unwrap();
        assert_eq!(fetched.tags.len(), 3);
    }
}
