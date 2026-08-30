# Complete Runtime Output Snapshots Encyclopedia (All 37 Nodes)

This exhaustive technical reference provides the **exact runtime output JSON payload (`output`)** for **all 37 OpenRP behavior nodes**, along with required input schemas, validation invariants, and downstream expression paths.

---

## 1. Events Nodes (3 Nodes)

### 1. `events/chat_message`
* **Trigger**: Fired when a user or bot sends a message in a chatroom.
* **Output Payload (`output`)**:
```json
{
  "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
  "messageId": "01a046a4-cba8-740f-a165-2d4f1131e7b9"
}
```
* **Downstream Access**:
  * `chatMessage.chatId` (string, UUID)
  * `chatMessage.messageId` (string, UUID)

---

### 2. `events/cron`
* **Trigger**: Scheduled execution based on cron syntax.
* **Output Payload (`output`)**:
```json
{
  "timestamp": "2026-08-28T06:30:00.000Z"
}
```
* **Downstream Access**:
  * `cronTrigger.timestamp` (string, ISO 8601)

---

### 3. `events/button_click`
* **Trigger**: Fired when a user clicks an interactive UI button in chat.
* **Output Payload (`output`)**:
```json
{
  "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
  "buttonId": "btn_cast_spell_fireball",
  "participantId": "01a046a4-a3f8-721a-8db5-4189d1535808"
}
```
* **Downstream Access**:
  * `buttonClick.buttonId` (string)
  * `buttonClick.chatId` (string, UUID)
  * `buttonClick.participantId` (string, UUID)

---

## 2. AI & Generation Nodes (8 Nodes)

### 4. `ai/llm`
* **Output Payload (`output`)**:
```json
{
  "outputText": "\"Salam, pengembara.\" *Pedang cahayanya bergetar lembut.* \"Apa tujuanmu melintasi batas Aetheria?\"",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 382,
    "completionTokens": 74,
    "totalTokens": 456
  }
}
```
* **Downstream Access**:
  * `generateReply.outputText` (string)
  * `generateReply.finishReason` ("stop" | "length" | "tool_calls")
  * `generateReply.usage.totalTokens` (number)

---

### 5. `ai/generate_embeddings`
* **Output Payload (`output`)**:
```json
{
  "embedding": [
    0.01423854,
    -0.03819402,
    0.08920194,
    -0.00219481,
    0.05739182
  ]
}
```
* **Downstream Access**:
  * `generateEmbedding.embedding` (number[], float vector)

---

### 6. `ai/count_tokens`
* **Output Payload (`output`)**:
```json
{
  "count": 420
}
```
* **Downstream Access**:
  * `countTokens.count` (number)

---

### 7. `ai/prune_text`
* **Output Payload (`output`)**:
```json
{
  "text": "User: Serang target\nBot: Target berhasil dilumpuhkan.",
  "tokenCount": 180
}
```
* **Downstream Access**:
  * `pruneHistory.text` (string)
  * `pruneHistory.tokenCount` (number)

---

### 8. `ai/get_default_model`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "64ffc716-89a3-456e-9a95-ef4095f7d781",
    "name": "Meta Llama 3.3 70B Instruct",
    "provider": "together",
    "contextLimit": 128000
  }
}
```
* **Downstream Access**:
  * `getDefaultModel.data.id` (string, UUID)
  * `getDefaultModel.data.name` (string)

---

### 9. `ai/get_model`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a02b8b-4c58-7848-ab88-593c79040b43",
    "name": "Claude 3.5 Sonnet",
    "provider": "anthropic",
    "contextLimit": 200000
  }
}
```
* **Downstream Access**:
  * `getModel.data.id` (string, UUID)
  * `getModel.data.contextLimit` (number)

---

### 10. `ai/get_models`
* **Output Payload (`output`)**:
```json
{
  "data": [
    { "id": "64ffc716-89a3-456e-9a95-ef4095f7d781", "name": "Llama 3.3 70B" },
    { "id": "01a02b8b-4c58-7848-ab88-593c79040b43", "name": "Claude 3.5 Sonnet" }
  ]
}
```
* **Downstream Access**:
  * `getModels.data` (array of model objects)

---

### 11. `ai/read_llm_stream`
* **Output Payload (`output`)**:
```json
{
  "chunk": " dan bayangan mulai memudar.",
  "isDone": true,
  "accumulatedText": "Pedang astral bercahaya terang dan bayangan mulai memudar."
}
```
* **Downstream Access**:
  * `readStream.chunk` (string)
  * `readStream.isDone` (boolean)
  * `readStream.accumulatedText` (string)

---

## 3. Control Flow & Logic Nodes (8 Nodes)

### 12. `control_flow/if`
* **Output Payload (`output`)**:
```json
{
  "next": "true",
  "data": {}
}
```
* **Branch Handles**: `true` | `false`

---

