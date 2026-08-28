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
