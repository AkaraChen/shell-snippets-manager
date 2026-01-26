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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::create_test_connection;

    #[test]
    fn test_create_tag() {
        let mut conn = create_test_connection();

        let new_tag = NewTag {
            name: "test-tag".to_string(),
            color: None,
        };

        let result = create_tag(&mut conn, new_tag);
        assert!(result.is_ok());

        let tag = result.unwrap();
        assert_eq!(tag.name, "test-tag");
        assert!(tag.color.is_none());
    }

    #[test]
    fn test_create_tag_with_color() {
        let mut conn = create_test_connection();

        let new_tag = NewTag {
            name: "colored-tag".to_string(),
            color: Some("#ff5500".to_string()),
        };

        let result = create_tag(&mut conn, new_tag);
        assert!(result.is_ok());

        let tag = result.unwrap();
        assert_eq!(tag.name, "colored-tag");
        assert_eq!(tag.color, Some("#ff5500".to_string()));
    }

    #[test]
    fn test_get_all_tags_empty() {
        let mut conn = create_test_connection();

        let result = get_all_tags(&mut conn);
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[test]
    fn test_get_all_tags_sorted_by_name() {
        let mut conn = create_test_connection();

        // Create tags in non-alphabetical order
        create_tag(&mut conn, NewTag { name: "zebra".to_string(), color: None }).unwrap();
        create_tag(&mut conn, NewTag { name: "apple".to_string(), color: None }).unwrap();
        create_tag(&mut conn, NewTag { name: "mango".to_string(), color: None }).unwrap();

        let result = get_all_tags(&mut conn).unwrap();
        assert_eq!(result.len(), 3);
        assert_eq!(result[0].name, "apple");
        assert_eq!(result[1].name, "mango");
        assert_eq!(result[2].name, "zebra");
    }

    #[test]
    fn test_get_tag_by_id() {
        let mut conn = create_test_connection();

        let created = create_tag(&mut conn, NewTag {
            name: "findable".to_string(),
            color: None,
        }).unwrap();

        let result = get_tag_by_id(&mut conn, created.id);
        assert!(result.is_ok());

        let tag = result.unwrap();
        assert_eq!(tag.id, created.id);
        assert_eq!(tag.name, "findable");
    }

    #[test]
    fn test_get_tag_not_found() {
        let mut conn = create_test_connection();

        let result = get_tag_by_id(&mut conn, 999);
        assert!(matches!(result, Err(AppError::TagNotFound(999))));
    }

    #[test]
    fn test_delete_tag() {
        let mut conn = create_test_connection();

        let created = create_tag(&mut conn, NewTag {
            name: "deletable".to_string(),
            color: None,
        }).unwrap();

        let result = delete_tag(&mut conn, created.id);
        assert!(result.is_ok());

        // Verify it's gone
        let get_result = get_tag_by_id(&mut conn, created.id);
        assert!(matches!(get_result, Err(AppError::TagNotFound(_))));
    }

    #[test]
    fn test_delete_tag_not_found() {
        let mut conn = create_test_connection();

        let result = delete_tag(&mut conn, 999);
        assert!(matches!(result, Err(AppError::TagNotFound(999))));
    }

    #[test]
    fn test_update_tag_name() {
        let mut conn = create_test_connection();

        let created = create_tag(&mut conn, NewTag {
            name: "old-name".to_string(),
            color: None,
        }).unwrap();

        let result = update_tag(&mut conn, created.id, Some("new-name".to_string()), None);
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.name, "new-name");
    }

    #[test]
    fn test_update_tag_color() {
        let mut conn = create_test_connection();

        let created = create_tag(&mut conn, NewTag {
            name: "colorless".to_string(),
            color: None,
        }).unwrap();

        let result = update_tag(&mut conn, created.id, None, Some(Some("#00ff00".to_string())));
        assert!(result.is_ok());

        let updated = result.unwrap();
        assert_eq!(updated.color, Some("#00ff00".to_string()));
    }

    #[test]
    fn test_update_tag_no_fields() {
        let mut conn = create_test_connection();

        let created = create_tag(&mut conn, NewTag {
            name: "unchanged".to_string(),
            color: None,
        }).unwrap();

        let result = update_tag(&mut conn, created.id, None, None);
        assert!(matches!(result, Err(AppError::ValidationError(_))));
    }
}
