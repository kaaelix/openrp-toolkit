# Multi-Agent & Group Chat Orchestration

## 1. Group Chat Architecture

In OpenRP, a group chat consists of multiple `participants` connected to a single `chatId`.

### Participant Model
- User Participants: Have a non-null `userId` and `characterId === null`.
- Character AI Participants: Have `userId === null` and a valid `characterId`.

---

## 2. Participant Isolation in Graphs

When multiple AI characters exist in the same chatroom, each character's attached behavior pipeline executes independently. To prevent a bot from replying to its own message or mistaking another bot for a human player, use `utilities/filter`:

```javascript
// Filter only the AI characters in the chatroom
item.userId === null

// Filter out human participants
item.userId !== null

// Filter only the character currently executing this behavior
item.characterId === myCharacterId
```

---

## 3. Multi-Bot Coordination Strategies

### Strategy A: Mention-Based Activation
The bot only responds if its `@handle` or display name is explicitly mentioned in the incoming message:

```javascript
// In control_flow/if node:
getChatMessage.content.toLowerCase().indexOf('@' + replyingCharacter.handle) !== -1 ||
getChatMessage.content.toLowerCase().indexOf(replyingCharacter.name.toLowerCase()) !== -1
```
Execution flow: If True, bot executes response. If False, pipeline halts silently.

---

### Strategy B: Round-Robin / Turn-Taking
Characters rotate turns based on the author of the most recent message in `get_chat_messages`:

```javascript
// In control_flow/if node:
// True only if the last message was NOT sent by this bot
getChatMessages.data[0].chatParticipantId !== replyingParticipant.id
```

---

### Strategy C: Game Master / Arbiter Pattern
One primary AI character acts as the central Game Master:
1. The Game Master receives user commands.
2. Calculates game state updates in sequential `storage/set_variable` nodes.
3. Posts the updated game board and invokes other NPC characters into the dialogue dynamically.
