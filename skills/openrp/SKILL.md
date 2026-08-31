---
name: openrp
description: Use when creating, configuring, testing, or debugging OpenRP.ai Worlds, Lorebooks, Characters, Behavior Graphs, Node Pipelines, and Multi-Agent Group Chats.
---

# OpenRP Autonomous Development & Creator Skill

Master technical specification, operational protocols, and autonomous development guide for configuring, building, testing, and debugging interactive AI characters, deterministic game logic, autonomous behavior graphs, semantic lorebooks, and multi-participant chatrooms on OpenRP.ai.

---

## Role & Core Mandate

You are working as a **Senior AI Architect and Reliability Engineer** for OpenRP. Your mandate goes beyond merely connecting graph nodes; you must anticipate race conditions, design defensive architectures (fail-safes, error trapping), and rigorously validate structural integrity using static analysis and runtime tracing.

The project has an existing skill named `openrp`. This `openrp` skill is the **primary and authoritative central knowledge base** for OpenRP-related development.

### Knowledge Storage & Synchronized Locations
- **Active Agent Runtime Directory**: `~/.agents/skills/openrp/` (or `~/.claude/skills/openrp/`, `~/.codex/skills/openrp/`)
- **Official GitHub Repository**: `https://github.com/kaaelix/openrp-toolkit`
- **Live Raw References CDN**: `https://raw.githubusercontent.com/kaaelix/openrp-toolkit/main/skills/openrp/`
- **Modular Technical References**:
  - `references/architecture.md` — Full system architecture, database ER models, execution lifecycles, and complete REST API endpoints.
  - `references/blueprints.md` — 4 production-tested architectural patterns (Sequential, Branching, State Machine, Looping).
  - `references/behavior_nodes.md` — 38 behavior node specifications, port handles, JEXL evaluator, variables, and lifecycles.
  - `references/worlds_and_characters.md` — World CRUD operations, RAG vector embeddings, tier visibility controls, character schemas, and prompt templates.
  - `references/group_orchestration.md` — Multi-character room architecture, participant filtering, mention triggers, round-robin turn cycling, and arbiter patterns.
  - `references/testing_and_debugging.md` — Manual test triggering in editor, live message metadata traces, error boundary trapping, and runtime error solutions.
  - `references/canvas_layouts_and_edge_styles.md` — Visual spatial layouts (Linear, Diamond, Waterfall, Scoped), coordinate formulas, and anti-looping connection guarantees.
  - `references/official_behavior_blueprints.md` — Exhaustive blueprints, node-by-node input/output specifications, and JSON exports for official default 54-node chat and multimodal image behaviors.
  - `commands/openrp.md` — Slash command dispatch workflows.

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
- MCP tools (60 developer tools)
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
- **Autonomous Scaffolding**: Whenever asked to create a new behavior from scratch or from a high-level user prompt, use `openrp_scaffold_behavior_graph` to generate a verified, auto-laid-out foundation from standard blueprints (sequential, branching, state_machine, looping).
- **Autonomous QA Verification**: After deploying or modifying a behavior, execute `openrp_test_and_heal_behavior` to verify live runtime execution and automatically extract failing node error diagnostics for targeted self-healing.
- **Visual Debugging**: Whenever you are asked to analyze, debug, or explain a behavior graph, ALWAYS call `openrp_render_behavior_mermaid` first to generate a visual diagram in the chat so both you and the user can see the topological flow clearly.
- **Auto-Layout Enforcement**: If you ever create or modify a behavior graph by adding nodes/edges, you MUST call `openrp_beautify_graph` afterwards to fix the spatial coordinates. Never leave nodes stacked on `x:0, y:0`.
- **Architectural Blueprint Matching**: Whenever you are asked to design, scaffold, or generate a new Behavior Graph, ALWAYS choose and adapt one of the 4 standard patterns from `references/blueprints.md` (Sequential Chain, Branching Router, State Machine, or Resilient Loop). Never invent arbitrary unverified topologies.
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

