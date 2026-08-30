# OpenRP Behavior Nodes: Complete Encyclopedia & Examples

This document is the authoritative encyclopedia for all 37 nodes in the OpenRP Behavior Engine, divided into 5 categories:
1. **Events** (2 nodes)
2. **AI & Generation** (8 nodes)
3. **Control Flow** (7 nodes)
4. **Storage & Memory** (13 nodes)
5. **Utilities** (7 nodes)

---

## CATEGORY 1: EVENTS (2 Nodes)

### 1. `events/chat_message`
* **Description**: The primary entry point for chat-driven behaviors. Fires whenever a user or participant posts a message in an attached chat.
* **Inputs**:
  * `customFields` (`TriggerCustomField[]`, optional): Array of customizable configuration fields exposed to the character binding dialog.
* **Outputs**:
  * `chatId` (`string`): UUID of the chat session.
  * `messageId` (`string`): UUID of the message that triggered the event.
  * `modelSettings` (`object`): Model configuration attached to the chat session (`chatModelId`, `inputTokens`, `outputTokens`, `temperature`).
  * `config` (`object`): Resolved key-value configuration populated from the character behavior binding.
* **Example**:
```json
{
  "id": "chatMessage",
  "type": "events/chat_message",
  "data": {
    "customFields": [
      {
        "name": "ecoMode",
        "type": "boolean",
        "description": "Enable Eco-Mode to save 78% tokens",
        "defaultValue": false
      }
    ]
  }
}
```

---

### 2. `events/cron`
* **Description**: Time-based scheduler trigger node. Fires periodically according to a standard 5-part cron expression.
* **Inputs**:
  * `cronExpression` (`string`, required): Standard cron syntax (e.g. `'0 * * * *'` for hourly, `'*/15 * * * *'` for every 15 minutes).
* **Outputs**:
  * `scheduledTime` (`string`): ISO 8601 string representation of when the schedule fired.
* **Example**:
```json
{
  "id": "hourlyTick",
  "type": "events/cron",
  "data": {
    "cronExpression": "0 * * * *"
  }
}
```

---

## CATEGORY 2: AI & GENERATION (8 Nodes)

### 3. `ai/count_tokens`
* **Description**: Calculates the exact number of tokens in a string using a specified tokenizer model.
* **Inputs**:
  * `text` (`string`, required): Text content to evaluate.
  * `tokenizer` (`string`, required): Tokenizer identifier (e.g. `"TOKENIZER_GPT4O"`).
* **Outputs**:
  * `count` (`number`): Total token count.
* **Example**:
```json
{
  "id": "countHistoryTokens",
  "type": "ai/count_tokens",
  "data": {
    "text": { "$expression": "getChatMessages.data.map(m => m.content).join('\\n')" },
    "tokenizer": "TOKENIZER_GPT4O"
  }
}
```

---

### 4. `ai/generate_embeddings`
* **Description**: Calls the vector embedding model to convert a text string into a high-dimensional float array.
* **Inputs**:
  * `content` (`string`, required): Text to generate embeddings for.
* **Outputs**:
  * `embedding` (`number[]`): Array of floating point numbers representing the vector.
* **Example**:
```json
{
  "id": "embedUserQuery",
  "type": "ai/generate_embeddings",
  "data": {
    "content": { "$expression": "getChatMessage.content" }
  }
}
```

---

### 5. `ai/get_default_model`
* **Description**: Fetches the default active language model for the current environment.
* **Inputs**:
  * `preferredModelId` (`string`, optional): Prioritize a specific model ID if available.
* **Outputs**:
  * `id` (`string`): UUID of the model.
  * `name` (`string`): Display name.
  * `contextWindow` (`number`): Max token capacity.
* **Example**:
```json
{
  "id": "fetchDefaultModel",
  "type": "ai/get_default_model",
  "data": {}
}
```

---

### 6. `ai/get_model`
* **Description**: Retrieves full metadata and configuration limits for a specific model ID.
* **Inputs**:
  * `modelId` (`string`, required): UUID of the model.
* **Outputs**:
  * Full model specification object.
* **Example**:
```json
{
  "id": "inspectModel",
  "type": "ai/get_model",
  "data": {
    "modelId": "64ffc716-89a3-456e-9a95-ef4095f7d781"
  }
}
```

---

### 7. `ai/get_models`
* **Description**: Returns the list of all available AI models supported by OpenRP.
* **Inputs**: None.
* **Outputs**:
  * `models` (`object[]`): Array of available model configurations.
* **Example**:
```json
{
  "id": "listAvailableModels",
  "type": "ai/get_models",
  "data": {}
}
```

---

