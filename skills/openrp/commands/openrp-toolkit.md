---
description: Execute OpenRP Toolkit commands, manage Worlds, Characters, Lorebooks, Behavior Graphs, Multi-Agent Group Chats, Traces, and Live Messages.
---

# OpenRP Toolkit AI Agent Command Suite

When invoked via `/openrp-toolkit` or `/openrp`, analyze the user's intended subcommand and invoke the appropriate MCP tools from the OpenRP suite:

## Subcommand Routing Matrix

### 1. `/openrp-toolkit init` or `/openrp-toolkit auth`
* **Purpose**: Configure credentials and verify session.
* **MCP Tools**: `openrp_set_auth`, `openrp_get_me`, `openrp_refresh_token`
* **Actions**: Save tokens in `~/.openrp_mcp_auth.json`, start background daemon, and display active user handle.

### 2. `/openrp-toolkit world [list|get|create|update|readme|delete]`
* **Purpose**: Manage World universe container and documentation.
* **MCP Tools**: `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world`
* **Actions**:
  * `list`: Retrieve and display owned worlds.
  * `get`: Inspect world metadata, stats, and visibility.
  * `create`: Create new world with `WORLD_VISIBILITY_PUBLIC` and chatOnly flags.
  * `update`: Edit world name, description, tags, or visibility.
  * `readme`: Write or update comprehensive Markdown documentation (up to 5,000 words).
  * `delete`: Permanently remove world and child entities.

### 3. `/openrp-toolkit lore [list|get|create|update|delete|access]`
* **Purpose**: Manage factual semantic lorebooks and confidential character access.
* **MCP Tools**: `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore`, `openrp_list_lore_characters`, `openrp_list_character_lores`
* **Actions**:
  * `list`: Display world lorebook entries.
  * `create`: Create general or exclusive lore (`isExclusive: true`).
  * `access`: Check which characters have access to a specific exclusive lore.
  * `update`: In-place update of lore content or title.

### 4. `/openrp-toolkit character [list|get|create|update|delete]`
* **Purpose**: Manage AI personas, greetings, dialogue presets, and behavior bindings.
* **MCP Tools**: `openrp_list_characters`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character`
* **Actions**:
  * `create`: Create character persona (auto-initializes `greetings: []` and `dialogs: []`).
  * `update`: Update persona, appearance, status, and background.
  * `get`: Inspect character configuration and attached behavior graphs.

### 5. `/openrp-toolkit group [list|create|update|delete]`
* **Purpose**: Organize characters into factions, teams, and character groups.
* **MCP Tools**: `openrp_list_character_groups`, `openrp_create_character_group`, `openrp_update_character_group`, `openrp_delete_character_group`

### 6. `/openrp-toolkit prompt [list|get|create|delete]`
* **Purpose**: Reusable system prompt templates with variable injection.
* **MCP Tools**: `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt`

### 7. `/openrp-toolkit behavior [list|get|deploy|update|edit-node|attach|delete]`
* **Purpose**: Design, deploy, edit, and bind 38-node ReactFlow behavior graphs.
* **MCP Tools**: `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_deploy_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_attach_behavior_to_character`, `openrp_delete_behavior`
* **Actions**:
  * `deploy`: Sanitize graph (ReactFlow edges and coordinate virtualization) and deploy pipeline.
  * `edit-node`: Perform surgical in-place JSON edit of a single node in the graph without re-uploading the entire structure.
  * `attach`: Bind behavior to character with automated pre-detachment of old bindings to prevent HTTP 500 error.

### 8. `/openrp-toolkit group-chat`
* **Purpose**: Coordinate multi-agent group chatrooms.
* **Architectures**: Mention-Gated Activation, Round-Robin turn cycling, or Game Master Arbiter state machines.

### 9. `/openrp-toolkit trace [search|get|nodes]`
* **Purpose**: Debug execution runs and inspect step-by-step resolved node outputs.
* **MCP Tools**: `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions`

### 10. `/openrp-toolkit chat [create|list|get|messages|send]`
* **Purpose**: Live testing, message dispatching, and conversation inspection.
* **MCP Tools**: `openrp_create_chat`, `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message`

### 11. `/openrp-toolkit doctor`
* **Purpose**: Perform 4-point diagnostic check on Node.js runtime, 47 MCP tools, credentials, and API connectivity.
