#!/usr/bin/env node

/**
 * AETHERIS-Omega: Quantum RPG Combat Arbiter & Multimodal World Engine
 * 
 * 18-Node High-Complexity DAG Generator & Deployer
 * Incorporating:
 * - Dynamic D20 Dice & Critical Multiplier arithmetic
 * - Lorebook Semantic Injection & Mapping
 * - Token Budget Tracking
 * - Resilient Error Boundary Try-Catch
 * - Snake S-Curve Spatial Geometry
 * - Strict ReactFlow Edge & Zod Port Invariants
 */

const fs = require('fs');
const path = require('path');
const { validateBehaviorGraph } = require('./validator');

const nodes = [
  // Row 1 (Left to Right: X = 0 -> 900, Y = 0)
  {
    id: "chatMessage",
    type: "events/chat_message",
    position: { x: 0, y: 0 },
    data: {
      customFields: []
    },
    lcaNodeId: null
  },
  {
    id: "getChatMessage",
    type: "storage/get_chat_message",
    position: { x: 300, y: 0 },
    data: {
      messageId: { "$expression": "chatMessage.messageId" }
    },
    lcaNodeId: null
  },
  {
    id: "getChat",
    type: "storage/get_chat",
    position: { x: 600, y: 0 },
    data: {
      chatId: { "$expression": "chatMessage.chatId" },
      expand: ["participants", "messages"]
    },
    lcaNodeId: null
  },
  {
    id: "filterBot",
    type: "utilities/filter",
    position: { x: 900, y: 0 },
    data: {
      list: { "$expression": "getChat.data.participants.data" },
      itemCondition: {
        "$expression": "item.userId === null && item.characterId !== null"
      }
    },
    lcaNodeId: null
  },

  // Row 2 (Right to Left: X = 900 -> 0, Y = 220)
  {
    id: "startTyping",
    type: "storage/update_typing_status",
    position: { x: 900, y: 220 },
    data: {
      chatParticipantId: { "$expression": "filterBot.list[0].id" },
      isTyping: true
    },
    lcaNodeId: null
  },
  {
    id: "getBotCharacter",
    type: "storage/get_character",
    position: { x: 600, y: 220 },
    data: {
      characterId: { "$expression": "filterBot.list[0].characterId" }
    },
    lcaNodeId: null
  },
  {
    id: "calcQuantumState",
    type: "storage/set_variable",
    position: { x: 300, y: 220 },
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
          value: { "$expression": "Math.floor((Math.random() * 35 + 15) * (Math.floor(Math.random() * 20) + 1 >= 18 ? 2.5 : 1.0))" }
        }
      ]
    },
    lcaNodeId: null
  },
  {
    id: "mapHistory",
    type: "utilities/map",
    position: { x: 0, y: 220 },
    data: {
      list: { "$expression": "getChat.data.messages.data.reverse()" },
      itemTemplate: {
        "$template": "{{ item.participant ? item.participant.name : 'Adventurer' }}: {{ item.content }}"
      }
    },
    lcaNodeId: null
  },

  // Row 3 (Left to Right: X = 0 -> 900, Y = 440)
  {
    id: "joinHistory",
    type: "utilities/join",
    position: { x: 0, y: 440 },
    data: {
      list: { "$expression": "mapHistory.list" },
      separator: "\n"
    },
    lcaNodeId: null
  },
  {
    id: "countContextTokens",
    type: "ai/count_tokens",
    position: { x: 300, y: 440 },
    data: {
      text: { "$expression": "joinHistory.text" }
    },
    lcaNodeId: null
  },
  {
    id: "searchLore",
    type: "storage/get_lores",
    position: { x: 600, y: 440 },
    data: {
      limit: 3
    },
    lcaNodeId: null
  },
  {
    id: "mapLores",
    type: "utilities/map",
    position: { x: 900, y: 440 },
    data: {
      list: { "$expression": "searchLore.data" },
      itemTemplate: {
        "$template": "<lore_entry title=\"{{ item.title }}\">{{ item.content }}</lore_entry>"
      }
    },
    lcaNodeId: null
  },

  // Row 4 (Right to Left: X = 900 -> 0, Y = 660)
  {
    id: "joinLores",
    type: "utilities/join",
    position: { x: 900, y: 660 },
    data: {
      list: { "$expression": "mapLores.list" },
      separator: "\n\n"
    },
    lcaNodeId: null
  },
  {
    id: "tryBlock",
    type: "control_flow/try",
    position: { x: 600, y: 660 },
    data: {},
    lcaNodeId: null
  },
  {
    id: "generateCinematicNarrative",
    type: "ai/llm",
    position: { x: 300, y: 660 },
    data: {
      modelId: { "$expression": "getChat.data.chatModelId" },
      systemPrompt: {
        "$template": "You are {{ getBotCharacter.name }}, an elite RPG persona and combat arbiter in Aetheria.\nPersonality & Directives: {{ getBotCharacter.personality }}\nWorld Lore Context:\n<world_lore>\n{{ joinLores.text }}\n</world_lore>\n\nRPG Combat Engine Metrics:\n- D20 Dice Roll: {{ $variables.d20Roll }}/20\n- Mana Consumed: {{ $variables.manaCost }} MP\n- Damage Calculated: {{ $variables.damageScore }} HP\n\nInstructions:\n1. Narrate the dramatic outcome of the player's action matching the D20 result (>= 15: Critical Triumph, <= 5: Perilous Fumble, otherwise solid success).\n2. Maintain deep in-character immersion, dramatic sensory prose, and tactical depth.\n3. Conclude with an ASCII RPG Combat Status Card showing [D20 Roll], [Damage Dealt], and [Mana Used]."
      },
      messages: [
        {
          role: "user",
          content: {
            "$template": "Recent Dialogue History:\n{{ joinHistory.text }}\n\nPlayer Latest Action:\n{{ getChatMessage.content }}\n\nResolve this action now with full narrative immersion."
          }
        }
      ]
    },
    lcaNodeId: null
  },
  {
    id: "insertSuccessReply",
    type: "storage/insert_chat_message",
    position: { x: 0, y: 660 },
    data: {
      chatId: { "$expression": "chatMessage.chatId" },
      chatParticipantId: { "$expression": "filterBot.list[0].id" },
      content: { "$expression": "generateCinematicNarrative.outputText" }
    },
    lcaNodeId: null
  },

  // Row 5 (X = 300 & 600, Y = 880)
  {
    id: "insertFallbackReply",
    type: "storage/insert_chat_message",
    position: { x: 300, y: 880 },
    data: {
      chatId: { "$expression": "chatMessage.chatId" },
      chatParticipantId: { "$expression": "filterBot.list[0].id" },
      content: {
        "$template": "*Energi astral berfluktuasi sesaat.* 'Kekuatan kosmik menahan serangan ini! (D20 Roll: {{ $variables.d20Roll }}, Damage: {{ $variables.damageScore }} HP). Sistem taktis sedang menyeimbangkan medan resonansi.'"
      }
    },
    lcaNodeId: null
  },
  {
    id: "stopTyping",
    type: "storage/update_typing_status",
    position: { x: 600, y: 880 },
    data: {
      chatParticipantId: { "$expression": "filterBot.list[0].id" },
      isTyping: false
    },
    lcaNodeId: null
  }
];

