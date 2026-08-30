// lib/layout_engine.js
function beautifyGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes)) return graph;

  const X_SPACING = 350;
  const Y_SPACING = 150;

  // 1. Find roots (nodes with no incoming edges)
  const incomingCount = {};
  graph.nodes.forEach(n => incomingCount[n.id] = 0);
  (graph.edges || []).forEach(e => {
    if (incomingCount[e.target] !== undefined) {
      incomingCount[e.target]++;
    }
  });

  // 2. Assign layers (BFS)
  const layers = {}; // id -> layer index
  let queue = graph.nodes.filter(n => incomingCount[n.id] === 0).map(n => n.id);
  
  // If no roots (circular), just pick the first node
  if (queue.length === 0 && graph.nodes.length > 0) queue.push(graph.nodes[0].id);

  queue.forEach(id => layers[id] = 0);

  let layerIndex = 0;
  while (queue.length > 0) {
    const nextQueue = [];
    queue.forEach(nodeId => {
      const children = (graph.edges || [])
        .filter(e => e.source === nodeId)
        .map(e => e.target);
        
      children.forEach(childId => {
        if (layers[childId] === undefined) {
          layers[childId] = layerIndex + 1;
          nextQueue.push(childId);
        }
      });
    });
    queue = nextQueue;
    layerIndex++;
  }

  // Assign any unconnected nodes to layer 0
  graph.nodes.forEach(n => {
    if (layers[n.id] === undefined) layers[n.id] = 0;
  });

  // 3. Assign Coordinates
  const layerCounts = {};
  const updatedNodes = graph.nodes.map(node => {
    const layer = layers[node.id];
    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    
    const yIndex = layerCounts[layer] - 1;
    
    return {
      ...node,
      position: {
        x: layer * X_SPACING,
        y: yIndex * Y_SPACING
      }
    };
  });

  return { ...graph, nodes: updatedNodes };
}

module.exports = { beautifyGraph };