### 13. `control_flow/end_if`
* **Output Payload (`output`)**:
```json
{
  "next": "next",
  "data": {}
}
```
* **Downstream Access**: Standard linear continuation.

---

### 14. `control_flow/split`
* **Output Payload (`output`)**:
```json
{
  "next": ["out1", "out2"]
}
```
* **Branch Handles**: `out1`, `out2`, `out3`, ...

---

### 15. `control_flow/sync`
* **Output Payload (`output`)**:
```json
{
  "next": "next",
  "data": {}
}
```
* **Requirement**: `inputCount` only (verified live). `lcaNodeId` is optional/legacy.

---

### 16. `control_flow/switch`
* **Output Payload (`output`)**:
```json
{
  "next": "case1",
  "data": { "value": "attack" }
}
```
* **Branch Handles**: `case1`, `case2`, `default`

---

### 17. `control_flow/wait`
* **Output Payload (`output`)**:
```json
{
  "next": "next"
}
```
* **Downstream Access**: Triggered after specified millisecond delay.

---

### 18. `control_flow/try`
* **Output Payload - Success Branch (`output`)**:
```json
{
  "next": "success",
  "data": {}
}
```
* **Output Payload - Error Branch (`output`)**:
```json
{
  "next": "error",
  "data": {
    "error": "Upstream service timeout: 504 Gateway Timeout"
  }
}
```
* **Downstream Access**: `tryBlock.data.error` (on error handle)

---

### 19. `control_flow/repeat_until`
* **Output Payload - Next Iteration (`output`)**:
```json
{
  "next": "loopStart",
  "data": {
    "loopCount": 3
  }
}
```
* **Output Payload - Loop Terminated (`output`)**:
```json
{
  "next": "next",
  "data": {
    "loopCount": 4
  }
}
```
* **Downstream Access**: `loopNode.data.loopCount` (number)

---

## 4. Storage & State Nodes (12 Nodes)

### 20. `storage/get_chat`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "name": "Aetheria Party",
    "ownerId": "019f4c49-0ec7-7374-8fab-d7e8add428bc",
    "chatModelId": "64ffc716-89a3-456e-9a95-ef4095f7d781",
    "participants": {
      "data": [
        {
          "id": "01a046a4-a3f8-721a-8db5-4189d1535809",
          "userId": null,
          "characterId": "01a0467c-2c62-7654-a4e9-3917119f29f3",
          "name": "Archon Aurelia"
        },
        {
          "id": "01a046a4-a3f8-721a-8db5-4189d1535808",
          "userId": "019f4c49-0ec7-7374-8fab-d7e8add428bc",
          "characterId": null,
          "name": "Kaa"
        }
      ]
    },
    "messages": {
      "data": [
        {
          "id": "01a046a4-cba8-740f-a165-2d4f1131e7b9",
          "content": "Serang ke depan!",
          "participantId": "01a046a4-a3f8-721a-8db5-4189d1535808"
        }
      ]
    }
  }
}
```
* **Downstream Access**:
  * `getChat.data.id` (string)
  * `getChat.data.participants.data` (array)
  * `getChat.data.messages.data` (array)

---

### 21. `storage/get_chat_message`
* **Output Payload (`output`)**:
```json
{
  "id": "01a046a4-cba8-740f-a165-2d4f1131e7b9",
  "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
  "content": "Saya menghunus pedang astral!",
  "participantId": "01a046a4-a3f8-721a-8db5-4189d1535808",
  "createdAt": "2026-08-28T04:33:00.000Z",
  "metadata": {
    "behaviorExecutionIds": []
  }
}
```
* **Downstream Access**:
  * `getChatMessage.content` (string)
  * `getChatMessage.participantId` (string, UUID)

---

### 22. `storage/get_chat_messages`
* **Output Payload (`output`)**:
```json
{
  "data": [
    { "id": "msg-1", "content": "Hai", "participantId": "p-1" },
    { "id": "msg-2", "content": "Halo", "participantId": "p-2" }
  ],
  "hasMore": false
}
```
* **Downstream Access**: `getMessages.data` (array)

---

### 23. `storage/insert_chat_message`
* **Mandatory Input**: `chatParticipantId` (NEVER `participantId`).
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a046a4-f8c5-762f-9240-d34094dc222e",
    "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "status": "SENT",
    "content": "Serangan pedangmu mengenai inti bayangan!",
    "metadata": {
      "behaviorExecutionIds": [
        "01a046a4-cb9c-74ce-9dd3-1f32072dc47c"
      ]
    },
    "participantId": "01a046a4-a3f8-721a-8db5-4189d1535809",
    "createdAt": "2026-08-28T04:33:31.845Z"
  }
}
```
* **Downstream Access**: `insertMessage.data.id` (string, UUID)

---

### 24. `storage/update_chat_message`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a046a4-f8c5-762f-9240-d34094dc222e",
    "content": "Konten pesan setelah diedit."
  }
}
```

---

### 25. `storage/delete_chat_message`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a046a4-f8c5-762f-9240-d34094dc222e",
    "deletedAt": "2026-08-28T04:35:00.000Z"
  }
}
```

