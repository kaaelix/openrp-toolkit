# Behavior Nodes Specification & Port Wiring Reference

## 1. Engine Execution Model & Topological Scheduling

- **Trigger**: Every behavior pipeline starts execution from a single Event Node (e.g. `events/chat_message`, `events/cron`). Exactly one event node is allowed per graph.
- **Topological Traversal**: The OpenRP execution engine resolves nodes in directed acyclic graph (DAG) topological order. Downstream nodes are executed only after all upstream dependencies have resolved with status `BEHAVIOR_EXECUTION_STATUS_COMPLETED`.
- **Data Transport**: Downstream nodes access upstream output payloads using Template Strings (`{{ nodeId.property }}`) or JEXL Expressions (`nodeId.property`).
- **Global Variables**: Defined via `storage/set_variable` and accessed globally during graph execution via `$variables.variableName` or `{{ $variables.variableName }}`.

---

## 2. Complete Port Handle & Edge Wiring Standard

All ReactFlow edges in OpenRP MUST follow the strict edge ID format:
`xy-edge__<sourceNodeId><sourceHandle>-<targetNodeId><targetHandle>`

### Port Handle Name Reference Table:

| Node Type | Allowed Source Handles (Outputs) | Allowed Target Handles (Inputs) | Description / Notes |
| :--- | :--- | :--- | :--- |
| **Standard Nodes** (AI, Storage, Utilities, Events) | `next` | `previous` | Standard linear pipeline flow. |
| **`control_flow/if`** | `true`, `false` | `previous` | Branches based on boolean `condition`. |
| **`control_flow/end_if`** | `next` | `in1`, `in2` | Merges branches from an `if` block. Requires `lcaNodeId`. |
| **`control_flow/split`** | `out1`, `out2`, `out3`, `out4` | `previous` | Parallel branch splitting. Number of outputs matches `outputCount`. |
| **`control_flow/sync`** | `next` | `in1`, `in2`, `in3`, `in4` | Barrier synchronization. Waits for all inputs to complete. Requires `lcaNodeId`. |
| **`control_flow/repeat_until`** | `loopStart`, `next` | `previous`, `loopEnd` | Loop control. `loopStart` starts body; last node in body connects `next` -> `loopEnd`. `next` handle exits loop when condition is met. |
| **`control_flow/try`** | `success`, `error` | `previous` | Error isolation boundary. Succeeded nodes flow from `success`; unhandled crashes route to `error`. |
| **`control_flow/wait`** | `next` | `previous` | Pauses execution for `duration` milliseconds. |

---

## 3. Why Nodes Disconnect or Fail to Reach Downstream Nodes (The 5 Core Failure Modes)

When designing or debugging Behavior Graphs in OpenRP, nodes frequently appear disconnected or unexecuted due to one of the following 5 root causes:

### 🔴 Failure Mode 1: Edge Port Handle Typos & Mismatches
* **Symptom**: Nodes are visibly linked in the canvas, but the engine ignores the link and terminates execution early.
* **Root Cause**:
  * Using `sourceHandle: "next"` on an `if` node (MUST be `true` or `false`).
  * Using `sourceHandle: "output_0"` / `output_1` on a `split` node (MUST be `out1`, `out2`, `out3`).
  * Using `targetHandle: "input_0"` / `input_1` on a `sync` node (MUST be `in1`, `in2`, `in3`).
  * Using `sourceHandle: "next"` on `repeat_until` for the loop body (MUST be `sourceHandle: "loopStart"` and returned to `targetHandle: "loopEnd"`).
  * Using `sourceHandle: "next"` on `control_flow/try` without handling `error`.

### 🔴 Failure Mode 2: Missing `lcaNodeId` on Convergence Nodes (`sync` & `end_if`)
* **Symptom**: The parallel or conditional branches run, but the `sync` or `end_if` node stays pending forever and never triggers downstream nodes.
* **Root Cause**:
  * In the OpenRP DAG scheduler, `control_flow/sync` and `control_flow/end_if` nodes **MUST specify `lcaNodeId`** pointing to the originating `control_flow/split` or `control_flow/if` node ID (e.g. `"lcaNodeId": "splitNode1"`).
  * Without `lcaNodeId`, the barrier synchronization algorithm cannot evaluate if all parallel paths originated from the same ancestor, preventing the barrier from unlocking.

### 🔴 Failure Mode 3: Upstream Unhandled Runtime Crash Halts Traversal
* **Symptom**: Step 8 succeeds, but Step 9 and all downstream nodes never execute.
* **Root Cause**:
  * In OpenRP, if any node fails with status `BEHAVIOR_EXECUTION_STATUS_FAILED` (e.g., Zod validation error, invalid input type, missing required field), the execution engine **instantly halts all further DAG progression**.
  * Downstream nodes are never reached.
  * **Solution**: Wrap risky or fallible nodes (like external LLM calls or complex filters) inside a `control_flow/try` block with an active fallback route connected to the `error` handle.

### 🔴 Failure Mode 4: JEXL Context Unwrapping & Undefined Expression Access
* **Symptom**: Node throws `Expected type: array, but received: undefined` or `Invalid input`.
* **Root Cause**:
  * OpenRP auto-unwraps top-level `output.data` into the global expression scope for storage nodes.
  * Accessing `getChat.data.participants.data` (with extra `.data.`) returns `undefined`.
  * The correct path for `storage/get_chat` is `chat.participants.data` and `chat.messages.data.reverse()`.
  * Passing `undefined` to strict Zod schemas causes the node to crash immediately, severing downstream flow.

