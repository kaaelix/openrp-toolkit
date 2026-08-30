# OpenRP Authentication & Session Bridge Reference

## Overview

The OpenRP CLI & MCP Suite uses a unified authentication mechanism backed by Supabase Auth sessions.

---

## 1. Web Browser Auto-Sync (1-Click Bridge)

### Command
```bash
npx openrp-toolkit auth
# or
npx openrp-toolkit web-login
```

### Architecture
```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ Local CLI / MCP │ <───  │ Local Bridge :45678  │ <───  │ openrp.ai DOM   │
│ ~/.openrp_mcp_  │ POST  │ /_openrp_cli_auth    │ Fetch │ Injected Modal  │
│ auth.json       │       │                      │       │ [Is this you?]  │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
```

### Injection Snippet (Eruda Style)
```javascript
javascript:(function(){var s=document.createElement('script');s.src='http://127.0.0.1:45678/bridge.js';document.body.appendChild(s);})();
```

---

## 2. Automated Userscript (`openrp-auth.user.js`)

For creators who frequently work between OpenRP and CLI/MCP:
1. Install [openrp-auth.user.js](file:///data/data/com.termux/files/home/openrp-toolkit/openrp-auth.user.js) in Violentmonkey / Tampermonkey / Kiwi Browser.
2. Visiting `https://openrp.ai/` will automatically sync tokens whenever the CLI is listening on port `45678`.

---

## 3. Credential Storage (`~/.openrp_mcp_auth.json`)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "userId": "usr_789abc",
  "userName": "Creator Name",
  "worldId": "wrld_123xyz",
  "characterId": "char_456def",
  "expiresAt": 1785688800
}
```

---

## 4. MCP Tools Authentication

- `openrp_set_auth` — Updates in-memory token, cookies, default world, and character IDs.
- `openrp_refresh_token` — Automatically refreshes JWT using the refresh token before expiry.
- `openrp_get_me` — Queries `/api/users/me` to verify permissions and profile data.

---

## 5. Verified Runtime Findings (2026-08-30, live session)

> [!IMPORTANT]
> These were confirmed against the live OpenRP API in a real session. They **correct** older assumptions elsewhere in this skill.

### 5.1 Expired Access Token Symptom = `403 user_not_authorized` (NOT 401)

When the Supabase access token is expired or invalid, OpenRP does **not** return `401`. Instead:

| Endpoint | Symptom |
|---|---|
| `GET /api/users/me` | `{"data": null, "error": null}` — empty profile, HTTP 200 |
| `GET /api/worlds/my-worlds` | `{"data": null, "error": {"code": "user_not_authorized"}}` — HTTP 403 |
| Public endpoints (`/api/worlds/discover`, `/api/models`) | Still work (no auth required) |

**Fix**: call `openrp_refresh_token` (or `POST https://uixnaquqjhzcctyfoapf.supabase.co/auth/v1/token?grant_type=refresh_token` with `apikey: sb_publishable_DN2mm7PLLgF2GEEd3bjZFw_T36rl4x0` and body `{"refresh_token":"..."}`). The refresh token outlives the access token. After refresh, `get_me` returns the full profile and `list_my_worlds` returns the world list.

### 5.2 Both User IDs Work in Route Paths (Correction)

The older claim that "route URLs MUST use the Supabase Auth UID or you get `400 bad_request_body`" is **wrong**. Verified: both IDs work in `/api/users/{userId}/worlds/{worldId}/...` routes:

- **Supabase Auth UID** (`sub` from JWT, UUIDv4): `0d24041d-23b1-465a-9f37-110c0c0729f1`
- **OpenRP Platform Account ID** (`get_me.data.id`, UUIDv7): `019f4c49-0ec7-7374-8fab-d7e8add428bc`

`openrp_list_characters` and `openrp_get_behavior` both succeeded with the platform account ID in the path. The platform ID is the safer default because it is what `get_me` returns and what appears in `owner.id` / `ownerId` fields.

### 5.3 `openrp_list_my_worlds` Endpoint

The MCP tool calls `GET /api/worlds/my-worlds` (NOT `/api/users/{userId}/worlds`). Response shape: `{"data": [{id, handle, name, description, avatarPath, owner: {id, handle}}, ...]}`.

### 5.4 `openrp_get_behavior` Requires All Three IDs

Despite the tool schema only marking `behaviorId` required, the handler requires `userId`, `worldId`, AND `behaviorId`. Omitting any returns `{"error": true, "message": "userId, worldId, and behaviorId are required"}`. Always pass all three explicitly.

### 5.5 `openrp_list_models` Leaks Provider API Keys (Security Warning)

`GET /api/models` returns each model's `provider.apiKey` in **plaintext** (zai, google, anthropic, xai, moonshot, deepseek, azure keys). **Never log, persist, or paste `openrp_list_models` output into a skill, memory, or public repo.** If you need model IDs, extract only `id`, `name`, `label`, `isFree`, `contextWindowSize`.

