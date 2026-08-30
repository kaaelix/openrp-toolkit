# Verified Production Behavior Graph (High-Capacity Roleplay)

> [!IMPORTANT]
> Every field in this file was extracted from a **live 5000-node / 5682-edge production behavior graph** (`sorasaki-hina`, world `kivotos-blue-archive`) via `openrp_get_behavior` on 2026-08-30. These are exact `data` shapes, not guesses. Use them as the authoritative schema reference when generating or editing behavior graphs.

## 1. Architecture: Single-LLM High-Capacity Roleplay Pipeline

The graph uses **one** `ai/llm` node fed by a massive deterministic pre-processing pipeline. Structure:

```
events/chat_message
  → storage/get_chat            (expand: ["participants","messages"])
  → utilities/filter            (bot: item.userId === null && item.characterId !== null)
  → storage/update_typing_status (isTyping: true)
  → utilities/filter            (user: item.userId !== null)
  → storage/get_character        (characterId: filterReplyingBot.list[0].characterId)
  → utilities/map               (messages → "Name: content" text lines)
  → utilities/join              (separator "\n\n")
  → ai/generate_embeddings       (content: {{ joinScanMessages.text }})
  → control_flow/split           (outputCount: 2)
       ├─ out1 → storage/get_lores        (semanticQuery: embedding, minConfidence 0.45)
       └─ out2 → storage/get_characters   (semanticQuery: embedding, minConfidence 0.45)
  → control_flow/sync            (inputCount: 2)
  → [3611× storage/set_variable + 681× control_flow/if + 681× control_flow/end_if]
       # deterministic state machine: init 27+ enum variables, then branch on
       # keyword / player-choice detection to update them
  → utilities/map               (messages → {role, content} objects)
  → utilities/append             (system message + mapped history → messages list)
  → ai/count_tokens             (tokenizer: TOKENIZER_DEEPSEEK_V4)
  → control_flow/try
       ├─ loopStart → ai/llm → storage/insert_chat_message (success)
       ├─ loopEnd   (success path re-enters try)
       ├─ next      → storage/update_typing_status (isTyping: false)
       └─ error     → storage/insert_chat_message (fallback text)
```

Key design decisions worth copying:
- **RAG before LLM**: embed the joined recent messages, then semantic-search both lores and characters in parallel (`split`/`sync`).
- **Messages built via `append`**, not inline in the LLM node. `ai/llm.messages` is `{"$expression": "appendSystemInstruction.list"}`.
- **Error boundary around the LLM + insert** via `control_flow/try`; the `error` branch posts a canned fallback reply so the chat never dies silently.
- **Choice detection is keyword-based** (`.indexOf()`, no regex) on the joined message text.

## 2. Verified Node `data` Shapes

### `events/chat_message`
```json
{ "customFields": [] }
```

### `storage/get_chat`
```json
{ "chatId": { "$expression": "chatMessage.chatId" }, "expand": ["participants", "messages"] }
```

### `storage/get_character`
```json
{ "characterId": { "$expression": "filterReplyingBot.list[0].characterId" } }
```

### `utilities/filter`
```json
{ "list": { "$expression": "chat.participants.data" },
  "itemCondition": { "$expression": "item.userId === null && item.characterId !== null" } }
```
- Bot: `item.userId === null && item.characterId !== null`
- User: `item.userId !== null`
- Output: `filterNode.list` (array of matched items).

### `utilities/map`
```json
{ "list": { "$expression": "chat.messages.data.reverse()" },
  "itemTemplate": { "$template": "{{ item.participantId === filterUserParticipant.list[0].id ? (...) : getReplyingCharacter.name }}: {{ item.content }}" } }
```
- `itemTemplate` may be `$template` (string) **or** `$expression` (object, e.g. `{ role: "user", content: item.content }`).
- `chat.messages.data.reverse()` puts oldest first (chronological order).
- Output: `mapNode.list`.

### `utilities/join`
```json
{ "list": { "$expression": "mapScanMessages.list" }, "separator": { "$template": "\n\n" } }
```
- Output: `joinNode.text`.

### `utilities/append`
```json
{ "item": { "$expression": "mapPromptMessages.list" },
  "list": [ { "$expression": "{\n  role: \"system\",\n  content: $variables.systemPrompt\n}" } ],
  "concatenate": true }
```
- `list` = base array; `item` = array to append; `concatenate: true` merges them.
- Output: `appendNode.list` (the final messages array for the LLM).

