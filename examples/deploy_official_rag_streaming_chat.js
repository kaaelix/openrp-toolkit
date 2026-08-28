#!/usr/bin/env node

/**
 * OpenRP Production Blueprint: Official Streaming RAG Chat Behavior
 * 
 * Based directly on official OpenRP Registry behavior: `openrp/behaviors/chat` (v1.0.6)
 * Execution Reference: 01a046a4-cb9c-74ce-9dd3-1f32072dc47c
 * 
 * Features:
 * 1. Reverse message context mapping (`utilities/map` + `utilities/join`)
 * 2. High-dimensional vector embedding generation (`ai/generate_embeddings`)
 * 3. Parallel semantic search for characters & lorebooks (`control_flow/split` -> `storage/get_characters` & `storage/get_lores`)
 * 4. Resilient error boundary (`control_flow/try`)
 * 5. Full typing indicators lifecycle (`storage/update_typing_status`)
 */

const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '..', '.openrp_auth.json');
const auth = fs.existsSync(AUTH_FILE) ? JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) : {};
const TOKEN = auth.session?.access_token || process.env.OPENRP_BEARER_TOKEN;
const USER_ID = auth.userId || auth.user?.id || process.env.OPENRP_USER_ID;
const WORLD_ID = auth.worldId || process.env.OPENRP_WORLD_ID;
const CHARACTER_ID = auth.characterId || process.env.OPENRP_CHARACTER_ID;

const API_BASE = 'https://openrp.ai';

