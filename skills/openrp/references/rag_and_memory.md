# Dynamic Vector RAG & Character Long-Term Memory (LTM) Reference

This specification documents the Retrieval-Augmented Generation (RAG) and Long-Term Memory (LTM) pipeline in OpenRP.

---

## 1. Architectural Overview

OpenRP provides vector database capabilities directly embedded in the behavior execution DAG. Rather than passing static system prompts, characters dynamically recall relevant memories and factual world lore through semantic vector similarity.

```
[chat_message]
      │
[get_chat_message (parse user query)]
      │
[split (outputCount: 2)]
      ├── (out1) ──> [get_character_memories] ──────────────────────────┐
      │                   - chatId: chatMessage.chatId                   │
      │                   - query: getChatMessage.content                │
      │                   - matchThreshold: 0.7                          │
      │                                                                  │
      └── (out2) ──> [generate_embeddings]                               │
                          - content: getChatMessage.content              │
                                │                                        │
                     [get_lores (vector search)]                         │
                          - worldId: chat.world.id                       │
                          - semanticQuery: generateEmbeddings.embedding  │
                          - minConfidence: 0.75                          │
                                │                                        │
                                └────────────────────────────────────────┼──> [sync]
                                                                          │
                                                      [set_variable (synthesize context)]
                                                                          │
                                                      [llm (generate contextual reply)]
                                                                          │
                                                      [insert_chat_message]
```

---

## 2. Character Memory Node (`storage/get_character_memories`)

Retrieves conversation history memories for a specific character participant using vector similarity.

### Inputs:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `chatId` | `string` | **Yes** | UUID of the active chat context (`chatMessage.chatId`). |
| `chatParticipantId` | `string` | **Yes** | UUID of the bot participant (`filterBot.list[0].id`). |
| `query` | `string` | **Yes** | Semantic query string (usually `getChatMessage.content`). |
| `limit` | `integer` | No | Max memories to return (default: `5`). |
| `matchThreshold` | `number` | No | Minimum cosine similarity score (`0.0` to `1.0`, recommended: `0.70`). |
| `shortTermMemoryThreshold`| `integer`| No | Milliseconds threshold. Memories newer than this are prioritized without semantic decay. |

### Outputs:
- `memories` (`object[]`): Array of memory records containing text snippet, relevance score, and timestamp.

---

## 3. Dynamic Lore Semantic Search (`storage/get_lores`)

Performs cosine similarity search across world lorebooks using pre-computed embeddings.

### Inputs:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `worldId` | `string` | **Yes** | UUID of the world (`chat.world.id`). |
| `semanticQuery` | `number[]` | No | Float array embedding vector from `ai/generate_embeddings`. |
| `minConfidence` | `number` | No | Minimum cosine similarity threshold (e.g. `0.75`). |
| `characterId` | `string` | No | Filter lore entries exclusive to a specific character. |
| `limit` | `integer` | No | Max lore entries to return (default: `3`). |

### Outputs:
- `data` (`Lore[]`): Matching lorebook records (`id`, `title`, `content`, `isExclusive`, `tags`).

---

## 4. Text Embedding Generation (`ai/generate_embeddings`)

Converts arbitrary string content into a high-dimensional vector representation.

### Inputs:
- `content` (`string`): The text to embed.

### Outputs:
- `embedding` (`number[]`): Array of floating point numbers representing the semantic vector.

---

## 5. Memory & Lore Context Synthesis Pattern

To format retrieved memories and lore into an LLM prompt:

```javascript
// Inside storage/set_variable:
{
  "key": { "$template": "augmentedContext" },
  "value": {
    "$expression": "'### RELEVANT WORLD LORE:\n' + (getLores.data.length > 0 ? getLores.data.map(item => '- ' + item.title + ': ' + item.content).join('\n') : 'None') + '\n\n### CHARACTER MEMORIES:\n' + (getCharacterMemories.memories.length > 0 ? getCharacterMemories.memories.map(m => '- ' + m.content).join('\n') : 'No previous memories found.')"
  }
}
```
