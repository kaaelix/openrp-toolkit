# Worlds, Lorebooks & Characters Specification

## 1. World Schema & Properties

A World in OpenRP represents an overarching universe, lore repository, and vector search database for all resident characters, lore entries, and behaviors.

### Complete World JSON Schema
```json
{
  "name": "Neon Arcadia 2099",
  "handle": "neon-arcadia-2099",
  "description": "An underground cyberpunk arcade where humans and autonomous synthetic intelligences compete in tactical games.",
  "readme": "# Neon Arcadia Lorebook\n\n## 1. Geography & Sectors\n- Sector 4 (Arcadia District): High-density neon avenue hosting classic holographic game cabinets.\n- Sector 1 (The Citadel): Corporate headquarters controlling energy grids.\n\n## 2. Universal Laws\n- Physical violence is strictly prohibited within the game arena.\n- All stakes are settled in digital CyberTokens.",
  "visibility": "public",
  "tags": ["cyberpunk", "arcade", "game", "tactical"],
  "avatarPath": "https://openrp.ai/storage/v1/object/public/user-content/worlds/avatar.png",
  "bannerPath": "https://openrp.ai/storage/v1/object/public/user-content/worlds/banner.png",
  "embeddingModelId": "text-embedding-3-small"
}
```

### The 9 World Properties:
1. `name`: Display title shown on headers and search cards.
2. `handle`: Unique URL slug identifier (e.g. `openrp.ai/worlds/neon-arcadia-2099`).
3. `description`: 1-2 sentence summary displayed in discovery feeds.
4. `readme`: Markdown lorebook defining geography, factions, technology, and rules. Automatically indexed for semantic RAG vector retrieval.
5. `visibility`: Access tier controls:
   - `public`: (Free & Pro) Visible in global explore feed and public search.
   - `unlisted`: (Free & Pro) Accessible only via direct URL slug link.
   - `private`: (Pro/Plus Only) Restricted to the creator account. Free accounts attempting private visibility will receive an API rejection.
6. `tags`: Array of classification labels (e.g. `["sci-fi", "rpg", "tictactoe"]`).
7. `avatarPath`: Direct image URL or storage path for the square icon.
8. `bannerPath`: Direct image URL or storage path for the horizontal header banner.
9. `embeddingModelId`: AI model used for vector indexing of the world lorebook (default: `text-embedding-3-small`).

---

## 2. Granular Lorebook Entries (/lore)

In addition to the world `readme`, individual lore entries can be created via `/lore` for targeted retrieval:
- `title`: Subject title of the entry.
- `handle`: Unique slug for graph referencing.
- `content`: Explicit background details and constraints.
- `isExclusive`: Boolean flag determining whether the entry applies only in specific contexts.

---

## 3. Character Architecture & Persona Engineering

Characters represent the autonomous agents living within a World.

### Complete Character Schema
```json
{
  "name": "Sera",
  "handle": "sera-arcade-host",
  "status": "Online - Ready to Play",
  "shortDescription": "Cheerful cyberpunk arcade host and game referee.",
  "description": "Sera is a 5th-generation synthetic AI created to manage the Neon Arcadia arena. She is razor-sharp, enthusiastically competitive, yet strictly fair.",
  "personality": "[Character(\"Sera\")]\n[Role(\"Arcade Game Host & Referee\")]\n[Personality(\"Enthusiastic\", \"Sharp\", \"Playful\", \"Fair\")]\n[Tone(\"Casual futuristic slang\", \"Direct\")]\n[Rules(\"Never break character\", \"Keep responses concise (2-3 sentences)\")]",
  "greetings": [
    "Welcome to Neon Arcadia! Ready to challenge me in Tic-Tac-Toe today?",
    "The cabinet is powered on! Pick your first move (1-9) to begin."
  ],
  "dialogs": [
    {
      "user": "How do we play?",
      "character": "Pick a square from 1 to 9! Get three in a row horizontally, vertically, or diagonally to win."
    }
  ],
  "avatarPath": "https://openrp.ai/storage/v1/object/public/user-content/characters/sera.png"
}
```

### Persona Formatting Guidelines
1. W++ / Pseudocode Persona: Use bracketed tags (`[Key("Value")]`) in the `personality` field for high-density instruction adherence without burning token budgets.
2. Few-Shot Demonstration (`dialogs`): Provide 1-3 concrete user/character interaction turns to anchor tone, sentence length, and vocabulary.
3. Deterministic HUDs: For game bots, combine LLM personality with formatted Markdown templates in behavior nodes for pixel-perfect HUDs and game boards.
