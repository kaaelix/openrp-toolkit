# OpenRP Developer Toolkit & Model Context Protocol (MCP) Server

[![OpenRP Suite](https://img.shields.io/badge/OpenRP-v1.1.0-00E5FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrp.ai)
[![MCP Compatible](https://img.shields.io/badge/MCP-Standard%202024--11--05-7C4DFF?style=for-the-badge)](https://modelcontextprotocol.io)
[![npm version](https://img.shields.io/badge/npm-v1.1.0-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/openrp-toolkit)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-kaaelix-FF4081?style=for-the-badge)](https://github.com/kaaelix)

> **Author & Maintainer**: **kaaelix** ([@kaaelix](https://github.com/kaaelix) | OpenRP: [@Seraaa](https://openrp.ai/Seraaa))  
> *An independent, community-built AI Agent Skill and Model Context Protocol (MCP) suite for [OpenRP.ai](https://openrp.ai).*

---

> [!NOTE]
> **Community Release Notice (v1.1.0)**:
> Version `1.1.0` introduces complete coverage for all 37 OpenRP Behavior nodes, automated static graph validation (`validator.js`), dynamic Eco-Mode token management (78%–100% token savings), Vector RAG memory retrieval, structured LLM JSON mode, and zero-LLM deterministic state machine blueprints.
> If you encounter any bugs or have feature suggestions, please file an issue or contribute directly on GitHub:
> **https://github.com/kaaelix/openrp-toolkit**

---

## Executive Overview

**OpenRP Toolkit** is a Model Context Protocol (MCP) server and AI Agent Skill suite engineered for **[OpenRP.ai](https://openrp.ai)**. It empowers AI coding assistants and agent environments—including **Google Antigravity**, **Gemini CLI**, **Claude Code**, **Claude Desktop**, **Cursor**, **Windsurf**, and **OpenAI Codex**—to autonomously architect, deploy, test, trace, and debug interactive roleplay universes, autonomous AI personas, 38-node behavior graphs, semantic vector lorebooks, confidential exclusive lore, prompt templates, and multi-agent group chatrooms.

---

## Key Capabilities

* **47 Comprehensive MCP Tools**: Full operational coverage across 9 distinct domains (Authentication, Worlds, Lorebook & Exclusive Access, Characters, Character Groups & Factions, Prompts, Behavior Graphs, Executions, Chats, and Foundation AI Models).
* **Pure Node.js Engine (Zero External Dependencies)**: Built entirely using Node.js 18+ native `fetch` and standard library modules. No compilation, external SDKs, or Python runtimes required.
* **Autonomous Background Token Refresh Daemon**: Automatically refreshes Supabase JWT authentication every 45 minutes to maintain active sessions.
* **Full 38-Node Behavior Engine Palette**: Support for all OpenRP node types (Events, AI Models, Control Flow, Storage, Utilities, Streaming, Try-Catch).
* **Deterministic ReactFlow Sanitization**: Automatically normalizes edge IDs (`xy-edge__<source><sourceHandle>-<target><targetHandle>`) and coordinates to prevent graph layout collapse.
* **Multi-Agent Group Orchestration**: Blueprints for Mention Gates, Round-Robin turn cycling, and Game Master Arbiter state machines.
* **Interactive CLI Installer with Auto-Detection**: Single command setup for all AI assistants via `npx openrp-toolkit install`.

---

## Installation & Getting Started

You can install, configure, and use the OpenRP Toolkit via `npx` (zero install) or as a global npm package:

### Method 1: Interactive 1-Command Setup via NPX (Recommended)

Run the interactive installer:
```bash
npx openrp-toolkit install
```
*(Alternative alias: `npx openrp-toolkit add`)*

The installer scans your local system and automatically detects:
* Google Antigravity & Gemini CLI (`~/.agents/skills/openrp` and `mcp_config.json`)
* Claude Code CLI (`~/.claude/skills/openrp` and `claude mcp add`)
* Claude Desktop (`claude_desktop_config.json`)
* Cursor IDE (`.cursor/skills/openrp` and `.cursor/mcp.json`)
* Windsurf / Codeium Cascade (`~/.codeium/windsurf`)
* OpenAI Codex (`~/.codex/skills/openrp`)

---

### Method 2: Global Installation via NPM

Install globally to access the `openrp-toolkit` or `openrp` command from anywhere:
```bash
npm install -g openrp-toolkit
```

After installation, run any of the available commands:
```bash
openrp install    # Run interactive assistant installer
openrp doctor     # Run diagnostic checks
openrp auth       # Set up OpenRP authentication credentials
openrp list       # Browse catalog of all 47 MCP tools & skills
openrp serve      # Launch stdio MCP server process
```

---

### Method 3: Direct Integration into AI Assistants & MCP Clients

You can manually register OpenRP MCP Server into your assistant configurations:

#### 1. Claude Code CLI
```bash
claude mcp add openrp npx -y openrp-toolkit serve
```

#### 2. Google Antigravity & Gemini CLI (`agy`)
* **Step A (Skill Definition)**:
  ```bash
  mkdir -p ~/.agents/skills/openrp
  npx openrp-toolkit install # Select option [3] or [1]
  ```
* **Step B (MCP Server in `~/.gemini/antigravity-cli/mcp_config.json`)**:
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

#### 3. Cursor IDE
Create or update `.cursor/mcp.json` in your workspace root:
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

#### 4. Windsurf (Codeium Cascade)
Add to `~/.codeium/windsurf/mcp_config.json`:
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

#### 5. Claude Desktop App
Add to `claude_desktop_config.json`:
* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

---

## Authentication Setup

OpenRP utilizes Supabase authentication. You can configure your credentials interactively:

```bash
npx openrp-toolkit auth
```

### How to get your OpenRP credentials:
1. Open your browser and navigate to **[OpenRP.ai](https://openrp.ai)**.
2. Open Developer Tools (`F12` -> `Application` -> `Cookies` -> `https://openrp.ai`).
3. Find cookie `sb-uixnaquqjhzcctyfoapf-auth-token` and copy its `access_token` and `refresh_token`.
4. Paste the values into `npx openrp-toolkit auth`.

*The MCP Server stores credentials in `~/.openrp_mcp_auth.json` and autonomously schedules token refresh intervals every 45 minutes.*

---

## Environment & Connectivity Diagnostics

To verify your Node.js environment, credentials, package integrity, and OpenRP API connectivity:
```bash
npx openrp-toolkit doctor
```

Output example:
```
┌  OpenRP Toolkit & MCP Suite (v1.0.0)
│  Maintainer: kaaelix (https://github.com/kaaelix)
│  Platform: https://openrp.ai
└───────────────────────────────────────────────────────────────

Running OpenRP Toolkit Diagnostics...

[CHECK 1/4] Node.js Runtime: v22.x (Native fetch support) -> OK
[CHECK 2/4] Package Integrity & Skill Files -> OK (47 MCP tools ready)
[CHECK 3/4] Authentication State -> OK (User ID: configured)
[CHECK 4/4] Testing connection to https://openrp.ai...
            OpenRP API Endpoint: HTTP 401 -> OK

┌───────────────────────────────────────────────────────────────┐
│ [SUCCESS] All diagnostic checks passed with 0 errors.         │
│ Your OpenRP Toolkit environment is ready to use!              │
└───────────────────────────────────────────────────────────────┘
```

---

## AI Agent Slash Commands (`/openrp-toolkit` & `/openrp`)

When using AI coding assistants like **Google Antigravity**, **Gemini CLI**, **Claude Code**, or **Cursor**, you can control the entire OpenRP ecosystem directly using the `/openrp-toolkit` or `/openrp` slash command:

```
/openrp-toolkit [subcommand] [arguments...]
```

### Complete Subcommand Routing Matrix

| Subcommand | Parameters / Actions | Description & MCP Routing |
|---|---|---|
| `/openrp-toolkit init` | `[token]` | Interactive authentication setup & JWT auto-refresh daemon initialization (`openrp_set_auth`, `openrp_get_me`). |
| `/openrp-toolkit world` | `list` / `get` / `create` / `update` / `readme` / `delete` | Manage World universes, settings, statistics, and 5,000-word Markdown README documentation. |
| `/openrp-toolkit lore` | `list` / `create` / `update` / `delete` / `access` | Architect factual semantic lorebook entries with support for confidential exclusive lore (`isExclusive: true`). |
| `/openrp-toolkit character`| `list` / `get` / `create` / `update` / `delete` | Construct autonomous AI character personas, greetings, and dialog presets. |
| `/openrp-toolkit group` | `list` / `create` / `update` / `delete` | Group characters into factions, guilds, combat squads, or organizational units (`openrp_character_groups`). |
| `/openrp-toolkit prompt` | `list` / `get` / `create` / `delete` | Create and maintain reusable prompt templates with variable injection (`{{reply_char.name}}`). |
| `/openrp-toolkit behavior`| `list` / `deploy` / `get` / `edit-node` / `attach` / `delete` | Deploy and surgically modify 38-node ReactFlow behavior graphs with automated graph sanitization. |
| `/openrp-toolkit group-chat` | `mention-gate` / `round-robin` / `game-master` | Deploy coordinated multi-agent group chat topologies with turn management gates. |
| `/openrp-toolkit trace` | `search` / `get <id>` / `nodes <id>` | Inspect live behavior execution logs, status (`COMPLETED`/`FAILED`), and step-by-step resolved node outputs. |
| `/openrp-toolkit chat` | `create` / `list` / `get` / `messages` / `send` | Create test chatrooms, inspect conversation histories, and dispatch live trigger messages. |
| `/openrp-toolkit doctor` | *(none)* | Execute 4-point diagnostic verification on runtime, package files, authentication, and API endpoints. |

### Practical Slash Command Invocation Examples:

* **Deploy an NPC character and behavior graph**:
  ```
  /openrp-toolkit character create "Eldrin the Sage" "eldrin"
  /openrp-toolkit behavior deploy "Eldrin Combat Logic" "eldrin-combat"
  ```
* **Update world documentation with rich Markdown**:
  ```
  /openrp-toolkit world readme
  ```
* **Debug a failed behavior execution**:
  ```
  /openrp-toolkit trace nodes 01a042e6-7f5a-75ea-a2da-2756ed0a2cf5
  ```
* **Add confidential secret lore accessible only by Eldrin**:
  ```
  /openrp-toolkit lore create "Ancient Relic Map" "relic-map" "Hidden inside the elder crypt..." --exclusive
  ```

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

## Complete 38 Behavior Nodes Architecture

OpenRP behavior pipelines support 38 specialized ReactFlow node types organized across 7 categories:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       OPENRP BEHAVIOR ENGINE (38 NODES)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. EVENTS       : chat_message                                              │
│ 2. AI / LLM     : llm, generate_image, classify_text, extract_json          │
│ 3. CONTROL FLOW : if, end_if, loop, end_loop, break, continue, switch,       │
│                   case, try, catch, end_try, throw                          │
│ 4. STORAGE      : get_chat, insert_chat_message, update_chat_message,       │
│                   search_lore, get_character, update_variable, get_variable │
│ 5. UTILITIES    : code_execution, template, filter, sort, transform, math,  │
│                   regex_match, regex_replace, delay, http_request           │
│ 6. CONTEXT      : get_current_time, get_chat_history, get_user_profile      │
│ 7. STREAMING    : stream_text, read_stream                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent Group Chat Coordination Blueprints

When multiple AI characters join the same chatroom, avoid reply storms and infinite trigger loops by using one of three proven coordination architectures:

### Blueprint 1: Mention-Gated Activation
The character evaluates whether its name or `@handle` is present before triggering LLM generation:
```
[events/chat_message]
       │
       ▼
[storage/get_chat] (expand: ["participants"])
       │
       ▼
[utilities/filter (botFilter)] (expr: item.characterId === myCharId)
       │
       ▼
[control_flow/if (mentionGate)]
       ├── [True Branch]  ──► [ai/llm] ──► [storage/insert_chat_message]
       └── [False Branch] ──► [control_flow/end_if] (Halt silently)
```

### Blueprint 2: Round-Robin Turn Cycling
Bots take turns participating in group discussions. A bot only speaks if the last speaker was a human or a different bot:
```javascript
// In control_flow/if node:
getChatMessage.chatParticipantId !== botFilter.list[0].id && getChatParticipant.userId !== null
```

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
│   ├── cli.js                         # Node.js CLI executable (stdio MCP runner & installer)
│   └── validator.js                   # Static Behavior Graph Analyzer & Schema Linter
├── README.md                          # Master documentation & installation guide
├── LICENSE                            # MIT Open Source License
├── mcp/
│   ├── server.js                      # Pure Node.js 47-Tool MCP JSON-RPC Server
│   └── mcp_config.example.json        # Example client configuration
├── examples/                          # Pure Node.js code examples & verified blueprints
│   ├── create_world_and_character.js
│   ├── deploy_game_bot.js
│   ├── deploy_eco_roleplay_bot.js
│   ├── deploy_multi_agent_arena.js
│   └── debug_behavior_execution.js
├── skills/
│   └── openrp/
│       ├── SKILL.md                   # AI Agent Skill Definition & Master Protocol
│       ├── commands/                  # AI Slash Command Definitions (/openrp-toolkit)
│       │   ├── openrp-toolkit.md
│       │   └── openrp.md
│       └── references/
│           ├── all_nodes_encyclopedia.md   # Exhaustive 37-Node Manual with JSON Examples
│           ├── behavior_nodes.md           # 37-Node Palette & Zero-LLM Game Machine
│           ├── token_optimization_and_modes.md # User-controlled Eco vs Full mode (78% savings)
│           ├── rag_and_memory.md           # Vector RAG & Character Long-Term Memory (LTM)
│           ├── advanced_patterns.md        # HTTP Webhook Polling & Structured JSON RPG
│           ├── expressions_and_templates.md # JEXL expressions, Math, & Date.format()
│           ├── streaming_and_registry.md   # Real-time LLM Streaming & Semver Registry
│           ├── group_orchestration.md      # Multi-agent group chat architecture
│           ├── testing_and_debugging.md    # DAG diagnostics & execution tracing
│           └── worlds_and_characters.md    # World/Character/Prompt schemas & Config
```

---

## Community Creator & Maintainer

* **Author**: **kaaelix** ([@kaaelix](https://github.com/kaaelix))
* **OpenRP Profile**: [@Seraaa](https://openrp.ai/Seraaa)
* **GitHub Repository**: [https://github.com/kaaelix/openrp-toolkit](https://github.com/kaaelix/openrp-toolkit)
* **Issue Tracker**: [https://github.com/kaaelix/openrp-toolkit/issues](https://github.com/kaaelix/openrp-toolkit/issues)
* **Platform**: [OpenRP.ai](https://openrp.ai)
* **Standard**: Model Context Protocol (MCP) Standard `2024-11-05`
* **Disclaimer**: This is an independent, community-driven open-source project created for the OpenRP.ai creator community and AI agents. It is not an official product of, nor affiliated with, OpenRP.ai.

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
