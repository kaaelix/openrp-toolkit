#!/usr/bin/env node

/**
 * AETHERIS-Mythic: Quantum RPG Arbiter & World Simulation Engine
 * 
 * 15-Node Symmetrical Diamond (Fork-Join) Graph with Parallel RAG & Mechanics
 */

const fs = require('fs');
const path = require('path');
const { validateBehaviorGraph } = require('./validator');

const nodes = [
  // 1. Ingestion Stage (Center Lane: Y = 250)
  {
    id: "chatMessage",
    type: "events/chat_message",
    position: { x: 0, y: 250 },
    data: { customFields: [] },
    lcaNodeId: null
  },
  {
    id: "getChatMessage",
    type: "storage/get_chat_message",
    position: { x: 320, y: 250 },
    data: { messageId: { "$expression": "chatMessage.messageId" } },
    lcaNodeId: null
  },
  {
    id: "chat",
    type: "storage/get_chat",
    position: { x: 640, y: 250 },
    data: {
      chatId: { "$expression": "chatMessage.chatId" },
      expand: ["participants", "messages"]
    },
    lcaNodeId: null
  },
  {
    id: "filterBot",
    type: "utilities/filter",
    position: { x: 960, y: 250 },
    data: {
      list: { "$expression": "chat.participants.data" },
      itemCondition: { "$expression": "item.userId === null && item.characterId !== null" }
    },
    lcaNodeId: null
  },
  {
    id: "startTyping",
    type: "storage/update_typing_status",
    position: { x: 1280, y: 250 },
    data: {
      participantId: { "$expression": "filterBot.list[0].id" },
      isTyping: true
    },
    lcaNodeId: null
  },
  {
    id: "character",
    type: "storage/get_character",
    position: { x: 1600, y: 250 },
    data: {
      characterId: { "$expression": "filterBot.list[0].characterId" }
    },
    lcaNodeId: null
  },

  // 2. Parallel Split
  {
    id: "splitParallel",
    type: "control_flow/split",
    position: { x: 1920, y: 250 },
    data: { outputCount: 2 },
    lcaNodeId: null
  },

  // --- Top Lane: Lorebook Context & World RAG (Y = 110) ---
  {
    id: "lores",
    type: "storage/get_lores",
    position: { x: 2240, y: 110 },
    data: {
      worldId: { "$expression": "character.worldId" },
      limit: 3
    },
    lcaNodeId: null
  },
  {
    id: "mapLores",
    type: "utilities/map",
    position: { x: 2560, y: 110 },
    data: {
      list: { "$expression": "lores.data" },
      itemTemplate: {
        "$template": "<lore_archive title=\"{{ item.title }}\">{{ item.content }}</lore_archive>"
      }
    },
    lcaNodeId: null
  },
  {
    id: "joinLores",
    type: "utilities/join",
    position: { x: 2880, y: 110 },
    data: {
      list: { "$expression": "mapLores.list" },
      separator: "\n\n"
    },
    lcaNodeId: null
  },

  // --- Bottom Lane: Quantum Combat Physics & History (Y = 390) ---
  {
    id: "calcGameState",
    type: "storage/set_variable",
    position: { x: 2240, y: 390 },
    data: {
      variables: [
        {
          key: { "$template": "d20Roll" },
          value: { "$expression": "Math.floor(Math.random() * 20) + 1" }
        },
        {
          key: { "$template": "manaCost" },
          value: { "$expression": "Math.floor(Math.random() * 15) + 5" }
        },
        {
          key: { "$template": "damageScore" },
          value: { "$expression": "Math.floor(Math.random() * 45) + 20" }
        }
      ]
    },
    lcaNodeId: null
  },
  {
    id: "mapHistory",
    type: "utilities/map",
    position: { x: 2560, y: 390 },
    data: {
      list: { "$expression": "chat.messages.data.reverse()" },
      itemTemplate: {
        "$template": "{{ item.participant ? item.participant.name : 'Adventurer' }}: {{ item.content }}"
      }
    },
    lcaNodeId: null
  },
  {
    id: "joinHistory",
    type: "utilities/join",
    position: { x: 2880, y: 390 },
    data: {
      list: { "$expression": "mapHistory.list" },
      separator: "\n"
    },
    lcaNodeId: null
  },

  // 3. Barrier Synchronization Convergence (Center Lane: Y = 250)
  {
    id: "syncParallel",
    type: "control_flow/sync",
    position: { x: 3200, y: 250 },
    data: { inputCount: 2 },
    lcaNodeId: "splitParallel"
  },
  {
    id: "countTokens",
    type: "ai/count_tokens",
    position: { x: 3520, y: 250 },
    data: {
      text: { "$expression": "joinHistory.text" },
      tokenizer: "TOKENIZER_LLAMA3"
    },
    lcaNodeId: null
  },
  {
    id: "generateRPGStory",
    type: "ai/llm",
    position: { x: 3840, y: 250 },
    data: {
      modelId: { "$expression": "chatMessage.modelSettings?.chatModelId || '64ffc716-89a3-456e-9a95-ef4095f7d781'" },
      stream: false,
      temperature: 0.7,
      maxTokens: 2000,
      messages: [
        {
          role: "system",
          content: {
            "$template": "You are {{ character.name }}, Archon of Aetheria & Divine Game Master.\nPersona: {{ character.personality }}\n\nWorld Lore Context:\n{{ joinLores.text }}\n\nRPG Combat Parameters:\n- D20 Dice Roll: {{ $variables.d20Roll }}/20\n- Mana Consumed: {{ $variables.manaCost }} MP\n- Damage Calculated: {{ $variables.damageScore }} HP\n\nDirectives:\n1. Narrate the dramatic outcome of the player's action according to the D20 result (>= 15: Critical Triumph, <= 5: Perilous Fumble, otherwise Solid Success).\n2. Maintain high literary roleplay depth, vivid combat sensory details, and regal celestial personality.\n3. Conclude with an ASCII Combat Status Card showing [D20 Roll], [Damage Dealt], and [Mana Used]."
          }
        },
        {
          role: "user",
          content: {
            "$template": "Recent Dialogue History:\n{{ joinHistory.text }}\n\nPlayer Latest Action:\n{{ getChatMessage.content }}\n\nExecute the combat turn resolution now:"
          }
        }
      ]
    },
    lcaNodeId: null
  },
  {
    id: "insertFinalReply",
    type: "storage/insert_chat_message",
    position: { x: 4160, y: 250 },
    data: {
      chatId: { "$expression": "chatMessage.chatId" },
      chatParticipantId: { "$expression": "filterBot.list[0].id" },
      content: { "$expression": "generateRPGStory.outputText" }
    },
    lcaNodeId: null
  },
  {
    id: "stopTyping",
    type: "storage/update_typing_status",
    position: { x: 4480, y: 250 },
    data: {
      participantId: { "$expression": "filterBot.list[0].id" },
      isTyping: false
    },
    lcaNodeId: null
  }
];