const edges = [
  // Row 1
  {
    id: "xy-edge__chatMessagenext-getChatMessageprevious",
    source: "chatMessage",
    target: "getChatMessage",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__getChatMessagenext-getChatprevious",
    source: "getChatMessage",
    target: "getChat",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__getChatnext-filterBotprevious",
    source: "getChat",
    target: "filterBot",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Turn 1 -> Row 2
  {
    id: "xy-edge__filterBotnext-startTypingprevious",
    source: "filterBot",
    target: "startTyping",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__startTypingnext-getBotCharacterprevious",
    source: "startTyping",
    target: "getBotCharacter",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__getBotCharacternext-calcQuantumStateprevious",
    source: "getBotCharacter",
    target: "calcQuantumState",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__calcQuantumStatenext-mapHistoryprevious",
    source: "calcQuantumState",
    target: "mapHistory",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Turn 2 -> Row 3
  {
    id: "xy-edge__mapHistorynext-joinHistoryprevious",
    source: "mapHistory",
    target: "joinHistory",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__joinHistorynext-countContextTokensprevious",
    source: "joinHistory",
    target: "countContextTokens",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__countContextTokensnext-searchLoreprevious",
    source: "countContextTokens",
    target: "searchLore",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__searchLorenext-mapLoresprevious",
    source: "searchLore",
    target: "mapLores",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Turn 3 -> Row 4
  {
    id: "xy-edge__mapLoresnext-joinLoresprevious",
    source: "mapLores",
    target: "joinLores",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__joinLoresnext-tryBlockprevious",
    source: "joinLores",
    target: "tryBlock",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__tryBlocksuccess-generateCinematicNarrativeprevious",
    source: "tryBlock",
    target: "generateCinematicNarrative",
    sourceHandle: "success",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__generateCinematicNarrativenext-insertSuccessReplyprevious",
    source: "generateCinematicNarrative",
    target: "insertSuccessReply",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Turn 4 -> Row 5
  {
    id: "xy-edge__insertSuccessReplynext-stopTypingprevious",
    source: "insertSuccessReply",
    target: "stopTyping",
    sourceHandle: "next",
    targetHandle: "previous"
  },
  // Error branch
  {
    id: "xy-edge__tryBlockerror-insertFallbackReplyprevious",
    source: "tryBlock",
    target: "insertFallbackReply",
    sourceHandle: "error",
    targetHandle: "previous"
  },
  {
    id: "xy-edge__insertFallbackReplynext-stopTypingprevious",
    source: "insertFallbackReply",
    target: "stopTyping",
    sourceHandle: "next",
    targetHandle: "previous"
  }
];

const omegaBehaviorPayload = {
  name: "AETHERIS-Omega: Quantum Combat Arbiter & World Engine",
  handle: "aetheris-omega-arbiter-v1",
  graph: {
    nodes,
    edges
  }
};

// Validate locally
console.log('--- Running Pre-Flight Validation ---');
const validation = validateBehaviorGraph(omegaBehaviorPayload.graph);
console.log('Errors:', validation.errors);
console.log('Warnings:', validation.warnings);

if (validation.errors.length > 0) {
  console.error('Validation failed!');
  process.exit(1);
}

// Write to file
const targetPath = path.join(__dirname, '..', 'omega_payload.json');
fs.writeFileSync(targetPath, JSON.stringify(omegaBehaviorPayload, null, 2));
console.log(`Saved payload to ${targetPath}`);
