# Testing & Diagnostics Runbook

## 0. Behavior Testing Prerequisites & World Scoping

Before testing any Behavior Graph or initiating live chat messages:

1. **Strict World & Character Co-Location**:
   * The testing character (`characterId`) **MUST reside in the exact same World (`worldId`)** where the behavior graph is defined.
   * Testing with a character from a different world will fail to resolve world lore vector embeddings, custom variables, and permission contexts.
2. **Mandatory Behavior Binding Prerequisite**:
   * The behavior graph **MUST already be attached/set to the character** (via `openrp_deploy_behavior` with `characterId` or `openrp_attach_behavior_to_character`).
   * If the behavior is not attached, OpenRP will route incoming messages through the standard fallback LLM chat without triggering the behavior pipeline graph.
3. **Chatroom Session Architecture & Trigger Flow**:
   * When a message is sent via `POST /api/chats/{chatId}/messages`, OpenRP identifies all character participants in the room.
   * For each character with an attached behavior, OpenRP instantiates an execution run (`events/chat_message`).
   * The resulting message emitted by `storage/insert_chat_message` includes the `metadata.behaviorExecutionIds` containing the exact run UUID for live tracing.

---

## 1. Editor Execution Modes

1. Build Mode: Default graph composition canvas for adding nodes, defining expressions, and wiring edges.
2. Debug Mode: Real-time execution visualizer displaying live step status badges (Success, Failed, Skipped), run duration, and exact resolved inputs and outputs for every node.

---

## 2. Manual Trigger Testing in Editor

Behaviors can be tested directly within the visual editor without needing to open an active chatroom:

### Step-by-Step Execution:
1. Open the World Behavior Editor on OpenRP.
2. Click the root `events/chat_message` node.
3. In the Inspector pane, scroll down to the Manual Test section.
4. Provide a sample JSON test payload:
   ```json
   {
     "chatId": "019ee8d0-ee75-770f-867d-370299c1b900",
     "messageId": "019ee8d4-4392-72d9-8b86-19b1e5619833"
   }
   ```
   (To obtain these IDs, copy the trailing UUID from any chatroom URL `/chats/<chatId>`, or click View Metadata on any chat message to get `messageId`).
5. Click Run Trigger Test.
6. The editor immediately transitions to Debug Mode, highlighting active node states and resolved variable payloads in real time.

---

## 3. Programmatic Execution Tracing & MCP Debugging Tools

AI agents and automated testing scripts can query and inspect behavior execution traces programmatically via MCP or REST:

### A. List & Search Behavior Executions (By Behavior, Chat, or Direct IDs)
* **MCP Tool**: `openrp_search_behavior_executions`
* **REST Route**: `POST /api/v1/behavior-executions/search`
* **Direct IDs Batch Query (From `ChatMessage.metadata.behaviorExecutionIds`)**:
  ```json
  {
    "ids": [
      "01a046aa-2ba8-72af-8ba4-c5cf556d5b2e",
      "01a046aa-2bd2-7300-b7d5-941bc34c4472"
    ]
  }
  ```
* **Filter Query**:
  ```json
  {
    "limit": 10,
    "behaviorId": "01a042b9-c601-7107-bdf4-809118d53db2",
    "chatId": "01a046a9-3e8e-7065-bf69-e04b8b4338b3",
    "status": "BEHAVIOR_EXECUTION_STATUS_COMPLETED"
  }
  ```

### B. Message-to-Execution Tracing Workflow
Every chat message returned by `GET /api/chats/{chatId}/messages` or `storage/get_chat_messages` contains a `metadata.behaviorExecutionIds` array:
1. Extract execution IDs: `const executionIds = message.metadata.behaviorExecutionIds;`
2. Fetch execution metadata & graph snapshots in batch:
   `POST /api/v1/behavior-executions/search` with `{ "ids": executionIds }`
3. Fetch full step-by-step node execution traces:
   `GET /api/v1/behavior-executions/{executionId}/node-executions`

### C. Retrieve Execution Summary
* **MCP Tool**: `openrp_get_behavior_execution`
* **REST Route**: `GET /api/v1/behavior-executions/{executionId}`
* **Emits**: High-level execution status, started/finished timestamps, error codes, and graph snapshot.

### C. Retrieve Step-by-Step Node Execution Traces
* **MCP Tool**: `openrp_get_behavior_node_executions`
* **REST Route**: `GET /api/v1/behavior-executions/{executionId}/node-executions`
* **Emits**: Complete node-by-node runtime execution trace:
  - Exact resolved node `inputs`
  - Exact emitted node `outputs`
  - Runtime execution `status` (`NODE_EXECUTION_STATUS_COMPLETED`, `NODE_EXECUTION_STATUS_FAILED`, `SKIPPED`)
  - Execution duration in milliseconds.
  - Complete error stack trace if a node failed.