### 5.6 Verified Response Shapes

- `openrp_list_characters` → `{"data": {"data": [CharacterMetadata...], "count": N}}` (nested `data.data`)
- `openrp_list_behaviors` → `{"data": {"data": [{id, name, handle}...], "before": null, "after": {"anchor", "hasMore"}}}`
- `openrp_list_lores` → `{"data": {"data": [LoreData...], "count": N}}` (nested `data.data`, each entry has `metadata` + optional `vectorEmbedding`)
- `openrp_list_chats` → `{"data": {"chats": [...], "users": [...], "characters": [...], "worlds": [...], "participants": [...]}}`
- `openrp_get_me` → `{"data": {id, name, handle, bio, followers, following, avatarPath, email, credits, metadata: {isPlus}, settings: {chat: {defaultChatModelId, inputTokenLimit}}}}`

### 5.7 Verified Behavior Graph Node `data` Shapes (from live `tictactoe` graph)

| Node type | `data` fields |
|---|---|
| `events/chat_message` | `customFields: []` |
| `storage/get_chat_message` | `messageId: {$expression}` |
| `storage/get_chat` | `chatId: {$expression}`, `expand: ["messages","participants"]` |
| `control_flow/split` | `outputCount: 2` |
| `control_flow/sync` | `inputCount: 2`, `lcaNodeId: "<splitNodeId>"` |
| `utilities/filter` | `list: {$expression}`, `itemCondition: {$expression}` |
| `storage/set_variable` | `variables: [{key: {$template}, value: {$expression}}]` |
| `control_flow/wait` | `seconds: 1` |
| `storage/insert_chat_message` | `chatId: {$expression}`, `content: {$template}`, `chatParticipantId: {$expression}` |
| `storage/update_typing_status` | `isTyping: bool`, `participantId: {$expression}` |

Edge ID format confirmed live: `xy-edge__<source><sourceHandle>-<target><targetHandle>` (e.g. `xy-edge__splitout1-filterUserParticipantprevious`).

### 5.8 Supabase Cookie Structure & Programmatic Token Extraction

The browser cookie `sb-uixnaquqjhzcctyfoapf-auth-token.0` (OpenRP.ai domain) is **not** the raw JWT — it is `base64-` + base64-encoded JSON:

```
sb-uixnaquqjhzcctyfoapf-auth-token.0 = "base64-" + base64({
  "access_token": "<JWT>",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": <unix seconds>,
  "refresh_token": "<refresh token>",
  "user": { "id": "<Supabase Auth UID>", "email": "...", ... }
})
```

- The `.1` cookie (`sb-...-auth-token.1`) holds base64-encoded identity data (`identities`, `identity_data`) — not needed for API auth.
- **Extraction procedure**: strip the `base64-` prefix → base64-decode the remainder → JSON-parse → read `access_token`, `refresh_token`, `user.id`. If the paste is truncated, truncate the base64 to a multiple of 4 chars first (the fields you need are near the start).
- **Never hand-transcribe the JWT.** Always decode programmatically. Hand transcription silently corrupts the token (e.g. the `alg` header flips), which yields `403 user_not_authorized` even when the token is unexpired.

### 5.9 JWT Algorithm = ES256 (with `kid`)

The Supabase access token header is:

```json
{"alg":"ES256","kid":"be0bca53-ab30-45b1-a1d8-5aca186f44c1","typ":"JWT"}
```

- `alg` is **ES256** (ECDSA P-256), not HS256. A token whose header says HS256 is corrupted and is rejected with `403 user_not_authorized`. Use this as a quick sanity check after any manual token handling.

### 5.10 MCP Server Auth File Lifecycle & Restart

`mcp/server.js` calls `loadAuth()` **once at process startup** (module scope). Consequences:

- Writing `~/.openrp_mcp_auth.json` directly does **not** affect a running MCP server — its in-memory `authState` is fixed until restart.
- To apply new credentials to a running server: either call `openrp_set_auth` (updates in-memory + file), or write the file then restart the server process:
  ```bash
  pkill -f 'openrp-toolkit/mcp/server.js'
  ```
  Hermes's `MCPServerTask` keepalive detects the dead child and respawns it within ~30s (re-reading the file). The next MCP call after respawn uses the new token. Each Hermes process (gateway, TUI, agent session) runs its own instance; all respawn independently.

### 5.11 Refresh Response Rotates the Refresh Token

`POST https://uixnaquqjhzcctyfoapf.supabase.co/auth/v1/token?grant_type=refresh_token` (headers `apikey: <supabase anon key>`, body `{"refresh_token":"..."}`) returns a **new** `refresh_token` alongside the new `access_token` and `expires_at`. Always persist the new `refresh_token` — the old one is rotated/consumed and will fail on the next refresh.