### 8. `ai/llm`
* **Description**: Invokes a language model to generate text or structured JSON from a conversation prompt.
* **Inputs**:
  * `modelId` (`string`, required): Target model UUID.
  * `temperature` (`number`, required): Creativity scale (`0.0` to `2.0`).
  * `maxTokens` (`integer`, optional): Max output tokens.
  * `messages` (`LlmMessage[]`, required): Array of `{ role: "system"|"user"|"assistant", content: string, attachments?: [] }`.
  * `responseSchema` (`string`, optional): JSON Schema string to enforce structured JSON output.
  * `stream` (`boolean`, optional): When `true`, returns immediately with `streamKey`.
* **Outputs**:
  * `outputText` (`string`): Generated response.
  * `streamKey` (`string`, when stream is true): Key for `ai/read_llm_stream`.
* **Example**:
```json
{
  "id": "generatePersonaReply",
  "type": "ai/llm",
  "data": {
    "modelId": "64ffc716-89a3-456e-9a95-ef4095f7d781",
    "temperature": 0.7,
    "maxTokens": 600,
    "messages": [
      { "role": "system", "content": "You are Aurelia, an astral mage." },
      { "role": "user", "content": "{{ getChatMessage.content }}" }
    ]
  }
}
```

---

### 9. `ai/prune_text`
* **Description**: Truncates text to fit strictly within a maximum token budget.
* **Inputs**:
  * `text` (`string`, required): Raw text to prune.
  * `maxTokens` (`integer`, required): Token limit ceiling.
  * `tokenizer` (`string`, required): Tokenizer ID (`"TOKENIZER_GPT4O"`).
  * `direction` (`enum: "start"|"end"`, required): Direction to drop tokens from.
* **Outputs**:
  * `prunedText` (`string`): Truncated string.
  * `tokenCount` (`number`): Final token count.
* **Example**:
```json
{
  "id": "pruneHistory",
  "type": "ai/prune_text",
  "data": {
    "text": { "$expression": "getChatMessages.data.map(m => m.content).join('\\n')" },
    "maxTokens": 2000,
    "tokenizer": "TOKENIZER_GPT4O",
    "direction": "start"
  }
}
```

---

### 10. `ai/read_llm_stream`
* **Description**: Reads the latest partial text snapshot and completion status from an active LLM background stream.
* **Inputs**:
  * `streamKey` (`string`, required): Stream key from `ai/llm` (`llm.streamKey`).
* **Outputs**:
  * `isFinished` (`boolean`): `true` when generation is done.
  * `snapshot` (`object`): Partial OpenAI completion snapshot.
* **Example**:
```json
{
  "id": "pollStreamSnapshot",
  "type": "ai/read_llm_stream",
  "data": {
    "streamKey": { "$expression": "generatePersonaReply.streamKey" }
  }
}
```

---

## CATEGORY 3: CONTROL FLOW (7 Nodes)

### 11. `control_flow/if`
* **Description**: Evaluates a boolean condition and directs execution down the `true` or `false` branch.
* **Inputs**:
  * `condition` (`boolean expression`, required).
* **Ports**: Input `previous` | Outputs `true`, `false`.
* **Example**:
```json
{
  "id": "checkEcoMode",
  "type": "control_flow/if",
  "data": {
    "condition": { "$expression": "$variables.isEcoMode === true" }
  }
}
```

---

### 12. `control_flow/end_if`
* **Description**: Optional convergence node that merges branches originating from the same `control_flow/if` node.
* **Ports**: Inputs `in1`, `in2` | Output `next`.
* **Example**:
```json
{
  "id": "mergeIfBranches",
  "type": "control_flow/end_if",
  "data": {}
}
```

---

### 13. `control_flow/split`
* **Description**: Forks execution into multiple parallel branches executing concurrently.
* **Inputs**:
  * `outputCount` (`integer`, optional, default: 2).
* **Ports**: Input `previous` | Outputs `out1`, `out2`, ...
* **Example**:
```json
{
  "id": "splitPipeline",
  "type": "control_flow/split",
  "data": {
    "outputCount": 2
  }
}
```

---

### 14. `control_flow/sync`
* **Description**: Synchronization barrier that pauses execution until all parallel input branches arrive.
* **Inputs**:
  * `inputCount` (`integer`, optional, default: 2).
  * `lcaNodeId` (`string`, **optional/legacy**): Node ID of the originating `split` node. Verified live production graphs omit it and only set `inputCount`.
* **Ports**: Inputs `in1`, `in2`, ... | Output `next`.
* **Example**:
```json
{
  "id": "syncPipeline",
  "type": "control_flow/sync",
  "data": {
    "inputCount": 2
  }
}
```

