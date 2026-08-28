# Token Economy, Dynamic Eco-Modes & Token Optimization Reference

This guide provides complete blueprints for token optimization, context budget pruning, and user-configurable **Eco Mode vs. Full-Quality Mode** in OpenRP behavior graphs.

---

## 1. Overview of Token Drivers in OpenRP

Tokens in OpenRP are consumed by:
1. **Chat History**: Large message logs loaded via `storage/get_chat_messages`.
2. **RAG Context**: Lorebook entries and character memories injected into system prompts.
3. **Few-Shot Dialogs & Greetings**: Character metadata included in the prompt.
4. **LLM Output Generation**: `maxTokens` setting on `ai/llm`.

By implementing **Dynamic Token Modes**, creators allow users to toggle between **Eco Mode** (saving 70–90% of tokens / credits) and **Full Quality Mode** (maximum depth, long context, and detailed prose).

---

## 2. Token Control Nodes

### A. `ai/count_tokens`
Counts the exact token weight of any text or serialized message array before passing it to the model.
* **Inputs**:
  * `text` (`string`): Target text or serialized JSON.
  * `tokenizer` (`string`): Model tokenizer (e.g. `"TOKENIZER_GPT4O"`).
* **Outputs**:
  * `count` (`number`): Integer token count.

### B. `ai/prune_text`
Intelligently truncates text to fit strictly within a designated token budget without breaking syntax.
* **Inputs**:
  * `text` (`string`): The raw text or dialogue history.
  * `maxTokens` (`integer`): Strict upper token limit (e.g. `1500` for Eco, `6000` for Full).
  * `tokenizer` (`string`): Tokenizer identifier (`"TOKENIZER_GPT4O"`).
  * `direction` (`enum: "start" | "end"`):
    * `"start"`: Drops the oldest messages from the beginning (preserving the latest turns).
    * `"end"`: Truncates from the end (preserving the initial system prompt / persona).
* **Outputs**:
  * `prunedText` (`string`): Cleanly truncated text.
  * `tokenCount` (`number`): Resulting token count.

---

## 3. User-Configurable Eco-Mode Blueprint

Creators can allow users to toggle token-saving modes dynamically via in-chat commands (e.g. `/eco on`, `/eco off`, `!fast`, `!full`).

```
[chat_message]
      │
[get_chat_message]
      │
[get_chat_messages (limit: 10)]
      │
[set_variable (Detect Eco Mode & User Commands)]
      │
[if (isZeroLlmCommand?)] ───────────────────────────────┐ (true: Zero Tokens)
      │ (false)                                        │
[if (isEcoMode?)]                                      [set_variable (evaluate deterministic response)]
      ├── (true: Eco Mode)                             │
      │     - History Limit: 4 messages                [insert_chat_message] (0 AI Tokens Used)
      │     - Prune Budget: 1000 tokens                │
      │     - Lore Retrieval: Disabled or Limit 1      │
      │     - Max Output Tokens: 250                   │
      │                                                │
      └── (false: Full Quality Mode)                   │
            - History Limit: 15 messages               │
            - Prune Budget: 5000 tokens                │
            - Lore Retrieval: Limit 4 + Embeddings     │
            - Max Output Tokens: 800                   │
      │                                                │
[ai/prune_text (apply dynamic budget)]                 │
      │                                                │
[ai/llm (dynamic maxTokens & model)]                   │
      │                                                │
[insert_chat_message] <────────────────────────────────┘
```

---

## 4. Implementation Recipes

