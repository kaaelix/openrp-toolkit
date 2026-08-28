# OpenRP Official Behavior Graph Blueprints & Node Specifications

This reference provides the exhaustive technical blueprint, node-by-node input/output specifications, state variables, and topological layouts for OpenRP's two official behavior archetypes:

1. **Official Default 54-Node Streaming RAG Chat Behavior** (`official_chat_behavior_54nodes.json`)
2. **Official Multimodal Dynamic Image & RPG Generation Behavior** (`official_image_rpg_behavior.json`)

---

## 1. Official 54-Node Streaming RAG Chat Architecture

The official default chat behavior in OpenRP consists of **54 nodes and 62 edges**, orchestrating a 7-stage enterprise pipeline:

### 7-Stage Architectural Flow:
1. **Stage 1 (Ingestion)**:
   - `chatMessage` (`events/chat_message`): Ingests incoming `chatId`, `messageId`, and custom fields (`prompt`, `useFullDescription`).
   - `chat` (`storage/get_chat`): Expands participants and message history.
   - `filterReplyingParticipant` (`utilities/filter`): Identifies the replying bot participant (`item.userId === null && item.characterId !== null`).
   - `setTypingTrue` (`storage/update_typing_status`): Begins typing animation (`isTyping: true`).
   - `replyingCharacter` (`storage/get_character`): Fetches bot's full personality and description.
   - `userParticipant` (`storage/get_chat_participant`): Identifies the user profile and bio.

2. **Stage 2 (Parallel Semantic Embedding & RAG)**:
   - `splitParallel` (`control_flow/split`): Splits into 3 concurrent search channels (`out1`, `out2`, `out3`).
   - **Channel A (Embedding Query)**:
     - `generateEmbedding` (`ai/generate_embeddings`): Generates vector embedding from user's latest message content.
     - `getReferencedLores` (`storage/get_lores`): Performs cosine semantic search over Lorebooks with `minConfidence: 0.5`.
     - `mapLores` (`utilities/map`) $\to$ `joinLores` (`utilities/join`).
   - **Channel B (Referenced Characters)**:
     - `getReferencedCharacters` (`storage/get_characters`): Searches character directory for mentioned entities.
     - `mapCharacters` $\to$ `joinCharacters`.
   - **Channel C (Model Configuration)**:
     - `getDefaultModel` (`ai/get_default_model`): Resolves context window limits, token budget, and tokenizer (`TOKENIZER_LLAMA3`).

3. **Stage 3 (Synchronization & State Assembly)**:
   - `syncParallel` (`control_flow/sync` with `"lcaNodeId": "splitParallel"`): Barrier joins all 3 channels.
   - `buildSystemPrompt` (`utilities/template`): Merges Lorebook RAG, Character Lore, and Dialogue History into system prompt.

4. **Stage 4 (Context Budgeting & Token Pruning Loop)**:
   - `countTokens` (`ai/count_tokens`): Counts total token consumption.
   - `repeatUntilFit` (`control_flow/repeat_until`): Dynamically prunes message history from the oldest turn until the prompt fits strictly within the model's token budget.

5. **Stage 5 (Streaming Inference Inside Error Boundary)**:
   - `tryBlock` (`control_flow/try`): Wraps LLM inference and streaming.
   - `llm` (`ai/llm`): Streams tokens (`stream: true`, `modelId: getDefaultModel.id`).
   - `readStream` (`ai/read_llm_stream`): Reads token chunks sequentially.

6. **Stage 6 (Paragraph Splitting & Incremental Dispatch)**:
   - `splitParagraphs` (`utilities/string_split`): Splits long generated messages by double newlines (`\n\n`).
   - `repeatUntilParagraphsSent` (`control_flow/repeat_until`): Emits messages in natural reading chunks with `control_flow/wait` pauses.

7. **Stage 7 (Terminal Delivery & Cleanup)**:
   - `insertChatMessage` (`storage/insert_chat_message`): Persists message with `chatParticipantId`.
   - `setTypingFalse` (`storage/update_typing_status`): Deactivates typing status on all branches (`next` and `error`).

---

## 2. Official Multimodal Image & RPG Generation Architecture

The Multimodal Image & RPG behavior integrates AI visual scene generation directly into roleplay narratives:

### Core Pipeline Stages:
1. **Scene Prompt Director (`ai/llm`)**:
   - Analyzes recent dialogue and player's action.
   - Generates a concise, high-density English visual prompt (Flux / Midjourney style keywords).
2. **Dynamic Visual Artifact Synthesis**:
   - Embeds encoded visual URL into Markdown:
     ```markdown
     ![Scene Illustration](https://image.pollinations.ai/prompt/{{ encodeURIComponent(prompt) }}?width=1024&height=1024&nologo=true&enhance=true)
     ```
3. **Immersive Narrative Generator (`ai/llm`)**:
   - Synthesizes the character's reaction, dialogue, tactical stats, and embedded artwork into a single unified markdown delivery.
4. **Instant Terminal Dispatch**:
   - Delivers the complete visual story to the chatroom in a single clean turn.

---

## 3. Exported JSON Snapshot References

* **Full 54-Node Chat Blueprint**: [`official_chat_behavior_54nodes.json`](file:///data/data/com.termux/files/home/openrp-toolkit/skills/openrp/references/official_chat_behavior_54nodes.json)
* **Multimodal Image RPG Blueprint**: [`official_image_rpg_behavior.json`](file:///data/data/com.termux/files/home/openrp-toolkit/skills/openrp/references/official_image_rpg_behavior.json)
