# 56-Behavior Battery — Full 37-Node Palette Coverage (2026-08-30)

> [!IMPORTANT]
> A 56-behavior experiment was deployed to a dedicated lab world (`behavior-lab-50-*`) and
> **executed via editor-debug** (`triggerSource: "editor"`). Result: **55/56 COMPLETED**, 1 FAILED
> (the `events/cron` behavior — cron triggers cannot be editor-debugged, see §4). Every one of the
> **37 node types** was exercised at least once. This file records the corrections and new facts
> discovered during the run.

## 1. Final Result Matrix

| Metric | Value |
|---|---|
| Behaviors deployed | 56 |
| Deploy success (HTTP 200) | 56/56 |
| Editor-debug COMPLETED | 55/56 |
| Editor-debug FAILED | 1/56 (`events/cron` — expected, see §4) |
| Node types covered | 37/37 |
| Model used | `01a04c17-1f4f-740b-9ab6-50b58cbfc4d3` (glm-5.3-flash, free) |

The 56 behaviors span: echo, uppercase transform, word count, profile card, history digest,
token meter, model discovery/catalog/detail, character census, memory recall, lore list/single,
RAG query, LLM persona reply, structured JSON, prune text, wait pause, if/else, split/sync,
repeat-until, try/catch, stream read, var get/set, append list, model names, filter non-empty,
participant names, typing toggle, cron tick, parallel waits, nested if, var chain, shout,
date format, if-true-only, try-success, AI pipeline, participant lookup, comment annotation,
double LLM, embedding dims, history tokens, filter-map, sentiment JSON, message fetch, if-waits,
realistic reply, memory persona, lore injection, LLM try, silence-empty, kitchen sink,
full pipeline, HTTP request.

## 2. NEW Correction — JEXL array length is `.length`, NOT `.size()`

**`.size()` is not a function in the JEXL evaluator.** Eight behaviors in the first deploy used
`<node>.data.size()` / `list.size()` and ALL failed with:

```
Error: Failed to evaluate expression: sp.list.size(). Expression is not a function
```

The fix is the JS-style `.length` property (the evaluator is JS-flavored — `.map()`, `.join()`,
`.split()`, `.toUpperCase()`, `.indexOf()` all work, as does `.length`):

| Wrong (fails) | Right (works) |
|---|---|
| `lo.data.size()` | `lo.data.length` |
| `cx.data.size()` | `cx.data.length` |
| `mr.memories.size()` | `mr.memories.length` |
| `em.embedding.size()` | `em.embedding.length` |
| `fl.list.size()` | `fl.list.length` |
| `ms.data.size()` | `ms.data.length` |

Optional chaining works: `lo.data?.length ?? 0`.

## 3. Re-confirmed — `utilities/append` with `concatenate: true`

Passing a **string** `item` with `concatenate: true` fails Zod validation:

```
Invalid input: expected array, received string
```

When `concatenate: true`, both `list` and `item` must be arrays. Verified working shape:

```json
{ "list": ["prefix"],
  "item": { "$expression": "mp.list" },
  "concatenate": true }
```

## 4. NEW — `events/cron` cannot be editor-debugged

A behavior whose root trigger is `events/cron` **fails in editor-debug mode** because the debug
trigger endpoint always injects `trigger: "events/chat_message"`. There is no cron trigger path in
the editor debug runner. The behavior itself deploys fine (HTTP 200) but cannot be runtime-verified
through `POST /api/v1/behaviors/{id}/executions`.

- **Implication**: test cron behaviors by deploying + attaching and waiting for the schedule, or
  accept deploy-only verification for cron-triggered graphs.
- The `events/cron` node type is still part of the palette (37/37 coverage includes it via deploy).

## 5. NEW — `control_flow/if` node output shape

The `if` node's execution output is `{"next": "true"}` or `{"next": "false"}` — the branch taken
is exposed as `output.next` (a string), NOT `output.data.next`.

```json
{ "next": "false" }
```

`control_flow/end_if` outputs `{"next": "next"}`.

## 6. NEW — `ai/count_tokens` output is a plain number

```json
{ "data": { "count": 9 } }
```

`count` is a JSON number. Comparisons in `if` conditions work directly: `ct.count > 3`.

## 7. NEW — multi-LLM chains need a longer poll window

Two behaviors with **two sequential `ai/llm` calls** (`double-llm`, `lore-injection`) exceeded a
40s poll window (20 × 2s) and reported `TIMEOUT`, but were later found `COMPLETED`. glm-5.3-flash
reasoning output is slow; for graphs with 2+ LLM nodes, poll ≥ 60s (or 30 × 2.5s).

## 8. NEW — kitchen-sink end_if topology constraint

A graph that nested `try` inside an `if` branch and routed **three** paths into one `end_if`
(`try.next`, `try.error`, `if.false`) failed with:

```
"End If" nodes must have exactly two incoming connections.
```

The error is reported on the **trigger node** (`nodeId: "t"`) in the node-executions trace, not on
the `end_if` node — misleading. Fix pattern: wrap the `if`/`end_if` **inside** the `try` body
instead of the reverse:

```
try.loopStart -> ifn -> (true: llm -> ok -> end_if.in1 | false: short -> end_if.in2)
end_if.next -> try.loopEnd
try.next -> finish ; try.error -> fallback -> finish
```

## 9. NEW — `storage/get_chat_message` output is the full message object

With `expand: ["attachments","participant"]`, the node output includes `id`, `chatId`, `content`,
`parentId`, `createdAt`, `metadata`, etc. — not just `content`. `gm.content` still resolves.

## 10. Confirmed — `insert_chat_message` output carries `metadata.behaviorExecutionIds`

Every inserted message's `metadata.behaviorExecutionIds` array maps the message back to the
behavior execution that produced it — the live-trigger trace hook.

## 11. Confirmed — full palette executes end-to-end

All 37 node types deploy AND execute to COMPLETED in editor-debug (except `events/cron`, §4).
The single-LLM `glm-5.3-flash` model handles: persona reply, structured JSON (`responseSchema`),
streaming (`stream: true` + `read_llm_stream`), embeddings, RAG (`get_lores` semanticQuery),
prune, count_tokens, and all control-flow (if/end_if, split/sync, repeat_until, try, wait).
