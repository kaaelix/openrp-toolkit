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

const AUTH_USER_ID = "0d24041d-23b1-465a-9f37-110c0c0729f1";
const WORLD_ID = "01a0467b-9fcc-746c-8f36-2c1ec0b46516";
const AURELIA_ID = "01a0467c-2c62-7654-a4e9-3917119f29f3";
const CHAT_ID = "01a046b4-2566-74d3-971b-9a46e7c8a192";
const PARTICIPANT_ID = "01a046b4-2585-7389-9fef-1f92104fcfa4";

let token = process.env.OPENRP_JWT || process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  try {
    const authPath = path.join(os.homedir(), '.openrp_mcp_auth.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      token = auth.token;
    }
  } catch (e) {}
}

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
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
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

async function verifyBehavior(payloadFilePath) {
  console.log('====================================================');
  console.log('🚀 Starting OpenRP Automated Behavior Runtime Verifier');
  console.log('====================================================');

  const raw = fs.readFileSync(path.resolve(process.cwd(), payloadFilePath), 'utf8');
  const payload = JSON.parse(raw);

  // 1. Static Validation
  console.log('\n[Step 1/5] Running Pre-Flight Static Analysis...');
  const validation = validateBehaviorGraph(payload.graph);
  if (validation.errors.length > 0) {
    console.error('❌ Static validation failed:', validation.errors);
    process.exit(1);
  }
  console.log('✅ Pre-flight static validation PASSED (0 Errors).');

  // 2. Deploy or In-place Update Behavior
  console.log('\n[Step 2/5] Deploying/Updating Behavior DAG on OpenRP...');
  let behaviorId = null;
  const listRes = await apiRequest(`/api/users/${AUTH_USER_ID}/worlds/${WORLD_ID}/behaviors`);
  const bList = listRes.data?.data || (Array.isArray(listRes.data) ? listRes.data : []);
  const existing = bList.find(b => b.handle === payload.handle || b.name === payload.name);

  if (existing) {
    behaviorId = existing.id;
    console.log(`ℹ️ Found existing behavior "${payload.name}" (ID: ${behaviorId}). Updating in-place...`);
    const updateRes = await apiRequest(`/api/users/${AUTH_USER_ID}/worlds/${WORLD_ID}/behaviors/${behaviorId}`, 'PUT', payload);
    if (updateRes.error) {
      console.error('❌ Update failed:', JSON.stringify(updateRes, null, 2));
      process.exit(1);
    }
    console.log(`✅ Behavior updated successfully! ID: ${behaviorId}`);
  } else {
    const deployRes = await apiRequest(`/api/users/${AUTH_USER_ID}/worlds/${WORLD_ID}/behaviors`, 'POST', payload);
    behaviorId = deployRes.data?.id;
    if (!behaviorId) {
      console.error('❌ Deployment failed:', JSON.stringify(deployRes, null, 2));
      process.exit(1);
    }
    console.log(`✅ Behavior created successfully! ID: ${behaviorId}`);
  }

  // 3. Attach to Character
  console.log(`\n[Step 3/5] Ensuring Behavior is Attached to Character (${AURELIA_ID})...`);
  const charBehaviors = await apiRequest(`/api/v1/characters/${AURELIA_ID}/behaviors`);
  const attachedItems = charBehaviors.data?.data || [];
  const alreadyAttached = attachedItems.find(item => item.behaviorId === behaviorId);

  if (!alreadyAttached) {
    // Detach old ones
    for (const item of attachedItems) {
      if (item.id) await apiRequest(`/api/v1/character-behaviors/${item.id}`, 'DELETE');
    }
    const attachRes = await apiRequest(`/api/v1/characters/${AURELIA_ID}/behaviors`, 'POST', {
      behaviorId,
      behaviorRegistryTagId: null
    });
    console.log(`✅ Behavior attached! Attachment ID: ${attachRes.data?.id}`);
  } else {
    console.log(`✅ Behavior is already cleanly attached (Attachment ID: ${alreadyAttached.id}).`);
  }

  // 4. Send Action Message
  console.log(`\n[Step 4/5] Sending Action Message to Chat (${CHAT_ID})...`);
  const sendRes = await apiRequest(`/api/chats/${CHAT_ID}/messages`, 'POST', {
    content: "Archon Aurelia, aktifkan protokol tempur kosmik dan lancarkan tembakan tombak bintang ke arah retakan bayangan!",
    participantId: PARTICIPANT_ID
  });
  const sentMsgId = sendRes.data?.id;
  console.log(`✅ Test message sent! Message ID: ${sentMsgId}`);

  // 5. Trigger Direct Editor Debug Execution Runner
  console.log(`\n[Step 5/5] Triggering Direct Editor Debug Execution Runner...`);
  const execTriggerPayload = {
    triggerInput: {
      trigger: "events/chat_message",
      input: {
        chatId: CHAT_ID,
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
  console.log(`⚡ Execution triggered successfully! Execution ID: ${executionId}`);

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

      process.exit(0);
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
  const fileArg = process.argv[2] || 'omega_payload.json';
  verifyBehavior(fileArg).catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
  });
}

module.exports = { verifyBehavior };
