# Testing & Diagnostics Runbook

## 0. Behavior Testing Prerequisites & World Scoping

Before testing any Behavior Graph or initiating live chat messages:

1. **Strict World & Character Co-Location**:
   * The testing character (`characterId`) **MUST reside in the exact same World (`worldId`)** where the behavior graph is defined.
   * Testing with a character from a different world will fail to resolve world lore vector embeddings, custom variables, and permission contexts.
2. **Mandatory Behavior Binding Prerequisite**:
   * The behavior graph **MUST already be attached/set to the character** (via `openrp_deploy_behavior` with `characterId` or `openrp_attach_behavior_to_character`).
   * If the behavior is not attached, OpenRP will route incoming messages through the standard fallback LLM chat without triggering the behavior pipeline graph.

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

### A. List & Search Behavior Executions
* **MCP Tool**: `openrp_search_behavior_executions`
* **REST Route**: `POST /api/v1/behavior-executions/search`
* **Body**:
  ```json
  {
    "limit": 10,
    "behaviorId": "01a042b9-c601-7107-bdf4-809118d53db2",
    "status": "BEHAVIOR_EXECUTION_STATUS_COMPLETED"
  }
  ```

### B. Retrieve Execution Summary
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
- Root Cause 2: Mismatched Route IDs. Providing a `userId` in the URL path that does not match the owner ID of the target `worldId`.
- Resolution: Call `openrp_set_auth` with fresh cookies or token, and verify that `userId` matches the world creator.

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

### E. HTTP 400: Bad Request
- Root Cause: Invalid JSON payload or missing mandatory schema properties (e.g. `name`, `handle`, or invalid port configurations).
- Resolution: Verify request arguments against schema requirements.

## 5. Behavior Engine Runtime Errors

### A. Error: Failed to evaluate expression ... Expected comma
- Cause: The expression contains a JavaScript Regular Expression literal (e.g. `/[1-9]/`).
- Fix: Replace regex with standard string methods (e.g. `str.indexOf('1') !== -1 ? '1' : ...`).

### B. Error: Expression is not a function
- Cause: Calling a string method on an `undefined` variable, typically when accessing a variable created in the same `set_variable` node before evaluation finishes.
- Fix: Split dependent variable calculations into consecutive `storage/set_variable` nodes.

### C. Sync Node Hanging Indefinitely
- Cause: A `control_flow/sync` barrier was connected to branches originating from an `if` node. Because only one branch ever runs, the barrier waits forever for the skipped branch.
- Fix: Use `control_flow/end_if` to merge `if` branches; reserve `sync` exclusively for merging `split` parallel branches.
