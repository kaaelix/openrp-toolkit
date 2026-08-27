---
name: openrp
description: Use when creating, configuring, testing, or debugging OpenRP.ai Worlds, Lorebooks, Characters, Behavior Graphs, Node Pipelines, and Multi-Agent Group Chats.
---

# OpenRP Creator & Developer Skill

Technical specification and operational guide for configuring, developing, testing, and debugging interactive AI characters, deterministic game logic, autonomous behavior graphs, semantic lorebooks, and multi-participant chatrooms on OpenRP.ai.

## Architecture

OpenRP separates world design, character identities, and interactive execution into four discrete layers:

```
+-----------------------------------------------------------------------------+
|                             OPENRP ARCHITECTURE                             |
+----------------------+----------------------+-------------------------------+
| 1. WORLD LAYER       | 2. CHARACTER LAYER   | 3. BEHAVIOR ENGINE            |
|  - Readme Lorebook   |  - System Persona    |  - 38 Node Palette            |
|  - Vector Embeddings |  - Few-Shot Dialogs  |  - JEXL Expression Evaluator  |
|  - Visibility Access |  - Greetings & State |  - Control Flow & Looping     |
|  - Sub-Factions      |  - Behavior Binding  |  - Real-Time Stream Reading   |
+----------------------+----------------------+-------------------------------+
| 4. MULTI-PARTICIPANT ORCHESTRATION & STATE MACHINES                         |
|  - Room Isolation: User (userId != null) vs Character (userId == null)       |
|  - Turn-Taking: Mention-based, Round-Robin, or Game Master Arbiter          |
|  - Deterministic State: Sequential Variable Pipelines                       |
+-----------------------------------------------------------------------------+
```

## Technical References

- **[Behavior Nodes Specification](./references/behavior_nodes.md)**: Comprehensive reference for all 38 node types, port handles, JEXL expressions, execution lifecycles, and variable evaluation.
- **[Worlds & Characters Reference](./references/worlds_and_characters.md)**: World CRUD operations, RAG vector embeddings, tier visibility controls (`public`, `unlisted`, `private`), character schemas, and few-shot formatting.
- **[Group Orchestration Reference](./references/group_orchestration.md)**: Multi-character room architecture, participant filtering, mention triggers, round-robin turn cycling, and arbiter patterns.
- **[Testing & Diagnostics Runbook](./references/testing_and_debugging.md)**: Manual test triggering in the editor, live message metadata traces, error boundary trapping, and runtime error solutions.

## Upstream Official Documentation Links