---

### 26. `storage/get_chat_participant`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "id": "01a046a4-a3f8-721a-8db5-4189d1535808",
    "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "userId": "019f4c49-0ec7-7374-8fab-d7e8add428bc",
    "characterId": null,
    "name": "Kaa",
    "canChat": true
  }
}
```
* **Downstream Access**: `getParticipant.data.name` (string)

---

### 27. `storage/update_typing_status`
* **Mandatory Input**: `chatParticipantId` (NEVER `participantId`).
* **Output Payload (`output`)**:
```json
{
  "data": null
}
```

---

### 28. `storage/get_character`
* **Output Payload (`output`)**:
```json
{
  "id": "01a0467c-2c62-7654-a4e9-3917119f29f3",
  "name": "Archon Aurelia",
  "handle": "aurelia",
  "status": "Channeling Celestial Light 🌟",
  "description": "Archon pelindung kubah langit Aetheria...",
  "personality": "[Role(\"Celestial Archon\")][Personality(\"Noble, Fierce\")]",
  "worldId": "01a0467b-9fcc-746c-8f36-2c1ec0b46516"
}
```
* **Downstream Access**: `getCharacter.name`, `getCharacter.personality`

---

### 29. `storage/get_characters`
* **Output Payload (`output`)**:
```json
{
  "data": [
    {
      "id": "01a0467c-3ff4-706a-9e19-257656da81c9",
      "name": "Zephyr Shadowveil",
      "handle": "zephyr",
      "description": "Void assassin infiltrator."
    }
  ]
}
```
* **Downstream Access**: `getCharacters.data` (array of character objects)

---

### 30. `storage/get_lores`
* **Output Payload (`output`)**:
```json
{
  "data": [
    {
      "id": "01a0467b-lore-1",
      "title": "Batu Kristal Nexus",
      "content": "Kristal energi kosmik di pusat Aetheria yang menstabilkan gravitasi."
    }
  ]
}
```
* **Downstream Access**: `getLores.data` (array of lorebook objects)

---

### 31. `storage/set_variable`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "variables": {
      "d20Roll": 18,
      "damageVal": 45,
      "playerName": "Kaa"
    }
  }
}
```
* **Downstream Access**:
  * `$variables.d20Roll` (number)
  * `{{ $variables.playerName }}` (template string)

---

### 32. `storage/broadcast_failed_chat_message`
* **Output Payload (`output`)**:
```json
{
  "data": {
    "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "status": "FAILED"
  }
}
```

---

## 5. Utilities & Helpers Nodes (7 Nodes)

### 33. `utilities/filter`
* **Mandatory Input**: `itemCondition` MUST be `{ "$expression": "..." }`.
* **Output Payload (`output`)**:
```json
{
  "list": [
    {
      "id": "01a046a4-a3f8-721a-8db5-4189d1535809",
      "userId": null,
      "characterId": "01a0467c-2c62-7654-a4e9-3917119f29f3"
    }
  ]
}
```
* **Downstream Access**: `filterBot.list[0].id`

---

### 34. `utilities/map`
* **Mandatory Input**: `itemTemplate` MUST be `{ "$template": "..." }` or `{ "$expression": "..." }`.
* **Output Payload (`output`)**:
```json
{
  "list": [
    "Kaa: Serang void rift!",
    "Aurelia: Panah astral meluncur."
  ]
}
```
* **Downstream Access**: `mapHistory.list` (array)

---

### 35. `utilities/join`
* **Output Payload (`output`)**:
```json
{
  "text": "Kaa: Serang void rift!\n\nAurelia: Panah astral meluncur."
}
```
* **Downstream Access**: `joinHistory.text` (string, NEVER `.string`)

---

### 36. `utilities/append`
* **Output Payload (`output`)**:
```json
{
  "list": [
    "Item 1",
    "Item 2",
    "New Appended Item"
  ]
}
```
* **Downstream Access**: `appendList.list` (array)

---

### 37. `utilities/string_split`
* **Output Payload (`output`)**:
```json
{
  "list": [
    "Paragraf pertama narasi.",
    "Paragraf kedua narasi.",
    "Paragraf ketiga penutup."
  ]
}
```
* **Downstream Access**: `splitText.list` (array of strings)

---

### 38. `utilities/http_request`
* **Output Payload (`output`)**:
```json
{
  "status": 200,
  "body": {
    "imageUrl": "https://image.pollinations.ai/prompt/cyberpunk_warrior.png",
    "seed": 489201
  }
}
```
* **Downstream Access**:
  * `httpRequest.body.imageUrl` (string)
  * `httpRequest.status` (number)

---

### 39. `utilities/random_number`
* **Output Payload (`output`)**:
```json
{
  "value": 17
}
```
* **Downstream Access**: `randomNumber.value` (number)
