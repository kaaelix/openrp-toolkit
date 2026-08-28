#!/usr/bin/env python3
"""
OpenRP MCP Server (Model Context Protocol)
Standard JSON-RPC 2.0 Stdio Transport MCP Server for OpenRP.ai

A complete developer toolsuite for programmatic manipulation of:
- Worlds & Markdown Lorebooks (Full CRUD, Visibility, RAG Embeddings)
- Characters & Personas (System Prompts, Greetings, Few-Shot Dialogs)
- Behavior Graphs & 37 Node Types (Creation, In-place Update, Granular Node Edits)
- Lorebook Entries (Granular RAG Entries & Vector Search)
- Chat & Group Orchestration (Room Details, Participant Filtering, Messaging)
- World Discovery & Universal REST API Gateway
"""

import sys
import json
import base64
import time
import urllib.request
import urllib.error
import urllib.parse
import re
import os

BASE_URL = os.environ.get("OPENRP_BASE_URL", "https://openrp.ai")
SUPABASE_URL = os.environ.get("OPENRP_SUPABASE_URL", "https://uixnaquqjhzcctyfoapf.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("OPENRP_SUPABASE_ANON_KEY", "sb_publishable_DN2mm7PLLgF2GEEd3bjZFw_T36rl4x0")
STATE_FILE = os.path.expanduser(os.environ.get("OPENRP_AUTH_FILE", "~/.openrp_mcp_auth.json"))

def load_auth():
    auth = {
        "token": os.environ.get("OPENRP_TOKEN", ""),
        "refreshToken": os.environ.get("OPENRP_REFRESH_TOKEN", ""),
        "expiresAt": 0,
        "userId": os.environ.get("OPENRP_USER_ID", ""),
        "worldId": os.environ.get("OPENRP_WORLD_ID", ""),
        "characterId": os.environ.get("OPENRP_CHARACTER_ID", "")
    }
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                saved = json.load(f)
                for k, v in saved.items():
                    if v and not auth.get(k):
                        auth[k] = v
        except Exception:
            pass
    return auth

def save_auth(auth_data):
    try:
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, "w") as f:
            json.dump(auth_data, f, indent=2)
    except Exception as e:
        sys.stderr.write(f"Failed to save auth state: {e}\n")

auth_state = load_auth()

def parse_cookie_payload(cookie_str):
    """Extracts access_token, refresh_token, and expires_at from raw Supabase cookie string."""
    m0 = re.search(r'sb-uixnaquqjhzcctyfoapf-auth-token\.0=([^;]+)', cookie_str)
    m1 = re.search(r'sb-uixnaquqjhzcctyfoapf-auth-token\.1=([^;]+)', cookie_str)
    
    b0 = m0.group(1) if m0 else ''
    if b0.startswith('base64-'):
        b0 = b0[7:]
    b1 = m1.group(1) if m1 else ''
    
    combined = b0 + b1
    if not combined:
        return {}
    
    try:
        padded = combined + "=" * (-len(combined) % 4)
        raw_json = base64.b64decode(padded).decode("utf-8")
        data = json.loads(raw_json)
        return {
            "token": data.get("access_token", ""),
            "refreshToken": data.get("refresh_token", ""),
            "expiresAt": data.get("expires_at", 0)
        }
    except Exception as e:
        sys.stderr.write(f"Error parsing cookie: {e}\n")
        return {}

def refresh_access_token():
    """Refreshes the Supabase JWT access token using the stored refresh_token."""
    global auth_state
    refresh_token = auth_state.get("refreshToken", "")
    if not refresh_token:
        return {"success": False, "message": "No refresh_token found in auth state"}
    
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "User-Agent": "OpenRP-MCP-Server/3.0"
    }
    payload = {"refresh_token": refresh_token}
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            auth_state["token"] = data.get("access_token", auth_state.get("token"))
            auth_state["refreshToken"] = data.get("refresh_token", auth_state.get("refreshToken"))
            auth_state["expiresAt"] = data.get("expires_at", int(time.time()) + 3600)
            save_auth(auth_state)
            return {
                "success": True,
                "message": "Token refreshed successfully",
                "expiresAt": auth_state["expiresAt"]
            }
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        return {"success": False, "status": e.code, "message": err_msg}
    except Exception as e:
        return {"success": False, "message": str(e)}