### 7. Senior Autonomous Engineering Rules
Be proactive, rigorous, and autonomous:
- **Defensive Design First**: Never wire an `ai/llm` or `utilities/http_request` without asking: "What if it fails?" Wrap volatile nodes in `control_flow/try` to prevent fatal runtime cascades.
- **Relentless Iteration**: DO NOT stop or ask the user for help at the first sign of a failure or HTTP 400/500 error. Use `openrp_execute_behavior_debug`, `validator.js`, and raw APIs to extract stack traces. Attempt to autonomously hotfix the issue at least 3 times before escalating.
- **Explain the 'Why'**: When presenting a solution, don't just say "I fixed it". Briefly explain the root cause, the trade-off chosen, and how the fix prevents future race conditions or data loss.
- Ask the user only when:
  - A required architectural decision cannot be inferred.
  - Multiple choices would materially change the result or cost (e.g. Eco vs Full token limits).
  - An action is destructive (deleting a production World/Behavior).

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
- **[Behavior Graph Blueprints](references/blueprints.md)**: 4 production-tested architectural patterns (Sequential, Branching, State Machine, Looping).
- **[Behavior Nodes Specification](./references/behavior_nodes.md)**: Architectural guide for node categories, layout coordinates, and Zero-LLM Game Engine patterns.
- **[Token Economy & Eco-Modes Reference](./references/token_optimization_and_modes.md)**: User-controlled Eco vs Full mode toggles, context budget pruning, zero-LLM fast paths, and 78% token reduction.
- **[Expressions & Templates Reference](./references/expressions_and_templates.md)**: JEXL operators, `$variables`, `$requestMetadata`, `Math` object, and timezone-aware `Date.format()`.
- **[Dynamic Vector RAG & Memory Reference](./references/rag_and_memory.md)**: Vector search for character memories, lorebook semantic embeddings, similarity thresholds, and context synthesis.
- **[Advanced Patterns & Tool Calling Reference](./references/advanced_patterns.md)**: External HTTP async polling, structured LLM JSON mode, RPG combat state machines, and context token pruning.
- **[Streaming & Registry Specification](./references/streaming_and_registry.md)**: Real-time LLM response streaming, chunk polling loops, Semver behavior registry publishing, and immutability.
- **[Worlds & Characters Reference](./references/worlds_and_characters.md)**: World CRUD operations, RAG vector embeddings, tier visibility controls (`public`, `unlisted`, `private`), character schemas, and few-shot formatting.
- **[Group Orchestration Reference](./references/group_orchestration.md)**: Multi-character room architecture, participant filtering, mention triggers, round-robin turn cycling, and arbiter patterns.
- **[Production Blueprints & Verified Graphs](./references/production_blueprints.md)**: 5 copy-pasteable production blueprints (Official RAG Chat, AI Image Synthesis, Zero-LLM Fast Path, Multi-Agent Party, Eco-Mode Pruning).
- **[Verified Production Graph (High-Capacity Roleplay)](./references/verified_production_graph.md)**: Exact `data` shapes for every node + the single-LLM RAG+state-machine architecture, extracted from a live 5000-node production behavior graph. Authoritative schema reference for graph generation.
- **[Verified Node Schemas & Experiment Findings](./references/verified_node_schemas.md)**: All 35 node `data` schemas verified by live deploy+execute, plus handle-validation rules, model compatibility matrix, and corrections to outdated docs (`repeat_until.expression`, `http_request.headers` enum, `prune_text.direction`, `responseSchema` plain string, try-node exit requirements).
- **[Canvas Layouts & Edge Styling Reference](./references/canvas_layouts_and_edge_styles.md)**: 5 visual layout modes (Snake S-Curve, Bento Modular, Diamond Fork-Join, Cyberpunk Wave, Radial Orbit) and animated color-coded ReactFlow edge wires.
- **[OpenRP-Base Architecture & Lineage](./references/openrp_base_architecture_lineage.md)**: Dissection of the official `openrp-ai/openrp-base` repository, protobuf definitions (`ai.openrp.base.metadata`), and the evolution from V1 prompt nodes into the V2 Behavior DAG Engine.
- **[All 37 Node Types — 56-Behavior Battery](./references/56_behavior_battery.md)**: 55/56 editor-debug COMPLETED run exercising every node type; `.length` not `.size()`, `if` output shape, cron-not-debuggable, multi-LLM poll window, end_if topology trap.
- **[Runtime Node Output Snapshots & Tracing](./references/runtime_output_snapshots.md)**: Exact JSON output payloads for all nodes from real execution traces, and how `metadata.behaviorExecutionIds` maps user messages to bot outputs.
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

