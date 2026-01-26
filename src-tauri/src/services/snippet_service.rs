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