---

## 4. Live Chat Execution Tracing in UI

Every message generated in OpenRP contains an execution trace link:
1. Hover or long-press on any character message bubble in the web interface.
2. Click View Metadata.
3. In the modal dialog, copy the Execution URL or click the link.
4. The Behavior Editor will open the exact historical execution snapshot that generated that specific message.

---

## 4. Complete HTTP Status & Error Code Troubleshooting

### A. HTTP 500: Internal Server Error (`{"code": "internal_server_error"}`)
- Root Cause 1: Expired Supabase JWT signature. OpenRP returns a 500 error on `/api/users/me` or `/api/users/{userId}/...` when an expired access token is presented.
- Root Cause 2: Unauthenticated / Missing MCP Credentials. When `~/.openrp_mcp_auth.json` is empty or no valid JWT is loaded into MCP server state, public endpoints (`/api/models`, `/api/worlds/discover`) and authenticated endpoints return HTTP 500 (`code: internal_server_error`).
- Root Cause 3: Missing `userId` in payload. When creating a World or Character without setting `userId` in `openrp_set_auth` or in tool arguments, MCP rejects the request with `{ error: true, message: "userId is required" }`.
- Resolution: Execute `openrp_set_auth({"token": "...", "userId": "...", "refreshToken": "..."})` with valid credentials, or use the interactive `openrp-toolkit auth` command.

### B. HTTP 401: Unauthorized
- Root Cause: Missing Authorization header, invalid token format, or expired refresh token.
- Resolution: Refresh via `openrp_refresh_token` or extract fresh cookies from `openrp.ai` in browser DevTools.

### C. HTTP 403: Forbidden
- Root Cause 1: Access Tier Constraint. Attempting to create or update a World with `"visibility": "private"` using a Free account (Free accounts only permit `"public"` and `"unlisted"`).
- Root Cause 2: Resource Ownership. Attempting to edit or delete characters, lore, or behaviors belonging to another user's world.
- Resolution: Switch visibility to `"unlisted"` or upgrade the account to Pro.

### D. HTTP 404: Not Found
- Root Cause: Target resource ID (`worldId`, `characterId`, `loreId`, or `behaviorId`) does not exist or was deleted.
- Resolution: Use listing tools (`openrp_list_my_worlds`, `openrp_list_characters`, `openrp_list_lores`, `openrp_list_behaviors`) to obtain valid UUIDs.

### E. HTTP 400: Bad Request (`{"code": "bad_request_body"}`)
- Root Cause 1: Mismatched User ID in URL route. Supplying the OpenRP platform account ID (`019f4c49-...` / UUIDv7) instead of the Supabase Auth UID (`0d24041d-...` / UUIDv4) in `/api/users/{userId}/...` routes.
- Root Cause 2: Missing Character Arrays. Omitting `dialogs: []` or `greetings: []` in character creation payloads.
- Root Cause 3: Invalid JSON or malformed ReactFlow graph payload.
- Resolution: Ensure route URLs use the Supabase Auth UID (`0d24041d-...`), and character payloads include explicit empty arrays for `dialogs` and `greetings`.

## 5. Behavior Engine Runtime Traces: COMPLETED vs FAILED

### A. Real-World `BEHAVIOR_EXECUTION_STATUS_COMPLETED` Trace Anatomy
When a behavior graph executes successfully, every node is marked `BEHAVIOR_EXECUTION_STATUS_COMPLETED` and emits a rich output payload:

```json
{
  "id": "01a042e6-83fe-733b-bd2a-c0a0b1437252",
  "executionId": "01a042e6-7f5a-75ea-a2da-2756ed0a2cf5",
  "nodeId": "insertChatMessage",
  "iteration": 0,
  "globalIteration": 21,
  "status": "BEHAVIOR_EXECUTION_STATUS_COMPLETED",
  "output": {
    "data": {
      "id": "01a042e6-8412-7044-a4b6-a441fc870eb4",
      "chatId": "01a042a8-9371-72c9-a666-4b2e474006e3",
      "status": "SENT",
      "content": "![](https://game-liart-nine-49.vercel.app/api/tictactoe?b=O2O4O6XXX&d=e&p=X)\n\n### TIC-TAC-TOE\n**Player (X)** vs **Bot (O)**\n\n[VICTORY] You connected 3 in a row! Pick a spot (1-9) or type reset to play again."
    }
  },
  "history": {
    "chatMessage": ["01a042e6-7f64-70b3-bb30-3b66733665c7"],
    "getChatMessage": ["01a042e6-7f65-73a9-bef9-9a2818f3669c"],
    "filterReplyingParticipant": ["01a042e6-7f8e-74dd-898e-60f8737297fc"],
    "setVariablePlayerWon": ["01a042e6-800f-7247-8a1c-40cda0b194ca"]
  },
  "startedAt": "2026-08-27T11:06:38.450Z",
  "finishedAt": "2026-08-27T11:06:38.528Z"
}
```

