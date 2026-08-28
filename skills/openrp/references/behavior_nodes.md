# Behavior Nodes Specification

## 1. Engine Execution Model

- Trigger: Every behavior pipeline starts execution from a single Event Node. Exactly one event node is allowed per graph.
- Data Transport: Downstream nodes access upstream output payloads using Template Strings (`{{ nodeId.property }}`) or Expressions (`nodeId.property`).
- State Variables: Persistent variables are defined via `storage/set_variable` and accessed globally during graph execution via `$variables.variableName` or `{{ $variables.variableName }}`.
- Port Conventions:
  - Standard linear flow: Output `next` -> Input `previous`
  - Condition flow: Outputs `true`, `false` -> Input `previous`
  - Condition merge: Outputs `next` -> Inputs `in1`, `in2` on `end_if`
  - Parallel execution: Outputs `out1`, `out2`, ... on `split` -> Input `previous`
  - Barrier synchronization: Outputs `next` -> Inputs `in1`, `in2`, ... on `sync`
  - Loop iteration: Output `loopStart` -> Input `previous`, and Output `next` on last loop node -> Input `loopEnd`
  - Loop exit: Output `next` on `repeat_until` -> Input `previous` on downstream node
  - Error isolation: Outputs `success`, `error` -> Input `previous`

---

## 2. Complete 37 Node Catalog

### A. Events (2 Nodes)

#### events/chat_message
- Description: Triggered when a message is sent in an active chatroom containing this character.
- Port: Output `next`
- Output Payload:
  - `chatId` (string, UUID): Identifier of the active chatroom.
  - `messageId` (string, UUID): Identifier of the incoming message.

#### events/cron
- Description: Scheduled execution triggered on a CRON schedule.
- Port: Output `next`
- Configuration: `cronExpression` (string, standard 5-part cron syntax).
- Output Payload: `timestamp` (string, ISO 8601).

---

### B. AI & Generation (8 Nodes)

#### ai/llm
- Description: Invokes an LLM to generate completions or structured JSON objects.
- Ports: Input `previous` | Output `next`
- Configuration Inputs:
  - `modelId` (string, static or expression)
  - `systemPrompt` (string, template supported)
  - `temperature` (number, range: 0.0 to 2.0, default: 0.7)
  - `jsonMode` (boolean, default: false)
- Output Payload:
  - `outputText` (string): Completion result.
  - `finishReason` (string): "stop", "length", or "tool_calls".
  - `usage` (object: promptTokens, completionTokens, totalTokens).

#### ai/generate_embeddings
- Description: Calls the AI embeddings API to generate a vector representation of the provided text content for semantic searches.
- Ports: Input `previous` | Output `next`
- Configuration Inputs:
  - `content` (string, required): Text content to generate an embedding vector for.
- Output Payload:
  - `embedding` (number[]): Array of floating point numbers representing the embedding vector.

#### ai/get_default_model
- Description: Retrieves default active model configuration.
- Ports: Input `previous` | Output `next`
- Configuration Inputs:
  - `preferredModelId` (string, optional): Specific model ID to prioritize if available.
- Output Payload: `id` (string), `name` (string), `provider` (string), `contextWindow` (number).

#### ai/get_model & ai/get_models
- Description: Inspects specific model details or lists all available models.
- Ports: Input `previous` | Output `next`
- Inputs (`get_model`): `modelId` (string).
- Output Payload: Model configuration objects including context windows and token limits.

#### ai/count_tokens
- Description: Computes exact token count of input text for a given tokenizer.
- Ports: Input `previous` | Output `next`
- Inputs: `text` (string), `tokenizer` (string, e.g. "cl100k_base").
- Output Payload: `tokenCount` (number).

#### ai/prune_text
- Description: Truncates text to fit strictly within a specified token ceiling.
- Ports: Input `previous` | Output `next`
- Inputs: `text` (string), `maxTokens` (number), `tokenizer` (string).
- Output Payload: `prunedText` (string).

#### ai/read_llm_stream
- Description: Sequentially consumes streaming chunks from an active LLM generation.
- Ports: Input `previous` | Output `next`
- Output Payload: `chunk` (string), `isFinished` (boolean).

---

### C. Control Flow (7 Nodes)

#### control_flow/if
- Description: Conditional branch evaluation routing to true or false paths.
- Ports: Input `previous` | Outputs `true`, `false`
- Inputs: `condition` (boolean expression).

#### control_flow/end_if
- Description: Merges execution branches originating from the same `if` node.
- Ports: Inputs `in1`, `in2` | Output `next`

#### control_flow/split
- Description: Forks pipeline into multiple concurrent execution paths.
- Ports: Input `previous` | Outputs `out1`, `out2`, `out3`, ...