### `storage/set_variable`
```json
{ "variables": [ { "key": { "$template": "charName" }, "value": { "$expression": "getReplyingCharacter.name" } } ] }
```
- `key`: `$template` (literal variable name).
- `value`: `$template` (literal string / enum) **or** `$expression` (JEXL). Numeric literals must be strings, e.g. `{"$expression": "64000"}`.

### `control_flow/if`
```json
{ "expression": { "$expression": "joinScanMessages.text.indexOf('[1]') >= 0 || joinScanMessages.text.indexOf('Option 1') >= 0" } }
```
- Condition is a pure JEXL expression (`.indexOf()`, `.startsWith()`, etc. — **no regex literals**).

### `control_flow/end_if`
Converging branches target `in1` / `in2`; `end_if` emits `next` downstream.

### `control_flow/split` / `control_flow/sync`
```json
{ "outputCount": 2 }   // split
{ "inputCount": 2 }     // sync — NOTE: no lcaNodeId in current engine
```

### `control_flow/try`
```json
{ }   // no data fields; body delimited by loopStart/loopEnd handles
```
Handles (verified): input `previous`; body start `loopStart`; body end `loopEnd`; success continuation `next`; error handler `error`. **There is no `success` handle.**

### `ai/generate_embeddings`
```json
{ "content": { "$template": "{{ joinScanMessages.text }}" } }
```
- Output: `embeddingsNode.embedding` (passed to `get_lores.semanticQuery` / `get_characters.semanticQuery`).

### `storage/get_lores` (semantic RAG)
```json
{ "limit": 5,
  "worldId": { "$expression": "getReplyingCharacter.worldId" },
  "enableFilters": true,
  "minConfidence": 0.45,
  "semanticQuery": { "$expression": "generateQueryEmbedding.embedding" },
  "titleValue": { "$template": "" }, "titleOperator": "ilike",
  "handleValue": { "$template": "" }, "handleOperator": "eq",
  "contentValue": { "$template": "" }, "contentOperator": "ilike" }
```

### `storage/get_characters` (semantic RAG)
```json
{ "limit": 5,
  "worldId": { "$expression": "getReplyingCharacter.worldId" },
  "enableFilters": true,
  "minConfidence": 0.45,
  "semanticQuery": { "$expression": "generateQueryEmbedding.embedding" },
  "nameValue": { "$template": "" }, "nameOperator": "ilike",
  "handleValue": { "$template": "" }, "handleOperator": "eq",
  "descriptionValue": { "$template": "" }, "descriptionOperator": "ilike" }
```

### `ai/count_tokens`
```json
{ "text": { "$template": "{{ $variables.systemPrompt }}\n\n{{ joinScanMessages.text }}" },
  "tokenizer": "TOKENIZER_DEEPSEEK_V4" }
```
- Tokenizer enum observed: `TOKENIZER_DEEPSEEK_V4`.

### `ai/llm`
```json
{ "stream": false,
  "modelId": "64ffc716-89a3-456e-9a95-ef4095f7d781",
  "messages": { "$expression": "appendSystemInstruction.list" },
  "maxTokens": 1800,
  "temperature": 0.75,
  "responseSchema": { "$template": "" } }
```
- `messages` is an `$expression` referencing the built list (not an inline array).
- Output field: `llmNode.outputText`.
- `responseSchema` empty template = free-form text (no structured JSON mode).

### `storage/insert_chat_message`
```json
{ "chatId": { "$expression": "chatMessage.chatId" },
  "content": { "$expression": "llmGenerateResponse.outputText" },
  "chatParticipantId": { "$expression": "filterReplyingBot.list[0].id" } }
```

### `storage/update_typing_status`
```json
{ "isTyping": true, "participantId": { "$expression": "filterReplyingBot.list[0].id" } }
```

## 3. Player-Choice Detection Pattern (text-based)

The graph presents the user with numbered choices (`[1]`…`[4]` / `Option 1`…`4` / `1.`…`4.`) and detects the reply by scanning the joined message text:

```
ifChoiceOption1: joinScanMessages.text.indexOf('[1]') >= 0 || joinScanMessages.text.indexOf('Option 1') >= 0 || joinScanMessages.text.indexOf('1.') >= 0
```
- Each `if` sets a `playerSelectedChoice` enum variable on its `true` branch (e.g. `EX_SKILL_ACTION`).
- This is a **zero-LLM deterministic branch** — the LLM only runs once at the end, consuming the resolved variables.
- Same pattern generalizes to any keyword-triggered state: `ifSkillCheckCritical` matches `"maximum" | "perfect" | "all out"`; `ifSkillCheckComplication` matches `"trap" | "ambush" | "overheat"`.

## 4. State-Machine Variable Initialization

