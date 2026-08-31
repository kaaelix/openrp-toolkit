const { beautifyGraph } = require('./layout_engine.js');

const SUPPORTED_BLUEPRINTS = ['sequential', 'branching', 'state_machine', 'looping'];

function createEdge(source, sourceHandle, target, targetHandle) {
  return {
    id: `xy-edge__${source}${sourceHandle}-${target}${targetHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle
  };
}

function scaffoldSequential(options = {}) {
  const systemPrompt = options.systemPrompt || 'You are a helpful companion.';
  const modelId = options.modelId || '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3';
  const fallbackMessage = options.fallbackMessage || 'I apologize, but I encountered an error processing your request. Please try again in a moment.';

  const nodes = [
    {
      id: 'chatEvent',
      type: 'events/chat_message',
      position: { x: 0, y: 0 },
      data: {
        customFields: [
          {
            name: 'systemPrompt',
            type: 'string',
            description: 'System prompt instructions',
            defaultValue: systemPrompt
          }
        ]
      }
    },
    {
      id: 'tryBlock',
      type: 'control_flow/try',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'llmGenerate',
      type: 'ai/llm',
      position: { x: 0, y: 0 },
      data: {
        modelId,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: {
              $expression: 'chatEvent.message.content'
            }
          }
        ],
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        maxTokens: options.maxTokens || 500
      }
    },
    {
      id: 'insertReply',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $expression: 'llmGenerate.outputText' }
      }
    },
    {
      id: 'insertFallback',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $template: fallbackMessage }
      }
    }
  ];

  const edges = [
    createEdge('chatEvent', 'next', 'tryBlock', 'previous'),
    createEdge('tryBlock', 'loopStart', 'llmGenerate', 'previous'),
    createEdge('llmGenerate', 'next', 'tryBlock', 'loopEnd'),
    createEdge('tryBlock', 'next', 'insertReply', 'previous'),
    createEdge('tryBlock', 'error', 'insertFallback', 'previous')
  ];

  return {
    name: options.name || 'Sequential Defensive LLM Chain',
    handle: options.handle || 'sequential-defensive-llm-chain',
    description: options.description || 'Standard single-turn AI chat pipeline with try-catch error boundary and fallback error messaging.',
    nodes,
    edges
  };
}

function scaffoldBranching(options = {}) {
  const keyword = options.keyword !== undefined ? options.keyword : 'help';
  const sanitizedKeyword = String(keyword).replace(/'/g, "\\'");
  const truePrompt = options.truePrompt || 'Help the user patiently.';
  const falsePrompt = options.falsePrompt || 'Engage in standard roleplay.';
  const modelId = options.modelId || '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3';
  const fallbackMessage = options.fallbackMessage || 'Failed to process the message intent.';
  const trueTemperature = options.trueTemperature !== undefined ? options.trueTemperature : (options.temperature !== undefined ? options.temperature : 0.3);
  const falseTemperature = options.falseTemperature !== undefined ? options.falseTemperature : (options.temperature !== undefined ? options.temperature : 0.8);

  const nodes = [
    {
      id: 'chatEvent',
      type: 'events/chat_message',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'tryBlock',
      type: 'control_flow/try',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'intentIf',
      type: 'control_flow/if',
      position: { x: 0, y: 0 },
      data: {
        condition: {
          $expression: `chatEvent.message.content.indexOf('${sanitizedKeyword}') >= 0`
        },
        expression: {
          $expression: `chatEvent.message.content.indexOf('${sanitizedKeyword}') >= 0`
        }
      }
    },
    {
      id: 'llmHelp',
      type: 'ai/llm',
      position: { x: 0, y: 0 },
      data: {
        modelId,
        messages: [
          {
            role: 'system',
            content: truePrompt
          },
          {
            role: 'user',
            content: {
              $expression: 'chatEvent.message.content'
            }
          }
        ],
        temperature: trueTemperature
      }
    },
    {
      id: 'llmDefault',
      type: 'ai/llm',
      position: { x: 0, y: 0 },
      data: {
        modelId,
        messages: [
          {
            role: 'system',
            content: falsePrompt
          },
          {
            role: 'user',
            content: {
              $expression: 'chatEvent.message.content'
            }
          }
        ],
        temperature: falseTemperature
      }
    },
    {
      id: 'endIf',
      type: 'control_flow/end_if',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'insertReply',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $expression: "intentIf.next === 'true' ? llmHelp.outputText : llmDefault.outputText" }
      }
    },
    {
      id: 'insertError',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $template: fallbackMessage }
      }
    }
  ];

  const edges = [
    createEdge('chatEvent', 'next', 'tryBlock', 'previous'),
    createEdge('tryBlock', 'loopStart', 'intentIf', 'previous'),
    createEdge('intentIf', 'true', 'llmHelp', 'previous'),
    createEdge('intentIf', 'false', 'llmDefault', 'previous'),
    createEdge('llmHelp', 'next', 'endIf', 'in1'),
    createEdge('llmDefault', 'next', 'endIf', 'in2'),
    createEdge('endIf', 'next', 'tryBlock', 'loopEnd'),
    createEdge('tryBlock', 'next', 'insertReply', 'previous'),
    createEdge('tryBlock', 'error', 'insertError', 'previous')
  ];

  return {
    name: options.name || 'Branching Sentiment / Intent Router',
    handle: options.handle || 'branching-intent-router',
    description: options.description || 'Conditional routing behavior evaluating user keywords to select specialized LLM personas before merging output.',
    nodes,
    edges
  };
}

function scaffoldStateMachine(options = {}) {
  const variableName = options.variableName || 'affinity';
  const modelId = options.modelId || '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3';
  const fallbackMessage = options.fallbackMessage || 'An error occurred while updating character state.';
  const temperature = options.temperature !== undefined ? options.temperature : 0.7;

  const nodes = [
    {
      id: 'chatEvent',
      type: 'events/chat_message',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'getVar',
      type: 'storage/get_variable',
      position: { x: 0, y: 0 },
      data: {
        variableKey: variableName,
        key: { $template: `${variableName}_{{ chatEvent.chatId }}` },
        defaultValue: 0
      }
    },
    {
      id: 'tryBlock',
      type: 'control_flow/try',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'checkState',
      type: 'control_flow/if',
      position: { x: 0, y: 0 },
      data: {
        condition: { $expression: 'getVar.value != null' },
        expression: { $expression: 'getVar.value != null' }
      }
    },
    {
      id: 'setVar',
      type: 'storage/set_variable',
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { $template: `${variableName}_{{ chatEvent.chatId }}` },
            value: { $expression: 'getVar.value + 1' }
          }
        ]
      }
    },
    {
      id: 'initVar',
      type: 'storage/set_variable',
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { $template: `${variableName}_{{ chatEvent.chatId }}` },
            value: { $expression: '1' }
          }
        ]
      }
    },
    {
      id: 'endIf',
      type: 'control_flow/end_if',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'llmGenerate',
      type: 'ai/llm',
      position: { x: 0, y: 0 },
      data: {
        modelId,
        messages: [
          {
            role: 'system',
            content: {
              $template: `You are a character in a relationship with the user. Your ${variableName} score is {{ checkState.next === 'true' ? setVar.variables[0].value : 1 }}.`
            }
          },
          {
            role: 'user',
            content: {
              $expression: 'chatEvent.message.content'
            }
          }
        ],
        temperature
      }
    },
    {
      id: 'insertReply',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $expression: 'llmGenerate.outputText' }
      }
    },
    {
      id: 'insertError',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: { $expression: 'chatEvent.chatId' },
        chatParticipantId: { $expression: 'chatEvent.recipientParticipantId' },
        content: { $template: fallbackMessage }
      }
    }
  ];

  const edges = [
    createEdge('chatEvent', 'next', 'getVar', 'previous'),
    createEdge('getVar', 'next', 'tryBlock', 'previous'),
    createEdge('tryBlock', 'loopStart', 'checkState', 'previous'),
    createEdge('checkState', 'true', 'setVar', 'previous'),
    createEdge('checkState', 'false', 'initVar', 'previous'),
    createEdge('setVar', 'next', 'endIf', 'in1'),
    createEdge('initVar', 'next', 'endIf', 'in2'),
    createEdge('endIf', 'next', 'llmGenerate', 'previous'),
    createEdge('llmGenerate', 'next', 'tryBlock', 'loopEnd'),
    createEdge('tryBlock', 'next', 'insertReply', 'previous'),
    createEdge('tryBlock', 'error', 'insertError', 'previous')
  ];

  return {
    name: options.name || 'State Machine & Persistent Memory Manager',
    handle: options.handle || 'state-machine-persistent-memory',
    description: options.description || 'Persistent state progression pattern that loads, branches, mutates variables, and generates context-aware character dialog.',
    nodes,
    edges
  };
}

function scaffoldLooping(options = {}) {
  const cronExpression = options.cronExpression || '*/5 * * * *';
  const targetUrl = options.targetUrl || 'https://api.example.com/health';
  const httpMethod = options.httpMethod || 'GET';
  const fallbackMessage = options.fallbackMessage || 'HTTP polling request failed with network error.';
  const alertMessage = options.alertMessage || 'Polling worker completed cycle successfully.';

  const nodes = [
    {
      id: 'cronEvent',
      type: 'events/cron',
      position: { x: 0, y: 0 },
      data: {
        cronExpression
      }
    },
    {
      id: 'initPollState',
      type: 'storage/set_variable',
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { $template: 'pollSuccess' },
            value: { $expression: 'false' }
          }
        ]
      }
    },
    {
      id: 'pollLoop',
      type: 'control_flow/repeat_until',
      position: { x: 0, y: 0 },
      data: {
        expression: {
          $expression: '$variables.pollSuccess === true'
        }
      }
    },
    {
      id: 'tryBlock',
      type: 'control_flow/try',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'httpPoll',
      type: 'utilities/http_request',
      position: { x: 0, y: 0 },
      data: {
        url: targetUrl,
        method: httpMethod
      }
    },
    {
      id: 'checkStatus',
      type: 'control_flow/if',
      position: { x: 0, y: 0 },
      data: {
        condition: {
          $expression: 'httpPoll.status === 200'
        },
        expression: {
          $expression: 'httpPoll.status === 200'
        }
      }
    },
    {
      id: 'setSuccess',
      type: 'storage/set_variable',
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { $template: 'pollSuccess' },
            value: { $expression: 'true' }
          }
        ]
      }
    },
    {
      id: 'setRetry',
      type: 'storage/set_variable',
      position: { x: 0, y: 0 },
      data: {
        variables: [
          {
            key: { $template: 'pollSuccess' },
            value: { $expression: 'false' }
          }
        ]
      }
    },
    {
      id: 'endIf',
      type: 'control_flow/end_if',
      position: { x: 0, y: 0 },
      data: {}
    },
    {
      id: 'insertError',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: 'system_alerts',
        chatParticipantId: 'bot_monitor',
        content: {
          $template: fallbackMessage
        }
      }
    },
    {
      id: 'insertAlert',
      type: 'storage/insert_chat_message',
      position: { x: 0, y: 0 },
      data: {
        chatId: 'system_alerts',
        chatParticipantId: 'bot_monitor',
        content: {
          $template: alertMessage
        }
      }
    }
  ];

  const edges = [
    createEdge('cronEvent', 'next', 'initPollState', 'previous'),
    createEdge('initPollState', 'next', 'pollLoop', 'previous'),
    createEdge('pollLoop', 'loopStart', 'tryBlock', 'previous'),
    createEdge('tryBlock', 'loopStart', 'httpPoll', 'previous'),
    createEdge('httpPoll', 'next', 'tryBlock', 'loopEnd'),
    createEdge('tryBlock', 'next', 'checkStatus', 'previous'),
    createEdge('tryBlock', 'error', 'insertError', 'previous'),
    createEdge('checkStatus', 'true', 'setSuccess', 'previous'),
    createEdge('checkStatus', 'false', 'setRetry', 'previous'),
    createEdge('setSuccess', 'next', 'endIf', 'in1'),
    createEdge('setRetry', 'next', 'endIf', 'in2'),
    createEdge('endIf', 'next', 'pollLoop', 'loopEnd'),
    createEdge('pollLoop', 'next', 'insertAlert', 'previous')
  ];

  return {
    name: options.name || 'Resilient Scheduled Loop & Polling Worker',
    handle: options.handle || 'resilient-scheduled-polling-worker',
    description: options.description || 'Background cron worker executing bounded polling loop with HTTP error wrapping, state variable management, and status notifications.',
    nodes,
    edges
  };
}

function scaffoldBehaviorGraph(options = {}) {
  if (!options || typeof options !== 'object') {
    throw new Error('Unsupported blueprint: options must be an object');
  }

  let graph;
  switch (options.blueprint) {
    case 'sequential':
      graph = scaffoldSequential(options);
      break;
    case 'branching':
      graph = scaffoldBranching(options);
      break;
    case 'state_machine':
      graph = scaffoldStateMachine(options);
      break;
    case 'looping':
      graph = scaffoldLooping(options);
      break;
    default:
      throw new Error(`Unsupported blueprint: "${options.blueprint}". Supported blueprints are: sequential, branching, state_machine, looping.`);
  }

  return beautifyGraph(graph);
}

module.exports = {
  scaffoldBehaviorGraph,
  SUPPORTED_BLUEPRINTS
};
