---
name: openrp
description: Use when creating, configuring, testing, or debugging OpenRP.ai Worlds, Lorebooks, Characters, Behavior Graphs, Node Pipelines, and Multi-Agent Group Chats.
---

# OpenRP Autonomous Development & Creator Skill

Master technical specification, operational protocols, and autonomous development guide for configuring, building, testing, and debugging interactive AI characters, deterministic game logic, autonomous behavior graphs, semantic lorebooks, and multi-participant chatrooms on OpenRP.ai.

---

## Role & Core Mandate

You are working as an **autonomous development agent for OpenRP**.

The project has an existing skill named `openrp`. This `openrp` skill is the **primary and authoritative central knowledge base** for OpenRP-related development.

### Knowledge Storage & Synchronized Locations
- **Primary Source & Toolkit Storage**: `/data/data/com.termux/files/home/openrp-toolkit/skills/openrp/`
- **Active Agent Runtime Directory**: `/data/data/com.termux/files/home/.agents/skills/openrp/`
- **Modular Technical References**:
  - `references/architecture.md` — Full system architecture, database ER models, execution lifecycles, and complete REST API endpoints.
  - `references/behavior_nodes.md` — 38 behavior node specifications, port handles, JEXL evaluator, variables, and lifecycles.
  - `references/worlds_and_characters.md` — World CRUD operations, RAG vector embeddings, tier visibility controls, character schemas, and prompt templates.
  - `references/group_orchestration.md` — Multi-character room architecture, participant filtering, mention triggers, round-robin turn cycling, and arbiter patterns.
  - `references/testing_and_debugging.md` — Manual test triggering in editor, live message metadata traces, error boundary trapping, and runtime error solutions.
  - `commands/openrp-toolkit.md` & `commands/openrp.md` — Slash command dispatch workflows.

---

## Autonomous Operating Protocols

### 1. Session Start Protocol
At the beginning of every session:
1. **Read and understand the `openrp` skill** before performing OpenRP-related work.
2. **Inspect the relevant project files**, source code, documentation, configuration, logs, and existing implementation when necessary.
3. **Understand the current architecture and constraints** before making changes.
4. **Use the existing knowledge in the `openrp` skill** before investigating a problem from scratch.
5. **Do not ask the user for information** that can be discovered from the skill, source code, project files, logs, available tools, or documentation.

### 2. OpenRP Skill Protocol
For all work related to OpenRP, use the existing `openrp` skill as the central knowledge base. This includes, but is not limited to:
- OpenRP API & REST endpoints
- Authentication & Supabase session lifecycle
- MCP tools (47 developer tools)
- Worlds (metadata, README, visibility tiers)
- Characters & Character Studio
- Character groups, hierarchies, and sub-factions
- Lorebooks (standard and exclusive RAG memory)
- Prompt templates (system, user, assistant)
- Behavior graphs & execution engine
- 38 Behavior nodes (ports, handles, lifecycles)
- Deploying and attaching behaviors
- Behavior executions, traces, and step diagnostics
- Chat and live messaging streams
- AI models catalog
- Request and response payloads
- Validation rules & constraints
- Errors, root causes, and debugging

**Before starting a new investigation or debugging process:**
1. Search and read the relevant sections of the `openrp` skill.
2. Reuse confirmed knowledge whenever applicable.
3. Only investigate from scratch when the skill does not contain sufficient information.

### 3. Automatic OpenRP Skill Updates
Whenever you discover meaningful, confirmed, and reusable knowledge related to OpenRP, **automatically update the existing `openrp` skill** in both the primary toolkit storage (`/data/data/com.termux/files/home/openrp-toolkit/skills/openrp/`) and active agent runtime directory (`/data/data/com.termux/files/home/.agents/skills/openrp/`).

**Do this autonomously without waiting for the user to explicitly say:**
- *"save this as a skill"*
- *"remember this"*
- *"document this"*
- *"update the skill"*
- *"summarize this"*