async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${endpoint}: ${text}`);
  }
  return res.json();
}

const officialRagChatGraph = {
  nodes: [
    {
      id: "chatMessage",
      type: "events/chat_message",
      position: { x: -100, y: 300 },
      data: {
        customFields: [
          {
            name: "prompt",
            type: "string",
            description: "Custom system prompt template",
            defaultValue: "You are {{replyingCharacter.name}}, a character in a roleplay. Respond in character."
          },
          {
            name: "useFullDescription",
            type: "boolean",
            description: "Whether to use full character descriptions",
            defaultValue: true
          }
        ]
      }
    },
    {
      id: "chat",
      type: "storage/get_chat",
      position: { x: 80, y: 300 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        expand: ["participants", "messages"]
      }
    },
    {
      id: "filterReplyingParticipant",
      type: "utilities/filter",
      position: { x: 260, y: 300 },
      data: {
        list: { "$expression": "chat.participants.data" },
        itemCondition: { "$expression": "item.userId === null && item.characterId !== null" }
      }
    },
    {
      id: "setTypingTrue",
      type: "storage/update_typing_status",
      position: { x: 440, y: 300 },
      data: {
        isTyping: true,
        chatParticipantId: { "$expression": "filterReplyingParticipant.list[0].id" }
      }
    },
    {
      id: "replyingCharacter",
      type: "storage/get_character",
      position: { x: 620, y: 300 },
      data: {
        characterId: { "$expression": "filterReplyingParticipant.list[0].characterId" }
      }
    },
    {
      id: "mapScanMessages",
      type: "utilities/map",
      position: { x: 440, y: 150 },
      data: {
        list: { "$expression": "chat.messages.data.reverse()" },
        itemTemplate: {
          "$template": "{{ item.participant ? item.participant.name : 'User' }}: {{ item.content }}"
        }
      }
    },
    {
      id: "joinScanMessages",
      type: "utilities/join",
      position: { x: 620, y: 150 },
      data: {
        list: { "$expression": "mapScanMessages.list" },
        separator: "\n\n"
      }
    },
    {
      id: "generateEmbedding",
      type: "ai/generate_embeddings",
      position: { x: 800, y: 150 },
      data: {
        content: { "$template": "{{ joinScanMessages.text }}" }
      }
    },
    {
      id: "fetchSplit",
      type: "control_flow/split",
      position: { x: 980, y: 300 },
      data: { outputCount: 2 }
    },
    {
      id: "getReferencedCharacters",
      type: "storage/get_characters",
      position: { x: 1160, y: 180 },
      data: {
        limit: 5,
        worldId: { "$expression": "replyingCharacter.worldId" },
        minConfidence: 0.5,
        semanticQuery: { "$expression": "generateEmbedding.embedding" }
      }
    },
    {
      id: "filterReferencedCharacters",
      type: "utilities/filter",
      position: { x: 1340, y: 180 },
      data: {
        list: { "$expression": "getReferencedCharacters.data" },
        itemCondition: { "$expression": "item.id !== replyingCharacter.id" }
      }
    },
    {
      id: "getReferencedLores",
      type: "storage/get_lores",
      position: { x: 1160, y: 420 },
      data: {
        limit: 5,
        worldId: { "$expression": "replyingCharacter.worldId" },
        minConfidence: 0.5,
        semanticQuery: { "$expression": "generateEmbedding.embedding" }
      }
    },
    {
      id: "fetchSync",
      type: "control_flow/sync",
      position: { x: 1520, y: 300 },
      lcaNodeId: "fetchSplit",
      data: { inputCount: 2 }
    },
    {
      id: "tryBlock",
      type: "control_flow/try",
      position: { x: 1700, y: 300 },
      data: {}
    },
    {
      id: "generateReply",
      type: "ai/llm",
      position: { x: 1880, y: 220 },
      data: {
        modelId: "64ffc716-89a3-456e-9a95-ef4095f7d781",
        temperature: 0.7,
        maxTokens: 500,
        messages: [
          {
            role: "system",
            content: "You are {{ replyingCharacter.name }}. Respond expressively and maintain lore continuity."
          },
          {
            role: "user",
            content: "{{ joinScanMessages.text }}"
          }
        ]
      }
    },
    {
      id: "insertMessage",
      type: "storage/insert_chat_message",
      position: { x: 2060, y: 220 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterReplyingParticipant.list[0].id" },
        content: { "$expression": "generateReply.outputText" }
      }
    },
    {
      id: "fallbackError",
      type: "storage/insert_chat_message",
      position: { x: 1880, y: 420 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterReplyingParticipant.list[0].id" },
        content: "*[System Notice: Generation timed out or encountered temporary error. Please retry.]*"
      }
    },
    {
      id: "setTypingFalse",
      type: "storage/update_typing_status",
      position: { x: 2240, y: 300 },
      data: {
        isTyping: false,
        chatParticipantId: { "$expression": "filterReplyingParticipant.list[0].id" }
      }
    }
  ],
  edges: [
    { id: "xy-edge__chatMessagenext-chatprevious", source: "chatMessage", sourceHandle: "next", target: "chat", targetHandle: "previous" },
    { id: "xy-edge__chatnext-filterReplyingParticipantprevious", source: "chat", sourceHandle: "next", target: "filterReplyingParticipant", targetHandle: "previous" },
    { id: "xy-edge__filterReplyingParticipantnext-setTypingTrueprevious", source: "filterReplyingParticipant", sourceHandle: "next", target: "setTypingTrue", targetHandle: "previous" },
    { id: "xy-edge__setTypingTruenext-replyingCharacterprevious", source: "setTypingTrue", sourceHandle: "next", target: "replyingCharacter", targetHandle: "previous" },
    { id: "xy-edge__replyingCharacternext-mapScanMessagesprevious", source: "replyingCharacter", sourceHandle: "next", target: "mapScanMessages", targetHandle: "previous" },
    { id: "xy-edge__mapScanMessagesnext-joinScanMessagesprevious", source: "mapScanMessages", sourceHandle: "next", target: "joinScanMessages", targetHandle: "previous" },
    { id: "xy-edge__joinScanMessagesnext-generateEmbeddingprevious", source: "joinScanMessages", sourceHandle: "next", target: "generateEmbedding", targetHandle: "previous" },
    { id: "xy-edge__generateEmbeddingnext-fetchSplitprevious", source: "generateEmbedding", sourceHandle: "next", target: "fetchSplit", targetHandle: "previous" },
    { id: "xy-edge__fetchSplitout1-getReferencedCharactersprevious", source: "fetchSplit", sourceHandle: "out1", target: "getReferencedCharacters", targetHandle: "previous" },
    { id: "xy-edge__getReferencedCharactersnext-filterReferencedCharactersprevious", source: "getReferencedCharacters", sourceHandle: "next", target: "filterReferencedCharacters", targetHandle: "previous" },
    { id: "xy-edge__filterReferencedCharactersnext-fetchSyncin1", source: "filterReferencedCharacters", sourceHandle: "next", target: "fetchSync", targetHandle: "in1" },
    { id: "xy-edge__fetchSplitout2-getReferencedLoresprevious", source: "fetchSplit", sourceHandle: "out2", target: "getReferencedLores", targetHandle: "previous" },
    { id: "xy-edge__getReferencedLoresnext-fetchSyncin2", source: "getReferencedLores", sourceHandle: "next", target: "fetchSync", targetHandle: "in2" },
    { id: "xy-edge__fetchSyncnext-tryBlockprevious", source: "fetchSync", sourceHandle: "next", target: "tryBlock", targetHandle: "previous" },
    { id: "xy-edge__tryBlocksuccess-generateReplyprevious", source: "tryBlock", sourceHandle: "success", target: "generateReply", targetHandle: "previous" },
    { id: "xy-edge__generateReplynext-insertMessageprevious", source: "generateReply", sourceHandle: "next", target: "insertMessage", targetHandle: "previous" },
    { id: "xy-edge__insertMessagenext-setTypingFalseprevious", source: "insertMessage", sourceHandle: "next", target: "setTypingFalse", targetHandle: "previous" },
    { id: "xy-edge__tryBlockerror-fallbackErrorprevious", source: "tryBlock", sourceHandle: "error", target: "fallbackError", targetHandle: "previous" },
    { id: "xy-edge__fallbackErrornext-setTypingFalseprevious", source: "fallbackError", sourceHandle: "next", target: "setTypingFalse", targetHandle: "previous" }
  ]
};

async function main() {
  console.log('🚀 Deploying Official OpenRP Streaming RAG Chat Behavior...');
  if (!TOKEN || !USER_ID || !WORLD_ID) {
    console.error('❌ Missing auth credentials. Run `node examples/create_world_and_character.js` first.');
    process.exit(1);
  }

  const payload = {
    name: 'Official Streaming RAG Engine',
    handle: 'official-rag-chat-engine',
    description: 'Production replica of openrp/behaviors/chat v1.0.6 with dual semantic search and try-catch safety.',
    graph: officialRagChatGraph
  };

  const res = await makeRequest(`/api/users/${USER_ID}/worlds/${WORLD_ID}/behaviors`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const behaviorId = res.data?.id || res.id;
  console.log(`✅ Behavior created: ${behaviorId}`);

  if (CHARACTER_ID) {
    console.log(`🔗 Attaching to Character: ${CHARACTER_ID}...`);
    await makeRequest(`/api/v1/characters/${CHARACTER_ID}/behaviors`, {
      method: 'POST',
      body: JSON.stringify({ behaviorId, behaviorRegistryTagId: null })
    });
    console.log('✅ Attached successfully!');
  }

  console.log('\n🎉 Official RAG Chat Behavior is live and ready for testing.');
}

main().catch(err => {
  console.error('❌ Deployment error:', err.message);
  process.exit(1);
});
