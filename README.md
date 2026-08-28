# OpenRP Developer Toolkit & Model Context Protocol (MCP) Server

[![OpenRP Suite](https://img.shields.io/badge/OpenRP-v3.0.0-00E5FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrp.ai)
[![MCP Compatible](https://img.shields.io/badge/MCP-Standard%202024--11--05-7C4DFF?style=for-the-badge)](https://modelcontextprotocol.io)
[![npm version](https://img.shields.io/badge/npm-v3.0.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/openrp-toolkit)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Kaa-FF4081?style=for-the-badge)](https://openrp.ai/Seraaa)

> **Author & Maintainer**: **Kaa** ([@Seraaa](https://openrp.ai/Seraaa))  
> *An independent, community-built AI Agent Skill and Model Context Protocol (MCP) suite for [OpenRP.ai](https://openrp.ai).*

---

## Executive Overview

**OpenRP Toolkit** is an enterprise-grade Model Context Protocol (MCP) server and AI Agent Skill suite engineered for **[OpenRP.ai](https://openrp.ai)**. It empowers AI coding assistants—including **Google Antigravity**, **Gemini CLI**, **Claude Code**, **Cursor**, **Windsurf**, and **Codex**—to autonomously architect, deploy, test, trace, and debug interactive roleplay universes, autonomous AI characters, 38-node behavior graphs, semantic vector lorebooks, prompt templates, and multi-agent group chatrooms.

---

## Key Capabilities

* **46 Comprehensive MCP Tools**: Full operational coverage across 9 distinct domains (Auth, Worlds, Lorebooks & Exclusive Access, Characters, Character Groups, Prompts, Behaviors, Executions, Chats & Creation, and AI Foundation Models).
* **Zero-Downtime Supabase Auto-Refresh**: Autonomous background token daemon that keeps sessions authenticated without manual re-login.
* **Full 38-Node Behavior Engine Palette**: Support for all OpenRP node types (Events, AI Models, Control Flow, Storage, Utilities, Streaming, Try-Catch).
* **Deterministic ReactFlow Sanitization**: Automatically normalizes edge IDs (`xy-edge__<source><sourceHandle>-<target><targetHandle>`) and viewport coordinates (X: 100-2400px) to prevent layout collapse.
* **Multi-Agent Group Orchestration**: Proven blueprints for Mention Gates, Round-Robin turn cycling, and Game Master Arbiter state machines.
* **Interactive CLI Installer with Auto-Detection**: Single command setup for all AI assistants via `npx openrp-toolkit`.
* **Zero External Node Dependencies**: Pure standard library implementation for maximum portability and speed.

---

## Quickstart via NPX (Recommended)

You can run, install, and diagnose the toolkit directly using `npx` without cloning the repository:

### 1. Interactive Installation
Run the installer to configure your environment automatically:
```bash
npx openrp-toolkit install
```
The installer provides two modes:
* **[1] Auto-Detect Environments (Recommended)**: Automatically scans your system for installed AI assistants (Google Antigravity, Claude Code, Claude Desktop, Cursor, Windsurf) and configures them instantly.
* **[2] Manual Platform Selection**: Lets you choose specific target platforms manually.

### 2. Authentication Setup
Set up your OpenRP session credentials interactively:
```bash
npx openrp-toolkit auth
```

### 3. Environment & Connectivity Diagnostics
Verify your installation, Python binary, and OpenRP API connectivity:
```bash
npx openrp-toolkit doctor
```

---

## Direct MCP Client Configuration

To configure OpenRP directly inside your MCP client settings (`mcp.json` / `claude_desktop_config.json`):

### Option A: Using NPX
```json
{
  "mcpServers": {
    "openrp": {
      "command": "npx",
      "args": ["-y", "openrp-toolkit"]
    }
  }
}
```

### Option B: Using Local Python Server
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
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
```
Add to `~/.gemini/antigravity-cli/mcp/openrp.json`:
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
    }
  }
}
```

### 2. Claude Code CLI & Claude Desktop
```bash
# Claude Code CLI registration
claude mcp add openrp python3 /path/to/openrp-toolkit/mcp/openrp_mcp_server.py

# Install agent skill
mkdir -p ~/.claude/skills/openrp
cp -r skills/openrp/* ~/.claude/skills/openrp/
```

For Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/absolute/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
    }
  }
}
```

### 3. OpenAI Codex CLI & OpenAI Agents
```bash
# Install skill files for Codex
mkdir -p ~/.codex/skills/openrp
cp -r skills/openrp/* ~/.codex/skills/openrp/
```
In `~/.codex/mcp.json` or project config:
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
    }
  }
}
```

### 4. Cursor IDE & Cursor CLI
In your project workspace or global settings (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/absolute/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
    }
  }
}
```
Copy skill files:
```bash
mkdir -p .cursor/skills/openrp
cp -r skills/openrp/* .cursor/skills/openrp/
```

### 5. Windsurf IDE (Codeium Cascade)
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/absolute/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"]
    }
  }
}
```

### 6. Android Termux & Linux CLI Environment
```bash
# Update system and install runtime dependencies
pkg update -y && pkg install nodejs python git -y

# Clone repository
git clone https://github.com/Kaa/openrp-toolkit.git ~/openrp-toolkit

# Run interactive installer
cd ~/openrp-toolkit && node bin/cli.js add
```

---

## Authentication & Session Setup

OpenRP uses Supabase authentication. You can authenticate using either method:

### Method 1: Browser Cookie Authentication (Recommended)
1. Log in to **[OpenRP.ai](https://openrp.ai)** in your browser.
2. Open Developer Tools (`F12` -> `Application` -> `Cookies` -> `https://openrp.ai`).
3. Copy the values of `sb-uixnaquqjhzcctyfoapf-auth-token.0` and `.1`.
4. Run `npx openrp-toolkit auth` or call `openrp_set_auth`:
   ```json
   {
     "cookie": "sb-uixnaquqjhzcctyfoapf-auth-token.0=...; sb-uixnaquqjhzcctyfoapf-auth-token.1=...",
     "userId": "YOUR_USER_UUID",
     "worldId": "YOUR_WORLD_UUID",
     "characterId": "YOUR_CHARACTER_UUID"
   }
   ```
*The MCP Server automatically extracts the access token and schedules background refresh intervals.*

### Method 2: Bearer JWT Access Token
1. Open Developer Tools (`F12` -> `Network` tab).
2. Filter by `Fetch/XHR` and inspect any `/api/...` request.
3. Copy the token from `Authorization: Bearer <TOKEN>`.
4. Run `npx openrp-toolkit auth` and paste the token string.

---

## Complete 40 MCP Tools Reference Suite

| No | Category | Count | Tool Names & Summary |
|---|---|---|---|
| 1 | Authentication & Profile | 3 Tools | `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me` |
| 2 | World Management | 6 Tools | `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world` |
| 3 | Lorebook System | 5 Tools | `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore` |
| 4 | Character Studio | 5 Tools | `openrp_list_characters`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character` |
| 5 | Prompt Templates | 4 Tools | `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt` |
| 6 | Behavior Engine | 7 Tools | `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character` |
| 7 | Tracing & Debugging | 3 Tools | `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions` |
| 8 | Chat & Messaging | 4 Tools | `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message` |
| 9 | AI Models & Discovery | 3 Tools | `openrp_list_models`, `openrp_discover_worlds`, `openrp_raw_api` |

---

## World Visibility Policy (Official Developer Notice)

* **`WORLD_VISIBILITY_PUBLIC` (Default)**: Visible in global explore feeds, community discover queries, and public profile listings for all users.
* **`WORLD_VISIBILITY_UNLISTED`**: Functions the same as public for now; accessible directly via URL slug.
* **`WORLD_VISIBILITY_PRIVATE`**: **Requires OpenRP Plus/Pro Plan** (`metadata.isPlus === true`). Free tier accounts attempting private visibility will be rejected by the backend.

---

## Repository Structure

```
openrp-toolkit/
├── package.json                       # NPM package configuration
├── bin/
│   └── cli.js                         # Node.js CLI executable (stdio MCP runner & installer)
├── README.md                          # Master documentation & installation guide (by Kaa)
├── LICENSE                            # MIT Open Source License
├── mcp/
│   ├── openrp_mcp_server.py           # 40-Tool MCP JSON-RPC Server
│   └── mcp_config.example.json        # Example client configuration
├── skills/
│   └── openrp/
│       ├── SKILL.md                   # AI Agent Skill Definition (English)
│       └── references/
│           ├── behavior_nodes.md      # Complete 38-Node technical manual
│           ├── group_orchestration.md # Multi-agent group chat architecture
│           ├── testing_and_debugging.md # Diagnostics & execution tracing
│           └── worlds_and_characters.md # World/Character/Prompt schemas
```

---

## Community Creator & Maintainer

* **Created by**: **Kaa** ([@Seraaa](https://openrp.ai/Seraaa)) — *OpenRP Community Creator*
* **Platform**: [OpenRP.ai](https://openrp.ai)
* **Standard**: Model Context Protocol (MCP) Standard `2024-11-05`
* **Disclaimer**: This is an independent, community-driven open-source project created for the OpenRP.ai creator community and AI agents. It is not an official product of, nor affiliated with, OpenRP.ai.
* **Contributions**: Community pull requests, feedback, and graph templates are warmly welcome!

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