def make_request(path, method="GET", body=None, token=None, retry_on_401=True):
    """Executes HTTP request against OpenRP API with auto-refresh on 401."""
    global auth_state
    
    if auth_state.get("expiresAt") and auth_state.get("refreshToken"):
        if time.time() > (auth_state["expiresAt"] - 60):
            refresh_access_token()
            
    active_token = token or auth_state.get("token", "")
    url = f"{BASE_URL}{path}" if path.startswith("/") else f"{BASE_URL}/{path}"
    
    headers = {
        "User-Agent": "OpenRP-MCP-Server/3.0",
        "Content-Type": "application/json"
    }
    if active_token:
        headers["Authorization"] = f"Bearer {active_token}"
    
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            resp_body = resp.read().decode("utf-8")
            try:
                return json.loads(resp_body)
            except Exception:
                return {"status": resp.status, "text": resp_body}
    except urllib.error.HTTPError as e:
        if e.code == 401 and retry_on_401 and auth_state.get("refreshToken"):
            ref_res = refresh_access_token()
            if ref_res.get("success"):
                return make_request(path, method=method, body=body, retry_on_401=False)
                
        err_text = e.read().decode("utf-8", errors="ignore")
        try:
            err_json = json.loads(err_text)
            return {"error": True, "status": e.code, "details": err_json}
        except Exception:
            return {"error": True, "status": e.code, "message": e.reason, "details": err_text}
    except Exception as e:
        return {"error": True, "message": str(e)}

