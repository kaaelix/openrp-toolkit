# Verified Node Schemas & Experiment Findings (2026-08-30)

> [!IMPORTANT]
> Every schema below was verified by **deploying + executing a real behavior graph** against the live OpenRP engine (via `POST /api/v1/behaviors/{id}/executions`, `triggerSource: "editor"`). Fields marked ⚠️ **correct** older documentation that was wrong. This file is the authoritative schema reference.

## 1. Verified Node `data` Schemas (all 35 tested nodes)

| Node type | `data` fields (verified) | Notes |
|---|---|---|
| `events/chat_message` | `{"customFields": []}` | Root trigger. Output exposes `chatId`, `messageId`. |
| `storage/get_chat` | `{"chatId": {$expression}, "expand": ["participants","messages"]}` | |
| `storage/get_chat_message` | `{"messageId": {$expression}}` | Output: `content`, `chatId`, `participantId`. |
| `storage/get_chat_messages` | `{"chatId": {$expression}, "limit": N}` | Output: `data` (array). |
| `storage/get_chat_participant` | `{"participantId": {$expression}, "expand": ["roleplayProfile","user"]}` | Output: `name`, `userId`, `characterId`. |
| `storage/get_character` | `{"characterId": {$expression}}` | Output: `name`, `worldId`, `personality`, `description`. |
| `storage/get_characters` | `{limit, worldId}` | Output: `data` (array). ✅ Verified `get_characters.data.length` works; filter by `item.name?.indexOf("X") >= 0`. |
| `storage/get_lores` | `{limit, worldId, semanticQuery, minConfidence, enableFilters, titleValue/titleOperator, ...}` | Semantic RAG. `worldId` must come from `get_character.worldId`, NOT a participant. |
| `storage/get_lore` | `{"loreId": "<id>"}` | Singular. Output: `title`, `content`, `isExclusive`. |
| `storage/get_character_memories` | `{"chatId", "chatParticipantId", "query", "matchThreshold"}` ⚠️ | Needs `chatId` + `chatParticipantId` (NOT `characterId`). Output: `memories`. |
| `storage/set_variable` | `{"variables": [{"key": {$template}, "value": {$template or $expression}}]}` | |
| `storage/get_variable` | `{"key": {$template}}` | Output: `value`. |
| `storage/insert_chat_message` | `{"chatId", "content", "chatParticipantId"}` | Output: `{id, chatId, status: "SENT", content}`. |
| `storage/update_typing_status` | `{"isTyping": bool, "participantId"}` | |
| `utilities/filter` | `{"list": {$expression}, "itemCondition": {$expression}}` | Output: `list`. |
| `utilities/map` | `{"list": {$expression}, "itemTemplate": {$template or $expression}}` | Output: `list`. |
| `utilities/append` | `{"item": {$expression}, "list": [...], "concatenate": true}` | Output: `list`. |
| `utilities/join` | `{"list": {$expression}, "separator": {$template}}` | Output: `text`. |
| `utilities/string_split` | `{"text": {$template}, "separator": {$template}}` | Output: `list`. |
| `utilities/http_request` | `{"url": "https://...", "method": "GET", "headers": "JSON"}` ⚠️ | `headers` is an **enum `JSON`|`TEXT`** (response parse mode), NOT HTTP headers. Output: `status`, `body`. |
| `ai/llm` | `{"stream": bool, "modelId": "<id>", "messages": {$expression}, "maxTokens": N, "temperature": f, "responseSchema": "<json-schema-string>"}` ⚠️ | `responseSchema` is a **plain JSON-schema string** (NOT `{$template}`). Output: `outputText`, `usage`, `model`. |
| `ai/count_tokens` | `{"text": {$template}, "tokenizer": "TOKENIZER_DEEPSEEK_V4"}` | Output: `count`. |
| `ai/generate_embeddings` | `{"content": {$template}}` | Output: `embedding`. |
| `ai/prune_text` | `{"text", "maxTokens", "direction": "end", "tokenizer"}` ⚠️ | `direction` is required enum `start`|`end`. |
| `ai/read_llm_stream` | `{"streamKey": {$expression: "llm.streamKey"}}` ⚠️ | Requires `streamKey` from the `ai/llm` node. Output: `isFinished`, `snapshot`. |
| `ai/get_default_model` | `{}` | Output: `id`. Verified: default = `01a04c17-1f4f-740b-9ab6-50b58cbfc4d3` (glm-5.3-flash). |
| `ai/get_models` | `{}` | Output: `data` (array). Verified: **39 models** in catalog (NOT 38). |
| `ai/get_model` | `{"modelId": {$expression}}` | Output includes `name` (e.g. "glm-5.3-flash"). |
| `control_flow/if` | `{"expression": {$expression}}` | |
| `control_flow/end_if` | `{}` | |
| `control_flow/split` | `{"outputCount": N}` | |
| `control_flow/sync` | `{"inputCount": N}` | `lcaNodeId` auto-populated by backend. |
| `control_flow/repeat_until` | `{"expression": {$expression}}` ⚠️ | Field is **`expression`**, NOT `condition` (encyclopedia was wrong). |
| `control_flow/try` | `{}` | Handles: `loopStart`/`loopEnd` (body), `next` (success), `error` (error). ⚠️ Must have BOTH `next` AND `error` exits — the graph cannot terminate inside the try body. |
| `control_flow/wait` | `{"seconds": N}` | |