A single `storage/set_variable` node (`initAnalysisVariables`) seeds ~27 enum-valued variables in one shot (evaluated concurrently — see Rule 2). Examples:

| Variable | Initial value |
|---|---|
| `charName` | `{"$expression": "getReplyingCharacter.name"}` |
| `charMood` | `VIGILANT_DUTY` |
| `dangerLevel` | `PEACEFUL_NORMAL` |
| `affinityLevel` | `MOMOTALK_LEVEL_3` |
| `playerSelectedChoice` | `FREEFORM_COMMAND` |
| `tokenBudget` | `{"$expression": "64000"}` |

Later `if`/`set_variable` pairs overwrite these based on detected keywords/choices. The final values are injected into the system prompt via `$variables.<name>`.

## 5. Corrections to Older Skill Content

- **`control_flow/try` handles**: `loopStart`/`loopEnd` delimit the body; `next` = success; `error` = error handler. The previously documented `success` handle **does not exist**.
- **`control_flow/sync`**: only `inputCount` is required; `lcaNodeId` is auto-populated by the backend (verified: deploying a graph without it stores `lcaNodeId: "<splitNodeId>"` on the sync node as a top-level field, not in `data`).
- **Bot participant filter**: `item.userId === null && item.characterId !== null` (not just `item.userId === null`).
- **`ai/llm.messages`**: accepts an `$expression` referencing a variable-built list, not only inline arrays.
- **`openrp_send_message` does NOT trigger behaviors**: it only inserts a message via `POST /api/chats/{chatId}/messages` (the response's `metadata.behaviorExecutionIds` stays `[]`). To test a behavior via MCP, use `openrp_execute_behavior_debug` (triggerSource becomes `"editor"`).

## 6. Verified Execution Trace & Testing Workflow (2026-08-30)

A 24-node graph built from the shapes above was deployed, attached, and executed end-to-end. Confirmed runtime outputs:

### `ai/llm` output
```json
{ "cost": 0, "model": "glm-5.3-flash",
  "usage": { "inputTokens": 436, "outputTokens": 1406, "totalTokens": 1842,
             "outputTokensDetails": { "reasoningTokens": 1164 } },
  "createdAt": 1788075495121, "outputText": "..." }
```
- The LLM node's own `modelId` **overrides** the trigger's `modelSettings.chatModelId`.

### `ai/count_tokens` output
```json
{ "count": 447 }
```

### `storage/insert_chat_message` output
```json
{ "id": "...", "chatId": "...", "status": "SENT", "content": "..." }
```

### `control_flow/try` output
- Success path: `{ "next": "next", "data": {} }`.
- Failure path (LLM threw): `{ "next": "error", "data": { "error": { "code": "chat_model_not_found", "nodeId": "llmGenerateResponse", "nodeType": "ai/llm", "message": "API Request failed: chat_model_not_found" } } }`.

### End-to-end testing workflow (verified)
1. `openrp_create_character` (in the target world) — or reuse an existing character.
2. Build the graph JSON (shapes above), then deploy:
   - `POST /api/users/{u}/worlds/{w}/behaviors` body `{name, handle, graph}` → `data.id` = behaviorId.
   - `POST /api/v1/characters/{c}/behaviors` body `{behaviorId, behaviorRegistryTagId: null}` → attaches.
3. `openrp_create_chat` with the characterId → chatId.
4. `openrp_execute_behavior_debug` with `behaviorId` + `chatId` + `pollUntilDone: true`.
5. Poll `openrp_get_behavior_execution` until `BEHAVIOR_EXECUTION_STATUS_COMPLETED`.
6. `openrp_get_behavior_node_executions` → confirm every node `COMPLETED` and inspect `llmGenerateResponse.output.data.outputText` / `insertSuccessMessage.output.data.status === "SENT"`.

## 7. `chat_model_not_found` Pitfall (Critical)

The LLM node fails with `chat_model_not_found` when its `modelId` references a model that no longer exists in the catalog. Verified 2026-08-30: the legacy default `64ffc716-89a3-456e-9a95-ef4095f7d781` is **stale** — every 5000-node production behavior in the account still references it and their executions are stuck in `RUNNING` / `FAILED` / `LIMIT_REACHED`.

**Fix**: always resolve a live model ID from `openrp_list_models` (extract only `id`/`name`/`label`/`isFree` — the response leaks provider `apiKey` values, never persist them). A working free model at time of writing: `01a04c17-1f4f-740b-9ab6-50b58cbfc4d3` (`glm-5.3-flash`). The `get_me.data.settings.chat.defaultChatModelId` may also be stale — do not trust it blindly.