const edges = [
  {
    id: "xy-edge__chatMessagenext-getChatMessageprevious",
    source: "chatMessage",
    target: "getChatMessage",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__getChatMessagenext-chatprevious",
    source: "getChatMessage",
    target: "chat",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__chatnext-filterBotprevious",
    source: "chat",
    target: "filterBot",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__filterBotnext-startTypingprevious",
    source: "filterBot",
    target: "startTyping",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__startTypingnext-characterprevious",
    source: "startTyping",
    target: "character",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__characternext-splitParallelprevious",
    source: "character",
    target: "splitParallel",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Top Lane Branch (out1)
  {
    id: "xy-edge__splitParallelout1-loresprevious",
    source: "splitParallel",
    target: "lores",
    sourceHandle: "out1",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__loresnext-mapLoresprevious",
    source: "lores",
    target: "mapLores",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__mapLoresnext-joinLoresprevious",
    source: "mapLores",
    target: "joinLores",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__joinLoresnext-syncParallelin1",
    source: "joinLores",
    target: "syncParallel",
    sourceHandle: "next",
    targetHandle: "in1"
  },
  // Bottom Lane Branch (out2)
  {
    id: "xy-edge__splitParallelout2-calcGameStateprevious",
    source: "splitParallel",
    target: "calcGameState",
    sourceHandle: "out2",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__calcGameStatenext-mapHistoryprevious",
    source: "calcGameState",
    target: "mapHistory",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__mapHistorynext-joinHistoryprevious",
    source: "mapHistory",
    target: "joinHistory",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__joinHistorynext-syncParallelin2",
    source: "joinHistory",
    target: "syncParallel",
    sourceHandle: "next",
    targetHandle: "in2"
  },
  // Convergence & Final Delivery
  {
    id: "xy-edge__syncParallelnext-countTokensprevious",
    source: "syncParallel",
    target: "countTokens",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__countTokensnext-generateRPGStoryprevious",
    source: "countTokens",
    target: "generateRPGStory",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__generateRPGStorynext-insertFinalReplyprevious",
    source: "generateRPGStory",
    target: "insertFinalReply",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__insertFinalReplynext-stopTypingprevious",
    source: "insertFinalReply",
    target: "stopTyping",
    sourceHandle: "next",
    targetHandle: "previous"
  }
];

const mythicPayload = {
  name: "AETHERIS-Mythic: Quantum RPG Arbiter & World Engine",
  handle: "aetheris-mythic-arbiter-v1",
  graph: {
    nodes,
    edges
  }
};

console.log('--- Running Pre-Flight Validation ---');
const validation = validateBehaviorGraph(mythicPayload.graph);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);

if (validation.errors.length > 0) {
  console.error('Validation failed!');
  process.exit(1);
}

const targetPath = path.join(__dirname, '..', 'mythic_rpg_payload.json');
fs.writeFileSync(targetPath, JSON.stringify(mythicPayload, null, 2));
console.log(`Saved mythic RPG payload to ${targetPath}`);
