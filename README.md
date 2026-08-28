# OpenRP Developer Toolkit & Model Context Protocol (MCP) Server

[![OpenRP Suite](https://img.shields.io/badge/OpenRP-v3.0.0-00E5FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrp.ai)
[![MCP Compatible](https://img.shields.io/badge/MCP-Standard%202024--11--05-7C4DFF?style=for-the-badge)](https://modelcontextprotocol.io)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Kaa-FF4081?style=for-the-badge)](https://openrp.ai/Seraaa)

> **Created & Maintained with ❤️ by Kaa** (`@Seraaa`)  
> *The ultimate autonomous AI agent skill and developer suite for [OpenRP.ai](https://openrp.ai).*

---

## 🌟 Executive Overview

**OpenRP Toolkit** is an enterprise-grade Model Context Protocol (MCP) server and AI Agent Skill suite engineered specifically for **[OpenRP.ai](https://openrp.ai)**. It empowers AI coding assistants—including **Google Antigravity**, **Gemini CLI**, **Claude Code**, **Cursor**, **Windsurf**, and **Codex**—to autonomously architect, deploy, test, trace, and debug interactive roleplay universes, autonomous AI characters, 38-node behavior graphs, semantic vector lorebooks, prompt templates, and multi-agent group chatrooms.

---

## ⚡ Key Capabilities

* 🛠️ **40 Comprehensive MCP Tools**: Full operational coverage spanning 9 distinct domains (Auth, Worlds, Lorebooks, Characters, Prompts, Behaviors, Executions, Chats, and AI Foundation Models).
* 🔄 **Zero-Downtime Supabase Auto-Refresh**: Autonomous background token daemon that keeps sessions authenticated without manual re-login.
* 🧩 **Full 38-Node Behavior Engine Palette**: Support for all OpenRP node types (*Events, AI Models, Control Flow, Storage, Utilities, Streaming, Try-Catch*).
* 📐 **Deterministic ReactFlow Sanitization**: Automatically normalizes edge IDs (`xy-edge__<source><sourceHandle>-<target><targetHandle>`) and viewport coordinates ($X: 100-2400\text{px}$) to eliminate layout collapse.
* 👥 **Multi-Agent Group Orchestration**: Proven blueprints for Mention Gates, Round-Robin turn cycling, and Game Master Arbiter state machines.
* 🪶 **Zero External Dependencies**: Pure Python 3.10+ standard library implementation (`urllib`, `json`, `subprocess`, `threading`).

---

## 🚀 Step-by-Step Installation Guides for AI CLIs & Editors

Choose your preferred AI coding assistant or environment below:

### 1. 🌌 Google Antigravity & Gemini CLI (`agy`)

Install the OpenRP skill into your global agents skill directory:

```bash
# 1. Create skill directory
mkdir -p ~/.agents/skills/openrp

# 2. Clone or copy toolkit skills
cp -r /path/to/openrp-toolkit/skills/openrp/* ~/.agents/skills/openrp/

# 3. Verify installation in Antigravity / Gemini CLI
# The skill is automatically loaded as 'openrp'
```

To configure the persistent MCP Server for Antigravity:
```json
// Add to ~/.gemini/antigravity-cli/mcp/openrp.json or project config
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

### 2. 🤖 Claude Code CLI & Claude Desktop

#### Option A: Claude Code CLI
```bash
# Add openrp as a persistent MCP server in Claude Code
claude mcp add openrp python3 /path/to/openrp-toolkit/mcp/openrp_mcp_server.py

# Install the agent skill
mkdir -p ~/.claude/skills/openrp
cp -r /path/to/openrp-toolkit/skills/openrp/* ~/.claude/skills/openrp/
```

#### Option B: Claude Desktop App
Add the MCP configuration to `claude_desktop_config.json`:
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

---

### 3. 🖱️ Cursor IDE & Cursor CLI

1. In your project workspace or global settings, create `.cursor/mcp.json`:
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
2. Copy the skill definition into Cursor's rule/skill directory:
```bash
mkdir -p .cursor/skills/openrp
cp -r /path/to/openrp-toolkit/skills/openrp/* .cursor/skills/openrp/
```

---

### 4. 🌊 Windsurf IDE (Codeium Cascade)

Add OpenRP to your Windsurf MCP configuration (`~/.codeium/windsurf/mcp_config.json`):

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

---

### 5. 📱 Android Termux & Linux CLI Environment

OpenRP Toolkit runs natively inside Android Termux without requiring root or containers:

```bash
# 1. Update packages and install Python
pkg update -y && pkg install python git -y

# 2. Clone repository
git clone https://github.com/Kaa/openrp-toolkit.git ~/openrp-toolkit

# 3. Test MCP Server stdio
python3 ~/openrp-toolkit/mcp/openrp_mcp_server.py
```

---

## 🔑 Authentication & Session Setup

OpenRP uses Supabase authentication. You can authenticate using either method:

### Method 1: Browser Cookie Authentication (Recommended)
1. Log in to **[OpenRP.ai](https://openrp.ai)** in your browser.
2. Open Developer Tools (`F12` $\to$ `Application` $\to$ `Cookies` $\to$ `https://openrp.ai`).
3. Copy the values of `sb-uixnaquqjhzcctyfoapf-auth-token.0` and `.1`.
4. Call `openrp_set_auth` inside your AI assistant:
   ```json
   {
     "cookie": "sb-uixnaquqjhzcctyfoapf-auth-token.0=...; sb-uixnaquqjhzcctyfoapf-auth-token.1=...",
     "userId": "YOUR_USER_UUID",
     "worldId": "YOUR_WORLD_UUID",
     "characterId": "YOUR_CHARACTER_UUID"
   }
   ```
*The MCP Server automatically parses the JWT access token and schedules the background refresh daemon.*

### Method 2: Bearer JWT Access Token
1. Open Developer Tools (`F12` $\to$ `Network` tab).
2. Filter by `Fetch/XHR` and inspect any `/api/...` request.
3. Copy the token from `Authorization: Bearer <TOKEN>`.
4. Run `openrp_set_auth({"token": "eyJ..."})`.

---

## 📋 Complete 40 MCP Tools Reference Suite

| No | Category | Count | Tool Names & Summary |
|---|---|---|---|
| **1** | **Authentication & Profile** | 3 Tools | `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me` |
| **2** | **World Management** | 6 Tools | `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world` |
| **3** | **Lorebook System** | 5 Tools | `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore` |
| **4** | **Character Studio** | 5 Tools | `openrp_list_characters`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character` |
| **5** | **Prompt Templates** | 4 Tools | `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt` |
| **6** | **Behavior Engine** | 7 Tools | `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character` |
| **7** | **Tracing & Debugging** | 3 Tools | `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions` |
| **8** | **Chat & Messaging** | 4 Tools | `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message` |
| **9** | **AI Models & Discovery** | 3 Tools | `openrp_list_models`, `openrp_discover_worlds`, `openrp_raw_api` |

---

## 🌐 World Visibility Policy (Official Developer Notice)

* **`WORLD_VISIBILITY_PUBLIC` (Default)**: Visible in global explore feeds, community discover queries, and public profile listings for all users.
* **`WORLD_VISIBILITY_UNLISTED`**: Functions the same as public for now; accessible directly via URL slug.
* **`WORLD_VISIBILITY_PRIVATE`**: **Requires OpenRP Plus/Pro Plan** (`metadata.isPlus === true`). Free tier accounts attempting private visibility will be rejected by the backend.

---

## 📂 Repository Structure

```
openrp-toolkit/
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

## 👨‍💻 Author & Credits

* **Crafted by**: **Kaa** ([@Seraaa](https://openrp.ai/Seraaa))
* **Platform**: [OpenRP.ai](https://openrp.ai)
* **Contributions**: Pull requests, issues, and graph templates are welcome!

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

