# Worlds, Lorebooks, Characters & Prompt Templates Specification

## 1. World Schema & Lifecycle Operations

A World in OpenRP represents an overarching universe, lore repository, and vector database for all resident characters, lore entries, prompt templates, and behaviors.

### Complete World Creation Payload (`POST /api/users/{userId}/worlds`)
```json
{
  "owner": "019f4c49-0ec7-7374-8fab-d7e8add428bc",
  "name": "Neon Arcadia 2099",
  "handle": "neon-arcadia-2099",
  "description": "An underground cyberpunk arcade where humans and synthetic intelligences compete.",
  "tags": ["cyberpunk", "arcade", "game", "tactical"],
  "visibility": "WORLD_VISIBILITY_PUBLIC",
  "chatOnly": false
}
```

### Complete World Update Payload (`PUT /api/users/{userId}/worlds/{worldId}`)
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

### World README.md Editing (`openrp_update_world_readme`)
The main World documentation (README) supports full GitHub Flavored Markdown up to 5,000 words:
```json
{
  "updateType": "metadata",
  "data": {
    "readme": "# ⚡ Cyber Neon Realm\n\nWelcome to the official arena!\n\n### 🕹️ Rules & Attractions:\n- Challenge the Game Master bot with coordinate moves (0-8).\n- Party roleplay with Eldrin the Mage."
  }
}
```

### World Deletion (`DELETE /api/users/{userId}/worlds/{worldId}`)
Permanently deletes the world and all child entities (characters, behaviors, prompts, lores).

---

## 2. Granular Lorebook System (`/lore`)

In addition to the world `readme`, individual factual entries are managed via `/lore`:
- `title`: Subject title of the entry.
- `handle`: Unique slug for graph referencing.
- `content`: Explicit background details, rules, and constraints.
- `isExclusive`: Boolean flag determining whether the entry applies only in specific context filters.

---

## 3. Character Studio & Persona Engineering

Characters represent autonomous bots living within a World.

### Character Creation Payload (`POST /api/users/{userId}/worlds/{worldId}/characters`)
```json
{
  "name": "Sera",
  "handle": "sera-arcade-host",
  "status": "Online - Ready to Play",
  "shortDescription": "Cheerful cyberpunk arcade host and game referee.",
  "description": "Sera is a 5th-generation synthetic AI created to manage the Neon Arcadia arena.",
  "personality": "[Character(\"Sera\")][Role(\"Arcade Game Host\")][Personality(\"Playful\", \"Fair\", \"Sharp\")]",
  "dialogs": []
}
```

### Character Update Payload (`PUT /api/users/{userId}/worlds/{worldId}/characters/{characterId}`)
Updates name, status, shortDescription, full description, personality, greetings, and dialog examples.

### Character Deletion (`DELETE /api/users/{userId}/worlds/{worldId}/characters/{characterId}`)
Permanently removes the character from the world.

---

## 4. Prompt Template System (`/prompts`)

Worlds can host multiple system prompt templates:
- `openrp_list_prompts` (`GET /api/users/{userId}/worlds/{worldId}/prompts`): Lists all templates.
- `openrp_get_prompt` (`GET /api/users/{userId}/worlds/{worldId}/prompts/{promptId}`): Inspects system/user/assistant nodes.
- `openrp_create_prompt` (`POST /api/users/{userId}/worlds/{worldId}/prompts`):
  ```json
  {
    "name": "Multi-Agent Raid Battle Prompt",
    "handle": "raid-prompt",
    "content": "You are {{reply_char.name}}. Track party HP and boss phase transitions in chat.",
    "isDefault": false
  }
  ```
- `openrp_delete_prompt` (`DELETE /api/users/{userId}/worlds/{worldId}/prompts/{promptId}`): Deletes prompt template.