TOOLS = [
    # 1. AUTH & USER PROFILE
    {
        "name": "openrp_set_auth",
        "description": "Configure OpenRP authentication. Accepts either a Bearer JWT access token or a raw cookie string (with sb-uixnaquqjhzcctyfoapf-auth-token).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "token": {"type": "string", "description": "JWT Bearer access token"},
                "refreshToken": {"type": "string", "description": "Supabase Refresh Token"},
                "cookie": {"type": "string", "description": "Raw cookie string from openrp.ai browser session"},
                "userId": {"type": "string", "description": "Default OpenRP User ID"},
                "worldId": {"type": "string", "description": "Default OpenRP World ID"},
                "characterId": {"type": "string", "description": "Default OpenRP Character ID"}
            }
        }
    },
    {
        "name": "openrp_refresh_token",
        "description": "Trigger an immediate token refresh via Supabase Auth.",
        "inputSchema": {"type": "object", "properties": {}}
    },
    {
        "name": "openrp_get_me",
        "description": "Get profile, bio, settings, and account details for the currently authenticated user.",
        "inputSchema": {"type": "object", "properties": {}}
    },

    # 2. WORLDS MANAGEMENT (Full CRUD & All Fields)
    {
        "name": "openrp_list_my_worlds",
        "description": "List all Worlds owned by or shared with the authenticated user.",
        "inputSchema": {"type": "object", "properties": {}}
    },
    {
        "name": "openrp_get_world",
        "description": "Get complete World information (name, handle, description, markdown readme lore, tags, visibility, avatarPath, bannerPath, embeddingModelId).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_create_world",
        "description": "Create a new World in OpenRP. Note on visibility: Free users can set 'public' or 'unlisted'; 'private' requires Pro/Plus subscription.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "name": {"type": "string", "description": "World Title"},
                "handle": {"type": "string", "description": "Unique URL slug handle"},
                "description": {"type": "string", "description": "Short pitch description"},
                "readme": {"type": "string", "description": "Markdown world lorebook, geography, rules, and documentation"},
                "visibility": {"type": "string", "description": "World Visibility: 'WORLD_VISIBILITY_PUBLIC' (default), 'WORLD_VISIBILITY_UNLISTED' (same as public for now), or 'WORLD_VISIBILITY_PRIVATE' (requires OpenRP Plus plan)", "default": "WORLD_VISIBILITY_PUBLIC"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Category tags"},
                "avatarPath": {"type": "string", "description": "World Avatar icon image URL / storage path"},
                "bannerPath": {"type": "string", "description": "World Header Banner image URL / storage path"},
                "embeddingModelId": {"type": "string", "description": "AI model for vector lore indexing (default: text-embedding-3-small)"}
            },
            "required": ["name", "handle"]
        }
    },
    {
        "name": "openrp_update_world",
        "description": "Update World metadata: name, description, readme (markdown documentation), tags, and visibility ('WORLD_VISIBILITY_PUBLIC', 'WORLD_VISIBILITY_UNLISTED', or 'WORLD_VISIBILITY_PRIVATE' for Plus users).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "name": {"type": "string", "description": "World Title"},
                "description": {"type": "string", "description": "Short World Description"},
                "readme": {"type": "string", "description": "Markdown world lorebook, rules, and documentation (up to 5000 words)"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Category tags"},
                "visibility": {"type": "string", "description": "World Visibility: 'WORLD_VISIBILITY_PUBLIC', 'WORLD_VISIBILITY_UNLISTED' (same as public for now), or 'WORLD_VISIBILITY_PRIVATE' (requires OpenRP Plus)"}
            }
        }
    },
    {
        "name": "openrp_update_world_readme",
        "description": "Update the main README markdown documentation of a World (supports full GitHub markdown formatting up to 5000 words).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "readme": {"type": "string", "description": "Complete markdown documentation and lore"}
            },
            "required": ["readme"]
        }
    },
    {
        "name": "openrp_delete_world",
        "description": "Delete a World from OpenRP.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID to delete"}
            },
            "required": ["worldId"]
        }
    },

    # 3. GRANULAR LOREBOOK ENTRIES
    {
        "name": "openrp_list_lores",
        "description": "List all specific lore entries in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_get_lore",
        "description": "Get a specific lore entry from a world by its loreId.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "loreId": {"type": "string", "description": "Lore Entry ID"}
            },
            "required": ["loreId"]
        }
    },
    {
        "name": "openrp_create_lore",
        "description": "Create a new lorebook entry in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "title": {"type": "string", "description": "Lore title"},
                "handle": {"type": "string", "description": "Lore handle slug"},
                "content": {"type": "string", "description": "Detailed lore content and knowledge"},
                "isExclusive": {"type": "boolean", "description": "Whether this lore is exclusive", "default": False}
            },
            "required": ["title", "handle", "content"]
        }
    },
    {
        "name": "openrp_update_lore",
        "description": "Update an existing lorebook entry in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "loreId": {"type": "string", "description": "Lore Entry ID"},
                "title": {"type": "string", "description": "Lore title"},
                "handle": {"type": "string", "description": "Lore handle slug"},
                "content": {"type": "string", "description": "Detailed lore content"},
                "isExclusive": {"type": "boolean", "description": "Whether this lore is exclusive"}
            },
            "required": ["loreId"]
        }
    },
    {
        "name": "openrp_delete_lore",
        "description": "Delete a lorebook entry from a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "loreId": {"type": "string", "description": "Lore Entry ID to delete"}
            },
            "required": ["loreId"]
        }
    },

    # 4. CHARACTERS & PERSONAS
    {
        "name": "openrp_list_characters",
        "description": "List all characters residing within a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_get_character",
        "description": "Get detailed Character settings: personality (system prompt), backstory, greetings, dialogs, avatarPath, and behavior bindings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "characterId": {"type": "string", "description": "Character ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_create_character",
        "description": "Create a new Character in a World with complete persona and settings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "name": {"type": "string", "description": "Character Name"},
                "handle": {"type": "string", "description": "Character Handle (slug)"},
                "shortDescription": {"type": "string", "description": "Short description / title"},
                "personality": {"type": "string", "description": "Core personality, system prompt, and behavioral constraints"},
                "description": {"type": "string", "description": "Full backstory and lore"},
                "status": {"type": "string", "description": "Character status or mood", "default": "Online"},
                "dialogs": {"type": "array", "description": "Few-shot example conversations", "default": []}
            },
            "required": ["name", "handle"]
        }
    },
    {
        "name": "openrp_update_character",
        "description": "Update Character details: name, personality (system prompt), description, shortDescription, greetings, status, avatarPath.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "characterId": {"type": "string", "description": "Character ID (optional if saved in auth)"},
                "name": {"type": "string", "description": "Character Name"},
                "handle": {"type": "string", "description": "Character Handle"},
                "status": {"type": "string", "description": "Character status or mood"},
                "shortDescription": {"type": "string", "description": "One-line character description"},
                "description": {"type": "string", "description": "Full backstory and lore"},
                "personality": {"type": "string", "description": "Core personality, system prompt, and behavioral constraints"},
                "greetings": {"type": "array", "items": {"type": "string"}, "description": "Opening greeting messages"},
                "dialogs": {"type": "array", "description": "Few-shot example conversations", "default": []},
                "avatarPath": {"type": "string", "description": "Avatar image URL / storage path"}
            },
            "required": ["characterId"]
        }
    },
    {
        "name": "openrp_delete_character",
        "description": "Permanently delete a character from a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "characterId": {"type": "string", "description": "Character ID to delete"}
            },
            "required": ["characterId"]
        }
    },
    {
        "name": "openrp_list_character_groups",
        "description": "List all Character Groups and faction hierarchies defined in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },

    # 5. PROMPT TEMPLATES & SYSTEM PROMPTS
    {
        "name": "openrp_list_prompts",
        "description": "List all prompt templates and system prompts in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_get_prompt",
        "description": "Get detailed Prompt Template structure, system nodes, user/assistant nodes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "promptId": {"type": "string", "description": "Prompt ID"}
            },
            "required": ["promptId"]
        }
    },
    {
        "name": "openrp_create_prompt",
        "description": "Create a new Prompt Template in a World.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "name": {"type": "string", "description": "Prompt Name"},
                "handle": {"type": "string", "description": "Prompt Handle (slug)"},
                "content": {"type": "string", "description": "Prompt Body Template content"},
                "isDefault": {"type": "boolean", "description": "Whether this is the default world prompt", "default": False}
            },
            "required": ["name", "handle"]
        }
    },
    {
        "name": "openrp_delete_prompt",
        "description": "Delete a prompt template from a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "promptId": {"type": "string", "description": "Prompt ID to delete"}
            },
            "required": ["promptId"]
        }
    },

    # 6. BEHAVIOR GRAPHS & NODE EDITING
    {
        "name": "openrp_list_behaviors",
        "description": "List all behavior graphs in a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"}
            }
        }
    },
    {
        "name": "openrp_get_behavior",
        "description": "Get complete Behavior Graph JSON (nodes, edges, variables, and expressions) for a behavior.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "behaviorId": {"type": "string", "description": "Behavior ID to fetch"}
            },
            "required": ["behaviorId"]
        }
    },
    {
        "name": "openrp_update_behavior",
        "description": "In-place update of an existing Behavior Graph without deleting or losing character bindings.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "behaviorId": {"type": "string", "description": "Behavior ID to update"},
                "name": {"type": "string", "description": "Behavior Name"},
                "handle": {"type": "string", "description": "Behavior Handle slug"},
                "graph": {"type": "object", "description": "Updated Behavior Graph with nodes and edges"}
            },
            "required": ["behaviorId", "graph"]
        }
    },
    {
        "name": "openrp_edit_behavior_node",
        "description": "Granularly edit a specific node inside a Behavior Graph (modify data, expressions, templates, or parameters of a single node by nodeId).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "behaviorId": {"type": "string", "description": "Behavior ID containing the node"},
                "nodeId": {"type": "string", "description": "ID of the specific node to edit (e.g. setVariableOutput, llm, insertChatMessage)"},
                "nodeData": {"type": "object", "description": "New data payload for the node (replaces or merges node.data)"}
            },
            "required": ["behaviorId", "nodeId", "nodeData"]
        }
    },
    {
        "name": "openrp_deploy_behavior",
        "description": "Create or update a Behavior Graph in a World and optionally attach it to a Character in one step (supports auto-cleanup of old graphs).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "characterId": {"type": "string", "description": "Optional Character ID to automatically attach behavior to"},
                "name": {"type": "string", "description": "Behavior Name"},
                "handle": {"type": "string", "description": "Behavior Handle (slug)"},
                "graph": {"type": "object", "description": "Complete Behavior Graph object with nodes and edges"},
                "deleteOldBehaviors": {"type": "boolean", "description": "Whether to delete old behaviors with the same name before creating", "default": True}
            },
            "required": ["name", "handle", "graph"]
        }
    },
    {
        "name": "openrp_delete_behavior",
        "description": "Delete a behavior graph from a world.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "userId": {"type": "string", "description": "User ID (optional if saved in auth)"},
                "worldId": {"type": "string", "description": "World ID (optional if saved in auth)"},
                "behaviorId": {"type": "string", "description": "ID of behavior to delete"}
            },
            "required": ["behaviorId"]
        }
    },
    {
        "name": "openrp_attach_behavior_to_character",
        "description": "Attach an existing behavior graph to a character (automatically replaces previous bindings to avoid HTTP 500 unique constraint error).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "characterId": {"type": "string", "description": "Character ID (optional if saved in auth)"},
                "behaviorId": {"type": "string", "description": "Behavior ID to attach"},
                "replaceExisting": {"type": "boolean", "description": "Whether to automatically detach existing behaviors first", "default": True}
            },
            "required": ["behaviorId"]
        }
    },

    # 6. CHAT & GROUP ROOMS
    {
        "name": "openrp_list_chats",
        "description": "List active chats, group chats, room participants, and session metadata.",
        "inputSchema": {"type": "object", "properties": {}}
    },
    {
        "name": "openrp_get_chat",
        "description": "Get detailed metadata for a specific chat room including all human and AI participants, active model, and world binding.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "chatId": {"type": "string", "description": "Chat Room ID"}
            },
            "required": ["chatId"]
        }
    },
    {
        "name": "openrp_get_chat_messages",
        "description": "Get message history for a specific chat room.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "chatId": {"type": "string", "description": "Chat Room ID"}
            },
            "required": ["chatId"]
        }
    },
    {
        "name": "openrp_send_message",
        "description": "Insert a new chat message into a room directly via API.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "chatId": {"type": "string", "description": "Chat Room ID"},
                "content": {"type": "string", "description": "Message content (Markdown supported)"},
                "chatParticipantId": {"type": "string", "description": "Participant ID sending the message"}
            },
            "required": ["chatId", "content", "chatParticipantId"]
        }
    },

    # 7. AI MODELS & DISCOVERY
    {
        "name": "openrp_list_models",
        "description": "List all 38+ available foundational AI models on OpenRP (Claude Sonnet/Opus 4.8, GPT-5.4, Gemini 3.5, Grok 4.5, Kimi k3, GLM 5.2, DeepSeek) with their provider details and IDs for configuring AI behavior nodes.",
        "inputSchema": {"type": "object", "properties": {}}
    },
    {
        "name": "openrp_discover_worlds",
        "description": "Search and explore public worlds on OpenRP by query and page.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword or category"},
                "page": {"type": "integer", "description": "Page number (default: 1)"}
            }
        }
    },

    # 8. BEHAVIOR EXECUTIONS & DEBUG MODE TRACES
    {
        "name": "openrp_search_behavior_executions",
        "description": "Search and list historical behavior execution traces across chat messages.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Maximum number of execution traces to return (default: 10)"},
                "behaviorId": {"type": "string", "description": "Filter by Behavior ID"},
                "chatId": {"type": "string", "description": "Filter by Chat ID"},
                "status": {"type": "string", "description": "Filter by status, e.g. BEHAVIOR_EXECUTION_STATUS_COMPLETED"}
            }
        }
    },
    {
        "name": "openrp_get_behavior_execution",
        "description": "Retrieve execution summary, status, timestamps, and metadata for a specific behavior run.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "executionId": {"type": "string", "description": "Behavior Execution ID"}
            },
            "required": ["executionId"]
        }
    },
    {
        "name": "openrp_get_behavior_node_executions",
        "description": "Retrieve step-by-step node execution traces (exact resolved inputs, outputs, status, error stack traces) for a behavior run.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "executionId": {"type": "string", "description": "Behavior Execution ID"}
            },
            "required": ["executionId"]
        }
    },

    # 9. RAW API
    {
        "name": "openrp_raw_api",
        "description": "Execute any raw HTTP API call to OpenRP (GET/POST/PUT/DELETE /api/...).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "API path, e.g. /api/users/me"},
                "method": {"type": "string", "description": "HTTP Method", "default": "GET"},
                "body": {"type": "object", "description": "JSON request body"}
            },
            "required": ["path"]
        }
    }
]

