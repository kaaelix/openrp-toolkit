#!/usr/bin/env python3
"""
OpenRP Example: Create World & Character
Demonstrates how to programmatically create a new World and Character persona.
"""

import os
import json
import urllib.request

TOKEN = os.environ.get("OPENRP_TOKEN", "YOUR_JWT_TOKEN")
USER_ID = os.environ.get("OPENRP_USER_ID", "YOUR_USER_ID")
BASE_URL = "https://openrp.ai"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "User-Agent": "OpenRP-Example/1.0"
}

def create_world():
    url = f"{BASE_URL}/api/users/{USER_ID}/worlds"
    payload = {
        "name": "Neon Arcadia 2099",
        "handle": "neon-arcadia-2099",
        "description": "A retro-futuristic arcade underground where AIs and humans play high-stakes games.",
        "readme": "# Neon Arcadia Lore\n\n## Factions & Rules\n1. Sector 4 Arcade Arena\n2. The High-Score Guild",
        "visibility": "public",
        "tags": ["cyberpunk", "arcade", "game", "retro"],
        "embeddingModelId": "text-embedding-3-small"
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("World Created Successfully!")
        print(json.dumps(res, indent=2))
        return res["data"]["id"]

def create_character(world_id):
    url = f"{BASE_URL}/api/users/{USER_ID}/worlds/{world_id}/characters"
    payload = {
        "name": "Sera",
        "handle": "sera-arcade-host",
        "status": "Online • Ready to play",
        "shortDescription": "Cheerful cyberpunk arcade host and game referee.",
        "description": "Sera is a 5th-gen synthetic AI hosting the Neon Arcadia arena.",
        "personality": "Role: Arcade Host. Personality: Cheerful, sharp, competitive yet fair. Style: Casual futuristic slang.",
        "greetings": [
            "Welcome to Neon Arcadia! Ready to challenge me in Tic-Tac-Toe today?",
            "The arcade cabinet is powered on! Pick your square (1-9) to start."
        ],
        "dialogs": [
            {
                "user": "What games can we play?",
                "character": "We specialize in tactical games like Tic-Tac-Toe and Cyber Matrix!"
            }
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        print("Character Created Successfully!")
        print(json.dumps(res, indent=2))
        return res["data"]["id"]

if __name__ == "__main__":
    print("Creating World & Character on OpenRP...")
    world_id = create_world()
    char_id = create_character(world_id)
    print(f"\nAll set! World ID: {world_id} | Character ID: {char_id}")
