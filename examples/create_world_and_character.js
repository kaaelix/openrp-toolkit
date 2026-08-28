#!/usr/bin/env node
/**
 * OpenRP Example: Create World & Character (Node.js Edition)
 * Demonstrates how to programmatically create a new World and Character persona.
 */

const TOKEN = process.env.OPENRP_TOKEN || 'YOUR_JWT_TOKEN';
const USER_ID = process.env.OPENRP_USER_ID || 'YOUR_USER_ID';
const BASE_URL = process.env.OPENRP_BASE_URL || 'https://openrp.ai';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'OpenRP-Node-Example/1.0'
};

async function createWorld() {
  const url = `${BASE_URL}/api/users/${USER_ID}/worlds`;
  const payload = {
    name: 'Neon Arcadia 2099',
    handle: 'neon-arcadia-2099',
    description: 'A retro-futuristic arcade underground where AIs and humans play high-stakes games.',
    readme: '# Neon Arcadia Lore\n\n## Factions & Rules\n1. Sector 4 Arcade Arena\n2. The High-Score Guild',
    visibility: 'public',
    tags: ['cyberpunk', 'arcade', 'game', 'retro'],
    embeddingModelId: 'text-embedding-3-small'
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await resp.json();
  console.log('World Created Successfully!');
  console.log(JSON.stringify(data, null, 2));
  return data.data.id;
}

async function createCharacter(worldId) {
  const url = `${BASE_URL}/api/users/${USER_ID}/worlds/${worldId}/characters`;
  const payload = {
    name: 'Sera',
    handle: 'sera-arcade-host',
    status: 'Online • Ready to play',
    shortDescription: 'Cheerful cyberpunk arcade host and game referee.',
    description: 'Sera is a 5th-gen synthetic AI hosting the Neon Arcadia arena.',
    personality: 'Role: Arcade Host. Personality: Cheerful, sharp, competitive yet fair. Style: Casual futuristic slang.',
    greetings: [
      'Welcome to Neon Arcadia! Ready to challenge me in Tic-Tac-Toe today?',
      'The arcade cabinet is powered on! Pick your square (1-9) to start.'
    ],
    dialogs: [
      {
        user: 'What games can we play?',
        character: 'We specialize in tactical games like Tic-Tac-Toe and Cyber Matrix!'
      }
    ]
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await resp.json();
  console.log('Character Created Successfully!');
  console.log(JSON.stringify(data, null, 2));
  return data.data.id;
}

async function main() {
  if (TOKEN === 'YOUR_JWT_TOKEN' || USER_ID === 'YOUR_USER_ID') {
    console.error('Please set OPENRP_TOKEN and OPENRP_USER_ID environment variables.');
    process.exit(1);
  }

  const worldId = await createWorld();
  await createCharacter(worldId);
}

if (require.main === module) {
  main().catch(console.error);
}