## 2. Handle / Name Validation Rules

- **Handle must be a slug**: lowercase letters, digits, hyphens. **Underscores and spaces → `400 bad_request_body`.** Uppercase is tolerated.
- **Name/handle max length ≈ 40 chars** (60+ → `400 bad_request_body`).
- Duplicate handle → `409 behavior_handle_exists`.

## 3. Model Compatibility (verified)

| Model | id | Free | Result |
|---|---|---|---|
| glm-5.3-flash | `01a04c17-1f4f-740b-9ab6-50b58cbfc4d3` | ✅ | Works |
| gemini-2.5-flash | `bc426576-0c36-4ab1-aba6-64bf078f1f30` | ✅ | Works |
| glm-4.7-flashx | `019d8a28-e76f-7d77-85fc-fa3d3f2190c9` | ✅ | Works |
| gpt-5-mini | `019b1566-66d9-7fea-80af-15f5623fe313` | ✅ | ❌ `llm_api_error` (broken) |
| deepseek-v4-pro | `019dbd9c-8274-75dd-bf7b-51ed6853a800` | ❌ | ❌ `user_insufficient_credits` |
| legacy default | `64ffc716-89a3-456e-9a95-ef4095f7d781` | — | ❌ `chat_model_not_found` (stale) |

- The LLM node's own `modelId` **overrides** the trigger's `modelSettings.chatModelId`.
- `openrp_list_models` leaks provider `apiKey` values — never persist them.

## 4. Key Patterns Confirmed Working

- **`storage/update_typing_status`**: `{participantId, isTyping}` ✅ verified (toggle on then off).
- **Model discovery pipeline**: `get_default_model` → `get_models` → `get_model` → `llm(modelId: getDefault.id)`.
- **Structured JSON**: `responseSchema` = plain JSON-schema string; glm-5.3-flash returned valid JSON.
- **Streaming**: `llm(stream: true)` → `read_llm_stream(streamKey: llm.streamKey)`.
- **RAG**: `map` → `join` → `generate_embeddings` → `split` → `{get_lores, get_characters}` → `sync`.
- **Try/error boundary**: on LLM failure routes to `error` (fallback); on success routes to `next`.

## 5. Rate Limiting

- **Behavior execution trigger endpoint** (`POST /api/v1/behaviors/{id}/executions`) is rate-limited to **~80 executions per window** — returns `429 rate_limit_exceeded` when exhausted. The **create endpoint is NOT rate-limited** (creating 100+ behaviors in a row works).
- Pacing: ≥4-6s between creates; for large batches, expect to hit the trigger limit around execution #80 and need to wait for the window to reset (or re-run the remainder later).
- Some executions get **stuck in `RUNNING`** and never complete (observed with glm-4.7-flashx and `maxTokens:10`). Poll for `COMPLETED`/`FAILED` with a timeout; treat `RUNNING`-forever as a failure mode.

## 5b. Model Compatibility (verified, 100-behavior run)

| Model | id | Free | Result |
|---|---|---|---|
| glm-5.3-flash | `01a04c17-1f4f-740b-9ab6-50b58cbfc4d3` | ✅ | Works for text; **fails structured JSON** (`malformed_llm_output`); **fails `temperature: 1.5`** (`llm_api_error`) — keep temp ≤ 1.0. |
| gemini-2.5-flash | `bc426576-0c36-4ab1-aba6-64bf078f1f30` | ✅ | Works, but **flaky** (`llm_response_error` on some short prompts); JSON output works. |
| glm-4.7-flashx | `019d8a28-e76f-7d77-85fc-fa3d3f2190c9` | ✅ | Works; sometimes **stuck in RUNNING**. |
| gpt-5-mini | `019b1566-66d9-7fea-80af-15f5623fe313` | ✅ | ❌ `llm_api_error` (broken). |
| deepseek-v4-pro | `019dbd9c-8274-75dd-bf7b-51ed6853a800` | ❌ | ❌ `user_insufficient_credits`. |
| legacy default | `64ffc716-89a3-456e-9a95-ef4095f7d781` | — | ❌ `chat_model_not_found` (stale). |

