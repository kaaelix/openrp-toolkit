#!/usr/bin/env node
/**
 * OpenRP Behavior Execution & Debug Mode Utility (Node.js Edition)
 * Automates testing, triggering, and inspecting behavior execution traces.
 * 
 * Usage:
 *   node examples/debug_behavior_execution.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const AUTH_FILE = path.join(os.homedir(), '.openrp_mcp_auth.json');
const BASE_URL = process.env.OPENRP_BASE_URL || 'https://openrp.ai';

function loadAuth() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error(`[ERROR] Auth file not found at ${AUTH_FILE}. Run 'npx openrp-toolkit auth' first.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
}

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {
    'User-Agent': 'OpenRP-Debugger/1.0',
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: true, message: err.message };
  }
}

async function debugActiveChat() {
  const auth = loadAuth();
  const token = auth.token;

  console.log('='.repeat(70));
  console.log('OPENRP BEHAVIOR DEBUGGER & EXECUTION RUNBOOK');
  console.log('='.repeat(70));

  // 1. Fetch User Profile
  const me = await apiRequest('/api/users/me', 'GET', null, token);
  const userName = me?.data?.name || 'Unknown';
  console.log(`[1] Authenticated User : ${userName} (@${me?.data?.handle || ''})`);

  // 2. Fetch Latest Executions
  console.log('[2] Searching latest behavior executions...');
  const execs = await apiRequest('/api/behavior-executions?limit=5', 'GET', null, token);
  const data = execs?.data?.data || [];

  if (!data.length) {
    console.log('[NOTICE] No behavior executions found yet.');
    console.log('Send a chat message in OpenRP UI or via openrp_send_message to trigger a run.');
    return;
  }

  console.log(`Found ${data.length} recent executions:\n`);
  for (const item of data) {
    const execId = item.id;
    const status = item.status;
    const started = item.startedAt;
    const ended = item.endedAt;
    console.log(`-> Execution ID : ${execId}`);
    console.log(`   Status       : ${status}`);
    console.log(`   Time Range   : ${started} -> ${ended}`);

    // Fetch Node Executions Trace
    const nodeExecs = await apiRequest(`/api/behavior-executions/${execId}/node-executions`, 'GET', null, token);
    const nodes = nodeExecs?.data || [];

    console.log(`   Resolved Nodes: (${nodes.length} nodes)`);
    for (const node of nodes) {
      const nodeName = node.nodeId || node.nodeType || 'Node';
      const nodeStatus = node.status;
      const errorMsg = node.error ? ` [ERROR: ${JSON.stringify(node.error)}]` : '';
      console.log(`     - [${nodeStatus}] ${nodeName}${errorMsg}`);
    }
    console.log('-'.repeat(50));
  }
}

if (require.main === module) {
  debugActiveChat().catch(console.error);
}