Do not create a separate skill for OpenRP-related discoveries unless explicitly requested by the user. All reusable OpenRP knowledge should be consolidated into the existing `openrp` skill.

### 4. What Must Be Added to the OpenRP Skill
Automatically preserve confirmed discoveries such as:
- API and endpoint behavior
- Authentication requirements & token lifecycle
- Correct request formats & response payloads
- Payload structures, required fields, and optional fields
- Validation rules & boundary conditions
- MCP tool usage & parameter specifications
- Behavior graph structures & edge wiring standards
- Node requirements, inputs, outputs, and format contracts
- Deployment requirements & binding lifecycles
- Error messages & confirmed root causes
- Successful fixes & debugging techniques
- Implementation patterns & architectural blueprints
- Constraints, limitations, and platform edge cases
- Common mistakes and verified solutions

### 5. Knowledge Quality Rules
When updating the `openrp` skill:
1. **Prefer verified evidence over assumptions**: Base entries on verified runtime logs, API responses, or source code.
2. **Clearly distinguish confirmed facts from hypotheses**: Never store speculation as confirmed knowledge.
3. **Avoid duplicate entries**: Consolidate findings into existing sections.
4. **Merge related discoveries** into the appropriate existing section or dedicated `references/*.md` file.
5. **Correct outdated knowledge** when newer evidence contradicts it.
6. **Keep information concise, structured, and easy to retrieve**: Use bullet points, code snippets, tables, and exact identifiers.
7. **Security & Privacy**: Never store passwords, API keys, JWTs, cookies, access tokens, refresh tokens, or personal information.

### 6. Mandatory Debugging & Verification-to-Completion Protocol
When an OpenRP-related problem occurs or when modifying/testing any Behavior Graph:
1. **Never Assume or Claim Success Without Evidence**: Never claim a fix or behavior is working based solely on deployment. You must verify actual runtime execution traces.
2. **Execute Live Trigger**: Trigger the behavior via `POST /api/chats/{chatId}/messages` or test input.
3. **Poll Execution Run Status**:
   - Query `POST /api/v1/behavior-executions/search` with `{ "chatId": "...", "limit": 5 }` or `{ "ids": message.metadata.behaviorExecutionIds }`.
   - If no execution appears within 2-3 seconds, verify character-world scoping and behavior binding attachment (`GET /api/v1/characters/{characterId}/behaviors`).
4. **Inspect Failing Step Diagnostics**:
   - If `status === "BEHAVIOR_EXECUTION_STATUS_FAILED"`, immediately call `GET /api/v1/behavior-executions/{executionId}/node-executions`.
   - Find the exact failing node (`status === "BEHAVIOR_EXECUTION_STATUS_FAILED"`), parse the `output.error` Zod validation error or runtime stack trace.
5. **Apply Graph Fix & Re-Deploy**:
   - Correct the node schema, input property, JEXL expression, or edge handle IDs.
   - Redeploy via `PUT /api/users/{userId}/worlds/{worldId}/behaviors/{behaviorId}`.
6. **Re-Test & Poll Until COMPLETED**:
   - Re-send test message and poll execution until `status === "BEHAVIOR_EXECUTION_STATUS_COMPLETED"`.
   - Confirm all node iterations in `node-executions` have `status === "BEHAVIOR_EXECUTION_STATUS_COMPLETED"`.
7. **Document the Diagnostic**: Automatically update the `openrp` skill references with the discovered root cause and fix pattern.

*Do not consider OpenRP debugging complete until the behavior execution status is confirmed as `BEHAVIOR_EXECUTION_STATUS_COMPLETED` in the runtime trace log and the reusable knowledge has been preserved in the skill.*

### 7. Autonomous Working Rules
Be proactive and autonomous:
- Continue to the next safe and relevant step without waiting for unnecessary confirmation.
- Ask the user only when:
  - A required decision cannot be inferred,
  - Multiple choices would materially change the result,
  - An action is destructive or irreversible,
  - Required credentials or external access are unavailable,
  - Or the user's intent is genuinely ambiguous.

