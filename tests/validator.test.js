const { validateBehaviorGraph } = require('../bin/validator.js');

describe('Behavior Graph Validator', () => {
  it('should be defined', () => {
    expect(validateBehaviorGraph).toBeDefined();
  });

  it('should detect invalid outgoing port handles on control_flow/if', () => {
    const invalidGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'if_node', type: 'control_flow/if', position: { x: 350, y: 0 } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-if_nodeprevious', source: 'trigger', sourceHandle: 'next', target: 'if_node', targetHandle: 'previous' },
        { id: 'xy-edge__if_nodeinvalid-triggerprevious', source: 'if_node', sourceHandle: 'invalid_handle', target: 'trigger', targetHandle: 'previous' }
      ]
    };
    const results = validateBehaviorGraph(invalidGraph);
    expect(results.errors.some(e => e.includes('Invalid outgoing handle "invalid_handle" on "control_flow/if"'))).toBe(true);
  });

  it('should detect invalid incoming port handle on standard node', () => {
    const invalidGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'llm', type: 'ai/llm', position: { x: 350, y: 0 }, data: { prompt: 'hi' } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-llmbad', source: 'trigger', sourceHandle: 'next', target: 'llm', targetHandle: 'bad_input' }
      ]
    };
    const results = validateBehaviorGraph(invalidGraph);
    expect(results.errors.some(e => e.includes('Invalid incoming handle "bad_input" on "ai/llm"'))).toBe(true);
  });

  it('should detect duplicate edges', () => {
    const dupGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'msg', type: 'storage/insert_chat_message', position: { x: 350, y: 0 } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-msgprevious', source: 'trigger', sourceHandle: 'next', target: 'msg', targetHandle: 'previous' },
        { id: 'xy-edge__triggernext-msgprevious', source: 'trigger', sourceHandle: 'next', target: 'msg', targetHandle: 'previous' }
      ]
    };
    const results = validateBehaviorGraph(dupGraph);
    expect(results.errors.some(e => e.includes('Duplicate edge detected'))).toBe(true);
  });

  it('should handle malformed and null edge objects defensively', () => {
    const malformedGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } }
      ],
      edges: [
        null,
        undefined,
        'not-an-edge',
        { id: 'missing-props' }
      ]
    };
    const results = validateBehaviorGraph(malformedGraph);
    expect(results.errors.filter(e => e.includes('missing source or target')).length).toBe(4);
  });

  it('should validate storage/update_typing_status participantId vs chatParticipantId', () => {
    const validGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'typing', type: 'storage/update_typing_status', position: { x: 350, y: 0 }, data: { participantId: 'part_123', isTyping: true } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-typingprevious', source: 'trigger', sourceHandle: 'next', target: 'typing', targetHandle: 'previous' }
      ]
    };
    const validResults = validateBehaviorGraph(validGraph);
    expect(validResults.errors.some(e => e.includes('update_typing_status'))).toBe(false);

    const invalidGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'typing', type: 'storage/update_typing_status', position: { x: 350, y: 0 }, data: { chatParticipantId: 'part_123', isTyping: true } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-typingprevious', source: 'trigger', sourceHandle: 'next', target: 'typing', targetHandle: 'previous' }
      ]
    };
    const invalidResults = validateBehaviorGraph(invalidGraph);
    expect(invalidResults.errors.some(e => e.includes('storage/update_typing_status') && e.includes('MUST use participantId'))).toBe(true);
  });

  it('should emit warning for backwards edge but exempt loopEnd', () => {
    const backwardsGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 350, y: 0 } },
        { id: 'msg', type: 'storage/insert_chat_message', position: { x: 0, y: 0 } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-msgprevious', source: 'trigger', sourceHandle: 'next', target: 'msg', targetHandle: 'previous' }
      ]
    };
    const warnResults = validateBehaviorGraph(backwardsGraph);
    expect(warnResults.warnings.some(w => w.includes('Monotonic X-Coordinate rule'))).toBe(true);

    const loopGraph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'repeat', type: 'control_flow/repeat_until', position: { x: 350, y: 0 } },
        { id: 'step', type: 'utilities/filter', position: { x: 700, y: 0 }, data: { itemCondition: { $expression: 'true' } } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-repeatprevious', source: 'trigger', sourceHandle: 'next', target: 'repeat', targetHandle: 'previous' },
        { id: 'xy-edge__repeatloopStart-stepprevious', source: 'repeat', sourceHandle: 'loopStart', target: 'step', targetHandle: 'previous' },
        { id: 'xy-edge__stepnext-repeatloopEnd', source: 'step', sourceHandle: 'next', target: 'repeat', targetHandle: 'loopEnd' }
      ]
    };
    const loopResults = validateBehaviorGraph(loopGraph);
    expect(loopResults.warnings.some(w => w.includes('Monotonic X-Coordinate rule'))).toBe(false);
  });

  it('should validate dynamic split and sync ports based on outputCount / inputCount', () => {
    const split3Graph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'split', type: 'control_flow/split', position: { x: 350, y: 0 }, data: { outputCount: 3 } },
        { id: 'sync', type: 'control_flow/sync', position: { x: 700, y: 0 }, lcaNodeId: 'split', data: { inputCount: 3 } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-splitprevious', source: 'trigger', sourceHandle: 'next', target: 'split', targetHandle: 'previous' },
        { id: 'xy-edge__splitout1-syncin1', source: 'split', sourceHandle: 'out1', target: 'sync', targetHandle: 'in1' },
        { id: 'xy-edge__splitout2-syncin2', source: 'split', sourceHandle: 'out2', target: 'sync', targetHandle: 'in2' },
        { id: 'xy-edge__splitout3-syncin3', source: 'split', sourceHandle: 'out3', target: 'sync', targetHandle: 'in3' }
      ]
    };
    const validResults = validateBehaviorGraph(split3Graph);
    expect(validResults.errors.some(e => e.includes('Invalid outgoing handle') || e.includes('Invalid incoming handle'))).toBe(false);

    const invalidSplit2Graph = {
      nodes: [
        { id: 'trigger', type: 'events/chat_message', position: { x: 0, y: 0 } },
        { id: 'split', type: 'control_flow/split', position: { x: 350, y: 0 }, data: { outputCount: 2 } },
        { id: 'sync', type: 'control_flow/sync', position: { x: 700, y: 0 }, lcaNodeId: 'split', data: { inputCount: 2 } }
      ],
      edges: [
        { id: 'xy-edge__triggernext-splitprevious', source: 'trigger', sourceHandle: 'next', target: 'split', targetHandle: 'previous' },
        { id: 'xy-edge__splitout3-syncin3', source: 'split', sourceHandle: 'out3', target: 'sync', targetHandle: 'in3' }
      ]
    };
    const invalidResults = validateBehaviorGraph(invalidSplit2Graph);
    expect(invalidResults.errors.some(e => e.includes('Invalid outgoing handle "out3" on "control_flow/split"'))).toBe(true);
    expect(invalidResults.errors.some(e => e.includes('Invalid incoming handle "in3" on "control_flow/sync"'))).toBe(true);
  });
});
