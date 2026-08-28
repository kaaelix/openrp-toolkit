#!/usr/bin/env node

/**
 * Deploy & Attach AETHERIS-Omega Behavior
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const AUTH_USER_ID = "0d24041d-23b1-465a-9f37-110c0c0729f1";
const WORLD_ID = "01a0467b-9fcc-746c-8f36-2c1ec0b46516"; // Aetheria
const AURELIA_ID = "01a0467c-2c62-7654-a4e9-3917119f29f3";
const CHAT_ID = "01a046b4-2566-74d3-971b-9a46e7c8a192";
const PARTICIPANT_ID = "01a046b4-2585-7389-9fef-1f92104fcfa4";

const token = process.env.OPENRP_JWT || process.env.SUPABASE_ACCESS_TOKEN;

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = `https://openrp.ai${path}`;
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== 1. Deploying AETHERIS-Omega Behavior ===');
  const payloadPath = path.join(__dirname, '..', 'omega_payload.json');
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

  const deployRes = await request(`/api/users/${AUTH_USER_ID}/worlds/${WORLD_ID}/behaviors`, 'POST', payload);
  console.log('Deploy Result:', JSON.stringify(deployRes, null, 2));

  const behaviorId = deployRes.data?.id;
  if (!behaviorId) {
    console.error('Failed to create behavior!');
    process.exit(1);
  }

  console.log(`\n=== 2. Attaching Behavior (${behaviorId}) to Archon Aurelia ===`);
  const attachRes = await request(`/api/v1/characters/${AURELIA_ID}/behaviors`, 'POST', {
    behaviorId,
    behaviorRegistryTagId: null
  });
  console.log('Attach Result:', JSON.stringify(attachRes, null, 2));

  console.log(`\n=== 3. Sending Action Message to Chat (${CHAT_ID}) ===`);
  const msgRes = await request(`/api/chats/${CHAT_ID}/messages`, 'POST', {
    content: "Aku merapal mantra Badai Kosmik Aetheria ke arah portal bayangan!",
    participantId: PARTICIPANT_ID
  });
  console.log('Message Sent:', JSON.stringify(msgRes, null, 2));

  console.log('\n======================================================');
  console.log('🎉 AETHERIS-Omega Successfully Deployed & Attached!');
  console.log(`Behavior ID: ${behaviorId}`);
  console.log(`OpenRP Editor URL: https://openrp.ai/behaviors/${behaviorId}`);
  console.log('======================================================');
}

main().catch(console.error);
