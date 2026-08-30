// tests/mermaid_renderer.test.js
const { renderGraphToMermaid } = require('../lib/mermaid_renderer.js');

describe('Mermaid Renderer', () => {
  it('should render a 3-node graph correctly', () => {
    const graph = {
      nodes: [
        { id: '1', type: 'events/chat_message', data: {} },
        { id: '2', type: 'ai/llm', data: { prompt: 'Hello "World"' } },
        { id: '3', type: 'utilities/join', data: {} }
      ],
      edges: [
        { id: 'e1', source: '1', sourceHandle: 'next', target: '2' },
        { id: 'e2', source: '2', sourceHandle: 'success', target: '3' }
      ]
    };
    
    const result = renderGraphToMermaid(graph);
    expect(result).toContain('graph LR');
    expect(result).toContain('1["[events/chat_message]"]');
    expect(result).toContain("2[\"[ai/llm] Hello 'World'\"]");
    expect(result).toContain('3["[utilities/join]"]');
    expect(result).toContain('1 -->|next| 2');
    expect(result).toContain('2 -->|success| 3');
  });
  
  it('should throw Error on malformed data', () => {
    expect(() => renderGraphToMermaid(null)).toThrow();
  });
});