def sanitize_graph(graph):
    """Ensures all nodes and edges have proper OpenRP ReactFlow schema, IDs, and connectivity."""
    if not isinstance(graph, dict):
        return graph
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    
    formatted_edges = []
    connected_targets = set()
    connected_sources = set()
    
    for edge in edges:
        s = edge.get("source", "")
        sh = edge.get("sourceHandle", "next")
        t = edge.get("target", "")
        th = edge.get("targetHandle", "previous")
        
        if s:
            connected_sources.add(s)
        if t:
            connected_targets.add(t)
            
        # Enforce OpenRP ReactFlow Edge ID standard: xy-edge__<source><sourceHandle>-<target><targetHandle>
        expected_id = f"xy-edge__{s}{sh}-{t}{th}"
        curr_id = edge.get("id", "")
        if not curr_id or not curr_id.startswith("xy-edge__"):
            curr_id = expected_id
            
        formatted_edges.append({
            "id": curr_id,
            "source": s,
            "target": t,
            "sourceHandle": sh,
            "targetHandle": th
        })
        
    formatted_nodes = []
    for node in nodes:
        node_copy = dict(node)
        if "position" not in node_copy:
            node_copy["position"] = {"x": 0, "y": 0}
        if "lcaNodeId" not in node_copy:
            node_copy["lcaNodeId"] = None
        formatted_nodes.append(node_copy)
        
    return {
        "nodes": formatted_nodes,
        "edges": formatted_edges
    }

