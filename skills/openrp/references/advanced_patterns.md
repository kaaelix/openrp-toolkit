# Advanced OpenRP Behavior Patterns Reference

This document provides complete implementation blueprints for external HTTP integration, structured JSON / AI tool use, multi-agent group choreography, and token budget management.

---

## 1. External HTTP Integration & Async Polling (`utilities/http_request`)

OpenRP behavior graphs can interact with external REST APIs and Webhooks via `utilities/http_request`.

### A. Core Constraints:
- **Protocol**: Target URL must use public `https://`.
- **Hard Timeout**: 30 seconds.
- **Headers**: `"JSON"` (`application/json`) or `"TEXT"` (`text/plain`).

### B. Asynchronous Job Polling Blueprint:
For long-running tasks (e.g. AI image generation or external simulation jobs):
```
[http_request (POST: trigger job)] ──> [set_variable (jobId: httpRequest.body.id)]
                                              │
[repeat_until (isJobFinished)] <──────────────┘
      │ (loopStart)
[wait (3s delay)]
      │
[http_request (GET: /jobs/{{ $variables.jobId }})]
      │
[set_variable (isJobFinished: httpRequest2.body.status === 'COMPLETED')]
      │
      └──────> (loopEnd on repeat_until)
```

---

## 2. Structured JSON Mode & AI Tool Use / RPG State Engine

The `ai/llm` node supports `responseSchema` to enforce deterministic, machine-parseable JSON responses from language models.

### A. Node Configuration:
```json
{
  "id": "combatLlm",
  "type": "ai/llm",
  "data": {
    "modelId": "64ffc716-89a3-456e-9a95-ef4095f7d781",
    "temperature": 0.2,
    "responseSchema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"action\": { \"type\": \"string\", \"enum\": [\"attack\", \"defend\", \"cast_spell\", \"use_item\"] },\n    \"target\": { \"type\": \"string\" },\n    \"damageDealt\": { \"type\": \"number\" },\n    \"narrativeDialogue\": { \"type\": \"string\" }\n  },\n  \"required\": [\"action\", \"damageDealt\", \"narrativeDialogue\"]\n}",
    "messages": [
      {
        "role": "system",
        "content": "You are the Combat Arbiter. Parse the player's action and calculate damage."
      },
      {
        "role": "user",
        "content": "{{ getChatMessage.content }}"
      }
    ]
  }
}
```

### B. Downstream State Machine Mutation:
Extract parsed JSON directly in `storage/set_variable`:
```javascript
{
  "key": { "$template": "bossHp" },
  "value": { "$expression": "Math.max(0, $variables.bossHp - combatLlm.parsedOutput.damageDealt)" }
}
```

---

## 3. Coordinated Multi-Agent Group Choreography

In shared multi-participant chatrooms, coordination prevents message collisions and race conditions.

### A. Mention-Gating Pattern (Decentralized):
Each character's behavior checks if they are explicitly summoned before responding:
```
[chat_message] ──> [get_chat_message] ──> [if (isMentioned)] ──> [llm] ──> [insert_chat_message]
```
- **Expression**:
  ```javascript
  getChatMessage.content.toLowerCase().indexOf('@' + replyingCharacter.handle.toLowerCase()) !== -1
  ```

### B. Arbiter / Game Master Turn Cycling (Centralized):
A single Arbiter bot (e.g. `CHRONOS-Prime`) manages initiative and directs which NPC responds:
1. Player takes action.
2. Arbiter evaluates the room state and outputs: `"@Aurelia prepare defenses! @Zephyr strike from the shadows!"`.
3. Mention-gated behaviors on Aurelia and Zephyr execute in sequence.

---

## 4. Token Budget Management & Context Pruning

To prevent context window overflow in long-running roleplay sessions:

### A. Token Counting (`ai/count_tokens`):
- `text`: `getChatMessages.data.map(m => m.content).join('\n')`
- `tokenizer`: `"TOKENIZER_GPT4O"`
- Emits: `count` (number of tokens).

### B. Intelligent Context Pruning (`ai/prune_text`):
- `text`: History string.
- `maxTokens`: Budget limit (e.g. `4000`).
- `direction`: `"start"` (drops oldest messages from the start of the history while preserving the most recent turns).
- `tokenizer`: `"TOKENIZER_GPT4O"`.
- Emits: `prunedText` (cleanly truncated text ready for injection into LLM system prompt).
