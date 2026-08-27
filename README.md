# OpenRP Toolkit

Developer toolkit and Model Context Protocol (MCP) server for [OpenRP.ai](https://openrp.ai). Provides programmatic APIs and AI agent skills for managing worlds, characters, behavior graphs, lorebooks, and multi-participant chatrooms.

## Features

- **28 MCP Tools**: Complete coverage of worlds, characters, behaviors, nodes, lore, and messaging.
- **Auto-Refresh Auth**: Automatic Supabase token refresh on expiry with zero downtime.
- **Granular Node Editing**: In-place modification of individual behavior nodes without graph rewrites.
- **AI Agent Skill**: Ready-to-use skill package (`skills/openrp/SKILL.md`) for AI assistants.
- **Zero Dependencies**: Pure Python 3.10+ standard library implementation.

## Authentication & Setup

OpenRP uses Supabase authentication. You can obtain your authentication credentials using either of the following methods:

### Method 1: Browser Cookie (Recommended with Auto-Refresh)
1. Log in to [OpenRP.ai](https://openrp.ai) in your browser.
2. Open Browser Developer Tools (`F12` -> `Application` -> `Cookies` -> `https://openrp.ai`).
3. Copy the raw cookie header string containing `sb-uixnaquqjhzcctyfoapf-auth-token.0` and `.1`.
4. Run `openrp_set_auth` inside your AI client:
   ```json
   {
     "cookie": "sb-uixnaquqjhzcctyfoapf-auth-token.0=...; sb-uixnaquqjhzcctyfoapf-auth-token.1=...",
     "userId": "YOUR_USER_UUID",
     "worldId": "YOUR_WORLD_UUID",
     "characterId": "YOUR_CHARACTER_UUID"
   }
   ```
*The MCP server will extract the refresh token and automatically renew access tokens when expired.*

### Method 2: Direct JWT Access Token
1. Open Browser Developer Tools (`F12` -> `Network` tab).
2. Filter by `Fetch/XHR` and inspect any request to `/api/...`.
3. Copy the token string from the `Authorization: Bearer <TOKEN>` request header.
4. Pass it to `openrp_set_auth` with `{"token": "eyJ..."}` or set `OPENRP_TOKEN` in your environment.

### Finding Resource IDs
- **User ID**: Call `openrp_get_me` or check `user.id` in auth payload.
- **World ID**: Copy from the URL when editing a world: `openrp.ai/worlds/<handle>` or call `openrp_list_my_worlds`.
- **Character ID**: Copy from the character edit page or call `openrp_list_characters`.

## MCP Configuration

Add the server to your client configuration (`claude_desktop_config.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "openrp": {
      "command": "python3",
      "args": ["/path/to/openrp-toolkit/mcp/openrp_mcp_server.py"],
      "env": {
        "OPENRP_TOKEN": "<YOUR_ACCESS_TOKEN>",
        "OPENRP_USER_ID": "<YOUR_USER_ID>",
        "OPENRP_WORLD_ID": "<YOUR_WORLD_ID>",
        "OPENRP_CHARACTER_ID": "<YOUR_CHARACTER_ID>"
      }
    }
  }
}
```

Credentials can also be set interactively via the `openrp_set_auth` tool.

## MCP Tool Reference

### Authentication & User
| Tool | Description |
|---|---|
| `openrp_set_auth` | Sets JWT access token or browser cookie with auto-refresh support. |
| `openrp_refresh_token` | Triggers immediate access token refresh via Supabase Auth. |
| `openrp_get_me` | Retrieves profile and account details for the authenticated user. |

### Worlds
| Tool | Description |
|---|---|
| `openrp_list_my_worlds` | Lists all worlds owned by or shared with the user. |
| `openrp_get_world` | Fetches full world metadata, lorebook, visibility, and assets. |
| `openrp_create_world` | Creates a new world (`public`/`unlisted` for Free; `private` for Pro). |
| `openrp_update_world` | Updates world title, handle, readme lore, tags, banner, or avatar. |
| `openrp_delete_world` | Deletes a world and its associated resources. |

### Granular Lorebook
| Tool | Description |
|---|---|
| `openrp_list_lores` | Lists all lore entries in a world. |
| `openrp_get_lore` | Retrieves a specific lore entry by ID or handle. |
| `openrp_create_lore` | Creates a new lore entry for vector RAG retrieval. |
| `openrp_update_lore` | Modifies existing lore content, title, or exclusivity. |
| `openrp_delete_lore` | Deletes a lore entry from a world. |

### Characters
| Tool | Description |
|---|---|
| `openrp_list_characters` | Lists all characters in a world. |
| `openrp_get_character` | Retrieves character persona, system prompt, greetings, and dialogs. |
| `openrp_update_character` | Updates character persona, description, status, avatar, or greetings. |

### Behaviors & Node Engine
| Tool | Description |
|---|---|
| `openrp_list_behaviors` | Lists all behavior graphs in a world. |
| `openrp_get_behavior` | Fetches full behavior graph JSON (nodes, edges, expressions). |
| `openrp_update_behavior` | In-place update of behavior graph without breaking character bindings. |
| `openrp_edit_behavior_node` | Modifies a single node's data or expression by `nodeId`. |
| `openrp_deploy_behavior` | All-in-one graph creation, cleanup, and character binding. |
| `openrp_delete_behavior` | Deletes a behavior graph from a world. |
| `openrp_attach_behavior_to_character` | Binds an existing behavior graph to a character. |

### Chat & Messaging
| Tool | Description |
|---|---|
| `openrp_list_chats` | Lists active chatrooms, group sessions, and participant records. |
| `openrp_get_chat_messages` | Fetches conversation history for a chatroom. |
| `openrp_send_message` | Posts a message (Markdown supported) to a chatroom. |

### Discovery & Gateway
| Tool | Description |
|---|---|
| `openrp_discover_worlds` | Searches public worlds by query keyword. |
| `openrp_raw_api` | Executes arbitrary REST requests to any OpenRP API endpoint. |

## MCP Server Tool Suite (31 Tools)

The OpenRP MCP Server gives AI agents programmatic control over the OpenRP ecosystem:

- **Authentication & Profile (3 tools)**: `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me`
- **World Management (5 tools)**: `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_delete_world`
- **Lorebook System (5 tools)**: `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore`
- **Character Studio (3 tools)**: `openrp_list_characters`, `openrp_get_character`, `openrp_update_character`
- **Behavior Engine (7 tools)**: `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character`
- **Behavior Executions & Debug Tracing (3 tools)**: `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions`
- **Chat & Direct Messaging (3 tools)**: `openrp_list_chats`, `openrp_get_chat_messages`, `openrp_send_message`
- **Discovery & Gateway (2 tools)**: `openrp_discover_worlds`, `openrp_raw_api`

## Node Palette Overview (38 Nodes)

OpenRP behavior graphs support 38 built-in node types:

- **Events (2)**: `chat_message`, `cron`
- **AI (8)**: `llm`, `generate_embeddings`, `get_default_model`, `get_model`, `get_models`, `count_tokens`, `prune_text`, `read_llm_stream`
- **Control Flow (7)**: `if`, `end_if`, `split`, `sync`, `repeat_until`, `wait`, `try`
- **Storage (14)**: `get_chat_message`, `get_chat_messages`, `get_chat`, `get_chat_participant`, `get_character`, `get_characters`, `get_character_memories`, `get_lore`, `get_lores`, `set_variable`, `get_variable`, `insert_chat_message`, `update_typing_status`, `broadcast_failed_chat_message`
- **Utilities (7)**: `filter`, `map`, `append`, `join`, `string_split`, `http_request`, `comment`

See [`skills/openrp/references/behavior_nodes.md`](skills/openrp/references/behavior_nodes.md) for full port specifications and JEXL rules.

## AI Agent Skill

This repository includes a skill definition compatible with Codex, Claude Code, Cursor, and Antigravity:

- **Skill Entrypoint**: [`skills/openrp/SKILL.md`](skills/openrp/SKILL.md)
- **Node Catalog**: [`skills/openrp/references/behavior_nodes.md`](skills/openrp/references/behavior_nodes.md)
- **Worlds & Lore**: [`skills/openrp/references/worlds_and_characters.md`](skills/openrp/references/worlds_and_characters.md)
- **Multi-Agent Logic**: [`skills/openrp/references/group_orchestration.md`](skills/openrp/references/group_orchestration.md)
- **Diagnostics**: [`skills/openrp/references/testing_and_debugging.md`](skills/openrp/references/testing_and_debugging.md)

## Official Documentation Links

- **Web Documentation**: [https://openrp.ai/docs](https://openrp.ai/docs)
- **LLM Index**: [https://openrp.ai/docs/llms.txt](https://openrp.ai/docs/llms.txt)
- **Full Text Export**: [https://openrp.ai/docs/llms-full.txt](https://openrp.ai/docs/llms-full.txt)

## Repository Layout

```
openrp-toolkit/
├── README.md
├── LICENSE
├── requirements.txt
├── .gitignore
├── mcp/
│   ├── openrp_mcp_server.py
│   └── mcp_config.example.json
├── skills/
│   └── openrp/
│       ├── SKILL.md
│       └── references/
│           ├── behavior_nodes.md
│           ├── group_orchestration.md
│           ├── testing_and_debugging.md
│           └── worlds_and_characters.md
└── examples/
    ├── create_world_and_character.py
    └── deploy_game_bot.py
```

## License

MIT License. See [LICENSE](LICENSE) for details.