---

### 15. `control_flow/repeat_until`
* **Description**: While/Repeat-until loop controller. Executes loop body while condition is true.
* **Inputs**:
  * `expression` (`boolean expression`, required). ⚠️ Verified 2026-08-30: the field is **`expression`**, NOT `condition` (older docs said `condition` — that fails with a Zod `invalid_type` error).
  * `checkConditionBeforeRunning` (`boolean`, optional, default: false).
* **Ports**: Inputs `previous`, `loopEnd` | Outputs `loopStart`, `next`.
* **Example**:
```json
{
  "id": "streamPollingLoop",
  "type": "control_flow/repeat_until",
  "data": {
    "expression": { "$expression": "!pollStreamSnapshot.isFinished" }
  }
}
```

---

### 16. `control_flow/try`
* **Description**: Protected execution boundary. Catches errors from downstream nodes and exposes failure details.
* **Ports**: Input `previous`, `loopEnd` | Outputs `loopStart`, `next`, `error`.
  * Body: `loopStart` → first body node `previous`; last body node `next` → `loopEnd`.
  * Success continuation: `next`.
  * Error handler: `error`.
  * ⚠️ There is **no** `success` handle (verified against live production graph).
* **Outputs**:
  * `error` (`object`): `{ code: string, message: string, nodeId: string, nodeType: string }`.
* **Example**:
```json
{
  "id": "protectedApiCall",
  "type": "control_flow/try",
  "data": {}
}
```

---

### 17. `control_flow/wait`
* **Description**: Pauses pipeline execution for a designated number of seconds.
* **Inputs**:
  * `seconds` (`number`, required): Duration in seconds (e.g. `1` or `0.5`).
* **Example**:
```json
{
  "id": "cooldownWait",
  "type": "control_flow/wait",
  "data": {
    "seconds": 1
  }
}
```

---

## CATEGORY 4: STORAGE & MEMORY (13 Nodes)

### 18. `storage/get_chat_message`
* **Description**: Fetches single message metadata and content by ID.
* **Inputs**:
  * `messageId` (`string`, required).
  * `expand` (`string[]`, optional): Relations to include (`"attachments"`, `"participant"`).
* **Outputs**:
  * `content` (`string`), `chatId` (`string`), `participantId` (`string`).
* **Example**:
```json
{
  "id": "getTriggerMessage",
  "type": "storage/get_chat_message",
  "data": {
    "messageId": { "$expression": "chatMessage.messageId" },
    "expand": ["attachments", "participant"]
  }
}
```

---

### 19. `storage/get_chat_messages`
* **Description**: Fetches a paginated list of historical chat messages from a room.
* **Inputs**:
  * `chatId` (`string`, required).
  * `limit` (`integer`, optional, default: 10).
  * `expand` (`string[]`, optional): `["attachments", "participant"]`.
* **Outputs**:
  * `data` (`Message[]`): Message history records.
* **Example**:
```json
{
  "id": "getChatHistory",
  "type": "storage/get_chat_messages",
  "data": {
    "chatId": { "$expression": "chatMessage.chatId" },
    "limit": 10,
    "expand": ["attachments", "participant"]
  }
}
```

---

### 20. `storage/get_chat`
* **Description**: Fetches chatroom metadata and associated world/participants.
* **Inputs**:
  * `chatId` (`string`, required).
  * `expand` (`string[]`, optional): `["participants", "messages"]`.
* **Outputs**:
  * `id` (`string`), `name` (`string`), `participants.data` (`Participant[]`).
* **Example**:
```json
{
  "id": "loadRoomMetadata",
  "type": "storage/get_chat",
  "data": {
    "chatId": { "$expression": "chatMessage.chatId" },
    "expand": ["participants"]
  }
}
```

---

### 21. `storage/get_chat_participant`
* **Description**: Retrieves detailed participant profile, user link, and roleplay persona.
* **Inputs**:
  * `participantId` (`string`, required).
  * `expand` (`string[]`, optional): `["roleplayProfile", "user"]`.
* **Outputs**:
  * `id` (`string`), `name` (`string`), `userId` (`string`), `characterId` (`string`).
* **Example**:
```json
{
  "id": "getSenderProfile",
  "type": "storage/get_chat_participant",
  "data": {
    "participantId": { "$expression": "filterUserParticipant.list[0].id" },
    "expand": ["roleplayProfile", "user"]
  }
}
```

---

### 22. `storage/get_character`
* **Description**: Fetches full character metadata, personality prompt, greetings, and dialogs.
* **Inputs**:
  * `characterId` (`string`, required).