* **`globalIteration`**: Monotonically increasing execution step counter (1 to N) confirming DAG topological sort order.
* **`history`**: Complete upstream dependency map linking every parent node execution that provided runtime input to this node.
* **`startedAt` / `finishedAt`**: Millisecond timestamps for profiling execution bottlenecks.

---

### B. Real-World `BEHAVIOR_EXECUTION_STATUS_FAILED` Trace Anatomy
When an error occurs during execution, the failing node terminates and emits detailed failure diagnostics:

#### Example 1: JEXL Syntax Error (Illegal Regex in Expression)
```json
{
  "id": "01a046a1-9102-7102-bc32-11a22b33c44d",
  "executionId": "01a046a1-8f55-7221-a123-456789abcdef",
  "nodeId": "evaluatePlayerMove",
  "iteration": 0,
  "globalIteration": 8,
  "status": "BEHAVIOR_EXECUTION_STATUS_FAILED",
  "error": {
    "code": "JEXL_SYNTAX_ERROR",
    "message": "Failed to evaluate expression: getChatMessage.content.match(/[1-9]/) -> Expected comma or closing bracket at position 31",
    "nodeId": "evaluatePlayerMove",
    "nodeType": "storage/set_variable"
  },
  "output": null,
  "startedAt": "2026-08-28T04:12:00.100Z",
  "finishedAt": "2026-08-28T04:12:00.105Z"
}
```
* **Root Cause**: JEXL parser does not support JavaScript regex literals (`/[1-9]/`).
* **Fix**: Use `.indexOf()` or string slicing: `getChatMessage.content.indexOf('1') !== -1 ? '1' : ...`.

#### Example 2: External HTTP Request Timeout (`utilities/http_request`)
```json
{
  "id": "01a046a2-1122-7334-9988-aabbccddeeff",
  "executionId": "01a046a2-0011-7445-bcde-f0123456789a",
  "nodeId": "fetchExternalGameState",
  "iteration": 0,
  "globalIteration": 12,
  "status": "BEHAVIOR_EXECUTION_STATUS_FAILED",
  "error": {
    "code": "HTTP_REQUEST_TIMEOUT",
    "message": "HTTP request to https://api.game-server.com/state timed out after 30000ms",
    "nodeId": "fetchExternalGameState",
    "nodeType": "utilities/http_request"
  },
  "output": null,
  "startedAt": "2026-08-28T04:15:00.000Z",
  "finishedAt": "2026-08-28T04:15:30.002Z"
}
```
* **Root Cause**: Upstream endpoint failed to respond within OpenRP's 30-second hard timeout.
* **Fix**: Wrap `utilities/http_request` in a `control_flow/try` node to route timeouts to a fallback recovery branch.

#### Example 3: Missing or Undefined Participant ID in Message Dispatch
```json
{
  "id": "01a046a3-4455-7667-8899-0123456789ab",
  "executionId": "01a046a3-3344-7778-9abc-def012345678",
  "nodeId": "sendBotReply",
  "iteration": 0,
  "globalIteration": 19,
  "status": "BEHAVIOR_EXECUTION_STATUS_FAILED",
  "error": {
    "code": "BAD_REQUEST_BODY",
    "message": "Validation failed: chatParticipantId is required and cannot be null",
    "nodeId": "sendBotReply",
    "nodeType": "storage/insert_chat_message"
  },
  "output": null
}
```
* **Root Cause**: `filterBot.list[0].id` evaluated to `undefined` because the filter condition `item.userId === null` did not match any participants.
* **Fix**: Verify room participants with `expand: ["participants"]` on `storage/get_chat` and check filter condition `item.userId === null || item.characterId !== null`.

---

### C. Resilient Error Boundary Pattern with `control_flow/try`

To prevent behavior crashes when external APIs or LLMs encounter transient failures:

```
[Incoming Trigger]
       │
       ▼
 [control_flow/try] ────────────────────────────────────────┐
       │                                                    │
 (success port)                                       (error port)
       │                                                    │
       ▼                                                    ▼
[utilities/http_request]                           [storage/broadcast_failed_chat_message]
       │                                                    │
       ▼                                                    ▼
[storage/insert_chat_message]                      [storage/insert_chat_message (Fallback)]
 "Success: API data returned"                       "Notice: Server is offline, using cache"
```

1. **`control_flow/try` outputs**:
   * `success`: Continues normal execution path if all downstream nodes in the protected block succeed.
   * `error`: Emits `error: { code, message, nodeId, nodeType }` if any protected node fails.
2. **Fallback Node (`storage/broadcast_failed_chat_message`)**:
   * Notifies the chatroom with an ephemeral error code without crashing the session.
   * Allows the bot to gracefully apologize or fallback to cached state.
