#!/usr/bin/env python3
"""
OpenRP Behavior Execution & Debug Mode Utility
----------------------------------------------
Automates testing, triggering, and inspecting behavior execution traces.

Usage:
  python3 examples/debug_behavior_execution.py
"""

import urllib.request
import urllib.error
import json
import os
import sys

AUTH_FILE = os.path.expanduser("~/.openrp_mcp_auth.json")

def load_auth():
    if not os.path.exists(AUTH_FILE):
        print(f"[ERROR] Auth file not found at {AUTH_FILE}. Run openrp_set_auth first.")
        sys.exit(1)
    with open(AUTH_FILE, "r") as f:
        return json.load(f)

def api_request(path, method="GET", body=None, token=None):
    url = f"https://openrp.ai{path}" if path.startswith("/") else path
    headers = {
        "User-Agent": "OpenRP-Debugger/1.0",
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {"status": resp.status}
    except urllib.error.HTTPError as e:
        raw_err = e.read().decode("utf-8")
        try:
            return json.loads(raw_err)
        except Exception:
            return {"error": True, "status": e.code, "message": raw_err}

def debug_active_chat():
    auth = load_auth()
    token = auth.get("token")
    user_id = auth.get("userId")
    
    print("=" * 60)
    print("OPENRP BEHAVIOR DEBUGGER & EXECUTION RUNBOOK")
    print("=" * 60)
    
    # 1. Fetch User Profile
    me = api_request("/api/users/me", token=token)
    user_name = me.get("data", {}).get("name", "Unknown")
    user_handle = me.get("data", {}).get("handle", "Unknown")
    print(f"[*] Authenticated User: {user_name} (@{user_handle})")
    
    # 2. List Chats
    chats_res = api_request("/api/chats", token=token)
    raw_data = chats_res.get("data", [])
    if isinstance(raw_data, dict):
        chats = raw_data.get("data", [])
    elif isinstance(raw_data, list):
        chats = raw_data
    else:
        chats = []
        
    if not chats:
        print("[!] No active chats found. Create a chatroom on openrp.ai first.")
        return
        
    chat = chats[0]
    chat_id = chat.get("id")
    print(f"[*] Target Chatroom ID: {chat_id}")
    
    # 3. Inspect Chat Details & Participants
    chat_detail = api_request(f"/api/chats/{chat_id}?expand=participants", token=token)
    participants = chat_detail.get("data", {}).get("participants", {}).get("data", [])
    
    user_part_id = None
    bot_part_id = None
    for p in participants:
        if p.get("userId"):
            user_part_id = p.get("id")
        else:
            bot_part_id = p.get("id")
            
    print(f"    - User Participant ID: {user_part_id}")
    print(f"    - Bot Participant ID : {bot_part_id}")
    
    # 4. Fetch Recent Messages & Inspect Metadata Traces
    print("\n" + "-" * 60)
    print("INSPECTING RECENT MESSAGES & EXECUTION TRACES")
    print("-" * 60)
    
    msg_res = api_request(f"/api/chats/{chat_id}/messages?limit=5", token=token)
    msg_data = msg_res.get("data", {})
    messages = msg_data.get("data", []) if isinstance(msg_data, dict) else msg_data
    
    for idx, msg in enumerate(messages):
        msg_id = msg.get("id")
        sender_type = "BOT" if msg.get("participantId") == bot_part_id else "USER"
        content_preview = msg.get("content", "").replace("\n", " ")[:60]
        created_at = msg.get("createdAt", "")
        
        print(f"\n[{idx + 1}] Message ID: {msg_id} ({sender_type})")
        print(f"    Created At: {created_at}")
        print(f"    Content   : \"{content_preview}...\"")
        print(f"    Debug Mode Inspection URL:")
        print(f"       https://openrp.ai/chats/{chat_id}?debugMessageId={msg_id}")
        
    # 5. Step-by-Step Manual Test Instructions
    print("\n" + "=" * 60)
    print("HOW TO TRIGGER DEBUG MODE MANUALLY IN BEHAVIOR EDITOR")
    print("=" * 60)
    print("1. Open the Behavior Editor in your browser: https://openrp.ai")
    print("2. Click on the root 'events/chat_message' node on the canvas.")
    print("3. In the right Inspector Panel, scroll to 'Manual Test'.")
    print("4. Paste the following test payload:")
    print("   {")
    print(f'     "chatId": "{chat_id}",')
    if messages:
        print(f'     "messageId": "{messages[0].get("id")}"')
    else:
        print(f'     "messageId": "<paste_message_id_here>"')
    print("   }")
    print("5. Click 'Run Trigger Test'.")
    print("6. The canvas will immediately enter DEBUG MODE:")
    print("   - Green badge: Node executed successfully.")
    print("   - Red badge  : Node failed (click to inspect error stack).")
    print("   - Gray badge : Node was skipped by conditional logic.")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    debug_active_chat()
