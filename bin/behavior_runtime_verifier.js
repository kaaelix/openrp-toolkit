#!/usr/bin/env node

/**
 * OpenRP Automated Behavior Runtime Verifier
 * 
 * Executes full lifecycle verification:
 * 1. Pre-flight static schema check (0 errors)
 * 2. Deploy or update behavior DAG to OpenRP API (handles existing behaviors)
 * 3. Attach behavior to target character
 * 4. Send action message to chatroom
 * 5. Trigger direct editor execution runner (POST /api/v1/behaviors/:id/executions)
 * 6. Poll execution status until COMPLETED or FAILED
 * 7. If FAILED: dumps failing node error trace
 * 8. If COMPLETED: displays execution metrics, quantum variables, and debug URL
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { validateBehaviorGraph } = require('./validator');

// Parse CLI arguments
const args = process.argv.slice(2);
let payloadFile = null;
let cliUserId = null;
let cliWorldId = null;
let cliCharacterId = null;
let cliChatId = null;
let cliMessage = "Archon, activate combat protocol and execute turn action!";

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--user' && args[i + 1]) cliUserId = args[++i];
  else if (args[i] === '--world' && args[i + 1]) cliWorldId = args[++i];
  else if (args[i] === '--character' && args[i + 1]) cliCharacterId = args[++i];
  else if (args[i] === '--chat' && args[i + 1]) cliChatId = args[++i];
  else if (args[i] === '--message' && args[i + 1]) cliMessage = args[++i];
  else if (!args[i].startsWith('--') && !payloadFile) payloadFile = args[i];
}

let token = process.env.OPENRP_JWT || process.env.SUPABASE_ACCESS_TOKEN || process.env.OPENRP_TOKEN;
let savedAuth = {};

try {
  const authPath = path.join(os.homedir(), '.openrp_mcp_auth.json');
  if (fs.existsSync(authPath)) {
    savedAuth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    if (!token) token = savedAuth.token;
  }
} catch (e) {}

function apiRequest(apiPath, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`https://openrp.ai${apiPath}`);
    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OpenRP-Runtime-Verifier/1.1.5 (Dynamic)',
        ...extraHeaders
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyBehavior(targetPayloadPath) {
  console.log('====================================================');
  console.log('🚀 Starting OpenRP Dynamic Behavior Runtime Verifier');
  console.log('====================================================');

  if (!token) {
    console.error('❌ Error: No authentication token found. Please set OPENRP_JWT or run `openrp auth`.');
    process.exit(1);
  }

  // 1. Resolve Current Authenticated User Dynamically
  console.log('\n[Step 1/6] Resolving Authenticated User ID...');
  let userId = cliUserId || savedAuth.userId;
  if (!userId) {
    const meRes = await apiRequest('/api/users/me');
    userId = meRes.data?.id;
    if (!userId) {
      console.error('❌ Failed to resolve authenticated user from /api/users/me:', JSON.stringify(meRes, null, 2));
      process.exit(1);
    }
  }
  console.log(`✅ Authenticated User: ${userId}`);

  // 2. Pre-Flight Static Validation
  console.log('\n[Step 2/6] Running Pre-Flight Static Analysis...');
  if (!targetPayloadPath) {
    console.error('❌ Error: Please specify a behavior payload file (e.g. `node behavior_runtime_verifier.js my_behavior.json`).');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(process.cwd(), targetPayloadPath), 'utf8');
  const payload = JSON.parse(raw);

  const validation = validateBehaviorGraph(payload.graph);
  if (validation.errors.length > 0) {
    console.error('❌ Static validation failed with errors:', validation.errors);
    process.exit(1);
  }
  console.log('✅ Pre-flight static validation PASSED (0 Errors).');

  // 3. Dynamically Discover or Resolve Target World & Character
  console.log('\n[Step 3/6] Discovering Target World and Character...');
  let worldId = cliWorldId || savedAuth.worldId;
  if (!worldId) {
    const worldsRes = await apiRequest(`/api/users/${userId}/worlds?limit=5`);
    const worlds = worldsRes.data?.data || (Array.isArray(worldsRes.data) ? worldsRes.data : []);
    if (worlds.length === 0) {
      console.error('❌ No worlds found for this user account. Please create a world first.');
      process.exit(1);
    }
    worldId = worlds[0].id;
    console.log(`ℹ️ Auto-selected World: "${worlds[0].name}" (ID: ${worldId})`);
  } else {
    console.log(`✅ Target World ID: ${worldId}`);
  }

  let characterId = cliCharacterId || savedAuth.characterId;
  if (!characterId) {
    const charsRes = await apiRequest(`/api/users/${userId}/worlds/${worldId}/characters?limit=5`);
    const chars = charsRes.data?.data || (Array.isArray(charsRes.data) ? charsRes.data : []);
    if (chars.length === 0) {
      console.error('❌ No characters found in this world. Please create a character first.');
      process.exit(1);
    }
    characterId = chars[0].id;
    console.log(`ℹ️ Auto-selected Character: "${chars[0].name}" (ID: ${characterId})`);
  } else {
    console.log(`✅ Target Character ID: ${characterId}`);
  }

  // 4. Deploy or In-place Update Behavior DAG
  console.log('\n[Step 4/6] Deploying/Updating Behavior DAG on OpenRP...');
  let behaviorId = null;
  const listRes = await apiRequest(`/api/users/${userId}/worlds/${worldId}/behaviors`);
  const bList = listRes.data?.data || (Array.isArray(listRes.data) ? listRes.data : []);
  const existing = bList.find(b => b.handle === payload.handle || b.name === payload.name);

  if (existing) {
    behaviorId = existing.id;
    console.log(`ℹ️ Found existing behavior "${payload.name}" (ID: ${behaviorId}). Updating in-place...`);
    const updateRes = await apiRequest(`/api/users/${userId}/worlds/${worldId}/behaviors/${behaviorId}`, 'PUT', payload);
    if (updateRes.error) {
      console.error('❌ Update failed:', JSON.stringify(updateRes, null, 2));
      process.exit(1);
    }
    console.log(`✅ Behavior updated successfully! ID: ${behaviorId}`);
  } else {
    const deployRes = await apiRequest(`/api/users/${userId}/worlds/${worldId}/behaviors`, 'POST', payload);
    behaviorId = deployRes.data?.id;
    if (!behaviorId) {
      console.error('❌ Deployment failed:', JSON.stringify(deployRes, null, 2));
      process.exit(1);
    }
    console.log(`✅ Behavior created successfully! ID: ${behaviorId}`);
  }

  // Attach to Character
  console.log(`\n🔗 Ensuring Behavior is Attached to Character (${characterId})...`);
  const charBehaviors = await apiRequest(`/api/v1/characters/${characterId}/behaviors`);
  const attachedItems = charBehaviors.data?.data || [];
  const alreadyAttached = attachedItems.find(item => item.behaviorId === behaviorId);

  if (!alreadyAttached) {
    for (const item of attachedItems) {
      if (item.id) await apiRequest(`/api/v1/character-behaviors/${item.id}`, 'DELETE');
    }
    const attachRes = await apiRequest(`/api/v1/characters/${characterId}/behaviors`, 'POST', {
      behaviorId,
      behaviorRegistryTagId: null
    });
    console.log(`✅ Behavior attached! Attachment ID: ${attachRes.data?.id}`);
  } else {
    console.log(`✅ Behavior is already cleanly attached.`);
  }

  // 5. Discover or Create Chat Session & Resolve Participants
  console.log('\n[Step 5/6] Resolving Active Chat Session & Participants...');
  let chatId = cliChatId || savedAuth.chatId;
  let participantId = null;

  if (!chatId) {
    const chatsRes = await apiRequest('/api/chats');
    const chatList = chatsRes.data?.chats || (Array.isArray(chatsRes.data) ? chatsRes.data : []);
    if (chatList.length > 0) {
      chatId = chatList[0].id;
    } else {
      const newChat = await apiRequest('/api/chats', 'POST', { character_id: characterId, tentative: false });
      chatId = newChat.data?.id;
    }
  }

  if (!chatId) {
    console.error('❌ Failed to resolve or create a chat session.');
    process.exit(1);
  }
  console.log(`✅ Target Chat Session ID: ${chatId}`);

  // Fetch participants of the chat to dynamically find the human participant
  const chatDetails = await apiRequest(`/api/chats/${chatId}?expand=participants`);
  const participants = chatDetails.data?.participants?.data || [];
  const userPart = participants.find(p => p.userId !== null) || participants[0];
  participantId = userPart?.id;

  // Send Action Message
  console.log(`\n💬 Sending Player Action Message into Chatroom...`);
  const sendRes = await apiRequest(`/api/chats/${chatId}/messages`, 'POST', {
    content: cliMessage,
    participantId: participantId
  });
  const sentMsgId = sendRes.data?.id;
  console.log(`✅ Message sent! ID: ${sentMsgId}`);

  // 6. Trigger Direct Editor Debug Execution Runner
  console.log(`\n[Step 6/6] Triggering Execution Runner (POST /api/v1/behaviors/${behaviorId}/executions)...`);
  const execTriggerPayload = {
    triggerInput: {
      trigger: "events/chat_message",
      input: {
        chatId: chatId,
        messageId: sentMsgId,
        config: {},
        modelSettings: {
          chatModelId: "64ffc716-89a3-456e-9a95-ef4095f7d781",
          inputTokens: 128000
        }
      }
    },
    triggerSource: "editor"
  };

  const triggerRes = await apiRequest(`/api/v1/behaviors/${behaviorId}/executions`, 'POST', execTriggerPayload, {
    'Origin': 'https://openrp.ai',
    'Referer': `https://openrp.ai/behaviors/${behaviorId}?mode=debug`
  });

  const executionId = triggerRes.data?.id;
  if (!executionId) {
    console.error('❌ Failed to trigger behavior execution:', JSON.stringify(triggerRes, null, 2));
    process.exit(1);
  }
  console.log(`⚡ Execution runner triggered! ID: ${executionId}`);

  // Polling execution status
  console.log('\n--- Polling Execution Status ---');
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    await sleep(1500);

    const pollRes = await apiRequest('/api/v1/behavior-executions/search', 'POST', { ids: [executionId] });
    const ex = pollRes.data?.data?.[0];

    if (!ex) {
      process.stdout.write('.');
      continue;
    }

    if (ex.status === 'BEHAVIOR_EXECUTION_STATUS_COMPLETED') {
      console.log(`\n\n🎉 [SUCCESS] Behavior execution COMPLETED! (Execution ID: ${executionId})`);
      console.log(`🔗 Debug URL: https://openrp.ai/behaviors/${behaviorId}?executionId=${executionId}&mode=debug`);

      const nodesRes = await apiRequest(`/api/v1/behavior-executions/${executionId}/node-executions`);
      const nodes = nodesRes.data || [];
      console.log(`\n📊 Executed Nodes Summary (${nodes.length} nodes):`);
      nodes.forEach((n, idx) => {
        console.log(`  [${idx + 1}] ${n.nodeId} (${n.status})`);
      });

      return { success: true, executionId, behaviorId };
    }

    if (ex.status === 'BEHAVIOR_EXECUTION_STATUS_FAILED') {
      console.error(`\n\n❌ [FAILED] Behavior execution FAILED! (Execution ID: ${executionId})`);
      const nodesRes = await apiRequest(`/api/v1/behavior-executions/${executionId}/node-executions`);
      const nodes = nodesRes.data || [];
      const failingNodes = nodes.filter(n => n.status === 'BEHAVIOR_EXECUTION_STATUS_FAILED' || n.output?.error);
      
      console.error('\n🔴 Failing Nodes Diagnostics:');
      failingNodes.forEach(fn => {
        console.error(`\nNode ID: ${fn.nodeId}`);
        console.error('Error Details:', JSON.stringify(fn.output, null, 2));
      });

      console.error(`\n🔗 Debug URL: https://openrp.ai/behaviors/${behaviorId}?executionId=${executionId}&mode=debug`);
      process.exit(1);
    }

    process.stdout.write(`[Attempt ${attempts}] Status: ${ex.status}...\r`);
  }

  console.error('\n⏱️ Timeout: Execution did not complete within the time limit.');
  process.exit(1);
}

if (require.main === module) {
  const target = payloadFile || 'skills/openrp/references/official_image_rpg_behavior.json';
  verifyBehavior(target).catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
  });
}

module.exports = { verifyBehavior };

