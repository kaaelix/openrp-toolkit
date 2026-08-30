const { beautifyGraph } = require('../lib/layout_engine.js');

describe('Layout Engine', () => {
  it('should space out nodes without coordinates', () => {
    const graph = {
      nodes: [
        { id: '1', position: { x: 0, y: 0 } },
        { id: '2', position: { x: 0, y: 0 } },
        { id: '3', position: { x: 0, y: 0 } }
      ],
      edges: [
        { source: '1', target: '2' },
        { source: '1', target: '3' }
      ]
    };
    
    const newGraph = beautifyGraph(graph);
    
    // Node 1 is root (Layer 0) -> X: 0
    expect(newGraph.nodes.find(n => n.id === '1').position.x).toBe(0);
    expect(newGraph.nodes.find(n => n.id === '1').position.y).toBe(0);
    
    // Nodes 2 and 3 are Layer 1 -> X: 350
    const node2 = newGraph.nodes.find(n => n.id === '2');
    const node3 = newGraph.nodes.find(n => n.id === '3');
    
    expect(node2.position.x).toBe(350);
    expect(node3.position.x).toBe(350);
    
    // They should have different Y positions to prevent overlap
    expect(node2.position.y).not.toBe(node3.position.y);
  });
});
