const { scaffoldBehaviorGraph, SUPPORTED_BLUEPRINTS } = require('../lib/graph_scaffolder.js');
const { validateBehaviorGraph } = require('../bin/validator.js');

describe('Graph Scaffolder Utility', () => {
  it('should scaffold a valid sequential LLM chain with 0 validator errors', () => {
    const graph = scaffoldBehaviorGraph({
      blueprint: 'sequential',
      systemPrompt: 'You are a helpful companion.',
      modelId: '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3'
    });

    expect(graph.nodes.length).toBeGreaterThanOrEqual(4);
    expect(graph.edges.length).toBeGreaterThanOrEqual(4);
    
    // Must pass full validator suite
    const validation = validateBehaviorGraph(graph);
    expect(validation.errors).toEqual([]);
  });

  it('should scaffold a valid branching intent router with 0 validator errors', () => {
    const graph = scaffoldBehaviorGraph({
      blueprint: 'branching',
      keyword: 'help',
      truePrompt: 'Help the user patiently.',
      falsePrompt: 'Engage in standard roleplay.',
      modelId: '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3'
    });

    const validation = validateBehaviorGraph(graph);
    expect(validation.errors).toEqual([]);
    expect(graph.nodes.some(n => n.type === 'control_flow/if')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'control_flow/end_if')).toBe(true);
  });

  it('should scaffold a valid state machine graph with 0 validator errors', () => {
    const graph = scaffoldBehaviorGraph({
      blueprint: 'state_machine',
      variableName: 'affinity',
      modelId: '01a04c17-1f4f-740b-9ab6-50b58cbfc4d3'
    });

    const validation = validateBehaviorGraph(graph);
    expect(validation.errors).toEqual([]);
    expect(graph.nodes.some(n => n.type === 'storage/get_variable')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'storage/set_variable')).toBe(true);
  });

  it('should scaffold a valid looping worker graph with 0 validator errors', () => {
    const graph = scaffoldBehaviorGraph({
      blueprint: 'looping',
      cronExpression: '*/5 * * * *',
      targetUrl: 'https://api.example.com/health'
    });

    const validation = validateBehaviorGraph(graph);
    expect(validation.errors).toEqual([]);
    expect(graph.nodes.some(n => n.type === 'control_flow/repeat_until')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'control_flow/try')).toBe(true);
  });

  it('should throw an error on unsupported blueprint types', () => {
    expect(() => scaffoldBehaviorGraph({ blueprint: 'unknown_type' })).toThrow('Unsupported blueprint');
  });

  it('should export SUPPORTED_BLUEPRINTS array', () => {
    expect(SUPPORTED_BLUEPRINTS).toEqual(['sequential', 'branching', 'state_machine', 'looping']);
  });

  it('should safely escape single quotes in branching keyword and validate with 0 errors', () => {
    const graph = scaffoldBehaviorGraph({
      blueprint: 'branching',
      keyword: "don't"
    });

    const validation = validateBehaviorGraph(graph);
    expect(validation.errors).toEqual([]);
    const ifNode = graph.nodes.find(n => n.type === 'control_flow/if');
    expect(ifNode.data.condition.$expression).toContain("indexOf('don\\'t')");
  });

  it('should assign numeric and finite coordinates to all graph nodes', () => {
    SUPPORTED_BLUEPRINTS.forEach(blueprint => {
      const graph = scaffoldBehaviorGraph({ blueprint });
      graph.nodes.forEach(node => {
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
      });
    });
  });

  it('should respect customizable parameters across all blueprints', () => {
    const sequential = scaffoldBehaviorGraph({
      blueprint: 'sequential',
      fallbackMessage: 'Custom sequential fallback',
      temperature: 0.2
    });
    const seqLlm = sequential.nodes.find(n => n.id === 'llmGenerate');
    expect(seqLlm.data.temperature).toBe(0.2);
    const seqFallback = sequential.nodes.find(n => n.id === 'insertFallback');
    expect(seqFallback.data.content.$template).toBe('Custom sequential fallback');

    const branching = scaffoldBehaviorGraph({
      blueprint: 'branching',
      fallbackMessage: 'Custom branch fallback',
      trueTemperature: 0.1,
      falseTemperature: 0.9
    });
    const branchHelp = branching.nodes.find(n => n.id === 'llmHelp');
    expect(branchHelp.data.temperature).toBe(0.1);
    const branchDefault = branching.nodes.find(n => n.id === 'llmDefault');
    expect(branchDefault.data.temperature).toBe(0.9);
    const branchFallback = branching.nodes.find(n => n.id === 'insertError');
    expect(branchFallback.data.content.$template).toBe('Custom branch fallback');

    const stateMachine = scaffoldBehaviorGraph({
      blueprint: 'state_machine',
      fallbackMessage: 'Custom state fallback',
      temperature: 0.4
    });
    const stateLlm = stateMachine.nodes.find(n => n.id === 'llmGenerate');
    expect(stateLlm.data.temperature).toBe(0.4);
    const stateFallback = stateMachine.nodes.find(n => n.id === 'insertError');
    expect(stateFallback.data.content.$template).toBe('Custom state fallback');

    const looping = scaffoldBehaviorGraph({
      blueprint: 'looping',
      httpMethod: 'POST',
      alertMessage: 'Custom poll alert',
      fallbackMessage: 'Custom poll error'
    });
    const httpNode = looping.nodes.find(n => n.id === 'httpPoll');
    expect(httpNode.data.method).toBe('POST');
    const alertNode = looping.nodes.find(n => n.id === 'insertAlert');
    expect(alertNode.data.content.$template).toBe('Custom poll alert');
    const loopErrNode = looping.nodes.find(n => n.id === 'insertError');
    expect(loopErrNode.data.content.$template).toBe('Custom poll error');
  });
});