### Recipe 1: User & Character Configurable Custom Fields (`customFields`)
Instead of hardcoding settings inside the graph, define `customFields` on the `events/chat_message` trigger node:
```json
{
  "customFields": [
    {
      "name": "ecoMode",
      "type": "boolean",
      "description": "Enable Eco Mode to save 78% tokens",
      "defaultValue": false
    },
    {
      "name": "maxTokenBudget",
      "type": "number",
      "description": "Maximum token budget for context pruning",
      "defaultValue": 2000
    }
  ]
}
```
When attached to a character (`POST /api/v1/characters/{characterId}/behaviors`), users configure `config: { "ecoMode": true, "maxTokenBudget": 1500 }`.
Inside expressions, read directly:
```javascript
// Variable: isEcoMode
chatMessage.config.ecoMode !== undefined ? chatMessage.config.ecoMode : (getChatMessage.content.toLowerCase().indexOf('/eco on') !== -1 ? true : false)
```

### Recipe 2: Mode Detection & Toggle Expression
In `storage/set_variable`:
```javascript
// Variable: isEcoMode
$variables.isEcoMode !== undefined
  ? (getChatMessage.content.toLowerCase().indexOf('/eco on') !== -1 || getChatMessage.content.toLowerCase().indexOf('!eco') !== -1 ? true : (getChatMessage.content.toLowerCase().indexOf('/eco off') !== -1 || getChatMessage.content.toLowerCase().indexOf('!full') !== -1 ? false : $variables.isEcoMode))
  : (chatMessage.config.ecoMode !== undefined ? chatMessage.config.ecoMode : false)
```

### Recipe 3: Zero-LLM Fast-Path for Routine Queries
Before calling `ai/llm`, check if the user is performing deterministic actions (status check, inventory, dice roll, simple greetings, help menu):
```javascript
// Expression in control_flow/if:
getChatMessage.content.toLowerCase().indexOf('/help') !== -1 ||
getChatMessage.content.toLowerCase().indexOf('/status') !== -1 ||
getChatMessage.content.toLowerCase().indexOf('/inventory') !== -1 ||
getChatMessage.content.toLowerCase().indexOf('/roll') !== -1 ||
getChatMessage.content.toLowerCase().indexOf('/eco') !== -1
```
* **True Branch**: Formats response with `storage/set_variable` and sends via `storage/insert_chat_message` $\to$ **Consumes 0 AI Tokens / 0 Credits**.
* **False Branch**: Routes to `ai/llm` for creative roleplay generation.

### Recipe 4: Dynamic Context Budgeting with `ai/prune_text`
Configure `ai/prune_text`:
* **`maxTokens`**: `{{ $variables.isEcoMode ? 1200 : 5000 }}`
* **`direction`**: `"start"`
* **`text`**:
  ```javascript
  getChatMessages.data.map(m => (m.participantId === filterBot.list[0].id ? 'Character: ' : 'User: ') + m.content).join('\n')
  ```

### Recipe 5: Dynamic Model & Generation Tuning
In `ai/llm`:
* **`maxTokens`**: `{{ $variables.isEcoMode ? 250 : 800 }}`
* **`temperature`**: `{{ $variables.isEcoMode ? 0.4 : 0.8 }}`

---

## 5. Token Comparison Benchmark

| Feature | Full Quality Mode | Eco Mode | Zero-LLM Fast-Path |
|---|---|---|---|
| **Chat History Depth** | 15–20 turns | 3–5 turns | 0 turns |
| **Lore Retrieval** | 3–5 entries ($+600\text{ tok}$) | 1 entry ($+150\text{ tok}$) | Disabled ($0\text{ tok}$) |
| **Context Prune Budget**| $\approx 5,000\text{ tokens}$ | $\approx 1,000\text{ tokens}$ | $0\text{ tokens}$ |
| **Output Token Limit** | 800 tokens | 250 tokens | Output string |
| **Average Cost per Turn**| $\sim 5,800\text{ tokens}$ | $\sim 1,250\text{ tokens}$ (**$\mathbf{-78\%}$**) | $\mathbf{0\text{ tokens}}$ (**$\mathbf{-100\%}$**) |
| **Execution Latency** | $1.5\text{s} - 3.5\text{s}$ | $600\text{ms} - 1.2\text{s}$ | $\mathbf{< 80\text{ms}}$ |
