#!/usr/bin/env node

/**
 * OpenRP Visual Graph Spatial Layout Generator
 * 
 * Arranges node (x, y) coordinates into clean, non-linear geometric layouts:
 * - 'snake': S-Curve / Zigzag grid (4 nodes per row, compact & readable)
 * - 'diamond': Symmetrical fork-join for parallel branches (split/sync)
 * - 'bento': Functional category clusters (Ingestion, RAG, Inference, Delivery)
 * - 'wave': Alternating diagonal sine-wave layout
 */

function applySnakeLayout(nodes, columns = 4, nodeWidth = 240, rowHeight = 160) {
  return nodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const colInRow = index % columns;
    const isEvenRow = row % 2 === 0;
    const col = isEvenRow ? colInRow : (columns - 1 - colInRow);

    return {
      ...node,
      position: {
        x: col * nodeWidth + 50,
        y: row * rowHeight + 100
      }
    };
  });
}

function applyBentoLayout(nodes) {
  const clusters = {
    events: { x: 50, y: 100 },
    storage: { x: 350, y: 100 },
    ai: { x: 650, y: 250 },
    delivery: { x: 950, y: 250 }
  };

  return nodes.map((node, idx) => {
    const type = node.type || '';
    let baseX = 50 + (idx % 4) * 260;
    let baseY = 100 + Math.floor(idx / 4) * 180;

    if (type.startsWith('events/')) {
      baseX = clusters.events.x;
      baseY = clusters.events.y + idx * 80;
    } else if (type.startsWith('storage/get')) {
      baseX = clusters.storage.x;
      baseY = clusters.storage.y + (idx % 3) * 120;
    } else if (type.startsWith('ai/')) {
      baseX = clusters.ai.x;
      baseY = clusters.ai.y + (idx % 2) * 140;
    } else if (type.startsWith('storage/insert') || type.startsWith('storage/update')) {
      baseX = clusters.delivery.x;
      baseY = clusters.delivery.y + (idx % 2) * 140;
    }

    return {
      ...node,
      position: { x: baseX, y: baseY }
    };
  });
}

function applyDiamondLayout(nodes, nodeWidth = 260) {
  return nodes.map((node, index) => {
    let x = index * nodeWidth;
    let y = 300;

    if (node.id.toLowerCase().includes('bot') || node.id.toLowerCase().includes('error') || index % 2 === 1) {
      y = 160;
    } else if (node.id.toLowerCase().includes('user') || node.id.toLowerCase().includes('lore')) {
      y = 440;
    }

    return {
      ...node,
      position: { x, y }
    };
  });
}

function applyWaveLayout(nodes, nodeWidth = 220, amplitude = 120, frequency = 0.8) {
  return nodes.map((node, index) => {
    const x = index * nodeWidth + 50;
    const y = 300 + Math.sin(index * frequency) * amplitude;
    return {
      ...node,
      position: { x: Math.round(x), y: Math.round(y) }
    };
  });
}

function layoutGraph(graph, layoutType = 'snake') {
  let nodes = graph.nodes || [];
  const edges = (graph.edges || []).map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle
  }));

  switch (layoutType.toLowerCase()) {
    case 'snake':
    case 's-curve':
      nodes = applySnakeLayout(nodes);
      break;
    case 'bento':
    case 'cluster':
      nodes = applyBentoLayout(nodes);
      break;
    case 'diamond':
    case 'fork-join':
      nodes = applyDiamondLayout(nodes);
      break;
    case 'wave':
    case 'cyberpunk':
      nodes = applyWaveLayout(nodes);
      break;
    default:
      nodes = applySnakeLayout(nodes);
  }

  return {
    ...graph,
    nodes,
    edges
  };
}

module.exports = {
  layoutGraph,
  applySnakeLayout,
  applyBentoLayout,
  applyDiamondLayout,
  applyWaveLayout
};
