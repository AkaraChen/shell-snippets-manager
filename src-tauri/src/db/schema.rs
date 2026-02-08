// @generated automatically by Diesel CLI.

diesel::table! {
    aliases (id) {
        id -> Integer,
        name -> Text,
        command -> Text,
        description -> Nullable<Text>,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    snippet_aliases (id) {
        id -> Integer,
        snippet_id -> Integer,
        alias_id -> Integer,
    }
}

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

diesel::joinable!(snippet_aliases -> aliases (alias_id));
diesel::joinable!(snippet_aliases -> snippets (snippet_id));

diesel::allow_tables_to_appear_in_same_query!(aliases, snippet_aliases, snippets,);
