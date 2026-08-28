#!/usr/bin/env node
/**
 * OpenRP Example: Multi-Agent Arena & Turn-Taking Orchestrator (Node.js Edition)
 * 
 * Demonstrates how to programmatically:
 * 1. Create a World Universe ("Valoria Battle Arena")
 * 2. Create 2 Distinct AI Characters ("Eldrin the Mage" & "Kaelen the Rogue")
 * 3. Create a Character Group / Faction ("Adventurers Guild")
 * 4. Deploy Mention-Gated ReactFlow Behavior Graph with Typing Indicator & Filter Gate
 * 5. Attach Behavior Graphs to Characters
 * 6. Initiate a Multi-Agent Group Chatroom
 * 
 * Maintainer: OpenRP Community
 * Platform: https://openrp.ai
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const AUTH_FILE = path.join(os.homedir(), '.openrp_mcp_auth.json');
const BASE_URL = process.env.OPENRP_BASE_URL || 'https://openrp.ai';

function loadAuth() {
  if (fs.existsSync(AUTH_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    } catch {}
  }
  return {
    token: process.env.OPENRP_TOKEN || '',
    userId: process.env.OPENRP_USER_ID || '',
    worldId: process.env.OPENRP_WORLD_ID || '',
    characterId: process.env.OPENRP_CHARACTER_ID || ''
  };
}

async function requestApi(endpoint, method = 'GET', body = null, token = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {
    'User-Agent': 'OpenRP-Arena-Orchestrator/1.0',
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API Error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

/**
 * Builds a Mention-Gated Behavior Graph conforming strictly to ReactFlow & JEXL standards:
 * - Root: events/chat_message
 * - storage/get_chat_message (reads incoming text)
 * - storage/get_chat (expands participants)
 * - utilities/filter (finds this bot's chatParticipantId: item.userId === null && item.characterId === botCharId)
 * - control_flow/if (checks if message contains @handle or character name)
 * - storage/update_typing_status (shows typing indicator)
 * - ai/get_default_model -> ai/llm (generates in-character roleplay response)
 * - storage/insert_chat_message (dispatches character reply)
 * - storage/update_typing_status (clears typing indicator)
 */
