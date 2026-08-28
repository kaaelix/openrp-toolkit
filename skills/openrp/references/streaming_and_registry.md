# Real-Time LLM Streaming & Behavior Registry Specification

This guide documents the real-time LLM streaming response architecture and Behavior Registry publishing protocol in OpenRP.

---

## 1. Real-Time LLM Response Streaming

When the `ai/llm` node is configured with `stream: true`, it does not block waiting for the full generation to complete. Instead, it returns immediately with a `streamKey` and streams chunks in the background.

A downstream loop then polls snapshots using `ai/read_llm_stream` and pushes incremental paragraphs as distinct chat messages.

### A. Real-Time Streaming Graph Topology:
```
[chat_message]
      │
[get_chat (expand: participants, messages)]
      │
[filter (bot participant)]
      │
[llm (stream: true)] ────────────────────────────────────────────────────────┐
      │                                                                      │ (streamKey)
[set_variable (paragraphsSent: 0)]                                           │
      │                                                                      │
[repeat_until (!readLlmStream.isFinished)] <───────────────────────────────┐ │
      │ (loopStart)                                                        │ │
[wait (1s delay to accumulate text)]                                       │ │
      │                                                                    │ │
[read_llm_stream (streamKey: llm.streamKey)] <─────────────────────────────┼─┘
      │                                                                    │
[string_split (separator: "\n\n", text: readLlmStream.snapshot...content)] │
      │                                                                    │
[if (hasUnsentParagraphs)] ──────────────────┐ (false)                     │
      │ (true)                               │                             │
[repeat_until (send all unsent paragraphs)]  │                             │
      │ (loopStart)                          │                             │
[insert_chat_message (current paragraph)]    │                             │
      │                                      │                             │
[set_variable (paragraphsSent += 1)]         │                             │
      │                                      │                             │
[wait (0.5s)] ──> (loopEnd on inner loop)    │                             │
      │                                      │                             │
[end_if] <───────────────────────────────────┘                             │
      │                                                                    │
      └────────────────────────────────────────────────────────────────────┘ (loopEnd on outer loop)
```

### B. Core Node Configurations for Streaming:
1. **`ai/llm`**:
   - `stream: true`
   - `prompt: "{{ getChat.messages.data[0].content }}"`
   - `modelId: chatMessage.modelSettings.chatModelId`
2. **`ai/read_llm_stream`**:
   - `streamKey: llm.streamKey`
   - Emits:
     - `isFinished` (boolean): `true` when generation has completed.
     - `snapshot` (object): Current partial OpenAI `ChatCompletionSnapshot` object with `choices[0].message.content`.
3. **`utilities/string_split`**:
   - `text: readLlmStream.snapshot.choices[0].message.content || ""`
   - `separator: "\n\n"`
4. **Paragraph Unsent Evaluation Expression**:
   ```javascript
   (stringSplit.array.length - (readLlmStream.isFinished ? 0 : 1)) > $variables.paragraphsSent
   ```
   *(Note: Skips the last paragraph while `isFinished === false` because the AI is still actively writing that paragraph!)*

---

## 2. Behavior Registry & Community Sharing

The **Behavior Registry** is OpenRP's public repository for discovering, sharing, and versioning reusable behavior graphs.

### A. Semantic Versioning Protocol
When publishing a behavior to the registry, assign a strict Semantic Version number (`MAJOR.MINOR.PATCH`, e.g. `1.0.0`, `1.1.0`):
- **MAJOR** (`1.0.0` $\to$ `2.0.0`): Breaking changes to expected inputs, custom fields, or graph execution contracts.
- **MINOR** (`1.0.0` $\to$ `1.1.0`): Backwards-compatible new features (e.g. adding dice roll support to an existing combat engine).
- **PATCH** (`1.0.0` $\to$ `1.0.1`): Minor bug fixes and expression optimizations.

### B. Graph Immutability Rule
> [!IMPORTANT]
> **Published behavior versions are permanently immutable snapshots.**
> Once version `1.0.0` is published, its ReactFlow graph definition cannot be edited or overwritten. Any changes require incrementing the version number (e.g. `1.0.1` or `1.1.0`) and publishing a new release.

### C. Behavior Registry Visibility
- All published behaviors are publicly discoverable in the Behavior Registry regardless of whether they originated from a public or private world.
- To attach a registry behavior to a character, specify `behaviorRegistryTagId` or `behaviorRegistryVersionId` during character binding.
