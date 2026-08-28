# Multi-Agent & Group Chat Orchestration Reference Manual

This manual provides complete specifications, topology blueprints, JEXL expressions, and lifecycle operations for orchestrating Multi-Agent Group Chats, managing character behaviors, and editing group pipelines in OpenRP.

---

## 0. Disambiguation: CharacterGroup vs Group Chat

In OpenRP architecture, the term **Group** refers to two fundamentally different concepts:

### 1. `CharacterGroup` (World-Level Character Factions & Hierarchies)
* **Domain**: World Design & NPC Taxonomy.
* **REST Route**: `GET /api/v1/worlds/{worldId}/character-groups`
* **MCP Tool**: `openrp_list_character_groups`
* **Purpose**: Organizes characters in a World into sub-factions, guilds, or party divisions (e.g. `"all-characters"`, `"adventurers-guild"`, `"cyber-syndicate"`).
* **Behavior Support**: Can attach shared behavior graphs (`characterBehaviors`) that cascade to characters within that group hierarchy.

### 2. `Group Chat` (Runtime Multi-Agent Conversation Session)
* **Domain**: Live Multi-Participant Messaging & State Machines.
* **REST Route**: `GET /api/chats/{chatId}` & `POST /api/chats/{chatId}/messages`
* **MCP Tools**: `openrp_list_chats`, `openrp_get_chat`, `openrp_get_chat_messages`, `openrp_send_message`
* **Purpose**: An active interactive room connecting human users (`userId !== null`) with one or more AI character bots (`userId === null`).
* **Behavior Execution**: When a message is sent to the chatroom, OpenRP dispatches an `events/chat_message` trigger event to the behavior pipeline of each participating character bot.

---

## 1. Group Chat Architecture & Data Models

In OpenRP, a Group Chat represents a multi-participant session connecting multiple human users and multiple AI character bots to a single shared message stream (`chatId`).

### Participant Model Schema
```typescript
interface ChatParticipant {
  id: string;                 // Unique participant identifier in the chatroom
  chatId: string;             // Owning chat session ID
  userId: string | null;      // Non-null for human players; null for AI characters
  characterId: string | null; // Non-null for AI characters; null for human users
  role: "admin" | "member";
  isMuted: boolean;
  createdAt: string;
}
```

### Behavior-to-Character Binding (`CharacterBehavior`)
```typescript
interface CharacterBehavior {
  id: string;                 // Unique binding record ID
  characterId: string;        // Attached character ID
  behaviorId: string;         // Executing behavior graph topology ID
  createdAt: string;
}
```

---

## 2. Character Behavior Lifecycle Operations

### A. Deploying / Binding Behavior to Character (`openrp_deploy_behavior`)
When a behavior graph is deployed:
1. All node connections are validated and serialized with standard `xy-edge__` format.
2. The behavior graph is saved in the World database (`POST /api/users/{userId}/worlds/{worldId}/behaviors`).
3. The behavior is attached to the character (`POST /api/characters/{characterId}/behaviors`).
4. If `deleteOldBehaviors=true`, previous behavior bindings and unlinked orphan graphs are cleaned up.

### B. Detaching / Deleting Behavior from Character (`openrp_delete_behavior`)
To permanently detach and remove a behavior:
```python
openrp_delete_behavior(
    userId="<userId>",
    worldId="<worldId>",
    behaviorId="<behaviorId>"
)
```
* **Engine Effect**: Deleting the behavior graph automatically breaks the `CharacterBehavior` binding. The character reverts to the default system prompt fallback without crashing active chatrooms.

### C. Live In-Place Node Editing (`openrp_edit_behavior_node`)
Modify prompts, temperature, conditions, or expressions without re-deploying or disrupting active chat sessions:
```python
openrp_edit_behavior_node(
    userId="<userId>",
    worldId="<worldId>",
    behaviorId="<behaviorId>",
    nodeId="llmChat",
    nodeData={
        "systemPrompt": "You are Eldrin. Coordinate party tactics in combat.",
        "temperature": 0.7
    }
)
```

### D. Full Topology Updating (`openrp_update_behavior`)
Updates the entire graph structure, adding/removing nodes and rewiring edges while preserving the existing `behaviorId` binding on the character.

---