### 🔴 Failure Mode 5: Node Schema & Parameter Name Contract Mismatches
* **Symptom**: Node throws Zod validation `invalid_type` or `missing_property`.
* **Critical Invariants**:
  1. `storage/update_typing_status`: Parameter MUST be **`participantId`** (NEVER `chatParticipantId`).
  2. `storage/insert_chat_message`: Parameter MUST be **`chatParticipantId`** (NEVER `participantId`).
  3. `storage/get_lores`: Parameter MUST include **`worldId`** (e.g. `worldId: { "$expression": "character.worldId" }`).
  4. `ai/count_tokens`: Parameter MUST include **`tokenizer`** (e.g. `tokenizer: "TOKENIZER_LLAMA3"`).
  5. `utilities/filter`: `itemCondition` MUST be `{ "$expression": "..." }`.
  6. `utilities/map`: `itemTemplate` MUST be `{ "$template": "..." }` or `{ "$expression": "..." }` (NEVER `itemExpression`).
  7. `utilities/join`: Output property is **`joinNode.text`** (NEVER `.string`).

---

## 4. Complete Node Catalog (39 Nodes)

### A. Events (2 Nodes)
* `events/chat_message`: Output `next`. Output: `{ chatId, messageId }`.
* `events/cron`: Output `next`. Config: `cronExpression`. Output: `{ timestamp }`.

### B. AI & Generation (8 Nodes)
* `ai/llm`: Ports `previous` -> `next`. Inputs: `modelId`, `messages`, `stream`, `temperature`, `maxTokens`. Output: `{ outputText, finishReason, usage }`.
* `ai/generate_embeddings`: Ports `previous` -> `next`. Input: `content`. Output: `{ embedding: number[] }`.
* `ai/get_default_model`: Ports `previous` -> `next`. Output: `{ id, name, provider, tokenizer, contextWindow }`.
* `ai/get_model`: Ports `previous` -> `next`. Input: `modelId`. Output: model details.
* `ai/get_models`: Ports `previous` -> `next`. Output: list of models.
* `ai/count_tokens`: Ports `previous` -> `next`. Inputs: `text`, `tokenizer`. Output: `{ tokenCount }`.
* `ai/prune_text`: Ports `previous` -> `next`. Inputs: `text`, `maxTokens`, `tokenizer`. Output: `{ prunedText }`.
* `ai/read_llm_stream`: Ports `previous` -> `next`. Output: `{ chunk, isFinished }`.

### C. Control Flow (7 Nodes)
* `control_flow/if`: Input `previous`, Outputs `true`, `false`. Input: `condition`.
* `control_flow/end_if`: Inputs `in1`, `in2`, Output `next`. Requires `lcaNodeId`.
* `control_flow/split`: Input `previous`, Outputs `out1`, `out2`, ... Input: `outputCount`.
* `control_flow/sync`: Inputs `in1`, `in2`, ..., Output `next`. Input: `inputCount`, Requires `lcaNodeId`.
* `control_flow/repeat_until`: Inputs `previous`, `loopEnd`, Outputs `loopStart`, `next`. Input: `condition`.
* `control_flow/try`: Input `previous`, Outputs `success`, `error`. Error isolation boundary.
* `control_flow/wait`: Input `previous`, Output `next`. Input: `duration` (ms).

### D. Storage & Database (14 Nodes)
* `storage/get_chat`: Input `previous`, Output `next`. Inputs: `chatId`, `expand` (`["participants", "messages"]`).
* `storage/get_chat_message`: Input `previous`, Output `next`. Input: `messageId`.
* `storage/get_chat_messages`: Input `previous`, Output `next`. Inputs: `chatId`, `limit`, `order`.
* `storage/get_chat_participant`: Input `previous`, Output `next`. Input: `participantId`.
* `storage/get_character`: Input `previous`, Output `next`. Input: `characterId`. Output: `{ id, name, personality, description, worldId }`.
* `storage/get_characters`: Input `previous`, Output `next`. Input: `worldId`.
* `storage/get_lores`: Input `previous`, Output `next`. Inputs: `worldId` (required), `limit`, `semanticQuery`. Output: `{ data: Lore[] }`.
* `storage/insert_chat_message`: Input `previous`, Output `next`. Inputs: `chatId`, `chatParticipantId` (required), `content`.
* `storage/update_typing_status`: Input `previous`, Output `next`. Inputs: `participantId` (required), `isTyping` (boolean).
* `storage/broadcast_failed_chat_message`: Input `previous`, Output `next`. Inputs: `chatId`, `participantId`, `content`.
* `storage/set_variable`: Input `previous`, Output `next`. Input: `variables: [{ key: { $template: "name" }, value: { $expression: "..." } }]`.
* `storage/get_variable`: Input `previous`, Output `next`. Input: `key`.
* `storage/delete_variable`: Input `previous`, Output `next`. Input: `key`.

### E. Utilities (8 Nodes)
* `utilities/filter`: Ports `previous` -> `next`. Inputs: `list`, `itemCondition: { "$expression": "..." }`. Output: `{ list }`.
* `utilities/map`: Ports `previous` -> `next`. Inputs: `list`, `itemTemplate: { "$template": "..." }` or `{ "$expression": "..." }`. Output: `{ list }`.
* `utilities/join`: Ports `previous` -> `next`. Inputs: `list`, `separator`. Output: `{ text }` (NEVER `.string`).
* `utilities/string_split`: Ports `previous` -> `next`. Inputs: `text`, `separator`. Output: `{ array }`.
* `utilities/append`: Ports `previous` -> `next`. Inputs: `list`, `item`. Output: `{ list }`.
* `utilities/slice`: Ports `previous` -> `next`. Inputs: `list`, `start`, `end`. Output: `{ list }`.
* `utilities/merge`: Ports `previous` -> `next`. Inputs: `list1`, `list2`. Output: `{ list }`.
* `utilities/length`: Ports `previous` -> `next`. Input: `list`. Output: `{ length }`.
