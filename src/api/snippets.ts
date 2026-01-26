import { invoke } from '@tauri-apps/api/core';
import type { Snippet, NewSnippet, UpdateSnippet, ShellType, Tag, NewTag } from '../types/snippet';

export const snippetApi = {
  // Snippet CRUD
  getAll: () => invoke<Snippet[]>('get_snippets'),

  getById: (id: number) => invoke<Snippet>('get_snippet', { id }),

  create: (snippet: NewSnippet) => invoke<Snippet>('create_snippet', { snippet }),

  update: (id: number, updates: UpdateSnippet) =>
    invoke<Snippet>('update_snippet', { id, updates }),

  delete: (id: number) => invoke<void>('delete_snippet', { id }),

  toggle: (id: number) => invoke<Snippet>('toggle_snippet', { id }),

  reorder: (order: [number, number][]) =>
    invoke<void>('reorder_snippets', { order }),
};

export const tagApi = {
  // Tag CRUD
  getAll: () => invoke<Tag[]>('get_tags'),

  create: (tag: NewTag) => invoke<Tag>('create_tag', { tag }),

  delete: (id: number) => invoke<void>('delete_tag', { id }),

  // Snippet-Tag associations
  addToSnippet: (snippetId: number, tagId: number) =>
    invoke<void>('add_tag_to_snippet', { snippetId, tagId }),

  removeFromSnippet: (snippetId: number, tagId: number) =>
    invoke<void>('remove_tag_from_snippet', { snippetId, tagId }),
};

export const syncApi = {
  // Sync operations
  syncToFile: (shellType: ShellType) =>
    invoke<string>('sync_to_file', { shellType }),

  syncAllShells: () => invoke<string[]>('sync_all_shells'),

  getSourceLine: (shellType: ShellType) =>
    invoke<string>('get_source_line', { shellType }),

  getOutputDirectory: () => invoke<string>('get_output_directory'),
};