#### control_flow/sync
- Description: Synchronization barrier that blocks until all parallel branches from a `split` node arrive.
- Ports: Inputs `in1`, `in2`, ... | Output `next`

#### control_flow/repeat_until
- Description: While loop control node. Repeatedly executes body while condition is true.
- Ports: Inputs `previous`, `loopEnd` | Outputs `loopStart`, `next`
- Inputs: `condition` (boolean expression), `checkConditionBeforeRunning` (boolean).

#### control_flow/wait
- Description: Pauses execution for a designated duration.
- Ports: Input `previous` | Output `next`
- Inputs: `seconds` (number).

#### control_flow/try
- Description: Error boundary. Routes successful execution to `success` and caught errors to `error`.
- Ports: Input `previous` | Outputs `success`, `error`

---

### D. Storage & Memory (14 Nodes)

#### storage/get_chat_message
- Description: Retrieves message payload and author metadata.
- Inputs: `messageId` (string), `expand` (array: ["attachments", "participant"]).
- Outputs: `content` (string), `chatId` (string), `chatParticipantId` (string).

#### storage/get_chat_messages
- Description: Fetches paginated history for a chatroom.
- Inputs: `chatId` (string), `limit` (integer), `startingAfter` / `endingBefore` (string).
- Outputs: `data` (array of Message objects), `hasMore` (boolean).

#### storage/get_chat
- Description: Retrieves chatroom details and participant memberships.
- Inputs: `chatId` (string), `expand` (array: ["participants", "messages"]).
- Outputs: `id` (string), `title` (string), `participants` ({ data: [Participant] }).

#### storage/get_chat_participant
- Description: Retrieves participant identity records.
- Inputs: `participantId` (string).
- Outputs: `id` (string), `userId` (string | null), `characterId` (string | null).

#### storage/get_character & storage/get_characters
- Description: Retrieves character definitions and system prompts.
- Outputs: `id`, `name`, `handle`, `personality`, `description`, `greetings`, `dialogs`.

#### storage/get_character_memories
- Description: Executes vector similarity search against a character's long-term memory store.
- Inputs: `characterId` (string), `query` (string), `limit` (integer), `minConfidence` (number).
- Outputs: `memories` (array of { content, similarity, createdAt }).

#### storage/get_lore & storage/get_lores
- Description: Retrieves world lore entries by identifier or semantic vector similarity.
- Inputs (`get_lores`): `worldId` (string), `semanticQuery` (number[]), `limit` (integer), `enableFilters` (bool).
- Outputs: `data` (array of { id, handle, title, content, isExclusive }).

#### storage/set_variable
- Description: Stores calculated variables into the graph state.
- Inputs: Array of `{ key: string, value: { $expression | $template } }`.

#### storage/get_variable
- Description: Reads a variable from the graph state store.
- Inputs: `variableName` (string).
- Outputs: `value` (any).

#### storage/insert_chat_message
- Description: Emits a new message into the chatroom on behalf of a participant.
- Inputs: `chatId` (string), `content` (string, template), `chatParticipantId` (string).
- Outputs: `insertedMessageId` (string).

#### storage/update_typing_status
- Description: Toggles the typing indicator animation in the chatroom UI.
- Inputs: `chatParticipantId` (string), `isTyping` (boolean).

#### storage/broadcast_failed_chat_message
- Description: Emits a non-persisted error alert in the chat UI.
- Inputs: `chatId` (string), `message` (string), `errorCode` (string).

---

### E. Utilities (7 Nodes)

#### utilities/filter
- Description: Filters an array with a predicate expression.
- Inputs: `list` (array expression), `itemCondition` (JEXL string, e.g. `item.userId === null`).
- Outputs: `list` (filtered array).

#### utilities/map
- Description: Transforms each element in an array.
- Inputs: `list` (array), `itemExpression` (JEXL expression, e.g. `item.name`).
- Outputs: `list` (transformed array).

#### utilities/append
- Description: Appends an item or concatenates arrays.
- Inputs: `list` (array), `item` (any).
- Outputs: `list` (updated array).

#### utilities/join & utilities/string_split
- Description: Converts an array to a delimited string, or splits a string into an array.
- Inputs (`join`): `list` (array), `separator` (string).
- Inputs (`string_split`): `string` (string), `separator` (string).

#### utilities/http_request
- Description: Dispatches an external HTTP request (GET, POST, PUT, DELETE). Timeout: 30 seconds.
- Inputs: `url` (string), `method` (string), `headers` (object), `body` (object/string).
- Outputs: `statusCode` (number), `data` (parsed payload), `headers` (object).

