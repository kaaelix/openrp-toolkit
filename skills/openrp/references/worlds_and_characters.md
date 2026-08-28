# Worlds, Lorebooks, Characters & Prompt Templates Specification

## 1. User ID Disambiguation & Authentication Protocol

> [!IMPORTANT]
> **OpenRP has two distinct user IDs**. Using the wrong ID in route paths or payload properties will result in `HTTP 400 bad_request_body` or `HTTP 403 forbidden`.
>
> 1. **Supabase Auth UID (`auth.uid()` / UUIDv4, e.g., `0d24041d-23b1-465a-9f37-110c0c0729f1`)**:
>    - Found in the JWT payload under `sub` / `user_id`.
>    - **MUST be used in all user-scoped REST route URLs**: `/api/users/{authUid}/worlds`, `/api/users/{authUid}/worlds/{worldId}/...`
>    - **MUST be used as the `owner` field value** in world creation payloads.
> 2. **OpenRP Platform Account ID (UUIDv7, e.g., `019f4c49-0ec7-7374-8fab-d7e8add428bc`)**:
>    - Returned in `openrp_get_me.data.id`.
>    - Represents public profiles, follower lists, and chat participant identifiers.

---

## 2. World Schema & Lifecycle Operations

A World in OpenRP represents an overarching universe, lore repository, and vector database for all resident characters, lore entries, prompt templates, and behaviors.

### Complete World Creation Payload (`POST /api/users/{authUid}/worlds`)
```json
{
  "owner": "0d24041d-23b1-465a-9f37-110c0c0729f1",
  "name": "Neon Arcadia 2099",
  "handle": "neon-arcadia-2099",
  "description": "An underground cyberpunk arcade where humans and synthetic intelligences compete.",
  "tags": ["cyberpunk", "arcade", "game", "tactical"],
  "visibility": "WORLD_VISIBILITY_PUBLIC",
  "chatOnly": false
}
```

### Complete World Update Payload (`PUT /api/users/{authUid}/worlds/{worldId}`)
World updates use a polymorphic `updateType: "metadata"` envelope:
```json
{
  "updateType": "metadata",
  "data": {
    "name": "Neon Arcadia 2099 ⚡",
    "description": "Updated cyberpunk multi-agent gaming realm.",
    "readme": "# Neon Arcadia Lorebook\n\nFull markdown documentation...",
    "tags": ["cyberpunk", "arcade"],
    "visibility": "WORLD_VISIBILITY_PUBLIC"
  }
}
```

### World Visibility Specifications (Official Developer Rules)
- `WORLD_VISIBILITY_PUBLIC`: Public visibility. Visible in global explore feeds, community discover queries, and public profile listings.
- `WORLD_VISIBILITY_UNLISTED`: Unlisted visibility. Currently functions the same as public, for now.
- `WORLD_VISIBILITY_PRIVATE`: Private visibility. **Requires OpenRP Plus/Pro plan** (`isPlus: true`). Free tier accounts attempting to set private visibility will be rejected by the backend.

### World README.md Editing (`openrp_update_world_readme`)
The main World documentation (README) supports full GitHub Flavored Markdown up to 5,000 words:
```json
{
  "updateType": "metadata",
  "data": {
    "readme": "# Cyber Neon Realm\n\nWelcome to the official arena!\n\n### Rules & Attractions:\n- Challenge the Game Master bot with coordinate moves (0-8).\n- Party roleplay with Eldrin the Mage."
  }
}
```

### World Deletion (`DELETE /api/users/{authUid}/worlds/{worldId}`)
Permanently deletes the world and all child entities (characters, behaviors, prompts, lores).

---

## 3. Granular Lorebook System (`/lore`)

In addition to the world `readme`, individual factual entries are managed via `/lore`:
- `title`: Subject title of the entry.
- `handle`: Unique slug for graph referencing.
- `content`: Explicit background details, rules, and constraints.
- `isExclusive`: Boolean flag (`true`/`false`) determining whether the lore is confidential and exclusive to specific characters or vector RAG queries.

### Creation Payload (`POST /api/users/{authUid}/worlds/{worldId}/lore`)
```json
{
  "title": "The Astral Heart Crystal",
  "handle": "astral-heart-crystal",
  "content": "A sacred relic that stabilizes reality and boosts astral magic by 500%.",
  "isExclusive": false
}
```

### Exclusive Lore & Character Access:
* When `isExclusive: true`, the lorebook entry is hidden from the general world lore context and is only supplied to assigned characters or triggered via targeted RAG searches.
* **`openrp_list_lore_characters`** (`GET /api/users/{authUid}/worlds/{worldId}/lore/{loreId}/characters`): Lists all characters that have access to this exclusive lore entry.
* **`openrp_list_character_lores`** (`GET /api/users/{authUid}/worlds/{worldId}/characters/{characterId}/lore`): Lists all exclusive and assigned lore entries that a specific character can access.

---

## 4. Character Studio & Persona Engineering

