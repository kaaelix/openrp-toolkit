# Official OpenRP Registry Behaviors Dissection

This reference documents the exact architecture, DAG topologies, and step execution traces of OpenRP's official core registry behaviors:
1. **`openrp/behaviors/chat` (v1.0.6)**: The 67-step streaming RAG roleplay engine.
2. **`openrp/behaviors/generate-image`**: The multimodal visual prompt synthesis & image delivery engine.

---

## 1. Official Chat Behavior (`openrp/behaviors/chat` v1.0.6)

* **Execution ID Reference**: `01a046a4-cb9c-74ce-9dd3-1f32072dc47c`
* **Total DAG Steps**: 67 iterations
* **Status**: `BEHAVIOR_EXECUTION_STATUS_COMPLETED`

### Topology Overview

```
[events/chat_message]
        │
        ▼
[storage/get_chat (expand: participants, messages)]
        │
        ├───────────────────────────────────────────────────────┐
        ▼                                                       ▼
[utilities/filter (replying bot)]              [utilities/map (reverse history)]
        │                                                       │
        ▼                                                       ▼
[storage/update_typing_status (true)]          [utilities/join (history text)]
        │                                                       │
        ▼                                                       ▼
[storage/get_character (replying)]             [ai/generate_embeddings]
        │                                                       │
        └───────────────────────┬───────────────────────────────┘
                                │
                                ▼
                      [control_flow/split (2 branches)]
                                │
        ┌───────────────────────┴───────────────────────────────┐
        ▼                                                       ▼
[storage/get_characters (semantic vector)]     [storage/get_lores (semantic vector)]
        │                                                       │
        ▼                                                       ▼
[utilities/filter (exclude self)]              [utilities/map & join (lore text)]
        │                                                       │
        └───────────────────────┬───────────────────────────────┘
                                │
                                ▼
                      [control_flow/sync]
                                │
                                ▼
                      [control_flow/try]
                                │
        ┌───────────────────────┴───────────────────────────────┐
        │ (try body: loopStart→loopEnd)                         │ (error branch)
        ▼                                                       ▼
[ai/llm (stream: true)]                         [storage/broadcast_failed_chat_message]
        │                                                       │
        ▼                                                       ▼
[ai/read_llm_stream]                            [storage/insert_chat_message (fallback)]
        │
        ▼
[storage/insert_chat_message]
        │
        ▼
[storage/update_typing_status (false)]
```

### Key Highlights & Best Practices in `openrp/behaviors/chat`:
1. **Dynamic Embedding Generation (`ai/generate_embeddings`)**:
   - Converts the last `N` chat messages into a high-dimensional vector.
2. **Dual-Branch Semantic Retrieval (`storage/get_characters` & `storage/get_lores`)**:
   - Queries world lore and characters using `semanticQuery: { "$expression": "generateEmbedding.embedding" }`.
   - Threshold confidence `minConfidence: 0.5`.
3. **Resilient Streaming & Try Boundary (`control_flow/try` & `ai/read_llm_stream`)**:
   - Streams generation token-by-token while protecting against mid-stream timeouts.

---

## 2. Official Image Generation Behavior (`openrp/behaviors/generate-image`)

The Image Generation behavior enables autonomous character visual self-expression, scenery rendering, and portrait generation during roleplay.

### Topology Overview

```
[events/chat_message]
        │
        ▼
[storage/get_chat_message]
        │
        ▼
[control_flow/if (detect image trigger, e.g. /image, /draw, or visual intent)]
        │ (true branch)
        ▼
[storage/update_typing_status (isTyping: true)]
        │
        ▼
[ai/llm (Visual Prompt Synthesis Node)]
  - System: "You are a prompt engineer for Flux.1 / Stable Diffusion. Expand the user's roleplay scene into a detailed visual prompt."
  - Output: outputText (e.g. "masterpiece, 8k, celestial archon in luminous armor...")
        │
        ▼
[control_flow/try]
        │
        ├───────────────────────────────────────────────────────┐
        ▼ (success branch)                                      ▼ (fallback branch)
[utilities/http_request (POST to Image Webhook)]       [storage/insert_chat_message]
  - URL: "https://api.pollinations.ai/prompt/..."         - "Could not render visual scene."
  - Method: "GET" or "POST"
        │
        ▼
[storage/insert_chat_message]
  - ChatId: chatMessage.chatId
  - ChatParticipantId: filterBot.list[0].id
  - Content: "![Generated Scene]({{ httpRequest.body.imageUrl ?? httpRequest.url }})\n\n*{{ visualPrompt.outputText }}*"
        │
        ▼
[storage/update_typing_status (isTyping: false)]
```

### Key Configuration Patterns for Image Behaviors:
1. **Visual Scene Prompt Expansion**:
   Use `ai/llm` with low temperature (`temperature: 0.3`) to translate character actions into descriptive text-to-image prompts.
2. **Markdown Image Formatting**:
   Format the output in `storage/insert_chat_message` with standard markdown `![Caption](url)`.
3. **Typing Status Lifecycle**:
   Always wrap long image synthesis API calls between `update_typing_status(true)` and `update_typing_status(false)`.