#### utilities/comment
- Description: Non-executing visual annotation on the editor canvas.
- Inputs: `text` (string).

---

## 3. Expression Rules & JEXL Syntax

### Allowed Constructs:
- String operations: `str.toLowerCase()`, `str.trim()`, `str.substring(start, length)`, `str.indexOf('token')`, `str.replace('old', 'new')`
- Array operations: `arr.length`, `arr[0]`, `['val1', 'val2'].indexOf(target) !== -1`
- Ternary logic: `condition ? ifTrue : ifFalse`
- Logical comparisons: `&&`, `||`, `!`, `===`, `!==`, `>`, `<`, `>=`, `<=`

### Parser Constraint:
Regular expression literals (`/[1-9]/`) are not supported by the JEXL parser and will throw a fatal syntax error. Use standard chained `.indexOf()` methods instead:

```javascript
// Correct sequential check:
input.indexOf('1') !== -1 ? '1' : input.indexOf('2') !== -1 ? '2' : 'none'
```

---

## 4. Visual Canvas Layout & Geometry Standard

To ensure behavior graphs are clean, human-readable, and well-organized on the OpenRP ReactFlow editor viewport:

```
Column 0 (Trigger)   Column 1 (Fork/Sync)   Column 2 (Storage)   Column 3 (AI/Logic)   Column 4 (Output)
(X = 100)            (X = 360)              (X = 640)            (X = 920)             (X = 1200)

[chat_message]
      │
[get_chat_message]
      │
[get_chat] ────────> [split]
                       ├──> [filter] ──> [get_participant] ──┐
                       └──> [filter] ──> [get_character]   ──┼──> [sync] ──> [llm] ──> [insert_message]
```

### Layout Coordinates Guide:
- **Base Grid Unit**: Column step $\Delta X = 220\text{px} - 260\text{px}$, Row step $\Delta Y = 130\text{px} - 150\text{px}$.
- **Sequential Nodes**: Increment $Y$ downwards for tight stages, then step $X$ right for major transitions.
- **Branch Symmetry**: Keep parallel branches equidistant from the centerline ($Y \pm 140\text{px}$).
- **Loop Positioning**: Place loop bodies directly offset above or below the controller node ($Y \pm 140\text{px}$).

---

## 5. Topological Continuity & Disconnection Repair

### Common Disconnection Causes & Fixes:
1. **Missing Edge Handle Prefix**:
   * *Problem*: Edge ID is defined as `"e1"` instead of `"xy-edge__<source><sourceHandle>-<target><targetHandle>"`.
   * *Fix*: Always prefix with `xy-edge__` followed by exact source and target port handles.
2. **Dangling Branch Nodes**:
   * *Problem*: The `false` branch of an `if` node or the `error` branch of a `try` node has no outgoing connection.
   * *Fix*: Route the branch to an `end_if` / merge barrier or terminate with a dedicated notification/toast node.
3. **Loop Body Disconnection**:
   * *Problem*: A `repeat_until` node connects to a loop body, but the end of the loop body does not route back to `loopEnd`.
   * *Fix*: Connect the final node inside the loop body with `sourceHandle: "next"` to `targetHandle: "loopEnd"` on the `repeat_until` node.
4. **Parallel Branch Orphan**:
   * *Problem*: A `split` node branches out to multiple paths, but one path is missing a connection to `sync.inX`.
   * *Fix*: Ensure every output port (`out1`, `out2`, ...) on `split` has a corresponding input port (`in1`, `in2`, ...) on `sync` with `lcaNodeId` configured.

---

## 6. Node Connectivity Classification (Mandatory, Optional, Fallback)

| Category | Node Types | Role / Connection Rules |
|---|---|---|
| **MANDATORY** *(Required)* | `events/chat_message`, `storage/get_*`, `storage/set_variable`, `ai/*`, `utilities/filter`, `utilities/map`, `utilities/join`, `control_flow/split`, `control_flow/if` | **Must be connected** from root trigger downstream. If disconnected, the node will never be executed by the runtime engine. |
| **OPTIONAL** *(Leaves / Annotation)* | `utilities/comment`, Terminal `storage/insert_chat_message`, Terminal `storage/update_typing_status` | **May have no outgoing connections**. `utilities/comment` does not even require input/output handles as it serves purely as a canvas visual note. |
| **FALLBACK / ERROR HANDLERS** | `storage/broadcast_failed_chat_message`, Fallback `ai/llm` on `try.error`, Fallback `control_flow/wait` on `if.false` | **Connected to contingency/alternative ports** (`try.error` or `if.false`) to guarantee the bot responds gracefully during errors or unsatisfied conditions. |