Characters represent autonomous bots living within a World.

> [!NOTE]
> Character creation **requires** both `dialogs: []` and `greetings: []` to be present as arrays in the payload. Omitting either field causes `HTTP 400 bad_request_body`.

### Character Creation Payload (`POST /api/users/{authUid}/worlds/{worldId}/characters`)
```json
{
  "name": "Archon Aurelia",
  "handle": "aurelia",
  "status": "Channeling Celestial Light 🌟",
  "shortDescription": "Celestial Sorceress and protector of the Astral Heart.",
  "description": "Aurelia is the high archon who leads the Astral Order with starlight magic and dimensional barriers.",
  "personality": "[Character(\"Archon Aurelia\")][Role(\"Celestial Archon\")][Personality(\"Wise\", \"Protective\", \"Regal\")][Skills(\"Astral Barrier\", \"Mana Restoration\", \"Starfall Strike\")]",
  "dialogs": [],
  "greetings": []
}
```

### Character Update Payload (`PUT /api/users/{authUid}/worlds/{worldId}/characters/{characterId}`)
Updates name, status, shortDescription, full description, personality, greetings, and dialog examples.

### Character Deletion (`DELETE /api/users/{authUid}/worlds/{worldId}/characters/{characterId}`)
Permanently removes the character from the world.

---

## 5. Character-Behavior Binding

Behaviors are attached to Characters using the V1 character binding route:

### Attachment Payload (`POST /api/v1/characters/{characterId}/behaviors`)
```json
{
  "behaviorId": "01a0467c-76e0-75fc-9d6d-a7e4ae57f65a",
  "behaviorRegistryTagId": null,
  "config": {
    "ecoMode": true,
    "difficulty": "hard",
    "greetingStyle": "mystical"
  }
}
```
- `config`: An arbitrary key-value object matching the `customFields` defined on the behavior's `events/chat_message` trigger node. This allows configuring behavior parameters per-character without editing the underlying graph.

### List Attached Behaviors (`GET /api/v1/characters/{characterId}/behaviors`)
Returns all active behavior bindings for the character, including resolved `config` values.

### Detach Behavior (`DELETE /api/v1/character-behaviors/{characterBehaviorId}`)
Removes a specific behavior attachment by its binding ID.

> [!IMPORTANT]
> **Disabling Default Behavior (`openrp/behaviors/chat`) During Custom Development**:
> By default, OpenRP attaches the standard `openrp/behaviors/chat` registry behavior. If you attach a custom behavior without detaching the default behavior, **both behaviors will trigger concurrently on every chat message**, resulting in double replies and token waste.
> **Rule**: When testing or deploying a custom behavior DAG, always detach `openrp/behaviors/chat` from the character or character group.

---

## 6. Factions & Character Groups (`/character-groups`)

Worlds can organize characters into hierarchical factions or groups.

### Character Group Behavior Inheritance:
> **"Behaviors attached directly to this character group. All member characters in this group will trigger these behaviors."**

When a behavior is attached to a Character Group (`POST /api/v1/character-groups/{groupId}/behaviors`), all member characters automatically inherit and execute the behavior pipeline upon receiving chat messages.

### Character Group Routes:
* **List Groups**: `GET /api/v1/worlds/{worldId}/character-groups`
* **Create Group**: `POST /api/v1/worlds/{worldId}/character-groups`
  ```json
  {
    "name": "Astral Defenders League",
    "handle": "astral-defenders",
    "description": "Alliance of cosmic guardians defending the Astral Heart crystal.",
    "autoAddMembers": true
  }
  ```
* **List Group Behaviors**: `GET /api/v1/character-groups/{groupId}/behaviors`
* **Attach Group Behavior**: `POST /api/v1/character-groups/{groupId}/behaviors`
  ```json
  {
    "behaviorId": "01a04697-412b-718b-a31d-b770dd018f0b",
    "config": { "ecoMode": true }
  }
  ```
* **Detach Group Behavior**: `DELETE /api/v1/character-group-behaviors/{characterGroupBehaviorId}`

---

## 7. Prompt Template System (`/prompts`)

Worlds can host multiple reusable system prompt templates:
- `openrp_list_prompts` (`GET /api/users/{authUid}/worlds/{worldId}/prompts`): Lists all templates.
- `openrp_get_prompt` (`GET /api/users/{authUid}/worlds/{worldId}/prompts/{promptId}`): Inspects system/user/assistant nodes.
- `openrp_create_prompt` (`POST /api/users/{authUid}/worlds/{worldId}/prompts`):
  ```json
  {
    "name": "Multi-Agent Raid Battle Prompt",
    "handle": "raid-prompt",
    "content": "You are {{reply_char.name}}. Track party HP and boss phase transitions in chat.",
    "isDefault": false
  }
  ```
- `openrp_delete_prompt` (`DELETE /api/users/{authUid}/worlds/{worldId}/prompts/{promptId}`): Deletes prompt template.

