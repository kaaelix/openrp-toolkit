# Runtime Node Output Snapshots & Message Correlation Reference

This reference documents the **exact runtime output payloads (`output`)** returned by OpenRP nodes during real executions, and explains how `ChatMessage.metadata.behaviorExecutionIds` correlates user actions with behavior executions.

---

## 1. Why `behaviorExecutionIds` Appears on Bot Replies

When an interaction happens in an OpenRP chatroom:

```
[User sends message via POST /api/chats/{chatId}/messages]
  │
  ├─> User Message created with metadata: { behaviorExecutionIds: [] } (Empty initially)
  │
  ▼
[OpenRP Background Worker triggers Behavior DAG]
  │
  ├─> Worker assigns Execution ID: "01a046a4-cb9c-74ce-9dd3-1f32072dc47c"
  │
  ▼
[Node: storage/insert_chat_message executes]
  │
  └─> Bot Reply Message created with:
      metadata: {
        behaviorExecutionIds: ["01a046a4-cb9c-74ce-9dd3-1f32072dc47c"]
      }
```

* **User Message**: Initial payload has `behaviorExecutionIds: []` because the background behavior has not run yet.
* **Bot Reply Message**: Stamped with `behaviorExecutionIds: ["<executionId>"]`.
* **Execution Trace**: You can take any ID from `behaviorExecutionIds` and query `GET /api/v1/behavior-executions/{executionId}/node-executions` to inspect every single node's output snapshot!

---

## 2. Real Node Output Snapshots (from Official Runtime Executions)

### A. `events/chat_message`
```json
{
  "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
  "messageId": "01a046a4-cba8-740f-a165-2d4f1131e7b9"
}
```

### B. `storage/get_chat`
```json
{
  "data": {
    "id": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "name": "NEXUS-7",
    "chatModelId": "64ffc716-89a3-456e-9a95-ef4095f7d781",
    "participants": {
      "data": [
        { "id": "01a046a4-a3f8-721a-8db5-4189d1535809", "userId": null, "characterId": "01a0467c..." },
        { "id": "01a046a4-a3f8-721a-8db5-4189d1535808", "userId": "019f4c49...", "characterId": null }
      ]
    },
    "messages": {
      "data": [
        { "id": "01a046a4-cba8...", "content": "Halo NEXUS-7", "participantId": "..." }
      ]
    }
  }
}
```

### C. `utilities/filter`
* **Input Requirement**: `itemCondition` MUST be `{ "$expression": "..." }`.
* **Output Snapshot**:
```json
{
  "list": [
    {
      "id": "01a046a4-a3f8-721a-8db5-4189d1535809",
      "userId": null,
      "characterId": "01a0467c..."
    }
  ]
}
```
* Accessing in downstream nodes: `filterBot.list[0].id`

### D. `utilities/map`
* **Input Requirement**: `itemTemplate` MUST be `{ "$template": "..." }` or `{ "$expression": "..." }`.
* **Output Snapshot**:
```json
{
  "list": [
    "User: Halo NEXUS-7",
    "NEXUS-7: Selamat datang di Aetheria."
  ]
}
```
* Accessing in downstream nodes: `mapHistory.list`

### E. `utilities/join`
* **Output Snapshot**:
```json
{
  "text": "User: Halo NEXUS-7\n\nNEXUS-7: Selamat datang di Aetheria."
}
```
* Accessing in downstream nodes: `joinHistory.text` (NEVER `.string`)

### F. `ai/generate_embeddings`
* **Output Snapshot**:
```json
{
  "embedding": [0.0142, -0.0381, 0.0892, 0.0021, ...]
}
```
* Accessing in downstream nodes: `generateEmbedding.embedding`

### G. `storage/set_variable`
* **Output Snapshot**:
```json
{
  "data": {
    "variables": {
      "d20Roll": 18,
      "damageVal": 45,
      "isCritical": true
    }
  }
}
```
* Accessing globally: `$variables.d20Roll` or `{{ $variables.d20Roll }}`

### H. `control_flow/try`
* **Output Snapshot (Success Branch)**:
```json
{
  "next": "success",
  "data": {}
}
```
* **Output Snapshot (Error Branch)**:
```json
{
  "next": "error",
  "data": {
    "error": "LLM API timeout: upstream service did not respond within 30000ms"
  }
}
```

### I. `ai/llm`
* **Output Snapshot**:
```json
{
  "outputText": "\"Selamat datang di Aetheria, pengembara.\" *Cahaya bintang berkerlap-kerlip di sekelilingmu.*",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 340,
    "completionTokens": 65,
    "totalTokens": 405
  }
}
```
* Accessing in downstream nodes: `generateReply.outputText`

### J. `storage/insert_chat_message`
* **Input Requirement**: `chatParticipantId` (NOT `participantId`).
* **Output Snapshot**:
```json
{
  "data": {
    "id": "01a046a4-f8c5-762f-9240-d34094dc222e",
    "chatId": "01a046a4-a3da-733d-b13c-8a30f84e9997",
    "status": "SENT",
    "content": "Selamat datang, Kaa.",
    "metadata": {
      "behaviorExecutionIds": ["01a046a4-cb9c-74ce-9dd3-1f32072dc47c"]
    },
    "participantId": "01a046a4-a3f8-721a-8db5-4189d1535809"
  }
}
```