* **Outputs**:
  * Character metadata object (`name`, `handle`, `prompt`, `greetings`, `dialogs`).
* **Example**:
```json
{
  "id": "loadCharacterPersona",
  "type": "storage/get_character",
  "data": {
    "characterId": "01a0467c-2c62-7654-a4e9-3917119f29f3"
  }
}
```

---

### 23. `storage/get_characters`
* **Description**: Fetches a paginated list of characters within a world with advanced filters.
* **Inputs**:
  * `worldId` (`string`, required).
  * `limit` (`integer`, optional).
* **Outputs**:
  * `data` (`Character[]`).
* **Example**:
```json
{
  "id": "listWorldCharacters",
  "type": "storage/get_characters",
  "data": {
    "worldId": "01a0467b-9fcc-746c-8f36-2c1ec0b46516",
    "limit": 10
  }
}
```

---

### 24. `storage/get_character_memories`
* **Description**: Performs vector search across character conversation memories.
* **Inputs**:
  * `chatId` (`string`, required).
  * `chatParticipantId` (`string`, required).
  * `query` (`string`, required): Semantic search query.
  * `matchThreshold` (`number`, optional): Cosine similarity threshold (e.g. `0.70`).
  * `shortTermMemoryThreshold` (`integer`, optional): Time in ms without decay.
* **Outputs**:
  * `memories` (`object[]`): Matching memory records.
* **Example**:
```json
{
  "id": "recallMemories",
  "type": "storage/get_character_memories",
  "data": {
    "chatId": { "$expression": "chatMessage.chatId" },
    "chatParticipantId": { "$expression": "filterBot.list[0].id" },
    "query": { "$expression": "getTriggerMessage.content" },
    "matchThreshold": 0.70
  }
}
```

---

### 25. `storage/get_lore`
* **Description**: Fetches a specific lorebook record by ID.
* **Inputs**:
  * `loreId` (`string`, required).
* **Outputs**:
  * Lore object (`id`, `title`, `content`, `isExclusive`).
* **Example**:
```json
{
  "id": "fetchSingleLore",
  "type": "storage/get_lore",
  "data": {
    "loreId": "01a0467b-dca8-770d-8e7a-e20e4314eaaf"
  }
}
```

---

### 26. `storage/get_lores`
* **Description**: Lists or performs semantic vector searches across world lorebooks.
* **Inputs**:
  * `worldId` (`string`, required).
  * `semanticQuery` (`number[]`, optional): Vector embedding from `ai/generate_embeddings`.
  * `minConfidence` (`number`, optional): Minimum similarity score.
* **Outputs**:
  * `data` (`Lore[]`).
* **Example**:
```json
{
  "id": "searchWorldLore",
  "type": "storage/get_lores",
  "data": {
    "worldId": "01a0467b-9fcc-746c-8f36-2c1ec0b46516",
    "semanticQuery": { "$expression": "embedUserQuery.embedding" },
    "minConfidence": 0.75
  }
}
```

---

### 27. `storage/set_variable`
* **Description**: Stores arbitrary run-scoped variables into the `$variables` store.
* **Inputs**:
  * `variables` (`array`): Array of `{ key: { "$template": "name" }, value: { "$expression" | "$template": "..." } }`.
* **Example**:
```json
{
  "id": "setGameState",
  "type": "storage/set_variable",
  "data": {
    "variables": [
      {
        "key": { "$template": "playerScore" },
        "value": { "$expression": "$variables.playerScore + 100" }
      },
      {
        "key": { "$template": "statusMsg" },
        "value": { "$template": "Player scored! Current: {{ $variables.playerScore }}" }
      }
    ]
  }
}
```

---

### 28. `storage/get_variable`
* **Description**: Explicit visual retrieval node for a variable in the store.
* **Inputs**:
  * `key` (`string`, required).
* **Outputs**:
  * `value` (`any`).
* **Example**:
```json
{
  "id": "readScore",
  "type": "storage/get_variable",
  "data": {
    "key": "playerScore"
  }
}
```

---

### 29. `storage/insert_chat_message`
* **Description**: Creates and posts a new message to the chatroom.
* **Inputs**:
  * `chatId` (`string`, required).
  * `chatParticipantId` (`string`, required): Participant ID sending the message.
  * `content` (`string`, required, template supported).
* **Outputs**:
  * Message record.
* **Example**:
```json
{
  "id": "sendBotReply",
  "type": "storage/insert_chat_message",
  "data": {
    "chatId": { "$expression": "chatMessage.chatId" },
    "chatParticipantId": { "$expression": "filterBot.list[0].id" },
    "content": { "$template": "{{ generatePersonaReply.outputText }}" }
  }
}
```

