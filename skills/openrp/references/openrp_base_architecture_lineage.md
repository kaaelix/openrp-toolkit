# OpenRP-Base Architecture & Behavior Engine Lineage

This technical reference documents the official source code, schemas, and historical architecture evolution discovered in the official repository [`openrp-ai/openrp-base`](https://github.com/openrp-ai/openrp-base).

---

## 1. The Official OpenRP-Base Repository

* **GitHub Organization**: `openrp-ai`
* **Repository**: `openrp-ai/openrp-base`
* **License**: Apache 2.0
* **Core Stack**: TypeScript, Next.js App Router, Supabase Postgres, Protocol Buffers (`proto/ai/openrp/base/metadata`).

---

## 2. Architectural Evolution: V1 Prompter vs V2 Behavior DAG

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OPENRP ARCHITECTURE EVOLUTION                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
[V1: Static Prompt Pipeline]                [V2: Modular Behavior DAG Engine]
- Repository: openrp-ai/openrp-base          - Platform: https://openrp.ai/behaviors
- 3 Fixed Nodes: System, User, Assistant     - 37 Atomic Modular Nodes (5 Categories)
- Hardcoded pipeline in prompter.ts          - Custom Directed Acyclic Graphs (ReactFlow)
- Handlebars Template Compilation            - JEXL AST Expressions & Template Wrappers
- Static Vector Cosine Semantic Search       - Multi-Agent Orchestration & Game Engines
```

---

## 3. V1 Architecture Dissection (`openrp-base`)

In `openrp-base`, prompt execution was handled by `lib/prompts/prompter.ts`:

### A. Protocol Buffer Schema (`proto/ai/openrp/base/metadata/prompt_metadata.proto`)
```protobuf
syntax = "proto3";
package ai.openrp.base.metadata;

message PromptMetadata {
  optional string id = 1;
  optional string handle = 4;
  optional string name = 5;
  repeated PromptNodeMetadata system_nodes = 6;
  optional PromptNodeMetadata user_node = 7;
  optional PromptNodeMetadata assistant_node = 8;
}

enum PromptNodeType {
  PROMPT_NODE_TYPE_UNKNOWN = 0;
  PROMPT_NODE_TYPE_SYSTEM = 1;
  PROMPT_NODE_TYPE_USER = 2;
  PROMPT_NODE_TYPE_ASSISTANT = 3;
}
```

### B. Core Pipeline in `prompter.ts`:
1. **Participant Resolution**: `getReplyCharacter()` identifies the responding persona.
2. **Scan Messages Batching**: `getChatHistory()` retrieves the last `N` messages.
3. **Embedding Generation**: `generateEmbeddings(scanMessages)` converts chat history to vector vectors.
4. **Context Injection**: Injects world lore, character persona, and memories into the `system` prompt node.
5. **Token Truncation**: Truncates overflowing tokens based on `tokenizer.encode()`.

---

## 4. V2 Architecture: The 37-Node Behavior Engine

OpenRP transformed the static `prompter.ts` pipeline into the **Behavior DAG Engine**:
* `getReplyCharacter()` $\to$ `storage/get_character` & `storage/get_chat_participant`
* `scanMessages` $\to$ `storage/get_chat` + `utilities/map` (`chat.messages.data.reverse()`)
* `generateEmbeddings()` $\to$ `ai/generate_embeddings`
* `semantic_search_lore` $\to$ `storage/get_lores` with `semanticQuery: generateEmbedding.embedding`
* `parseMessages()` $\to$ `ai/count_tokens` + `ai/prune_text`
* `applyTemplate()` $\to$ JEXL AST + `{{ template }}`
* `OpenAIMessage generation` $\to$ `ai/llm` & `ai/read_llm_stream`
* `insertMessage` $\to$ `storage/insert_chat_message`