### 8. Completion Protocol
For every meaningful OpenRP-related task:
1. Use the existing `openrp` skill.
2. Complete or investigate the user's request.
3. Verify the result when possible.
4. Extract newly discovered reusable knowledge.
5. Automatically update the existing `openrp` skill in primary storage (`openrp-toolkit/skills/openrp/`) and active agent directory (`~/.agents/skills/openrp/`).
6. Then report the final result.

The `openrp` skill must continuously improve throughout the session and future work. Do not wait for the user to manually request a skill update.

---

## Core Architecture

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

- **[Complete Nodes Encyclopedia & Examples](./references/all_nodes_encyclopedia.md)**: Exhaustive reference with JSON configurations and port definitions for all 37 OpenRP nodes.
- **[Behavior Nodes Specification](./references/behavior_nodes.md)**: Architectural guide for node categories, layout coordinates, and Zero-LLM Game Engine patterns.
- **[Token Economy & Eco-Modes Reference](./references/token_optimization_and_modes.md)**: User-controlled Eco vs Full mode toggles, context budget pruning, zero-LLM fast paths, and 78% token reduction.
- **[Expressions & Templates Reference](./references/expressions_and_templates.md)**: JEXL operators, `$variables`, `$requestMetadata`, `Math` object, and timezone-aware `Date.format()`.
- **[Dynamic Vector RAG & Memory Reference](./references/rag_and_memory.md)**: Vector search for character memories, lorebook semantic embeddings, similarity thresholds, and context synthesis.
- **[Advanced Patterns & Tool Calling Reference](./references/advanced_patterns.md)**: External HTTP async polling, structured LLM JSON mode, RPG combat state machines, and context token pruning.
- **[Streaming & Registry Specification](./references/streaming_and_registry.md)**: Real-time LLM response streaming, chunk polling loops, Semver behavior registry publishing, and immutability.
- **[Worlds & Characters Reference](./references/worlds_and_characters.md)**: World CRUD operations, RAG vector embeddings, tier visibility controls (`public`, `unlisted`, `private`), character schemas, and few-shot formatting.
- **[Group Orchestration Reference](./references/group_orchestration.md)**: Multi-character room architecture, participant filtering, mention triggers, round-robin turn cycling, and arbiter patterns.
- **[Production Blueprints & Verified Graphs](./references/production_blueprints.md)**: 5 copy-pasteable production blueprints (Official RAG Chat, AI Image Synthesis, Zero-LLM Fast Path, Multi-Agent Party, Eco-Mode Pruning).
- **[Testing & Diagnostics Runbook](./references/testing_and_debugging.md)**: Manual test triggering in the editor, live message metadata traces, error boundary trapping, and runtime error solutions.

## Slash Command Direct Dispatch (`/openrp-toolkit` & `/openrp`)

When the user invokes `/openrp-toolkit` or `/openrp` in chat, directly route the request to the corresponding tool family:
* `/openrp-toolkit init` -> Authenticate and load session profile (`openrp_set_auth`, `openrp_get_me`).
* `/openrp-toolkit world [list|get|create|update|readme|delete]` -> World universe and documentation management (`openrp_worlds`).
* `/openrp-toolkit lore [list|create|update|delete|access]` -> Factual lorebooks and confidential exclusive lore (`openrp_lores`).
* `/openrp-toolkit character [list|get|create|update|delete]` -> Autonomous personas, greetings, dialogs (`openrp_characters`).
* `/openrp-toolkit group [list|create|update|delete]` -> Factions and character groups (`openrp_character_groups`).
* `/openrp-toolkit prompt [list|get|create|delete]` -> Reusable system prompt templates (`openrp_prompts`).
* `/openrp-toolkit behavior [list|deploy|get|edit-node|attach|delete]` -> 38-node ReactFlow behavior graphs (`openrp_behaviors`).
* `/openrp-toolkit group-chat [mention-gate|round-robin|game-master]` -> Multi-agent group chat topologies.
* `/openrp-toolkit trace [search|get|nodes]` -> Behavior execution logs and resolved node trace inspection.
* `/openrp-toolkit chat [create|list|get|messages|send]` -> Live room testing and message dispatching.
* `/openrp-toolkit doctor` -> Diagnostics on runtime, packages, credentials, and API endpoints.