---

### 30. `storage/update_typing_status`
* **Description**: Toggles the frontend visual typing indicator for a character.
* **Inputs**:
  * `participantId` (`string`, required).
  * `isTyping` (`boolean`, required).
* **Example**:
```json
{
  "id": "startTyping",
  "type": "storage/update_typing_status",
  "data": {
    "participantId": { "$expression": "filterBot.list[0].id" },
    "isTyping": true
  }
}
```

---

## CATEGORY 5: UTILITIES (7 Nodes)

### 31. `utilities/filter`
* **Description**: Filters an array based on a JEXL condition evaluated for each `item`.
* **Inputs**:
  * `list` (`array`, required).
  * `itemCondition` (`boolean expression`, required).
* **Outputs**:
  * `list` (`array`): Filtered subset.
* **Example**:
```json
{
  "id": "filterBotParticipant",
  "type": "utilities/filter",
  "data": {
    "list": { "$expression": "loadRoomMetadata.participants.data" },
    "itemCondition": { "$expression": "item.userId === null && item.characterId !== null" }
  }
}
```

---

### 32. `utilities/map`
* **Description**: Transforms an array into a new array by evaluating a template or expression on each `item`.
* **Inputs**:
  * `list` (`unknown[]`, required): Input array to iterate over.
  * `itemTemplate` (`object`, required): Must be an object with `{ "$template": "..." }` or `{ "$expression": "..." }`. The current item is exposed as `item`.
* **Outputs**:
  * `list` (`unknown[]`): Transformed mapped array.
* **Example**:
```json
{
  "id": "mapMessageStrings",
  "type": "utilities/map",
  "data": {
    "list": { "$expression": "getChatHistory.data" },
    "itemTemplate": {
      "$template": "{{ item.participant ? item.participant.name : 'User' }}: {{ item.content }}"
    }
  }
}
```

---

### 33. `utilities/append`
* **Description**: Appends a single item or concatenates an array onto an existing list.
* **Inputs**:
  * `list` (`array`, required).
  * `item` (`any`, required).
* **Outputs**:
  * `list` (`array`).
* **Example**:
```json
{
  "id": "appendSystemNote",
  "type": "utilities/append",
  "data": {
    "list": { "$expression": "mapMessageStrings.list" },
    "item": "[System: The boss has entered Phase 2!]"
  }
}
```

---

### 34. `utilities/join`
* **Description**: Converts an array of strings into a single delimited string.
* **Inputs**:
  * `list` (`string[]`, required).
  * `separator` (`string`, required, e.g. `"\n"`).
* **Outputs**:
  * `string` (`string`).
* **Example**:
```json
{
  "id": "joinDialogueLines",
  "type": "utilities/join",
  "data": {
    "list": { "$expression": "mapMessageStrings.list" },
    "separator": "\n"
  }
}
```

---

### 35. `utilities/string_split`
* **Description**: Splits a text string into an array of substrings using a separator delimiter.
* **Inputs**:
  * `text` (`string`, required).
  * `separator` (`string`, required, e.g. `"\n\n"`).
* **Outputs**:
  * `array` (`string[]`).
* **Example**:
```json
{
  "id": "splitParagraphs",
  "type": "utilities/string_split",
  "data": {
    "text": { "$expression": "pollStreamSnapshot.snapshot.choices[0].message.content || ''" },
    "separator": "\n\n"
  }
}
```

---

### 36. `utilities/http_request`
* **Description**: Dispatches an external HTTP request (30s timeout).
* **Inputs**:
  * `url` (`string`, required, public `https://`).
  * `method` (`enum: GET|POST|PUT|DELETE|PATCH`, required).
  * `headers` (`enum: JSON|TEXT`, required).
  * `body` (`string`, optional).
* **Outputs**:
  * `status` (`number`), `headers` (`object`), `body` (`parsed JSON or raw text`).
* **Example**:
```json
{
  "id": "fetchExternalWeather",
  "type": "utilities/http_request",
  "data": {
    "url": "https://api.weatherapi.com/v1/current.json?q=Tokyo",
    "method": "GET",
    "headers": "JSON"
  }
}
```

---

### 37. `utilities/comment`
* **Description**: Non-executing visual annotation box placed on the ReactFlow canvas for documentation.
* **Inputs**:
  * `text` (`string`, required).
* **Example**:
```json
{
  "id": "canvasNote",
  "type": "utilities/comment",
  "position": { "x": 100, "y": -100 },
  "data": {
    "text": "STAGE 2: Evaluate Combat Rules and Deduct Boss HP"
  }
}
```