- `utilities/append.list` field rejects an inline array literal via `$expression` (`Invalid input: expected array`) — pass a node output reference (e.g. `map.list`) or a literal array value instead.

## 6. The 37-Node Palette (actual)

The README's "38 nodes" list is outdated — `ai/generate_image`, `ai/classify_text`, `ai/extract_json`, `control_flow/switch/case/break/continue` **do not exist** in the current engine. Actual palette: `events/chat_message`, `events/cron`, `ai/count_tokens`, `ai/generate_embeddings`, `ai/get_default_model`, `ai/get_model`, `ai/get_models`, `ai/llm`, `ai/prune_text`, `ai/read_llm_stream`, `control_flow/if`, `control_flow/end_if`, `control_flow/split`, `control_flow/sync`, `control_flow/repeat_until`, `control_flow/try`, `control_flow/wait`, `storage/get_chat_message`, `storage/get_chat_messages`, `storage/get_chat`, `storage/get_chat_participant`, `storage/get_character`, `storage/get_characters`, `storage/get_character_memories`, `storage/get_lore`, `storage/get_lores`, `storage/set_variable`, `storage/get_variable`, `storage/insert_chat_message`, `storage/update_typing_status`, `utilities/filter`, `utilities/map`, `utilities/append`, `utilities/join`, `utilities/string_split`, `utilities/http_request`, `utilities/comment`.

## 7. JEXL Expression Rules (verified)

- **Double quotes inside string literals must be escaped** (`\"`). Unescaped `"` inside a `$expression` string breaks the JEXL parser: `Error: Failed to evaluate expression ... Cannot read properties of undefined (reading 'type')`.
- **Undefined identifiers throw**: referencing a node that doesn't exist (or an output field that is `null`) throws `Identifier "X" is not defined in the current context`.
- **Strict runtime type validation** (Zod) on node inputs:
  - `control_flow/wait.seconds` must be a `number` (string → `invalid_type: expected number, received string`).
  - `utilities/append.list` must be an `array` (string → `invalid_type: expected array, received string`).
  - `ai/llm.messages` must have **≥1 element** (empty array → `too_small: expected array to have at least 1 element`).
- Use `?.` optional chaining and `??` nullish coalescing (e.g. `lores.data?.length ?? 0`) to safely handle null outputs.

## 8. Control-Flow Constraints (verified)

### `control_flow/try` (error boundary) — CONFIRMED WORKING
Exact edge wiring (verified against the 5000-node production graph):
```
[prev] ──next──> [try] ──loopStart──> [body...] ──next──> [last body] ──loopEnd──> [try]
                     │ next (success)  ──> [success downstream]
                     └ error (failure) ──> [fallback e.g. insert_chat_message]
```
- `try` input handle = `previous`. Body entry = `loopStart`, body return = `loopEnd`.
- Success exits via **`next`**, failure via **`error`** — to DIFFERENT downstream nodes.
- The graph CANNOT terminate inside the try body; terminal `insert_chat_message` must be reachable via success or fallback exits.
- VERIFIED: `http_request` to an invalid domain inside try → routes to `error` fallback; fallback message inserted. The error boundary genuinely catches failures.

### `control_flow/split` + `control_flow/sync`
```
[prev] ──next──> [split(outputCount:2)] ──out1──> [branch A] ──next──> [sync] <──in1
                                        └─out2──> [branch B] ──next──> [sync] <──in2
                                                                   [sync] ──next──> [downstream]
```
- `split` emits `out1..N`, `sync` takes `in1..N` and emits `next` after all branches merge.
- `sync.lcaNodeId` is auto-populated by the backend — do not set it.
- VERIFIED: split(2)+sync(2) with `out1/out2→in1/in2` merges correctly.