---

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

#### 1. Mandatory Execution Chains
These nodes process state, invoke models, or dispatch actions. If disconnected, they will **never execute** and referencing their outputs will return `null`:
- **Root Triggers**: `events/chat_message` (must have outgoing `next`).
- **Core Storage**: `storage/get_chat_message`, `storage/get_chat`, `storage/get_chat_participant`, `storage/get_characters`, `storage/get_character`, `storage/get_lores`, `storage/get_lore`, `storage/get_character_memories`, `storage/get_chat_messages`.
- **Variables & Transformers**: `storage/set_variable`, `storage/get_variable`, `utilities/filter`, `utilities/map`, `utilities/append`, `utilities/join`, `utilities/string_split`.
- **AI Engine**: `ai/get_default_model`, `ai/get_models`, `ai/get_model`, `ai/count_tokens`, `ai/prune_text`, `ai/generate_embeddings`, `ai/llm`.
- **Control Gateways**: `control_flow/split` $\to$ `control_flow/sync`, `control_flow/if` $\to$ `control_flow/end_if`, `control_flow/repeat_until`.

#### 2. Optional / Canvas-Only Nodes
- **Canvas Annotations (`utilities/comment`)**: Sticky notes for developer documentation. No input/output ports.
- **Terminal Exits**: Final nodes in a workflow (`storage/insert_chat_message`, `storage/update_typing_status` set to false) do not require outgoing `next` edges.

#### 3. Fallback & Error Branch Handlers
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

### Rule 9: Strict World-Character Co-Location & Behavior Binding Prerequisite for Testing
- **World & Character Co-Location**: When testing or executing behavior pipelines in a World (`worldId`), the character (`characterId`) used for testing **MUST belong to that exact same World**. Using a character from a different World breaks RAG vector lore lookup, context retrieval, and causes permission errors.
- **Behavior Binding Prerequisite**: Before initiating a chat session or sending test messages (`openrp_send_message`) to trigger the behavior pipeline (`events/chat_message`), the behavior graph **MUST already be explicitly attached/set to that character** (via `openrp_deploy_behavior` with `characterId` or `openrp_attach_behavior_to_character`). If the behavior is not attached, OpenRP defaults to generic fallback chat and the behavior pipeline will not execute.

## 7. Tool Usage Guide: `openrp_edit_behavior_node` vs `openrp_update_behavior`

| Task | Recommended MCP Tool | Why |
|---|---|---|
| Modifying an LLM prompt, variable formula, or message text | `openrp_edit_behavior_node` | Granular, fast in-place update of a single node's `data` without touching the rest of the graph. |
| Adding new nodes, deleting nodes, or rewiring edges | `openrp_update_behavior` | Replaces the entire graph topology while preserving behavior ID and bindings. |
| Reorganizing canvas layout coordinates ($X, Y$) | `openrp_update_behavior` | Repositions all nodes into structured grid columns. |
| Creating a completely new behavior workflow | `openrp_deploy_behavior` | Creates the behavior record, builds the graph, and optionally binds it to a character. |

---

## 8. Complete 40 MCP Tools Reference Guide

The OpenRP MCP Server exposes **40 high-level developer tools** organized into 9 operational domains:

1. **Authentication & Session** (3 tools): `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me`
2. **World Management** (6 tools): `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world`
3. **Lorebook System** (7 tools): `openrp_list_lores`, `openrp_list_lore_characters`, `openrp_list_character_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore`
4. **Character Studio & Factions** (9 tools): `openrp_list_characters`, `openrp_list_character_groups`, `openrp_create_character_group`, `openrp_update_character_group`, `openrp_delete_character_group`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character`
5. **Prompt Template System** (4 tools): `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt`
6. **Behavior Pipeline Engine** (7 tools): `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character`
7. **Behavior Executions & Debugging** (3 tools): `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions`
8. **Chat & Live Messaging** (5 tools): `openrp_create_chat`, `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message`
9. **Discovery, AI Models & Universal Gateway** (3 tools): `openrp_list_models`, `openrp_discover_worlds`, `openrp_raw_api`

---

## 2. Complete 47 MCP Tools Reference Guide

### Category 1: Authentication & Profile
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_set_auth` | `token?`, `refreshToken?`, `userId?`, `worldId?`, `characterId?` | Stores auth credentials, sets active IDs, and starts background auto-refresh daemon |
| `openrp_refresh_token` | *(none)* | Forces manual Supabase JWT session refresh before token expiry |
| `openrp_get_me` | *(none)* | Fetches authenticated user account profile, settings, credits, and subscription status |

### Category 2: World Management
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_my_worlds` | `page?`, `limit?` | Lists all worlds owned by the authenticated user |
| `openrp_get_world` | `userId?`, `worldId?` | Fetches complete metadata, settings, and stats of a world |
| `openrp_create_world` | `userId?`, `name`, `handle`, `description?`, `visibility?` | Creates a new World with verified `owner` and `chatOnly` payload |
| `openrp_update_world` | `userId?`, `worldId?`, `name?`, `description?`, `readme?`, `visibility?`, `tags?` | Updates world title, description, tags, and visibility using `updateType: "metadata"` |
| `openrp_update_world_readme` | `userId?`, `worldId?`, `readme` | Updates the main Markdown documentation (README.md) of a world up to 5000 words |
| `openrp_delete_world` | `userId?`, `worldId?` | Permanently deletes a world and all associated entities |

> [!NOTE]
> **Official Developer Notice on World Visibility**:
> - **`WORLD_VISIBILITY_PUBLIC`**: Default public visibility accessible across community feeds and search.
> - **`WORLD_VISIBILITY_UNLISTED`**: The same as public, for now.
> - **`WORLD_VISIBILITY_PRIVATE`**: **Requires OpenRP Plus/Pro subscription** (`isPlus: true`). Free accounts attempting to set private visibility will receive a plan constraint error from the backend.

### Category 3: Lorebook Management & Exclusive Access
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_lores` | `userId?`, `worldId?`, `page?`, `limit?` | Lists all lorebook entries and memory records in a world |
| `openrp_list_lore_characters` | `userId?`, `worldId?`, `loreId` | Lists all characters that have access to a specific exclusive lore entry |
| `openrp_list_character_lores` | `userId?`, `worldId?`, `characterId` | Lists all exclusive and assigned lore entries accessible by a character |
| `openrp_get_lore` | `userId?`, `worldId?`, `loreId` | Retrieves specific lore title, handle, markdown content, and exclusive flags |
| `openrp_create_lore` | `userId?`, `worldId?`, `title`, `handle`, `content`, `isExclusive?`, `tags?` | Creates a new factual lorebook entry (`isExclusive: true/false`) |
| `openrp_update_lore` | `userId?`, `worldId?`, `loreId`, `title?`, `content?`, `isExclusive?`, `tags?` | Updates an existing lorebook record |
| `openrp_delete_lore` | `userId?`, `worldId?`, `loreId` | Permanently deletes a lorebook entry |