For further deep dives, live updates, or raw specification references, refer to the official OpenRP resources:
- **Interactive Web Documentation**: [https://openrp.ai/docs](https://openrp.ai/docs)
- **Machine-Readable LLM Index**: [https://openrp.ai/docs/llms.txt](https://openrp.ai/docs/llms.txt)
- **Complete Full-Text Documentation Export**: [https://openrp.ai/docs/llms-full.txt](https://openrp.ai/docs/llms-full.txt)
- **Behavior Engine Guides**:
  - Getting Started: [https://openrp.ai/docs/behaviors/getting-started](https://openrp.ai/docs/behaviors/getting-started)
  - Variable Pipelines: [https://openrp.ai/docs/behaviors/using-variables](https://openrp.ai/docs/behaviors/using-variables)
  - JEXL Expression Syntax: [https://openrp.ai/docs/behaviors/expressions](https://openrp.ai/docs/behaviors/expressions)
  - Control Flow & Branching: [https://openrp.ai/docs/behaviors/control-flow](https://openrp.ai/docs/behaviors/control-flow)
  - Real-Time Streaming: [https://openrp.ai/docs/behaviors/streaming](https://openrp.ai/docs/behaviors/streaming)
  - Public Behavior Registry: [https://openrp.ai/docs/behaviors/behavior-registry](https://openrp.ai/docs/behaviors/behavior-registry)

## Authentication & Session Management

To interact with OpenRP APIs via MCP tools:
1. **Using Browser Cookie (Recommended)**: Pass raw browser cookies (`sb-uixnaquqjhzcctyfoapf-auth-token.0` and `.1`) to `openrp_set_auth({"cookie": "...", "userId": "...", "worldId": "..."})`. This enables automatic background token refreshing via Supabase Auth when the 1-hour access token expires.
2. **Using Direct JWT Token**: Pass the Bearer token string to `openrp_set_auth({"token": "eyJ..."})`.
3. **Session Verification (`openrp_get_me`)**: Call `openrp_get_me` to verify active authentication. It retrieves the authenticated user's ID, display name, handle, email, bio, and avatar.

## HTTP Status & Error Code Reference

When diagnosing API responses or error logs:

| HTTP Status | Error Type | Root Cause & Resolution |
|---|---|---|
| `401 Unauthorized` | Token Expired / Missing | JWT token is missing or expired. Call `openrp_refresh_token` or provide fresh cookies to `openrp_set_auth`. |
| `403 Forbidden` | Permission / Tier Limit | Attempting to access resources owned by another user, or setting a World to `private` on a Free account tier (Free accounts only support `public` and `unlisted`). |
| `404 Not Found` | Resource Missing | The specified `worldId`, `characterId`, `loreId`, or `behaviorId` does not exist or was deleted. |
| `400 Bad Request` | Payload Validation Error | Missing required fields (e.g. `name`, `handle`) or invalid JEXL syntax in graph nodes. |
| `500 Internal Error` | Server Exception / Expired Signature | In OpenRP, sending an expired Supabase JWT or querying an endpoint with mismatched `userId` and `worldId` triggers a backend 500. Refresh the token via `openrp_set_auth` or verify resource IDs. |

## Autonomous Behavior Generation Guardrails

When generating or editing behavior graphs, AI agents must strictly enforce the following rules:

### Rule 1: Enforce Strict ReactFlow Edge ID and Port Matching
OpenRP's visual canvas requires every edge in `graph.edges` to have the exact deterministic ID format:
`"id": "xy-edge__<source><sourceHandle>-<target><targetHandle>"` (e.g. `"xy-edge__chatMessagenext-getChatMessageprevious"`).

Port handles must match the following specifications:
- Linear execution (`get_chat_message`, `set_variable`, `insert_chat_message`, `llm`, `wait`):
  - `sourceHandle: "next"`, `targetHandle: "previous"`
- Conditional branching (`if`):
  - `sourceHandle: "true"` or `"false"`, `targetHandle: "previous"`
- Conditional merging (`end_if`):
  - `sourceHandle: "next"` on converging branches -> `targetHandle: "in1"` and `"in2"` on `end_if`
- Parallel split (`split`):
  - `sourceHandle: "out1"`, `"out2"`, ... -> `targetHandle: "previous"`
- Barrier synchronization (`sync`):
  - `sourceHandle: "next"` -> `targetHandle: "in1"`, `"in2"` on `sync` (set `lcaNodeId: "<splitNodeId>"` on `sync`)
- Looping (`repeat_until`):
  - Loop body start: `sourceHandle: "loopStart"` -> `targetHandle: "previous"`
  - Loop body close: `sourceHandle: "next"` -> `targetHandle: "loopEnd"`
  - Loop exit: `sourceHandle: "next"` on `repeat_until` -> `targetHandle: "previous"` downstream
- Error isolation (`try`):
  - `sourceHandle: "success"` or `"error"`, `targetHandle: "previous"`

### Rule 2: Chain Dependent Variable Evaluations
Variables defined in the same `storage/set_variable` node are evaluated concurrently. If Variable B references `$variables.A`, Variable A must be set in an earlier `set_variable` node in the sequence.

### Rule 3: Pure JEXL Expressions Only
All expressions within `{ "$expression": "..." }` must follow pure standard JEXL syntax:
- Never use JavaScript regex literals (`/[1-9]/`). Use `.indexOf()`, `.startsWith()`, `.endsWith()`, or `.split()` instead.
- Access node outputs by their exact node ID (e.g. `getChatMessage.content`, `filterBot.list[0].id`).
- Access session variables via `$variables.<varName>`.

### Rule 4: Canvas Geometry & Structured Multi-Column Grid Layout
Never generate behavior graphs on a single flat horizontal line spanning thousands of pixels. Always lay out nodes using a structured multi-column grid:
- **Column Spacing ($\Delta X$)**: $220\text{px} - 260\text{px}$ between functional stages.
- **Row Spacing ($\Delta Y$)**: $130\text{px} - 150\text{px}$ for sequential downward flows.
- **Branch Offsets**:
  - Upper branch: $Y_{\text{base}} - 140\text{px}$
  - Lower branch: $Y_{\text{base}} + 140\text{px}$
  - Merge barrier (`sync`, `end_if`): Re-align at $Y_{\text{base}}$ centered between branches.
- **Loop Offsets (`repeat_until`)**: Place loop body nodes directly above or below the loop controller ($Y_{\text{base}} \pm 140\text{px}$) with `loopStart` and `loopEnd` handles properly paired.
- **Error Handlers (`try`)**: Place the `error` branch directly below the `success` branch.

### Rule 5: Always Filter Participant ID Before Sending Messages
Before calling `storage/insert_chat_message`, fetch chat participants using `storage/get_chat` (`expand: ["participants"]`) and filter for the AI character using `utilities/filter` (`item.userId === null`). Pass `filterNode.list[0].id` to `insert_chat_message.chatParticipantId`.

### Rule 6: Error Trapping for External Webhooks
Wrap network calls (`utilities/http_request`) with `control_flow/try`. Route the `error` port to `storage/broadcast_failed_chat_message` to alert the user without corrupting the chatroom message history.

### Rule 7: End-to-End Topological Continuity & Connectivity Requirements
Behavior node connectivity rules depend strictly on node category and runtime semantics:

#### 1. Node Wajib Tersambung (Mandatory Execution Chain)
These nodes process state, invoke models, or dispatch actions. If disconnected, they will **never execute** and referencing their outputs will return `null`:
- **Root Triggers**: `events/chat_message` (must have outgoing `next`).
- **Core Storage**: `storage/get_chat_message`, `storage/get_chat`, `storage/get_chat_participant`, `storage/get_characters`, `storage/get_character`, `storage/get_lores`, `storage/get_lore`, `storage/get_character_memories`, `storage/get_chat_messages`.
- **Variables & Transformers**: `storage/set_variable`, `storage/get_variable`, `utilities/filter`, `utilities/map`, `utilities/append`, `utilities/join`, `utilities/string_split`.
- **AI Engine**: `ai/get_default_model`, `ai/get_models`, `ai/get_model`, `ai/count_tokens`, `ai/prune_text`, `ai/generate_embeddings`, `ai/llm`.
- **Control Gateways**: `control_flow/split` $\to$ `control_flow/sync`, `control_flow/if` $\to$ `control_flow/end_if`, `control_flow/repeat_until`.

#### 2. Node Tidak Wajib / Opsional (Optional / Canvas-Only)
- **Canvas Annotations (`utilities/comment`)**: Sticky notes for developer documentation. No input/output ports.
- **Terminal Exits**: Final nodes in a workflow (`storage/insert_chat_message`, `storage/update_typing_status` set to false) do not require outgoing `next` edges.

#### 3. Node Cadangan / Fallback (Error & Alternative Branch Handlers)
- **Error Trapping (`control_flow/try.error`)**: Route to `storage/broadcast_failed_chat_message` or a fallback `storage/insert_chat_message` to gracefully handle network/webhook failures.
- **False/Alternative Path (`control_flow/if.false`)**: Connect to a `control_flow/wait` or fallback `ai/llm` before converging into `control_flow/end_if`.

### Rule 8: Model Node Pipeline & Viewport Virtualization Safety
- **Model Discovery Pipeline**:
  - `ai/get_default_model`: Discovers system-configured default chat model ID (`getDefaultModel.id`).
  - `ai/get_models`: Lists all available models in `getModels.data` array.
  - `ai/get_model`: Retrieves detailed provider metadata for a specific model ID (`modelId: getDefaultModel.id`).
  - Pass the resolved ID directly to `ai/llm.modelId`.
- **Viewport Virtualization & 1x1 Pixel Collapse Prevention**:
  ReactFlow virtualizes off-screen nodes and may collapse distant nodes ($X > 3000\text{px}$) into `1x1` pixel bounding boxes (`measured: { width: 1, height: 1 }`). Always keep node clusters centered within compact coordinates ($X: 100-2400\text{px}, Y: 100-1400\text{px}$) so every node renders at full dimensions with visible wire connections.

## Tool Usage Guide: `openrp_edit_behavior_node` vs `openrp_update_behavior`

| Task | Recommended MCP Tool | Why |
|---|---|---|
| Modifying an LLM prompt, variable formula, or message text | `openrp_edit_behavior_node` | Granular, fast in-place update of a single node's `data` without touching the rest of the graph. |
| Adding new nodes, deleting nodes, or rewiring edges | `openrp_update_behavior` | Replaces the entire graph topology while preserving behavior ID and bindings. |
| Reorganizing canvas layout coordinates ($X, Y$) | `openrp_update_behavior` | Repositions all nodes into structured grid columns. |
| Creating a completely new behavior workflow | `openrp_deploy_behavior` | Creates the behavior record, builds the graph, and optionally binds it to a character. |

## MCP Tool Index (28 Tools)

The OpenRP MCP Server provides 28 tools for full-stack programmatic control:

| Category | Tools | Description |
|---|---|---|
| Authentication | `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me` | Session configuration, auto-refresh token handling, and user profile inspection. |
| Worlds | `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_delete_world` | Complete CRUD for worlds, lorebook READMEs, visibility tiers, assets, and embeddings. |
| Lorebooks | `openrp_list_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore` | Targeted fact entries with semantic vector search support. |
| Characters | `openrp_list_characters`, `openrp_get_character`, `openrp_update_character` | Persona configuration, system prompts, few-shot dialogs, and avatar management. |
| Behaviors | `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character` | Node graph building, in-place updates, granular node editing, and character binding. |
| Chat & Messaging | `openrp_list_chats`, `openrp_get_chat_messages`, `openrp_send_message` | Chatroom history, group participant inspection, and direct message dispatch. |
| Gateway | `openrp_discover_worlds`, `openrp_raw_api` | Public community search and universal REST API execution. |
