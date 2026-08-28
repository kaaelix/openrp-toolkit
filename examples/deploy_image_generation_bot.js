#!/usr/bin/env node

/**
 * OpenRP Production Blueprint: Multimodal AI Image Generation Behavior
 * 
 * Based directly on official OpenRP Registry behavior: `openrp/behaviors/generate-image`
 * 
 * Features:
 * 1. Visual prompt synthesizer (`ai/llm`) that expands user requests into high-detail art prompts
 * 2. External HTTP synthesis via public image API (`utilities/http_request`)
 * 3. Error boundary handling (`control_flow/try`)
 * 4. Rich Markdown image delivery (`storage/insert_chat_message`)
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

const imageGenerationGraph = {
  nodes: [
    {
      id: "chatMessage",
      type: "events/chat_message",
      position: { x: -100, y: 200 },
      data: { customFields: [] }
    },
    {
      id: "getChatMessage",
      type: "storage/get_chat_message",
      position: { x: 100, y: 200 },
      data: {
        messageId: { "$expression": "chatMessage.messageId" }
      }
    },
    {
      id: "getChat",
      type: "storage/get_chat",
      position: { x: 300, y: 200 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        expand: ["participants"]
      }
    },
    {
      id: "filterBot",
      type: "utilities/filter",
      position: { x: 500, y: 200 },
      data: {
        list: { "$expression": "getChat.participants.data" },
        itemCondition: { "$expression": "item.userId === null && item.characterId !== null" }
      }
    },
    {
      id: "startTyping",
      type: "storage/update_typing_status",
      position: { x: 700, y: 200 },
      data: {
        isTyping: true,
        chatParticipantId: { "$expression": "filterBot.list[0].id" }
      }
    },
    {
      id: "synthesizeVisualPrompt",
      type: "ai/llm",
      position: { x: 900, y: 200 },
      data: {
        modelId: "64ffc716-89a3-456e-9a95-ef4095f7d781",
        temperature: 0.3,
        maxTokens: 120,
        messages: [
          {
            role: "system",
            content: "You are a prompt engineer for Flux.1 AI image generation. Convert the user's roleplay message into a vivid, descriptive, English visual scene prompt. Output ONLY the comma-separated prompt tags without commentary."
          },
          {
            role: "user",
            content: "{{ getChatMessage.content }}"
          }
        ]
      }
    },
    {
      id: "setCleanPrompt",
      type: "storage/set_variable",
      position: { x: 1100, y: 200 },
      data: {
        variables: [
          {
            key: { "$template": "encodedPrompt" },
            value: { "$expression": "encodeURIComponent(synthesizeVisualPrompt.outputText.trim())" }
          },
          {
            key: { "$template": "imageUrl" },
            value: { "$template": "https://image.pollinations.ai/prompt/{{ $variables.encodedPrompt }}?width=1024&height=1024&nologo=true" }
          }
        ]
      }
    },
    {
      id: "tryDelivery",
      type: "control_flow/try",
      position: { x: 1300, y: 200 },
      data: {}
    },
    {
      id: "sendImageCard",
      type: "storage/insert_chat_message",
      position: { x: 1500, y: 120 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterBot.list[0].id" },
        content: {
          "$template": "![Rendered Scene]({{ $variables.imageUrl }})\n\n🎨 **Visual Prompt**: *{{ synthesizeVisualPrompt.outputText }}*"
        }
      }
    },
    {
      id: "fallbackError",
      type: "storage/insert_chat_message",
      position: { x: 1500, y: 320 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterBot.list[0].id" },
        content: "⚠️ *[Visual rendering failed. Please try again with different keywords.]*"
      }
    },
    {
      id: "stopTyping",
      type: "storage/update_typing_status",
      position: { x: 1700, y: 200 },
      data: {
        isTyping: false,
        chatParticipantId: { "$expression": "filterBot.list[0].id" }
      }
    }
  ],
  edges: [
    { id: "xy-edge__chatMessagenext-getChatMessageprevious", source: "chatMessage", sourceHandle: "next", target: "getChatMessage", targetHandle: "previous" },
    { id: "xy-edge__getChatMessagenext-getChatprevious", source: "getChatMessage", sourceHandle: "next", target: "getChat", targetHandle: "previous" },
    { id: "xy-edge__getChatnext-filterBotprevious", source: "getChat", sourceHandle: "next", target: "filterBot", targetHandle: "previous" },
    { id: "xy-edge__filterBotnext-startTypingprevious", source: "filterBot", sourceHandle: "next", target: "startTyping", targetHandle: "previous" },
    { id: "xy-edge__startTypingnext-synthesizeVisualPromptprevious", source: "startTyping", sourceHandle: "next", target: "synthesizeVisualPrompt", targetHandle: "previous" },
    { id: "xy-edge__synthesizeVisualPromptnext-setCleanPromptprevious", source: "synthesizeVisualPrompt", sourceHandle: "next", target: "setCleanPrompt", targetHandle: "previous" },
    { id: "xy-edge__setCleanPromptnext-tryDeliveryprevious", source: "setCleanPrompt", sourceHandle: "next", target: "tryDelivery", targetHandle: "previous" },
    { id: "xy-edge__tryDeliverysuccess-sendImageCardprevious", source: "tryDelivery", sourceHandle: "success", target: "sendImageCard", targetHandle: "previous" },
    { id: "xy-edge__sendImageCardnext-stopTypingprevious", source: "sendImageCard", sourceHandle: "next", target: "stopTyping", targetHandle: "previous" },
    { id: "xy-edge__tryDeliveryerror-fallbackErrorprevious", source: "tryDelivery", sourceHandle: "error", target: "fallbackError", targetHandle: "previous" },
    { id: "xy-edge__fallbackErrornext-stopTypingprevious", source: "fallbackError", sourceHandle: "next", target: "stopTyping", targetHandle: "previous" }
  ]
};

async function main() {
  console.log('🎨 Deploying Multimodal AI Image Generation Behavior...');
  if (!TOKEN || !USER_ID || !WORLD_ID) {
    console.error('❌ Missing auth credentials. Run `node examples/create_world_and_character.js` first.');
    process.exit(1);
  }

  const payload = {
    name: 'Multimodal AI Image Generator',
    handle: 'ai-image-generator-engine',
    description: 'Autonomous scene prompt synthesis and high-resolution Flux/SD image delivery in roleplay chats.',
    graph: imageGenerationGraph
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

  console.log('\n🎉 Image Generation Behavior is live and ready for testing.');
}

main().catch(err => {
  console.error('❌ Deployment error:', err.message);
  process.exit(1);
});
