// @generated automatically by Diesel CLI.

diesel::table! {
    snippets (id) {
        id -> Integer,
        name -> Text,
        content -> Text,
        shell_type -> Text,
        description -> Nullable<Text>,
        enabled -> Integer,
        sort_order -> Integer,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    tags (id) {
        id -> Integer,
        name -> Text,
        color -> Nullable<Text>,
    }
}

diesel::table! {
    snippet_tags (snippet_id, tag_id) {
        snippet_id -> Integer,
        tag_id -> Integer,
    }
}

diesel::joinable!(snippet_tags -> snippets (snippet_id));
diesel::joinable!(snippet_tags -> tags (tag_id));

diesel::allow_tables_to_appear_in_same_query!(
    snippets,
    tags,
    snippet_tags,
);