## 3. Multi-Agent Group Coordination Blueprints

When multiple AI characters join the same chatroom, each bot's behavior graph triggers on `events/chat_message`. Without coordination gates, bots will reply to each other in infinite loops. Use one of the three proven patterns below:

---

### 🏛️ Blueprint 1: Mention-Gated Activation (Recommended)
The AI character only generates a response if its `@handle` or display name is mentioned in the incoming user message.

#### Graph Layout & Topology
```
[events/chat_message] (X: 100, Y: 200)
       │
       ▼
[storage/get_chat] (X: 350, Y: 200, expand: ["participants"])
       │
       ▼
[utilities/filter (botFilter)] (X: 600, Y: 200, expr: item.characterId === myCharId)
       │
       ▼
[control_flow/if (mentionGate)] (X: 850, Y: 200)
       ├── [True Branch]  ──► [ai/llm] (X: 1100, Y: 120) ──► [storage/insert_chat_message] (X: 1350, Y: 120)
       └── [False Branch] ──► [control_flow/end_if] (X: 1100, Y: 280) (Halt silently)
```

#### Exact JEXL Expressions:
* **Bot Participant Filter (`botFilter`)**:
  ```javascript
  item.userId === null && item.characterId === "<my_character_id>"
  ```
* **Mention Gate Expression (`mentionGate`)**:
  ```javascript
  getChatMessage.content.toLowerCase().indexOf("@" + getCharacter.handle.toLowerCase()) != -1 ||
  getChatMessage.content.toLowerCase().indexOf(getCharacter.name.toLowerCase()) != -1
  ```
* **Message Insertion Payload (`insert_chat_message`)**:
  * `chatParticipantId`: `{ "$expression": "botFilter.list[0].id" }`
  * `content`: `{ "$expression": "llmNode.content" }`

---

### 🔄 Blueprint 2: Round-Robin / Turn-Taking Pattern
Bots take turns participating in group discussions. A bot only speaks if the last speaker was a human or a different bot.

#### Graph Logic & Turn Checking:
```javascript
// In control_flow/if node:
// Verify that the incoming message did NOT originate from this bot
getChatMessage.chatParticipantId !== botFilter.list[0].id &&
// Verify that the author was a human user
getChatParticipant.userId !== null
```

---

### ⚔️ Blueprint 3: Central Game Master & Arbiter Pattern
One primary character acts as the Arbiter (Game Master). Other party members act as dynamic support NPCs:

1. **Arbiter Stage**:
   * Evaluates user action / dice roll / tactical command.
   * Updates state variables via `storage/set_variable` (e.g. `party_hp`, `boss_phase`, `inventory`).
2. **Support Trigger Stage**:
   * If a party member is called to assist, the Arbiter's graph triggers a sub-dialogue or inserts companion comments via dedicated participant IDs.
3. **HUD Broadcast**:
   * Arbiter renders the updated Game Board / Status HUD to the chatroom.

---

## 4. Universal JEXL Expression Cheat Sheet for Group Chat

| Requirement | Pure JEXL Expression |
|---|---|
| Filter Human Users Only | `item.userId != null` |
| Filter AI Characters Only | `item.userId == null` |
| Filter Specific Bot by ID | `item.characterId == "<character_id>"` |
| Mention Detection by Handle | `getChatMessage.content.toLowerCase().indexOf("@" + "<handle>") != -1` |
| Command Detection (e.g. `/attack`) | `getChatMessage.content.toLowerCase().startsWith("/attack")` |
| Extract Target from Message | `getChatMessage.content.split(" ")[1]` |
| Read Global State Variable | `$variables.boss_hp` |
| Check If Last Speaker Was Human | `getChatParticipant.userId != null` |

---

## 5. Tracing & Debugging Group Behavior Executions

When testing multi-agent group chats:
1. Search execution sessions via `openrp_search_behavior_executions(chatId="...")`.
2. Inspect overall status and trigger message via `openrp_get_behavior_execution(executionId="...")`.
3. Inspect granular 38-node execution logs via `openrp_get_behavior_node_executions(executionId="...")` to verify:
   * Whether the mention gate evaluated to `true` or `false`.
   * What participant ID was resolved by `utilities/filter`.
   * The exact token count and prompt sent to `ai/llm`.
