# Shell Snippets Manager

> A modern desktop app for managing shell script snippets across Bash, Zsh, and Fish.

[中文](./README.cn.md)

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)](https://www.rust-lang.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Screenshot

<!-- TODO: Add screenshot here -->
<!-- ![Shell Snippets Manager](./screenshots/app.png) -->

## Features

- **Multi-Shell Support** - Manage snippets for Bash, Zsh, and Fish in one place
- **Enable/Disable** - Toggle snippets without deleting them
- **Drag & Drop** - Reorder snippets with intuitive drag-and-drop
- **Sync to Shell** - Export enabled snippets to shell config files
- **Syntax Highlighting** - Beautiful code display with Shiki
- **Dark Theme** - Modern terminal-inspired aesthetic
- **Local Storage** - SQLite database for reliable persistence

## Tech Stack

| Layer             | Technology                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| Desktop Framework | [Tauri 2](https://tauri.app)                                                 |
| Frontend          | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Styling           | [TailwindCSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)  |
| Backend           | [Rust](https://www.rust-lang.org)                                            |
| Database          | [SQLite](https://sqlite.org) via [Diesel ORM](https://diesel.rs)             |
| Package Manager   | [Bun](https://bun.sh)                                                        |

## Installation

### Prerequisites

- [Bun](https://bun.sh) (or npm/pnpm/yarn)
- [Rust](https://rustup.rs)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/AkaraChen/shell-snippets-manager.git
cd shell-snippets-manager

# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## Usage

### Creating Snippets

1. Select your target shell (Bash, Zsh, or Fish)
2. Click "Add Snippet"
3. Enter a name and your shell code
4. Save the snippet

### Syncing to Shell

Click the sync button to export enabled snippets to shell-specific files:

| Shell | Generated File Location                                                              |
| ----- | ------------------------------------------------------------------------------------ |
| Linux | `~/.config/shell-snippets-manager/generated/<shell>.sh`                              |
| macOS | `~/Library/Application Support/com.akrc.shell-snippets-manager/generated/<shell>.sh` |

Then source the generated file in your shell config:

```bash
# For Bash (~/.bashrc)
source ~/.config/shell-snippets-manager/generated/bash.sh

# For Zsh (~/.zshrc)
source ~/.config/shell-snippets-manager/generated/zsh.sh

# For Fish (~/.config/fish/config.fish)
source ~/.config/shell-snippets-manager/generated/fish.fish
```

## Development

```bash
# Development with hot reload
bun run tauri dev

# Frontend only (Vite dev server)
bun run dev

# TypeScript check + build
bun run build

# Run Rust tests
cd src-tauri && cargo test
```

### Project Structure

```
shell-snippets-manager/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── api/                # Tauri IPC wrapper
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Diesel ORM models
│   │   └── db/             # Database schema
│   └── migrations/         # Diesel migrations
└── package.json
```

## License

[MIT](./LICENSE)
