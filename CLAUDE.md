# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shell Snippets Manager is a Tauri 2 desktop application for managing shell script snippets across multiple shell environments (Bash, Zsh, Fish). It features a React frontend with a Rust backend using SQLite for persistence.

## Development Commands

```bash
# Install dependencies
bun install

# Development (frontend + Tauri backend with HMR)
bun run tauri dev

# Frontend only (Vite dev server on port 1420)
bun run dev

# Build production app
bun run tauri build

# TypeScript check + Vite build
bun run build

# Run Rust tests (from src-tauri directory)
cd src-tauri && cargo test

# Run a single Rust test
cd src-tauri && cargo test test_name

# Run Diesel migrations
cd src-tauri && diesel migration run
```

## Architecture

### Three-Layer Backend Pattern

The Rust backend follows a three-layer architecture:

1. **Commands Layer** (`src-tauri/src/commands/`): Tauri command handlers that expose IPC endpoints to the frontend
2. **Services Layer** (`src-tauri/src/services/`): Business logic - `snippet_service`, `sync_service`
3. **Models Layer** (`src-tauri/src/models/`): Diesel ORM models with `Queryable`, `Insertable`, `AsChangeset` traits

### Frontend Structure

- **API Layer** (`src/api/snippets.ts`): Wraps Tauri `invoke()` calls in a `snippetApi` object
- **Custom Hooks** (`src/hooks/`): `useSnippets` for CRUD operations with SWR caching
- **UI Components** (`src/components/ui/`): shadcn/ui components (new-york style)
- **Path Alias**: `@/` maps to `./src`

### IPC Flow

Frontend components → Custom hooks → API layer (`invoke()`) → Tauri commands → Services → Diesel models → SQLite

### Database

- **Linux Location**:
  - Database: `$XDG_DATA_HOME/shell-snippets-manager/snippets.db` (default: `~/.local/share/shell-snippets-manager/`)
  - Generated files: `$XDG_CONFIG_HOME/shell-snippets-manager/generated/` (default: `~/.config/shell-snippets-manager/`)
- **macOS Location**: `~/Library/Application Support/com.akrc.shell-snippets-manager/`
- **Schema**: `snippets`, `tags`, `snippet_tags` (junction table)
- **Migrations**: `src-tauri/migrations/`
- **Path Management**: `src-tauri/src/config/paths.rs` (XDG-compliant via `etcetera` crate)

## Key Files

- `src-tauri/src/lib.rs`: Tauri app setup and command handler registration
- `src-tauri/src/config/paths.rs`: XDG-compliant path management with `etcetera` crate
- `src-tauri/src/db/schema.rs`: Diesel schema (auto-generated, do not edit manually)
- `src-tauri/src/error.rs`: `AppError` enum with `thiserror` derives
- `src/types/snippet.ts`: TypeScript interfaces matching Rust models
- `vite.config.ts`: Vite config with Tauri-specific settings

## Shell Types

The `ShellType` enum (Rust) and union type (TypeScript) support: `bash`, `zsh`, `fish`

## Testing

Backend has unit tests in the services layer. Tests use in-memory SQLite databases via `test_helpers.rs`.
