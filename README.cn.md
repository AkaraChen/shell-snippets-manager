# Shell Snippets Manager

> 一款现代化的桌面应用，用于管理 Bash、Zsh 和 Fish 等多种 Shell 环境的代码片段。

[English](./README.md)

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)](https://www.rust-lang.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)](https://sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## 截图

<!-- TODO: 在此添加截图 -->
<!-- ![Shell Snippets Manager](./screenshots/app.png) -->

## 功能特点

- **多 Shell 支持** - 在一个应用中管理 Bash、Zsh、Fish 的代码片段
- **启用/禁用** - 无需删除即可切换片段状态
- **拖拽排序** - 直观的拖放操作调整顺序
- **同步到 Shell** - 将启用的片段导出到 Shell 配置文件
- **语法高亮** - 使用 Shiki 实现美观的代码展示
- **深色主题** - 现代终端风格界面
- **本地存储** - 使用 SQLite 数据库可靠持久化

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Tauri 2](https://tauri.app) |
| 前端 | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| 样式 | [TailwindCSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| 后端 | [Rust](https://www.rust-lang.org) |
| 数据库 | [SQLite](https://sqlite.org) via [Diesel ORM](https://diesel.rs) |
| 包管理器 | [Bun](https://bun.sh) |

## 安装

### 环境要求

- [Bun](https://bun.sh)（或 npm/pnpm/yarn）
- [Rust](https://rustup.rs)
- [Tauri 依赖](https://v2.tauri.app/start/prerequisites/)

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/AkaraChen/shell-snippets-manager.git
cd shell-snippets-manager

# 安装依赖
bun install

# 开发模式运行
bun run tauri dev

# 构建生产版本
bun run tauri build
```

## 使用方法

### 创建代码片段

1. 选择目标 Shell（Bash、Zsh 或 Fish）
2. 点击「添加片段」
3. 输入名称和 Shell 代码
4. 保存片段

### 同步到 Shell

点击同步按钮，将启用的片段导出到 Shell 配置文件：

| Shell | 生成文件位置 |
|-------|-------------|
| Linux | `~/.config/shell-snippets-manager/generated/<shell>.sh` |
| macOS | `~/Library/Application Support/com.akrc.shell-snippets-manager/generated/<shell>.sh` |

然后在 Shell 配置文件中引入生成的文件：

```bash
# Bash (~/.bashrc)
source ~/.config/shell-snippets-manager/generated/bash.sh

# Zsh (~/.zshrc)
source ~/.config/shell-snippets-manager/generated/zsh.sh

# Fish (~/.config/fish/config.fish)
source ~/.config/shell-snippets-manager/generated/fish.fish
```

## 开发

```bash
# 带热重载的开发模式
bun run tauri dev

# 仅前端（Vite 开发服务器）
bun run dev

# TypeScript 检查 + 构建
bun run build

# 运行 Rust 测试
cd src-tauri && cargo test
```

### 项目结构

```
shell-snippets-manager/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 React Hooks
│   ├── api/                # Tauri IPC 封装
│   └── types/              # TypeScript 类型
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令处理器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # Diesel ORM 模型
│   │   └── db/             # 数据库 Schema
│   └── migrations/         # Diesel 迁移文件
└── package.json
```

## 开源协议

[MIT](./LICENSE)
