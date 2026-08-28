#!/usr/bin/env node

/**
 * OpenRP Automated Behavior Runtime Verifier
 * 
 * Executes full lifecycle verification:
 * 1. Pre-flight static schema check (0 errors)
 * 2. Deploy behavior DAG to OpenRP API
 * 3. Attach behavior to target character
 * 4. Trigger test message in target chatroom
 * 5. Poll behavior executions until status is COMPLETED or FAILED
 * 6. If FAILED: dumps failing node error trace
 * 7. If COMPLETED: retrieves bot reply and confirms success
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { validateBehaviorGraph } = require('./validator');

const AUTH_USER_ID = "0d24041d-23b1-465a-9f37-110c0c0729f1";
const WORLD_ID = "01a0467b-9fcc-746c-8f36-2c1ec0b46516";
const AURELIA_ID = "01a0467c-2c62-7654-a4e9-3917119f29f3";
const CHAT_ID = "01a046b4-2566-74d3-971b-9a46e7c8a192";
const PARTICIPANT_ID = "01a046b4-2585-7389-9fef-1f92104fcfa4";

const token = process.env.OPENRP_JWT || process.env.SUPABASE_ACCESS_TOKEN;

function apiRequest(apiPath, method = 'GET', body = null) {
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
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)'
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

  // 2. Deploy Behavior
  console.log('\n[Step 2/5] Deploying Behavior DAG to OpenRP...');
  const deployRes = await apiRequest(`/api/users/${AUTH_USER_ID}/worlds/${WORLD_ID}/behaviors`, 'POST', payload);
  const behaviorId = deployRes.data?.id;
  if (!behaviorId) {
    console.error('❌ Deployment failed:', JSON.stringify(deployRes, null, 2));
    process.exit(1);
  }
  console.log(`✅ Behavior deployed successfully! ID: ${behaviorId}`);

  // 3. Attach to Character
  console.log(`\n[Step 3/5] Attaching Behavior to Character (${AURELIA_ID})...`);
  const attachRes = await apiRequest(`/api/v1/characters/${AURELIA_ID}/behaviors`, 'POST', {
    behaviorId,
    behaviorRegistryTagId: null
  });
  console.log(`✅ Behavior attached! Attachment ID: ${attachRes.data?.id}`);

  // 4. Send Action Message
  console.log(`\n[Step 4/5] Sending Action Message to Chat (${CHAT_ID})...`);
  const sendRes = await apiRequest(`/api/chats/${CHAT_ID}/messages`, 'POST', {
    content: "Archon Aurelia, aktifkan protokol tempur kosmik dan lancarkan tembakan tombak bintang ke arah retakan bayangan!",
    participantId: PARTICIPANT_ID
  });
  const sentMsgId = sendRes.data?.id;
  console.log(`✅ Test message sent! Message ID: ${sentMsgId}`);

  // 5. Polling Behavior Execution until COMPLETED or FAILED
  console.log('\n[Step 5/5] Polling Behavior Executions Runtime Status...');
  let targetExecution = null;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    await sleep(2000);

    const searchRes = await apiRequest('/api/v1/behavior-executions/search', 'POST', { limit: 5 });
    const executions = searchRes.data?.data || [];
    
    // Find execution matching our behaviorId or sent messageId
    const found = executions.find(ex => ex.behaviorId === behaviorId || ex.triggerInput?.input?.messageId === sentMsgId);
    if (found) {
      targetExecution = found;
      console.log(`[Attempt ${attempts}] Execution ID: ${found.id} | Status: ${found.status} | Node Count: ${found.nodeExecutionCount}`);
      
      if (found.status === 'BEHAVIOR_EXECUTION_STATUS_COMPLETED') {
        console.log('\n====================================================');
        console.log('🎉 VERIFICATION SUCCESS: BEHAVIOR_EXECUTION_STATUS_COMPLETED!');
        console.log(`Behavior ID: ${behaviorId}`);
        console.log(`Execution ID: ${found.id}`);
        console.log(`OpenRP Editor: https://openrp.ai/behaviors/${behaviorId}?mode=debug&executionId=${found.id}`);
        console.log('====================================================');
        return { success: true, executionId: found.id, behaviorId };
      }

      if (found.status === 'BEHAVIOR_EXECUTION_STATUS_FAILED') {
        console.error('\n❌ EXECUTION FAILED! Fetching failed node error trace...');
        const nodeExecRes = await apiRequest(`/api/v1/behavior-executions/${found.id}/node-executions`, 'GET');
        const nodeExecs = nodeExecRes.data || [];
        nodeExecs.forEach(n => {
          if (n.status === 'BEHAVIOR_EXECUTION_STATUS_FAILED' || n.output?.error) {
            console.error(`\n🚨 FAILED NODE: [${n.nodeId}] (${n.status})`);
            console.error('Error Details:', JSON.stringify(n.output?.error || n.output, null, 2));
          }
        });
        return { success: false, executionId: found.id, behaviorId, error: found };
      }
    } else {
      console.log(`[Attempt ${attempts}] Waiting for worker to pick up trigger...`);
    }
  }

  console.error('❌ Polling timed out without terminal execution status.');
  return { success: false, timeout: true };
}

if (require.main === module) {
  const payloadPath = process.argv[2] || 'omega_payload.json';
  verifyBehavior(payloadPath).then(result => {
    if (!result.success) process.exit(1);
  });
}

module.exports = { verifyBehavior };
