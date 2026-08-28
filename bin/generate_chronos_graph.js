const fs = require('fs');
const { layoutGraph } = require('./layout_styler.js');

const rawGraph = {
  nodes: [
    {
      id: "chatMessage",
      type: "events/chat_message",
      position: { x: 0, y: 0 },
      data: { customFields: [] }
    },
    {
      id: "getChatMessage",
      type: "storage/get_chat_message",
      position: { x: 0, y: 0 },
      data: { messageId: { "$expression": "chatMessage.messageId" } }
    },
    {
      id: "getChat",
      type: "storage/get_chat",
      position: { x: 0, y: 0 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        expand: ["participants", "messages"]
      }
    },
    {
      id: "filterBot",
      type: "utilities/filter",
      position: { x: 0, y: 0 },
      data: {
        list: { "$expression": "getChat.participants.data" },
        itemCondition: { "$expression": "item.userId === null && item.characterId !== null" }
      }
    },
    {
      id: "startTyping",
      type: "storage/update_typing_status",
      position: { x: 0, y: 0 },
      data: {
        isTyping: true,
        chatParticipantId: { "$expression": "filterBot.list[0].id" }
      }
    },
    {
      id: "mapScanMessages",
      type: "utilities/map",
      position: { x: 0, y: 0 },
      data: {
        list: { "$expression": "getChat.messages.data.reverse()" },
        itemTemplate: {
          "$template": "{{ item.participant ? item.participant.name : 'Adventurer' }}: {{ item.content }}"
        }
      }
    },
    {
      id: "joinScanMessages",
      type: "utilities/join",
      position: { x: 0, y: 0 },
      data: {
        list: { "$expression": "mapScanMessages.list" },
        separator: "\n\n"
      }
    },
    {
      id: "calcDiceAndState",
      type: "storage/set_variable",
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { "$template": "d20Roll" },
            value: { "$expression": "Math.floor(Math.random() * 20) + 1" }
          },
          {
            key: { "$template": "damageVal" },
            value: { "$expression": "Math.floor(Math.random() * 40) + 20" }
          }
        ]
      }
    },
    {
      id: "countTokens",
      type: "ai/count_tokens",
      position: { x: 0, y: 0 },
      data: {
        content: { "$expression": "joinScanMessages.text" }
      }
    },
    {
      id: "getLores",
      type: "storage/get_lores",
      position: { x: 0, y: 0 },
      data: {
        worldId: "01a0467b-9fcc-746c-8f36-2c1ec0b46516",
        limit: 3
      }
    },
    {
      id: "mapLores",
      type: "utilities/map",
      position: { x: 0, y: 0 },
      data: {
        list: { "$expression": "getLores.data" },
        itemTemplate: {
          "$template": "=== {{ item.title }} ===\n{{ item.content }}"
        }
      }
    },
    {
      id: "joinLores",
      type: "utilities/join",
      position: { x: 0, y: 0 },
      data: {
        list: { "$expression": "mapLores.list" },
        separator: "\n\n"
      }
    },
    {
      id: "tryBlock",
      type: "control_flow/try",
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: "generateStory",
      type: "ai/llm",
      position: { x: 0, y: 0 },
      data: {
        modelId: "64ffc716-89a3-456e-9a95-ef4095f7d781",
        temperature: 0.8,
        maxTokens: 550,
        messages: [
          {
            role: "system",
            content: "You are CHRONOS-Prime, the Grand AI Game Master of Aetheria. The player made an action. Calculate the combat outcome based on their D20 roll: {{ $variables.d20Roll }}. If >= 15, narrate a decisive, spectacular success with {{ $variables.damageVal }} damage. If <= 5, narrate a dramatic complication or close call. Reference the world lore if relevant. Deliver a rich, cinematic RPG turn."
          },
          {
            role: "user",
            content: "<world_lore>\n{{ joinLores.text }}\n</world_lore>\n\n<recent_actions>\n{{ joinScanMessages.text }}\n</recent_actions>"
          }
        ]
      }
    },
    {
      id: "insertStoryMessage",
      type: "storage/insert_chat_message",
      position: { x: 0, y: 0 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterBot.list[0].id" },
        content: {
          "$template": "{{ generateStory.outputText }}\n\n---\n🎲 **Combat Roll**: D20 = `{{ $variables.d20Roll }}` | ⚔️ **Impact**: `{{ $variables.damageVal }} DMG` | ⏱️ *{{ Date.format('h:mm a') }}*\n📊 *[Context: {{ countTokens.count }} tokens | Arbiter: Llama-3.3-70B]*"
        }
      }
    },
    {
      id: "fallbackError",
      type: "storage/insert_chat_message",
      position: { x: 0, y: 0 },
      data: {
        chatId: { "$expression": "chatMessage.chatId" },
        chatParticipantId: { "$expression": "filterBot.list[0].id" },
        content: "*[CHRONOS-Prime Arbiter Core encountered temporary cosmic distortion. Please retry your turn.]*"
      }
    },
    {
      id: "stopTyping",
      type: "storage/update_typing_status",
      position: { x: 0, y: 0 },
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
    { id: "xy-edge__startTypingnext-mapScanMessagesprevious", source: "startTyping", sourceHandle: "next", target: "mapScanMessages", targetHandle: "previous" },
    { id: "xy-edge__mapScanMessagesnext-joinScanMessagesprevious", source: "mapScanMessages", sourceHandle: "next", target: "joinScanMessages", targetHandle: "previous" },
    { id: "xy-edge__joinScanMessagesnext-calcDiceAndStateprevious", source: "joinScanMessages", sourceHandle: "next", target: "calcDiceAndState", targetHandle: "previous" },
    { id: "xy-edge__calcDiceAndStatenext-countTokensprevious", source: "calcDiceAndState", sourceHandle: "next", target: "countTokens", targetHandle: "previous" },
    { id: "xy-edge__countTokensnext-getLoresprevious", source: "countTokens", sourceHandle: "next", target: "getLores", targetHandle: "previous" },
    { id: "xy-edge__getLoresnext-mapLoresprevious", source: "getLores", sourceHandle: "next", target: "mapLores", targetHandle: "previous" },
    { id: "xy-edge__mapLoresnext-joinLoresprevious", source: "mapLores", sourceHandle: "next", target: "joinLores", targetHandle: "previous" },
    { id: "xy-edge__joinLoresnext-tryBlockprevious", source: "joinLores", sourceHandle: "next", target: "tryBlock", targetHandle: "previous" },
    { id: "xy-edge__tryBlocksuccess-generateStoryprevious", source: "tryBlock", sourceHandle: "success", target: "generateStory", targetHandle: "previous" },
    { id: "xy-edge__generateStorynext-insertStoryMessageprevious", source: "generateStory", sourceHandle: "next", target: "insertStoryMessage", targetHandle: "previous" },
    { id: "xy-edge__insertStoryMessagenext-stopTypingprevious", source: "insertStoryMessage", sourceHandle: "next", target: "stopTyping", targetHandle: "previous" },
    { id: "xy-edge__tryBlockerror-fallbackErrorprevious", source: "tryBlock", sourceHandle: "error", target: "fallbackError", targetHandle: "previous" },
    { id: "xy-edge__fallbackErrornext-stopTypingprevious", source: "fallbackError", sourceHandle: "next", target: "stopTyping", targetHandle: "previous" }
  ]
};

const styled = layoutGraph(rawGraph, 'snake');
fs.writeFileSync('/data/data/com.termux/files/home/openrp-toolkit/chronos_payload.json', JSON.stringify({
  name: 'CHRONOS-Prime: Cosmic Game Master & Combat Arbiter',
  handle: 'chronos-combat-arbiter-' + Date.now().toString(36),
  description: 'Autonomous 17-node RPG Dungeon Master with dynamic D20 dice rolling, lore synthesis, token tracking, and try-catch safety.',
  graph: styled
}, null, 2));

console.log('✅ Generated chronos_payload.json with', styled.nodes.length, 'nodes arranged in Snake S-Curve layout.');