### `control_flow/repeat_until` (loop)
```
[prev] ──next──> [loop(expression:...)] ──loopStart──> [body] ──next──> [loop] ──loopEnd
                                           └ next (exit) ──> [downstream]
```
- Condition field is **`expression`** (NOT `condition`).
- Body entry = `loopStart`, body return = `loopEnd`, exit = `next`.
- A `next` edge from loop/try INTO its own body FAILS ("Nodes inside a loop cannot connect to nodes outside").
- ⚠️ **Loop condition CANNOT forward-reference body-node outputs.** `read.isFinished` in the condition fails with `Identifier "read" is not defined` — the condition is evaluated before the body node runs. Prime the condition with a `set_variable` placed BEFORE the loop.
- ⚠️ **Multi-iteration loops not observed to work in editor-debug executions.** Verified: `checkConditionBeforeRunning: false` (default) → body ran exactly once then exited (counter 0→1, final `i:1`); `checkConditionBeforeRunning: true` → body ran zero times when condition was initially false (correct while-loop skip). The re-check after the body does not appear to loop again. Treat `repeat_until` as effectively single-pass until verified against live chat triggers.

### `control_flow/if` + `control_flow/end_if`
```
[prev] ──next──> [if] ──true──> [T] ──next──> [end_if] <──in1
                     └─false─> [F] ──next──> [end_if] <──in2
                                                  [end_if] ──next──> [downstream]
```
- `end_if` MUST have EXACTLY TWO incoming edges (`in1`+`in2`) from the SAME `if`. One incoming edge fails: `"End If" nodes must have exactly two incoming connections`.
- Nested ifs each need their own `end_if`.

### Streaming loop (`ai/llm(stream:true)` + `ai/read_llm_stream` + `repeat_until`)
```
[prev] ──next──> [llm(stream:true)] ──next──> [loop(expression: read.isFinished == true)]
                                                └─loopStart─> [read(streamKey: llm.streamKey)] ──next──> [loop] ──loopEnd
                                                [loop] ──next──> [downstream]
```
- ⚠️ **Streaming poll loop does NOT poll to completion.** Verified: the loop reads ONE snapshot and exits — `read.isFinished` was still `false` after the first read (`stream done, finished:false`). Combined with the single-pass loop behavior, the full streaming-poll pattern from the official blueprint does not complete in editor-debug mode. The simple linear `llm(stream:true)` → `read_llm_stream` → `insert` chain DOES work (verified earlier).

### Structure limits (verified)
- Deep chains: 12+ sequential `set_variable` works (`final i: 12`).
- Multiple sequential `ai/llm` calls work (`1:FIRST 2:SECOND`).
- `try` (error boundary) ✅, `split`/`sync` (2-branch) ✅ verified working with correct manual wiring.
- `repeat_until` loop: single-pass only in editor-debug (see loop section).

## 8b. Harness Pitfall — Auto-Chaining Edges Through Control-Flow Nodes

A naive "chain every node with `next`→`previous`" generator corrupts control-flow graphs. Control-flow nodes use NON-`next` handles (`loopStart`/`loopEnd`/`out1..N`/`in1..N`/`true`/`false`) and MUST be wired manually. Auto-chaining produces:
- `Nodes inside a loop cannot connect to nodes outside.` (loop/try body)
- `"End If" nodes must have exactly two incoming connections.` (end_if)

Rule: switch to explicit manual edges immediately after any control-flow node.

## 9. RAG Semantic Search Behavior (verified)

- **built-ins verified**: `Math.floor/random/pow/round` ✅, `Date.format("yyyy-MM-dd HH:mm")` ✅, string methods (`toUpperCase`, `indexOf`, `split`) ✅, ternary ✅.
- **`$requestMetadata` is NOT exposed in editor debug executions** — `$requestMetadata.timeZone` evaluates to `undefined` (only populated for live chat triggers with authenticated user context). Don't rely on it in editor-mode tests.

- **`storage/get_lores` with `semanticQuery` returns 0 results in practice** — even at `minConfidence: 0.3`. The vector similarity match does not return lore entries (lore embeddings appear not to be generated/matched on this account).
- **`enableFilters: false` returns all lores** (up to `limit`), ignoring semantic similarity.
- **`enableFilters: true` + no `semanticQuery` → `bad_request`** (API error).
- **Practical consequence**: character persona comes from `get_character.personality` (works), NOT from RAG lore retrieval (returns empty). For deterministic lore injection, use `enableFilters: false` + `limit` (returns all lores) or filter by `titleValue`/`nameValue`.
- `get_character` output fields (verified): `id`, `name`, `handle`, `status`, `dialogs`, `worldId`, `promptId`, `greetings`, `avatarPath`, `description`, `personality`, `messageCount`, `shortDescription`, `characterBehaviors`.

## 10. Split/Sync Notes

- `split` (`outputCount`) + `sync` (`inputCount`) with **2 branches** works (verified in production graph).
- 4-branch split/sync may fail validation — keep splits to 2 branches unless `lcaNodeId` is explicitly set on the `sync` node.