### Category 4: Character Studio & Personas
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_characters` | `userId?`, `worldId?` | Lists all character bots residing inside a world |
| `openrp_list_character_groups` | `worldId?` | Lists all Character Groups and faction hierarchies in a world |
| `openrp_create_character_group` | `worldId?`, `name`, `handle`, `description?`, `parentGroupId?`, `autoAddMembers?` | Creates a new faction / character group in a world |
| `openrp_update_character_group` | `groupId`, `name?`, `handle?`, `description?`, `parentGroupId?`, `autoAddMembers?`, `avatarPath?` | Updates an existing character group / faction |
| `openrp_delete_character_group` | `groupId` | Permanently deletes a character group |
| `openrp_get_character` | `characterId?` | Retrieves full persona details, system prompt, greetings, dialogs, and avatar URL |
| `openrp_create_character` | `userId?`, `worldId?`, `name`, `handle`, `shortDescription?`, `personality?`, `description?`, `status?`, `dialogs?` | Creates a new character bot in a world |
| `openrp_update_character` | `userId?`, `worldId?`, `characterId?`, `name?`, `status?`, `shortDescription?`, `description?`, `personality?`, `greetings?`, `dialogs?`, `avatarPath?` | Updates character persona, dialog examples, and system prompt |
| `openrp_delete_character` | `userId?`, `worldId?`, `characterId` | Permanently deletes a character from a world |

### Category 5: Prompt Template System
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_prompts` | `userId?`, `worldId?` | Lists all system prompt templates configured in a world |
| `openrp_get_prompt` | `userId?`, `worldId?`, `promptId` | Retrieves detailed prompt template nodes (system, user, assistant) |
| `openrp_create_prompt` | `userId?`, `worldId?`, `name`, `handle`, `content?`, `isDefault?` | Creates a new world prompt template |
| `openrp_delete_prompt` | `userId?`, `worldId?`, `promptId` | Deletes a prompt template from a world |

### Category 6: Behavior Pipeline Engine
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_behaviors` | `userId?`, `worldId?` | Lists all behavior graphs in a world |
| `openrp_get_behavior` | `userId?`, `worldId?`, `behaviorId` | Retrieves full Behavior Graph JSON (nodes, edges, expressions) |
| `openrp_update_behavior` | `userId?`, `worldId?`, `behaviorId`, `name?`, `handle?`, `graph` | In-place update of an existing Behavior Graph without losing character bindings |
| `openrp_edit_behavior_node` | `userId?`, `worldId?`, `behaviorId`, `nodeId`, `nodeData` | Granular in-place edit of a single node's data/expressions |
| `openrp_deploy_behavior` | `userId?`, `worldId?`, `characterId?`, `name`, `handle`, `graph`, `deleteOldBehaviors?` | Atomic deployment and auto-binding of a behavior graph to a character |
| `openrp_delete_behavior` | `userId?`, `worldId?`, `behaviorId` | Deletes a behavior pipeline from a world |
| `openrp_attach_behavior_to_character` | `characterId?`, `behaviorId` | Binds a behavior pipeline to an active character |

### Category 7: Behavior Executions & Debugging Traces
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_search_behavior_executions` | `limit?`, `behaviorId?`, `chatId?`, `status?` | Searches execution history runs (`COMPLETED`, `FAILED`, etc.) |
| `openrp_get_behavior_execution` | `executionId` | Retrieves execution summary, timestamps, trigger message, and status |
| `openrp_get_behavior_node_executions` | `executionId` | Retrieves step-by-step resolved node execution traces, inputs, outputs, and errors |

### Category 8: Chat & Live Messaging
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_create_chat` | `characterId?`, `tentative?` | Creates a new 1-on-1 chat session or retrieves existing chat room with a character |
| `openrp_list_chats` | `page?`, `limit?` | Lists active chat sessions and room participants |
| `openrp_get_chat` | `chatId` | Retrieves detailed metadata, participants, model settings, and connected world for a chatroom |
| `openrp_get_chat_messages` | `chatId`, `limit?` | Fetches conversation history from a chatroom |
| `openrp_send_message` | `chatId`, `content`, `chatParticipantId?` | Dispatches a message directly into a chatroom to trigger behaviors |

### Category 9: Discovery, AI Models & Universal REST Gateway
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_list_models` | *(none)* | Lists all 38+ available AI models (Claude Opus/Sonnet 4.8, GPT-5.4, Gemini 3.5, Grok 4.5, Kimi k3, DeepSeek) |
| `openrp_discover_worlds` | `query?`, `page?` | Searches public community worlds (`/api/worlds/discover`) |
| `openrp_raw_api` | `path`, `method?`, `body?` | Executes arbitrary OpenRP REST API calls with auto-authentication |