To interact with OpenRP APIs via CLI and MCP tools, multiple authentication workflows are supported:

### Method 1: Web Browser 1-Click Auto-Sync (Recommended)
Run the authentication command in your terminal:
```bash
npx openrp-toolkit auth
# or
npx openrp-toolkit web-login
```
1. The CLI launches a local listening gateway on `http://127.0.0.1:45678`.
2. A minimalist Black & White Gateway opens in your browser.
3. Open `https://openrp.ai` in your browser where you are logged in.
4. Execute the bridge via **Bookmarklet** or **Console (F12)** (just like Eruda):
   ```javascript
   javascript:(function(){var s=document.createElement('script');s.src='http://127.0.0.1:45678/bridge.js';document.body.appendChild(s);})();
   ```
5. The browser verifies the session and confirms:
   - User Name & Handle
   - "Authorization Granted"
   - Credentials are automatically saved to `~/.openrp_mcp_auth.json`.

### Method 2: Automated Userscript (`openrp-auth.user.js`)
Install the included [openrp-auth.user.js](file:///data/data/com.termux/files/home/openrp-toolkit/openrp-auth.user.js) into Tampermonkey, Violentmonkey, or Kiwi Browser. Whenever you visit `https://openrp.ai/`, the script automatically detects active sessions and links them to your local CLI & MCP server.

### Method 3: Manual Cookie / JWT Token Paste
Pass raw Supabase cookies (`sb-uixnaquqjhzcctyfoapf-auth-token`) or JWT Bearer tokens directly:
```bash
npx openrp-toolkit auth
# Select Option 2 and paste token
```

### Method 4: MCP Tool Invocation (`openrp_set_auth`)
AI Agents can set authentication at runtime by calling:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "userId": "019f4c49-0ec7-7374-8fab-d7e8add428bc",
  "worldId": "wrld_..."
}
```
> [!TIP]
> `userId` should be the **OpenRP Platform Account ID** (UUIDv7, from `openrp_get_me.data.id`), not the Supabase auth UID. Both work in route paths, but the platform ID is what `get_me` returns and what appears in every `owner.id`. The `token` (access JWT) expires after ~1h — the `refreshToken` outlives it, so always store both and call `openrp_refresh_token` on `403 user_not_authorized`.

## HTTP Status & Error Code Reference

When diagnosing API responses or error logs:

| HTTP Status | Error Type | Root Cause & Resolution |
|---|---|---|
| `401 Unauthorized` | Token Expired / Missing | JWT token is missing or expired. Call `openrp_refresh_token` or provide fresh cookies to `openrp_set_auth`. |
| `403 Forbidden` | Permission / Tier Limit / **Expired Token** | Attempting to access resources owned by another user, setting a World to `private` on a Free account tier, **or presenting an expired access token** (verified: `/api/worlds/my-worlds` returns `{"code":"user_not_authorized"}` and `/api/users/me` returns `data:null` when the JWT is expired — refresh fixes it). |
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
  - `sourceHandle: "next"` -> `targetHandle: "in1"`, `"in2"` on `sync` (data: `{"inputCount": N}`; `lcaNodeId` is optional/legacy — verified live production graphs omit it and only set `inputCount`)
- Looping (`repeat_until`):
  - Loop body start: `sourceHandle: "loopStart"` -> `targetHandle: "previous"`
  - Loop body close: `sourceHandle: "next"` -> `targetHandle: "loopEnd"`
  - Loop exit: `sourceHandle: "next"` on `repeat_until` -> `targetHandle: "previous"` downstream
- Error isolation (`try`) — **VERIFIED against a live 5000-node production graph**:
  - Body start: `sourceHandle: "loopStart"` on `try` -> body node `targetHandle: "previous"`
  - Body end: last body node `sourceHandle: "next"` -> `targetHandle: "loopEnd"` on `try`
  - Success continuation: `sourceHandle: "next"` on `try` -> downstream `targetHandle: "previous"`
  - Error handler: `sourceHandle: "error"` on `try` -> fallback node `targetHandle: "previous"`
  - ⚠️ `try` does **not** use `success`/`error` for the body boundary — it reuses `loopStart`/`loopEnd` (same handles as `repeat_until`). The `success` handle does not exist.

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
- **Error Handlers (`try`)**: Place the `error` branch directly below the try body (body is delimited by `loopStart`/`loopEnd`, not `success`).

### Rule 5: Always Filter Participant ID Before Sending Messages
Before calling `storage/insert_chat_message`, fetch chat participants using `storage/get_chat` (`expand: ["participants"]`) and filter for the AI character using `utilities/filter`. Verified live filter conditions:
- **Bot participant**: `item.userId === null && item.characterId !== null` (the `characterId !== null` guard distinguishes the AI character from other null-user entries)
- **User participant**: `item.userId !== null`
Pass `filterNode.list[0].id` to `insert_chat_message.chatParticipantId` and `filterNode.list[0].characterId` to `storage/get_character.characterId`.

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
- **Behavior Binding Prerequisite**: Before testing a behavior pipeline (`events/chat_message`), the behavior graph **MUST already be explicitly attached/set to that character** (via `openrp_deploy_behavior` with `characterId` or `openrp_attach_behavior_to_character`). If the behavior is not attached, OpenRP defaults to generic fallback chat and the behavior pipeline will not execute.
- **Testing trigger (verified)**: `openrp_send_message` only inserts a message (`POST /api/chats/{chatId}/messages`) and does **not** trigger the behavior engine (`metadata.behaviorExecutionIds` stays `[]`). To execute a behavior via MCP, use `openrp_execute_behavior_debug` (triggerSource `"editor"`), then poll `openrp_get_behavior_execution` + `openrp_get_behavior_node_executions` until `BEHAVIOR_EXECUTION_STATUS_COMPLETED`.

## 7. Tool Usage Guide: `openrp_edit_behavior_node` vs `openrp_update_behavior`

| Task | Recommended MCP Tool | Why |
|---|---|---|
| Modifying an LLM prompt, variable formula, or message text | `openrp_edit_behavior_node` | Granular, fast in-place update of a single node's `data` without touching the rest of the graph. |
| Adding new nodes, deleting nodes, or rewiring edges | `openrp_update_behavior` | Replaces the entire graph topology while preserving behavior ID and bindings. |
| Reorganizing canvas layout coordinates ($X, Y$) | `openrp_update_behavior` | Repositions all nodes into structured grid columns. |
| Creating a completely new behavior workflow | `openrp_deploy_behavior` | Creates the behavior record, builds the graph, and optionally binds it to a character. |

---

## 8. Complete 60 MCP Tools Reference Guide

The OpenRP MCP Server exposes **60 high-level developer tools** organized into 9 operational domains:

1. **Authentication & Session** (5 tools): `openrp_auth`, `openrp_web_login`, `openrp_set_auth`, `openrp_refresh_token`, `openrp_get_me`
2. **World Management** (6 tools): `openrp_list_my_worlds`, `openrp_get_world`, `openrp_create_world`, `openrp_update_world`, `openrp_update_world_readme`, `openrp_delete_world`
3. **Lorebook System** (7 tools): `openrp_list_lores`, `openrp_list_lore_characters`, `openrp_list_character_lores`, `openrp_get_lore`, `openrp_create_lore`, `openrp_update_lore`, `openrp_delete_lore`
4. **Character Studio & Factions** (9 tools): `openrp_list_characters`, `openrp_list_character_groups`, `openrp_create_character_group`, `openrp_update_character_group`, `openrp_delete_character_group`, `openrp_get_character`, `openrp_create_character`, `openrp_update_character`, `openrp_delete_character`
5. **Prompt Template System** (4 tools): `openrp_list_prompts`, `openrp_get_prompt`, `openrp_create_prompt`, `openrp_delete_prompt`
6. **Behavior Pipeline Engine** (16 tools): `openrp_list_behaviors`, `openrp_get_behavior`, `openrp_render_behavior_mermaid`, `openrp_beautify_graph`, `openrp_scaffold_behavior_graph`, `openrp_update_behavior`, `openrp_edit_behavior_node`, `openrp_deploy_behavior`, `openrp_delete_behavior`, `openrp_attach_behavior_to_character`, `openrp_list_character_behaviors`, `openrp_detach_behavior_from_character`, `openrp_list_character_group_behaviors`, `openrp_attach_behavior_to_character_group`, `openrp_detach_behavior_from_character_group`, `openrp_execute_behavior_debug`
7. **Behavior Executions & Debugging** (4 tools): `openrp_search_behavior_executions`, `openrp_get_behavior_execution`, `openrp_get_behavior_node_executions`, `openrp_test_and_heal_behavior`
8. **Chat & Live Messaging** (5 tools): `openrp_create_chat`, `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message`
9. **Discovery, AI Models & Universal Gateway** (4 tools): `openrp_list_models`, `openrp_discover_worlds`, `openrp_raw_api`, `openrp_sync_skills`

---

### Category 1: Authentication & Profile
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_auth` | *(none)* | Triggers the CLI interactive authentication flow |
| `openrp_web_login` | *(none)* | Launches the local Quantum Auth Bridge on port 45678 for 1-click browser login |
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
| `openrp_render_behavior_mermaid` | `behaviorId` | Renders a complex JSON behavior graph into a Mermaid.js diagram for easy visual debugging. |
| `openrp_beautify_graph` | `behaviorId`, `userId?`, `worldId?` | Analyzes a messy graph and automatically re-calculates all X/Y coordinates using a DAG layout algorithm to make it neat. |
| `openrp_scaffold_behavior_graph` | `blueprint`, `name?`, `systemPrompt?`, `keyword?`, `variableName?`, `cronExpression?`, `targetUrl?`, `modelId?`, `autoDeploy?`, `behaviorId?`, `userId?`, `worldId?`, `characterId?` | Generates a verified, schema-compliant Behavior Graph from standard blueprints with auto-layout coordinates |
| `openrp_update_behavior` | `userId?`, `worldId?`, `behaviorId`, `name?`, `handle?`, `graph` | In-place update of an existing Behavior Graph without losing character bindings |
| `openrp_edit_behavior_node` | `userId?`, `worldId?`, `behaviorId`, `nodeId`, `nodeData` | Granular in-place edit of a single node's data/expressions |
| `openrp_deploy_behavior` | `userId?`, `worldId?`, `characterId?`, `name`, `handle`, `graph`, `deleteOldBehaviors?` | Atomic deployment and auto-binding of a behavior graph to a character |
| `openrp_delete_behavior` | `userId?`, `worldId?`, `behaviorId` | Deletes a behavior pipeline from a world |
| `openrp_attach_behavior_to_character` | `characterId?`, `behaviorId` | Binds a behavior pipeline to an active character |
| `openrp_list_character_behaviors` | `characterId?` | Lists all behavior graphs currently attached to a character |
| `openrp_detach_behavior_from_character` | `characterId?`, `behaviorId` | Detaches a specific behavior from a character |
| `openrp_list_character_group_behaviors` | `groupId` | Lists behaviors attached to a character group |
| `openrp_attach_behavior_to_character_group` | `groupId`, `behaviorId` | Binds a behavior pipeline to a character group |
| `openrp_detach_behavior_from_character_group` | `groupId`, `behaviorId` | Detaches a specific behavior from a character group |
| `openrp_execute_behavior_debug` | `behaviorId`, `chatId?`, `triggerMessageId?` | Executes a behavior pipeline manually for testing |

### Category 7: Behavior Executions & Debugging Traces
| Tool Name | Parameters | Purpose |
|---|---|---|
| `openrp_search_behavior_executions` | `limit?`, `behaviorId?`, `chatId?`, `status?` | Searches execution history runs (`COMPLETED`, `FAILED`, etc.) |
| `openrp_get_behavior_execution` | `executionId` | Retrieves execution summary, timestamps, trigger message, and status |
| `openrp_get_behavior_node_executions` | `executionId` | Retrieves step-by-step resolved node execution traces, inputs, outputs, and errors |
| `openrp_test_and_heal_behavior` | `chatId`, `message?`, `maxWaitMs?` | Autonomous QA tool that sends a test message, monitors execution status, and extracts failing node error diagnostics for automatic hotfixing |

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
| `openrp_sync_skills` | `targetDir?` | Synchronize latest OpenRP skill definitions to active AI agent directories |
