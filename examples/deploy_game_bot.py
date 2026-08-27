#!/usr/bin/env python3
"""
OpenRP Example: Deploy Game Bot Behavior Graph
Demonstrates how to build a sequential state machine graph and deploy it to OpenRP.
"""

import os
import json
import urllib.request

TOKEN = os.environ.get("OPENRP_TOKEN", "YOUR_JWT_TOKEN")
USER_ID = os.environ.get("OPENRP_USER_ID", "YOUR_USER_ID")
WORLD_ID = os.environ.get("OPENRP_WORLD_ID", "YOUR_WORLD_ID")
CHARACTER_ID = os.environ.get("OPENRP_CHARACTER_ID", "YOUR_CHARACTER_ID")
BASE_URL = "https://openrp.ai"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "OpenRP-Example/1.0"
}

def deploy_game_behavior():
    url = f"{BASE_URL}/api/users/{USER_ID}/worlds/{WORLD_ID}/behaviors"
    
    # Define minimal working behavior graph
    graph = {
        "nodes": [
            {
                "id": "chatMessage",
                "type": "events/chat_message",
                "position": {"x": 0, "y": 0},
                "data": {}
            },
            {
                "id": "getChatMessage",
                "type": "storage/get_chat_message",
                "position": {"x": 200, "y": 0},
                "data": {
                    "messageId": {"$expression": "chatMessage.messageId"}
                }
            },
            {
                "id": "getDefaultModel",
                "type": "ai/get_default_model",
                "position": {"x": 400, "y": 0},
                "data": {}
            },
            {
                "id": "llm",
                "type": "ai/llm",
                "position": {"x": 600, "y": 0},
                "data": {
                    "modelId": {"$expression": "getDefaultModel.id"},
                    "systemPrompt": {"$template": "You are a cyber arcade AI. Reply cheerfully to: {{ getChatMessage.content }}"}
                }
            },
            {
                "id": "getChat",
                "type": "storage/get_chat",
                "position": {"x": 800, "y": 0},
                "data": {
                    "chatId": {"$expression": "chatMessage.chatId"},
                    "expand": ["participants"]
                }
            },
            {
                "id": "filterBot",
                "type": "utilities/filter",
                "position": {"x": 1000, "y": 0},
                "data": {
                    "list": {"$expression": "getChat.participants.data"},
                    "itemCondition": "item.userId === null"
                }
            },
            {
                "id": "insertChatMessage",
                "type": "storage/insert_chat_message",
                "position": {"x": 1200, "y": 0},
                "data": {
                    "chatId": {"$expression": "chatMessage.chatId"},
                    "chatParticipantId": {"$expression": "filterBot.list[0].id"},
                    "content": {"$template": "{{ llm.outputText }}"}
                }
            }
        ],
        "edges": [
            {"id": "e1", "source": "chatMessage", "target": "getChatMessage", "sourceHandle": "next", "targetHandle": "previous"},
            {"id": "e2", "source": "getChatMessage", "target": "getDefaultModel", "sourceHandle": "next", "targetHandle": "previous"},
            {"id": "e3", "source": "getDefaultModel", "target": "llm", "sourceHandle": "next", "targetHandle": "previous"},
            {"id": "e4", "source": "llm", "target": "getChat", "sourceHandle": "next", "targetHandle": "previous"},
            {"id": "e5", "source": "getChat", "target": "filterBot", "sourceHandle": "next", "targetHandle": "previous"},
            {"id": "e6", "source": "filterBot", "target": "insertChatMessage", "sourceHandle": "next", "targetHandle": "previous"}
        ]
    }
    
    payload = {
        "name": "Arcade Responder",
        "handle": "arcade-responder",
        "graph": graph
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        behavior_id = res["data"]["id"]
        print(f"Behavior Created! ID: {behavior_id}")
        
    # Attach to character
    if CHARACTER_ID:
        attach_url = f"{BASE_URL}/api/v1/characters/{CHARACTER_ID}/behaviors"
        attach_payload = {"behaviorId": behavior_id, "behaviorRegistryTagId": None}
        req_att = urllib.request.Request(attach_url, data=json.dumps(attach_payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req_att) as resp_att:
            print("Behavior Attached to Character Successfully!")

if __name__ == "__main__":
    print("Deploying Game Behavior to OpenRP...")
    deploy_game_behavior()
