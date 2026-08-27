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
    
    print("=" * 70)
    print("🚀 OPENRP BEHAVIOR DEBUGGER & EXECUTION RUNBOOK")
    print("=" * 70)
    
    # 1. Fetch User Profile
    me = api_request("/api/users/me", token=token)
    user_name = me.get("data", {}).get("name", "Unknown")
    user_handle = me.get("data", {}).get("handle", "Unknown")
    print(f"[*] Authenticated User: {user_name} (@{user_handle})")
    
    # 2. Query Recent Behavior Executions via Official Debug API
    print("\n" + "-" * 70)
    print("🔍 RECENT BEHAVIOR EXECUTION TRACES (GET /api/v1/behavior-executions)")
    print("-" * 70)
    
    exec_search = api_request("/api/v1/behavior-executions/search", method="POST", body={"limit": 3}, token=token)
    executions = exec_search.get("data", {}).get("data", [])
    
    if executions:
        for idx, ex in enumerate(executions):
            eid = ex.get("id")
            status = ex.get("status")
            started_at = ex.get("startedAt")
            finished_at = ex.get("finishedAt")
            beh_id = ex.get("behaviorId")
            
            print(f"\n[{idx + 1}] Execution ID: {eid}")
            print(f"    - Status     : {status}")
            print(f"    - Started At : {started_at}")
            print(f"    - Finished At: {finished_at}")
            print(f"    - Behavior ID: {beh_id}")
            
            # Fetch node-level trace
            nodes_res = api_request(f"/api/v1/behavior-executions/{eid}/node-executions", token=token)
            nodes_trace = nodes_res.get("data", [])
            print(f"    - Node Traces ({len(nodes_trace)} nodes executed):")
            for nt in nodes_trace[:6]:
                nid = nt.get("nodeId")
                nstatus = nt.get("status")
                duration = nt.get("duration")
                print(f"      • [{nid}] -> {nstatus} ({duration}ms)")
    else:
        print("[!] No recent behavior executions found.")
        
    print("\n" + "=" * 70)
    print("🛠️ MANUAL TEST / DEBUG INSTRUCTIONS")
    print("=" * 70)
    print("1. Open Behavior Editor in OpenRP: https://openrp.ai")
    print("2. Click the root 'events/chat_message' node.")
    print("3. In the Inspector pane under 'Manual Test', enter a test chatId & messageId.")
    print("4. Click 'Run Trigger Test' to enter live visual Debug Mode.")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    debug_active_chat()
