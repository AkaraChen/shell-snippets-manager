use diesel::prelude::*;

use crate::db::schema::tags::dsl::*;
use crate::error::{AppError, AppResult};
use crate::models::{NewTag, Tag, TagResponse};

/// Get all tags
pub fn get_all_tags(conn: &mut SqliteConnection) -> AppResult<Vec<TagResponse>> {
    let all_tags: Vec<Tag> = tags.order(name.asc()).load(conn)?;
    Ok(all_tags.into_iter().map(TagResponse::from).collect())
}

/// Get a single tag by ID
pub fn get_tag_by_id(conn: &mut SqliteConnection, tag_id: i32) -> AppResult<TagResponse> {
    let tag: Tag = tags.find(tag_id).first(conn).map_err(|e| match e {
        diesel::result::Error::NotFound => AppError::TagNotFound(tag_id),
        _ => AppError::from(e),
    })?;

    Ok(TagResponse::from(tag))
}

/// Create a new tag
pub fn create_tag(conn: &mut SqliteConnection, new: NewTag) -> AppResult<TagResponse> {
    diesel::insert_into(tags)
        .values(&new)
        .returning(Tag::as_returning())
        .get_result(conn)
        .map(TagResponse::from)
        .map_err(AppError::from)
}

/// Update tag
pub fn update_tag(
    conn: &mut SqliteConnection,
    tag_id: i32,
    new_name: Option<String>,
    new_color: Option<Option<String>>,
) -> AppResult<TagResponse> {
    // Build the update dynamically
    let mut updated = false;

    if let Some(n) = new_name {
        diesel::update(tags.find(tag_id))
            .set(name.eq(n))
            .execute(conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::TagNotFound(tag_id),
                _ => AppError::from(e),
            })?;
        updated = true;
    }

    if let Some(c) = new_color {
        diesel::update(tags.find(tag_id))
            .set(color.eq(c))
            .execute(conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::TagNotFound(tag_id),
                _ => AppError::from(e),
            })?;
        updated = true;
    }

    if !updated {
        return Err(AppError::ValidationError(
            "No fields to update".to_string(),
        ));
    }

    get_tag_by_id(conn, tag_id)
}

/// Delete a tag
pub fn delete_tag(conn: &mut SqliteConnection, tag_id: i32) -> AppResult<()> {
    let deleted = diesel::delete(tags.find(tag_id)).execute(conn)?;

    if deleted == 0 {
        Err(AppError::TagNotFound(tag_id))
    } else {
        Ok(())
    }
}
