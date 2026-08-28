#!/usr/bin/env node
/**
 * OpenRP Example: Deploy Game Bot Behavior Graph (Node.js Edition)
 * Demonstrates how to build a sequential state machine graph and deploy it to OpenRP.
 */

const TOKEN = process.env.OPENRP_TOKEN || 'YOUR_JWT_TOKEN';
const USER_ID = process.env.OPENRP_USER_ID || 'YOUR_USER_ID';
const WORLD_ID = process.env.OPENRP_WORLD_ID || 'YOUR_WORLD_ID';
const CHARACTER_ID = process.env.OPENRP_CHARACTER_ID || 'YOUR_CHARACTER_ID';
const BASE_URL = process.env.OPENRP_BASE_URL || 'https://openrp.ai';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'User-Agent': 'OpenRP-Node-Example/1.0'
};

async function deployGameBehavior() {
  const url = `${BASE_URL}/api/users/${USER_ID}/worlds/${WORLD_ID}/behaviors`;

  const graph = {
    nodes: [
      {
        id: 'chatMessage',
        type: 'events/chat_message',
        position: { x: 0, y: 0 },
        data: {}
      },
      {
        id: 'getChatMessage',
        type: 'storage/get_chat_message',
        position: { x: 200, y: 0 },
        data: {
          messageId: { $expression: 'chatMessage.messageId' }
        }
      },
      {
        id: 'getDefaultModel',
        type: 'ai/get_default_model',
        position: { x: 400, y: 0 },
        data: {}
      },
      {
        id: 'llm',
        type: 'ai/llm',
        position: { x: 600, y: 0 },
        data: {
          modelId: { $expression: 'getDefaultModel.id' },
          systemPrompt: { $template: 'You are a cyber arcade AI. Reply cheerfully to: {{ getChatMessage.content }}' }
        }
      },
      {
        id: 'getChat',
        type: 'storage/get_chat',
        position: { x: 800, y: 0 },
        data: {
          chatId: { $expression: 'chatMessage.chatId' }
        }
      },
      {
        id: 'getParticipant',
        type: 'storage/get_chat_participant',
        position: { x: 1000, y: 0 },
        data: {
          characterId: CHARACTER_ID
        }
      },
      {
        id: 'insertMessage',
        type: 'storage/insert_chat_message',
        position: { x: 1200, y: 0 },
        data: {
          chatId: { $expression: 'chatMessage.chatId' },
          chatParticipantId: { $expression: 'getParticipant.id' },
          content: { $expression: 'llm.content' }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'chatMessage', target: 'getChatMessage', sourceHandle: 'next', targetHandle: 'in' },
      { id: 'e2', source: 'getChatMessage', target: 'getDefaultModel', sourceHandle: 'next', targetHandle: 'in' },
      { id: 'e3', source: 'getDefaultModel', target: 'llm', sourceHandle: 'next', targetHandle: 'in' },
      { id: 'e4', source: 'llm', target: 'getChat', sourceHandle: 'next', targetHandle: 'in' },
      { id: 'e5', source: 'getChat', target: 'getParticipant', sourceHandle: 'next', targetHandle: 'in' },
      { id: 'e6', source: 'getParticipant', target: 'insertMessage', sourceHandle: 'next', targetHandle: 'in' }
    ]
  };

  const payload = {
    name: 'Cyber Arcade Logic',
    handle: 'cyber-arcade-logic',
    description: 'Autonomous referee logic for Tic-Tac-Toe and arcade chat.',
    graph
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await resp.json();
  console.log('Behavior Pipeline Created Successfully!');
  console.log(JSON.stringify(data, null, 2));
  const behaviorId = data.data.id;

  // Attach to character
  const attachUrl = `${BASE_URL}/api/users/${USER_ID}/worlds/${WORLD_ID}/characters/${CHARACTER_ID}/behaviors`;
  const attachResp = await fetch(attachUrl, { method: 'POST', headers, body: JSON.stringify({ behaviorId }) });
  const attachData = await attachResp.json();
  console.log('Behavior Attached to Character!');
  console.log(JSON.stringify(attachData, null, 2));
}

async function main() {
  if (TOKEN === 'YOUR_JWT_TOKEN' || USER_ID === 'YOUR_USER_ID' || WORLD_ID === 'YOUR_WORLD_ID' || CHARACTER_ID === 'YOUR_CHARACTER_ID') {
    console.error('Please set OPENRP_TOKEN, OPENRP_USER_ID, OPENRP_WORLD_ID, and OPENRP_CHARACTER_ID environment variables.');
    process.exit(1);
  }

  await deployGameBehavior();
}

if (require.main === module) {
  main().catch(console.error);
}
