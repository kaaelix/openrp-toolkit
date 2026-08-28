# OpenRP Developer Toolkit & Model Context Protocol (MCP) Server

[![OpenRP Suite](https://img.shields.io/badge/OpenRP-v1.0.0-00E5FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrp.ai)
[![MCP Compatible](https://img.shields.io/badge/MCP-Standard%202024--11--05-7C4DFF?style=for-the-badge)](https://modelcontextprotocol.io)
[![npm version](https://img.shields.io/badge/npm-v1.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/openrp-toolkit)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Kaa-FF4081?style=for-the-badge)](https://github.com/kaaelix)

> **Author & Maintainer**: **Kaa** ([@kaaelix](https://github.com/kaaelix) | OpenRP: [@Seraaa](https://openrp.ai/Seraaa))  
> *An independent, community-built AI Agent Skill and Model Context Protocol (MCP) suite for [OpenRP.ai](https://openrp.ai).*

---

> [!NOTE]
> **Community Release Notice (v1.0.0)**:
> This is version `1.0.0` of the OpenRP Toolkit. While all 47 MCP tools have been verified and tested against live OpenRP endpoints, this is an evolving community-driven suite. Minor edge cases, upstream backend schema adjustments, or unexpected behavior may still occur under certain account tiers.
> If you encounter any bugs, unexpected errors, or have feature suggestions, please file an issue or contribute directly on GitHub:
> **https://github.com/kaaelix/openrp-toolkit**

---

## Executive Overview

**OpenRP Toolkit** is a Model Context Protocol (MCP) server and AI Agent Skill suite engineered for **[OpenRP.ai](https://openrp.ai)**. It empowers AI coding assistants and agent environments—including **Google Antigravity**, **Gemini CLI**, **Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, and **OpenAI Codex**—to autonomously architect, deploy, test, trace, and debug interactive roleplay universes, autonomous AI personas, 38-node behavior graphs, semantic vector lorebooks, confidential exclusive lore, prompt templates, and multi-agent group chatrooms.

---

## Key Capabilities

* **47 Comprehensive MCP Tools**: Full operational coverage across 9 distinct domains (Authentication, Worlds, Lorebook & Exclusive Access, Characters, Character Groups & Factions, Prompts, Behavior Graphs, Executions, Chats, and Foundation AI Models).
* **Pure Node.js Engine (Zero External Dependencies)**: Built entirely using Node.js 18+ native `fetch` and standard library modules. No compilation or third-party dependencies required.
* **Autonomous Background Token Refresh Daemon**: Automatically refreshes Supabase JWT authentication every 45 minutes to maintain active sessions.
* **Full 38-Node Behavior Engine Palette**: Support for all OpenRP node types (Events, AI Models, Control Flow, Storage, Utilities, Streaming, Try-Catch).
* **Deterministic ReactFlow Sanitization**: Automatically normalizes edge IDs (`xy-edge__<source><sourceHandle>-<target><targetHandle>`) and coordinates to prevent graph layout collapse.
* **Multi-Agent Group Orchestration**: Blueprints for Mention Gates, Round-Robin turn cycling, and Game Master Arbiter state machines.
* **Interactive CLI Installer with Auto-Detection**: Single command setup for all AI assistants via `npx openrp-toolkit install`.

---

## Quickstart via NPX (Recommended)

You can run, install, and diagnose the toolkit directly using `npx` without cloning the repository:

### 1. Interactive Installation
Run the installer to configure your environment automatically:
```bash
npx openrp-toolkit install
```
The installer provides:
* **Auto-Detect Environments**: Automatically scans your system for installed AI assistants (Google Antigravity, Claude Code, Claude Desktop, Cursor, Windsurf) and configures them instantly.
* **Custom Platform Selection**: Lets you choose specific target platforms manually.

### 2. Authentication Setup
Set up your OpenRP session credentials interactively:
```bash
npx openrp-toolkit auth
```

### 3. Environment & Connectivity Diagnostics
Verify your installation, Node runtime, and OpenRP API connectivity:
```bash
npx openrp-toolkit doctor
```

---

## Direct MCP Client Configuration

To configure OpenRP directly inside your MCP client settings (`mcp.json` / `claude_desktop_config.json`):

### Option A: Using NPX (Global / Standalone)
```json
{
  "mcpServers": {
    "openrp": {
      "command": "npx",
      "args": ["-y", "openrp-toolkit", "serve"]
    }
  }
}
```

### Option B: Using Local Node Server
```json
{
  "mcpServers": {
    "openrp": {
      "command": "node",
      "args": ["/path/to/openrp-toolkit/mcp/server.js"]
    }
  }
}
```

---

## Manual Installation Guide by Platform

If you prefer manual setup over the `npx openrp-toolkit install` command:

### 1. Google Antigravity & Gemini CLI (`agy`)
```bash
# 1. Create skill directory
mkdir -p ~/.agents/skills/openrp

# 2. Copy skill files
cp -r skills/openrp/* ~/.agents/skills/openrp/

# 3. Add to ~/.gemini/antigravity-cli/mcp_config.json
```
```json
{
  "mcpServers": {
    "openrp": {
      "command": "node",
      "args": ["/path/to/openrp-toolkit/mcp/server.js"]
    }
  }
}
```

### 2. Claude Code CLI
```bash
claude mcp add openrp node "/path/to/openrp-toolkit/mcp/server.js"
```

### 3. Cursor IDE
Add to your project's `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "openrp": {
      "command": "node",
      "args": ["/path/to/openrp-toolkit/mcp/server.js"]
    }
  }
}
```

### 4. Claude Desktop App
Add to `claude_desktop_config.json`:
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openrp": {
      "command": "node",
      "args": ["/path/to/openrp-toolkit/mcp/server.js"]
    }
  }
}
```

---

## Authentication Guide

OpenRP utilizes Supabase authentication. You can authenticate using either method:

### Method 1: Browser Cookie Authentication (Recommended)
1. Log in to **[OpenRP.ai](https://openrp.ai)** in your browser.
2. Open Developer Tools (`F12` -> `Application` -> `Cookies` -> `https://openrp.ai`).
3. Find cookie `sb-uixnaquqjhzcctyfoapf-auth-token` and copy its `access_token` and `refresh_token`.
4. Run `npx openrp-toolkit auth` to store credentials in `~/.openrp_mcp_auth.json`.

*The MCP Server automatically extracts the access token and schedules background refresh intervals.*

### Method 2: Bearer JWT Access Token
1. Open Developer Tools (`F12` -> `Network` tab).
2. Filter by `Fetch/XHR` and inspect any `/api/...` request.
3. Copy the token from header `Authorization: Bearer <TOKEN>`.
4. Run `npx openrp-toolkit auth` and paste the token string.

---

## Complete 47 MCP Tools Reference Suite

| No | Category | Count | Tool Names & Summary |
|---|---|---|---|
| 1 | Authentication & Profile | 3 Tools | `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me` |
| 2 | World Management | 6 Tools | `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world` |
| 3 | Lorebook System & Exclusivity | 7 Tools | `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore`, `openrp_list_lore_characters`, `openrp_list_character_lores` |
| 4 | Character Studio & Factions | 9 Tools | `openrp_list_characters`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character`, `openrp_list_character_groups`, `openrp_create_character_group`, `openrp_update_character_group`, `openrp_delete_character_group` |
| 5 | Prompt Templates | 4 Tools | `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt` |
| 6 | Behavior Engine | 7 Tools | `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character` |
| 7 | Tracing & Debugging | 3 Tools | `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions` |
| 8 | Chat & Messaging | 5 Tools | `openrp_create_chat`, `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message` |
| 9 | AI Models & Discovery | 3 Tools | `openrp_list_models`, `openrp_discover_worlds`, `openrp_raw_api` |

---

## World Visibility Policy (Official Developer Notice)

* **`WORLD_VISIBILITY_PUBLIC` (Default)**: Visible in global explore feeds, community discover queries, and public profile listings for all users.
* **`WORLD_VISIBILITY_UNLISTED`**: Accessible directly via URL slug.
* **`WORLD_VISIBILITY_PRIVATE`**: **Requires OpenRP Plus/Pro Plan** (`metadata.isPlus === true`). Free tier accounts attempting private visibility will be rejected by the backend.

---

## Repository Structure

```
openrp-toolkit/
├── package.json                       # NPM package configuration (v1.0.0)
├── bin/
│   └── cli.js                         # Node.js CLI executable (stdio MCP runner & installer)
├── README.md                          # Master documentation & installation guide (by Kaa)
├── LICENSE                            # MIT Open Source License
├── mcp/
│   ├── server.js                      # Pure Node.js 47-Tool MCP JSON-RPC Server
│   ├── openrp_mcp_server.py           # Python 3 fallback server
│   └── mcp_config.example.json        # Example client configuration
├── skills/
│   └── openrp/
│       ├── SKILL.md                   # AI Agent Skill Definition (Pure English)
│       └── references/
│           ├── behavior_nodes.md      # Complete 38-Node technical manual
│           ├── group_orchestration.md # Multi-agent group chat architecture
│           ├── testing_and_debugging.md # Diagnostics & execution tracing
│           └── worlds_and_characters.md # World/Character/Prompt schemas
```

---

## Community Creator & Maintainer

* **Author**: **Kaa** ([@kaaelix](https://github.com/kaaelix))
* **OpenRP Profile**: [@Seraaa](https://openrp.ai/Seraaa)
* **GitHub Repository**: [https://github.com/kaaelix/openrp-toolkit](https://github.com/kaaelix/openrp-toolkit)
* **Issue Tracker**: [https://github.com/kaaelix/openrp-toolkit/issues](https://github.com/kaaelix/openrp-toolkit/issues)
* **Platform**: [OpenRP.ai](https://openrp.ai)
* **Standard**: Model Context Protocol (MCP) Standard `2024-11-05`
* **Disclaimer**: This is an independent, community-driven open-source project created for the OpenRP.ai creator community and AI agents. It is not an official product of, nor affiliated with, OpenRP.ai.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