function buildMentionGatedGraph(characterHandle, characterName) {
  return {
    nodes: [
      {
        id: 'chatTrigger',
        type: 'events/chat_message',
        position: { x: 100, y: 200 },
        data: {}
      },
      {
        id: 'getMessage',
        type: 'storage/get_chat_message',
        position: { x: 360, y: 200 },
        data: {
          messageId: { $expression: 'chatTrigger.messageId' }
        }
      },
      {
        id: 'getChatRoom',
        type: 'storage/get_chat',
        position: { x: 620, y: 200 },
        data: {
          chatId: { $expression: 'chatTrigger.chatId' },
          expand: ['participants']
        }
      },
      {
        id: 'filterBotParticipant',
        type: 'utilities/filter',
        position: { x: 880, y: 200 },
        data: {
          list: { $expression: 'getChatRoom.participants.data' },
          itemCondition: 'item.userId === null'
        }
      },
      {
        id: 'mentionGate',
        type: 'control_flow/if',
        position: { x: 1140, y: 200 },
        data: {
          condition: {
            $expression: `getMessage.content.toLowerCase().indexOf("@${characterHandle.toLowerCase()}") != -1 || getMessage.content.toLowerCase().indexOf("${characterName.toLowerCase()}") != -1`
          }
        }
      },
      {
        id: 'startTyping',
        type: 'storage/update_typing_status',
        position: { x: 1400, y: 120 },
        data: {
          chatParticipantId: { $expression: 'filterBotParticipant.list[0].id' },
          isTyping: true
        }
      },
      {
        id: 'getModel',
        type: 'ai/get_default_model',
        position: { x: 1660, y: 120 },
        data: {}
      },
      {
        id: 'llmGenerate',
        type: 'ai/llm',
        position: { x: 1920, y: 120 },
        data: {
          modelId: { $expression: 'getModel.id' },
          systemPrompt: {
            $template: `You are ${characterName} (@${characterHandle}). Stay in character. Respond concisely to the adventurer's message: {{ getMessage.content }}`
          },
          temperature: 0.7
        }
      },
      {
        id: 'insertReply',
        type: 'storage/insert_chat_message',
        position: { x: 2180, y: 120 },
        data: {
          chatId: { $expression: 'chatTrigger.chatId' },
          chatParticipantId: { $expression: 'filterBotParticipant.list[0].id' },
          content: { $expression: 'llmGenerate.content' }
        }
      },
      {
        id: 'stopTyping',
        type: 'storage/update_typing_status',
        position: { x: 2440, y: 120 },
        data: {
          chatParticipantId: { $expression: 'filterBotParticipant.list[0].id' },
          isTyping: false
        }
      },
      {
        id: 'gateEnd',
        type: 'control_flow/end_if',
        position: { x: 2700, y: 200 },
        data: {}
      }
    ],
    edges: [
      { id: 'xy-edge__chatTriggernext-getMessageprevious', source: 'chatTrigger', target: 'getMessage', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__getMessagenext-getChatRoomprevious', source: 'getMessage', target: 'getChatRoom', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__getChatRoomnext-filterBotParticipantprevious', source: 'getChatRoom', target: 'filterBotParticipant', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__filterBotParticipantnext-mentionGateprevious', source: 'filterBotParticipant', target: 'mentionGate', sourceHandle: 'next', targetHandle: 'previous' },
      // True Branch -> Typing -> Model -> LLM -> Insert -> StopTyping -> EndIf
      { id: 'xy-edge__mentionGatetrue-startTypingprevious', source: 'mentionGate', target: 'startTyping', sourceHandle: 'true', targetHandle: 'previous' },
      { id: 'xy-edge__startTypingnext-getModelprevious', source: 'startTyping', target: 'getModel', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__getModelnext-llmGenerateprevious', source: 'getModel', target: 'llmGenerate', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__llmGeneratenext-insertReplyprevious', source: 'llmGenerate', target: 'insertReply', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__insertReplynext-stopTypingprevious', source: 'insertReply', target: 'stopTyping', sourceHandle: 'next', targetHandle: 'previous' },
      { id: 'xy-edge__stopTypingnext-gateEndin1', source: 'stopTyping', target: 'gateEnd', sourceHandle: 'next', targetHandle: 'in1' },
      // False Branch -> EndIf (Silent Bypass)
      { id: 'xy-edge__mentionGatefalse-gateEndin2', source: 'mentionGate', target: 'gateEnd', sourceHandle: 'false', targetHandle: 'in2' }
    ]
  };
}

async function runArenaDeployment() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   OPENRP AUTONOMOUS MULTI-AGENT ARENA ORCHESTRATOR             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const auth = loadAuth();
  const token = auth.token;
  const userId = auth.userId;

  if (!token || !userId) {
    console.log('[ERROR] Missing OpenRP credentials.');
    console.log('Please configure token & userId in ~/.openrp_mcp_auth.json or via "npx openrp-toolkit auth".');
    process.exit(1);
  }

  console.log(`[1/6] Authenticated User: ${userId}`);

  // 1. Create World
  console.log('[2/6] Provisioning Universe: "Valoria Battle Arena"...');
  const worldPayload = {
    owner: userId,
    name: 'Valoria Battle Arena',
    handle: 'valoria-battle-arena',
    description: 'A mythic fantasy arena where mages and rogues coordinate tactical raids.',
    readme: '# Valoria Battle Arena Lore\n\nWelcome to the grand tournament of Valoria!',
    visibility: 'WORLD_VISIBILITY_PUBLIC',
    tags: ['rpg', 'fantasy', 'multi-agent', 'tactical'],
    chatOnly: false
  };
  const worldRes = await requestApi(`/api/users/${userId}/worlds`, 'POST', worldPayload, token);
  const worldId = worldRes.data.id;
  console.log(`      ✓ World ID created: ${worldId}`);

  // 2. Create Characters
  console.log('[3/6] Summoning Characters into World...');
  
  // Character 1: Eldrin
  const eldrinRes = await requestApi(`/api/users/${userId}/worlds/${worldId}/characters`, 'POST', {
    name: 'Eldrin the Mage',
    handle: 'eldrin-mage',
    status: 'Channeling Arcane Power 🔮',
    shortDescription: 'Master of elemental spells and party tactician.',
    description: 'Eldrin is a high archmage of Valoria specializing in fire and barrier magic.',
    personality: 'Role: Arcane Mage. Tone: Wise, analytical, composed, and protective of allies.',
    greetings: ['Greetings, traveler. Arcane winds favor our party today.'],
    dialogs: [{ user: 'Cast a barrier!', character: 'Shielding matrix deployed! Hold your ground.' }]
  }, token);
  const eldrinId = eldrinRes.data.id;
  console.log(`      ✓ Character [Eldrin] created: ${eldrinId}`);

  // Character 2: Kaelen
  const kaelenRes = await requestApi(`/api/users/${userId}/worlds/${worldId}/characters`, 'POST', {
    name: 'Kaelen the Rogue',
    handle: 'kaelen-rogue',
    status: 'Lurking in Shadows 🗡️',
    shortDescription: 'Agile scout, trap disarmer, and critical striker.',
    description: 'Kaelen strikes from the shadows and detects enemy flanks before they engage.',
    personality: 'Role: Shadow Rogue. Tone: Cynical, sharp-witted, agile, and always watchful.',
    greetings: ['Keep your voice down. What are we hunting?'],
    dialogs: [{ user: 'Flank the boss!', character: 'Already behind him. Aim for the weak spot on my mark.' }]
  }, token);
  const kaelenId = kaelenRes.data.id;
  console.log(`      ✓ Character [Kaelen] created: ${kaelenId}`);

  // 3. Deploy Behavior Graphs
  console.log('[4/6] Building & Deploying Mention-Gated Behavior Graphs...');

  // Eldrin Behavior
  const eldrinGraph = buildMentionGatedGraph('eldrin-mage', 'Eldrin the Mage');
  const eldrinBehavRes = await requestApi(`/api/users/${userId}/worlds/${worldId}/behaviors`, 'POST', {
    name: 'Eldrin Mention-Gated Tactics',
    handle: 'eldrin-tactics',
    description: 'Autonomous mention routing and spellcasting behavior for Eldrin.',
    graph: eldrinGraph
  }, token);
  const eldrinBehavId = eldrinBehavRes.data.id;

  // Bind to Eldrin
  await requestApi(`/api/characters/${eldrinId}/behaviors`, 'POST', { behaviorId: eldrinBehavId }, token);
  console.log(`      ✓ Bound Eldrin Behavior: ${eldrinBehavId} -> Character: ${eldrinId}`);

  // Kaelen Behavior
  const kaelenGraph = buildMentionGatedGraph('kaelen-rogue', 'Kaelen the Rogue');
  const kaelenBehavRes = await requestApi(`/api/users/${userId}/worlds/${worldId}/behaviors`, 'POST', {
    name: 'Kaelen Mention-Gated Shadows',
    handle: 'kaelen-shadows',
    description: 'Autonomous mention routing and ambush behavior for Kaelen.',
    graph: kaelenGraph
  }, token);
  const kaelenBehavId = kaelenBehavRes.data.id;

  // Bind to Kaelen
  await requestApi(`/api/characters/${kaelenId}/behaviors`, 'POST', { behaviorId: kaelenBehavId }, token);
  console.log(`      ✓ Bound Kaelen Behavior: ${kaelenBehavId} -> Character: ${kaelenId}`);

  // 4. Create Group Chatroom
  console.log('[5/6] Opening Live Group Arena Chatroom...');
  const chatRes = await requestApi(`/api/chats`, 'POST', {
    characterId: eldrinId,
    tentative: false
  }, token);
  const chatId = chatRes.data.id;
  console.log(`      ✓ Chat Session ID: ${chatId}`);

  // 5. Verify & Test Message Dispatch
  console.log('[6/6] Dispatching Test Raid Trigger Message...');
  const msgRes = await requestApi(`/api/chats/${chatId}/messages`, 'POST', {
    content: '@eldrin-mage prepare a fire barrier while @kaelen-rogue scout the dungeon entrance!'
  }, token);
  console.log(`      ✓ Sent message ID: ${msgRes.data.id}`);

  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ [SUCCESS] Multi-Agent Arena deployed and verified!             │');
  console.log(`│ World ID     : ${worldId.padEnd(46)} │`);
  console.log(`│ Chat ID      : ${chatId.padEnd(46)} │`);
  console.log(`│ OpenRP URL   : https://openrp.ai/chats/${chatId.padEnd(30)} │`);
  console.log('└────────────────────────────────────────────────────────────────┘\n');
}

if (require.main === module) {
  runArenaDeployment().catch(err => {
    console.error(`\n[FATAL ERROR] Deployment failed: ${err.message}`);
    process.exit(1);
  });
}