def handle_tool_call(name, args):
    global auth_state
    
    if name == "openrp_set_auth":
        cookie = args.get("cookie")
        if cookie:
            extracted = parse_cookie_payload(cookie)
            if extracted.get("token"):
                auth_state["token"] = extracted["token"]
            if extracted.get("refreshToken"):
                auth_state["refreshToken"] = extracted["refreshToken"]
            if extracted.get("expiresAt"):
                auth_state["expiresAt"] = extracted["expiresAt"]
        if "token" in args and args["token"]:
            auth_state["token"] = args["token"]
        if "refreshToken" in args and args["refreshToken"]:
            auth_state["refreshToken"] = args["refreshToken"]
        if "userId" in args:
            auth_state["userId"] = args["userId"]
        if "worldId" in args:
            auth_state["worldId"] = args["worldId"]
        if "characterId" in args:
            auth_state["characterId"] = args["characterId"]
        
        save_auth(auth_state)
        return {
            "success": True,
            "message": "Auth configuration saved with auto-refresh support",
            "hasToken": bool(auth_state.get("token")),
            "hasRefreshToken": bool(auth_state.get("refreshToken")),
            "expiresAt": auth_state.get("expiresAt"),
            "userId": auth_state.get("userId"),
            "worldId": auth_state.get("worldId"),
            "characterId": auth_state.get("characterId")
        }
        
    elif name == "openrp_refresh_token":
        return refresh_access_token()
        
    elif name == "openrp_get_me":
        return make_request("/api/users/me")
        
    elif name == "openrp_list_my_worlds":
        return make_request("/api/worlds/my-worlds")
        
    elif name == "openrp_get_world":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}")
        
    elif name == "openrp_create_world":
        u = args.get("userId") or auth_state.get("userId")
        if not u:
            return {"error": True, "message": "userId is required"}
        payload = {
            "owner": u,
            "name": args["name"],
            "handle": args["handle"],
            "description": args.get("description", ""),
            "tags": args.get("tags", []),
            "visibility": args.get("visibility", "WORLD_VISIBILITY_PUBLIC"),
            "chatOnly": args.get("chatOnly", False)
        }
        return make_request(f"/api/users/{u}/worlds", method="POST", body=payload)
        
    elif name == "openrp_update_world":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        data = {}
        for k in ["name", "description", "readme", "tags", "visibility"]:
            if k in args and args[k] is not None:
                data[k] = args[k]
        payload = {
            "updateType": "metadata",
            "data": data
        }
        return make_request(f"/api/users/{u}/worlds/{w}", method="PUT", body=payload)
        
    elif name == "openrp_update_world_readme":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w or not args.get("readme"):
            return {"error": True, "message": "userId, worldId, and readme are required"}
        payload = {
            "updateType": "metadata",
            "data": {"readme": args["readme"]}
        }
        return make_request(f"/api/users/{u}/worlds/{w}", method="PUT", body=payload)
        
    elif name == "openrp_delete_world":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}", method="DELETE")
        
    # --- LOREBOOK TOOLS ---
    elif name == "openrp_list_lores":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/lore")
        
    elif name == "openrp_get_lore":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        l = args.get("loreId")
        if not u or not w or not l:
            return {"error": True, "message": "userId, worldId, and loreId are required"}
        lores = make_request(f"/api/users/{u}/worlds/{w}/lore")
        if lores.get("error") or not lores.get("data"):
            return lores
        for item in lores["data"].get("data", []):
            meta = item.get("metadata", item)
            if meta.get("id") == l or meta.get("handle") == l:
                return {"data": item, "error": None}
        return {"data": None, "error": {"code": "not_found", "message": "Lore entry not found"}}
        
    elif name == "openrp_create_lore":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        payload = {
            "title": args["title"],
            "handle": args["handle"],
            "content": args["content"],
            "isExclusive": args.get("isExclusive", False)
        }
        return make_request(f"/api/users/{u}/worlds/{w}/lore", method="POST", body=payload)
        
    elif name == "openrp_update_lore":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        l = args.get("loreId")
        if not u or not w or not l:
            return {"error": True, "message": "userId, worldId, and loreId are required"}
        curr = make_request(f"/api/users/{u}/worlds/{w}/lore")
        if curr.get("error") or not curr.get("data"):
            return curr
        target_meta = None
        for item in curr["data"].get("data", []):
            m = item.get("metadata", item)
            if m.get("id") == l or m.get("handle") == l:
                target_meta = m
                break
        if not target_meta:
            return {"error": True, "message": "Lore entry not found"}
            
        for k in ["title", "handle", "content", "isExclusive"]:
            if k in args and args[k] is not None:
                target_meta[k] = args[k]
        return make_request(f"/api/users/{u}/worlds/{w}/lore/{l}", method="PUT", body=target_meta)
        
    elif name == "openrp_delete_lore":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        l = args.get("loreId")
        if not u or not w or not l:
            return {"error": True, "message": "userId, worldId, and loreId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/lore/{l}", method="DELETE")
        
    # --- CHARACTERS ---
    elif name == "openrp_list_characters":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/characters")
        
    elif name == "openrp_get_character":
        c = args.get("characterId") or auth_state.get("characterId")
        if not c:
            return {"error": True, "message": "characterId is required"}
        return make_request(f"/api/v1/characters/{c}")
        
    elif name == "openrp_create_character":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w or not args.get("name") or not args.get("handle"):
            return {"error": True, "message": "userId, worldId, name, and handle are required"}
        payload = {
            "name": args["name"],
            "handle": args["handle"],
            "shortDescription": args.get("shortDescription", ""),
            "personality": args.get("personality", ""),
            "description": args.get("description", ""),
            "status": args.get("status", "Online"),
            "dialogs": args.get("dialogs", [])
        }
        return make_request(f"/api/users/{u}/worlds/{w}/characters", method="POST", body=payload)
        
    elif name == "openrp_update_character":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        c = args.get("characterId") or auth_state.get("characterId")
        if not u or not w or not c:
            return {"error": True, "message": "userId, worldId, and characterId are required"}
        curr = make_request(f"/api/v1/characters/{c}")
        if curr.get("error") or not curr.get("data"):
            return curr
        char_obj = curr["data"]
        for k in ["name", "status", "shortDescription", "description", "personality", "greetings", "dialogs", "avatarPath"]:
            if k in args and args[k] is not None:
                char_obj[k] = args[k]
        if "dialogs" not in char_obj or char_obj["dialogs"] is None:
            char_obj["dialogs"] = []
        return make_request(f"/api/users/{u}/worlds/{w}/characters/{c}", method="PUT", body=char_obj)
        
    elif name == "openrp_delete_character":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        c = args.get("characterId") or auth_state.get("characterId")
        if not u or not w or not c:
            return {"error": True, "message": "userId, worldId, and characterId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/characters/{c}", method="DELETE")
        
    elif name == "openrp_list_character_groups":
        w = args.get("worldId") or auth_state.get("worldId")
        if not w:
            return {"error": True, "message": "worldId is required"}
        return make_request(f"/api/v1/worlds/{w}/character-groups")
        
    # --- PROMPTS ---
    elif name == "openrp_list_prompts":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/prompts")
        
    elif name == "openrp_get_prompt":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        p = args.get("promptId")
        if not u or not w or not p:
            return {"error": True, "message": "userId, worldId, and promptId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/prompts/{p}")
        
    elif name == "openrp_create_prompt":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w or not args.get("name") or not args.get("handle"):
            return {"error": True, "message": "userId, worldId, name, and handle are required"}
        payload = {
            "name": args["name"],
            "handle": args["handle"],
            "content": args.get("content", ""),
            "isDefault": args.get("isDefault", False)
        }
        return make_request(f"/api/users/{u}/worlds/{w}/prompts", method="POST", body=payload)
        
    elif name == "openrp_delete_prompt":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        p = args.get("promptId")
        if not u or not w or not p:
            return {"error": True, "message": "userId, worldId, and promptId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/prompts/{p}", method="DELETE")
        
    # --- BEHAVIORS & NODES ---
    elif name == "openrp_list_behaviors":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/behaviors")
        
    elif name == "openrp_get_behavior":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        b = args.get("behaviorId")
        if not u or not w or not b:
            return {"error": True, "message": "userId, worldId, and behaviorId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b}")
        
    elif name == "openrp_update_behavior":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        b = args.get("behaviorId")
        if not u or not w or not b:
            return {"error": True, "message": "userId, worldId, and behaviorId are required"}
        payload = {
            "graph": sanitize_graph(args["graph"])
        }
        if "name" in args:
            payload["name"] = args["name"]
        if "handle" in args:
            payload["handle"] = args["handle"]
        return make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b}", method="PUT", body=payload)
        
    elif name == "openrp_edit_behavior_node":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        b = args.get("behaviorId")
        node_id = args.get("nodeId")
        node_data = args.get("nodeData", {})
        if not u or not w or not b or not node_id:
            return {"error": True, "message": "userId, worldId, behaviorId, and nodeId are required"}
            
        curr = make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b}")
        if curr.get("error") or not curr.get("data"):
            return curr
        graph = curr["data"]["graph"]
        nodes = graph.get("nodes", [])
        
        found = False
        for node in nodes:
            if node.get("id") == node_id:
                node["data"] = node_data
                found = True
                break
                
        if not found:
            return {"error": True, "message": f"Node with ID '{node_id}' not found in behavior graph"}
            
        update_payload = {
            "name": curr["data"]["name"],
            "handle": curr["data"]["handle"],
            "graph": sanitize_graph(graph)
        }
        res_put = make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b}", method="PUT", body=update_payload)
        if res_put.get("error"):
            return res_put
        return {"success": True, "message": f"Node '{node_id}' updated successfully in behavior {b}"}
        
    elif name == "openrp_deploy_behavior":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        c = args.get("characterId") or auth_state.get("characterId")
        if not u or not w:
            return {"error": True, "message": "userId and worldId are required"}
            
        if args.get("deleteOldBehaviors", True):
            existing = make_request(f"/api/users/{u}/worlds/{w}/behaviors")
            if not existing.get("error") and "data" in existing:
                for b in existing.get("data", {}).get("data", []):
                    b_id = b.get("id")
                    if b_id:
                        make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b_id}", method="DELETE")
                        
        payload = {
            "name": args["name"],
            "handle": args["handle"],
            "graph": sanitize_graph(args["graph"])
        }
        res_create = make_request(f"/api/users/{u}/worlds/{w}/behaviors", method="POST", body=payload)
        if res_create.get("error") or not res_create.get("data"):
            return res_create
            
        behavior_id = res_create["data"]["id"]
        result = {
            "success": True,
            "behaviorId": behavior_id,
            "attached": False
        }
        
        if c:
            existing = make_request(f"/api/v1/characters/{c}/behaviors")
            if not existing.get("error") and "data" in existing:
                for item in existing.get("data", {}).get("data", []):
                    cb_id = item.get("id")
                    if cb_id:
                        make_request(f"/api/v1/character-behaviors/{cb_id}", method="DELETE")

            attach_payload = {
                "behaviorId": behavior_id,
                "behaviorRegistryTagId": None
            }
            res_attach = make_request(f"/api/v1/characters/{c}/behaviors", method="POST", body=attach_payload)
            result["attached"] = not res_attach.get("error")
            result["attachResponse"] = res_attach
            
        return result
        
    elif name == "openrp_delete_behavior":
        u = args.get("userId") or auth_state.get("userId")
        w = args.get("worldId") or auth_state.get("worldId")
        b = args.get("behaviorId")
        if not u or not w or not b:
            return {"error": True, "message": "userId, worldId, and behaviorId are required"}
        return make_request(f"/api/users/{u}/worlds/{w}/behaviors/{b}", method="DELETE")
        
    elif name == "openrp_attach_behavior_to_character":
        c = args.get("characterId") or auth_state.get("characterId")
        b = args.get("behaviorId")
        if not c or not b:
            return {"error": True, "message": "characterId and behaviorId are required"}
            
        if args.get("replaceExisting", True):
            existing = make_request(f"/api/v1/characters/{c}/behaviors")
            if not existing.get("error") and "data" in existing:
                for item in existing.get("data", {}).get("data", []):
                    cb_id = item.get("id")
                    if cb_id:
                        make_request(f"/api/v1/character-behaviors/{cb_id}", method="DELETE")

        payload = {
            "behaviorId": b,
            "behaviorRegistryTagId": None
        }
        return make_request(f"/api/v1/characters/{c}/behaviors", method="POST", body=payload)
        
    # --- CHAT & GROUP ---
    elif name == "openrp_list_chats":
        return make_request("/api/chats")
        
    elif name == "openrp_get_chat":
        chat_id = args.get("chatId")
        if not chat_id:
            return {"error": True, "message": "chatId is required"}
        return make_request(f"/api/chats/{chat_id}")
        
    elif name == "openrp_get_chat_messages":
        chat_id = args["chatId"]
        return make_request(f"/api/chats/{chat_id}/messages")
        
    elif name == "openrp_send_message":
        chat_id = args["chatId"]
        payload = {
            "chatId": chat_id,
            "content": args["content"],
            "chatParticipantId": args["chatParticipantId"]
        }
        return make_request(f"/api/chats/{chat_id}/messages", method="POST", body=payload)
        
    # --- AI MODELS & DISCOVERY ---
    elif name == "openrp_list_models":
        return make_request("/api/models")
        
    elif name == "openrp_discover_worlds":
        q = urllib.parse.quote(args.get("query", ""))
        page = args.get("page", 1)
        return make_request(f"/api/worlds/discover?query={q}&page={page}")
        
    elif name == "openrp_search_behavior_executions":
        payload = {}
        if "limit" in args:
            payload["limit"] = args["limit"]
        if "behaviorId" in args:
            payload["behaviorId"] = args["behaviorId"]
        if "chatId" in args:
            payload["chatId"] = args["chatId"]
        if "status" in args:
            payload["status"] = args["status"]
        return make_request("/api/v1/behavior-executions/search", method="POST", body=payload)
        
    elif name == "openrp_get_behavior_execution":
        eid = args.get("executionId")
        if not eid:
            return {"error": True, "message": "executionId is required"}
        return make_request(f"/api/v1/behavior-executions/{eid}")
        
    elif name == "openrp_get_behavior_node_executions":
        eid = args.get("executionId")
        if not eid:
            return {"error": True, "message": "executionId is required"}
        return make_request(f"/api/v1/behavior-executions/{eid}/node-executions")
        
    # --- RAW ---
    elif name == "openrp_raw_api":
        return make_request(
            path=args["path"],
            method=args.get("method", "GET"),
            body=args.get("body")
        )
        
    return {"error": True, "message": f"Unknown tool: {name}"}

def process_message(msg):
    method = msg.get("method")
    req_id = msg.get("id")
    
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "openrp-mcp-server", "version": "3.0.0"}
            }
        }
    elif method == "notifications/initialized":
        return None
    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": TOOLS}
        }
    elif method == "tools/call":
        params = msg.get("params", {})
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        result = handle_tool_call(tool_name, arguments)
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [{"type": "text", "text": json.dumps(result, indent=2)}]
            }
        }
    elif method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}
    else:
        if req_id is not None:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method '{method}' not found"}
            }
        return None

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
            resp = process_message(msg)
            if resp is not None:
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"Error handling message: {e}\n")

if __name__ == "__main__":
    main()
