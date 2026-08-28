#!/usr/bin/env node

/**
 * OpenRP Visual Graph Layout & Edge Styler
 * 
 * Transforms behavior graphs into beautiful visual layouts with custom edge aesthetics:
 * - Styles: 'snake' (S-Curve), 'diamond' (Hierarchical Fork-Join), 'bento' (Modular Clusters), 'radial' (Orbit), 'cyberpunk' (Wave Grid)
 * - Edge Customization: Animated pulsing wires, color-coded branches (Success, Error, Parallel, Data).
 */

const STYLES = {
  CONTROL: { stroke: '#3b82f6', strokeWidth: 2 },        // Blue
  SUCCESS: { stroke: '#10b981', strokeWidth: 2 },        // Green
  ERROR: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4,4' }, // Red Dashed
  PARALLEL: { stroke: '#8b5cf6', strokeWidth: 2 },       // Purple
  RAG: { stroke: '#f59e0b', strokeWidth: 2 }             // Amber
};

function styleEdges(edges, animated = true) {
  return edges.map(edge => {
    let edgeStyle = { ...STYLES.CONTROL };
    let edgeType = 'smoothstep';

    if (edge.sourceHandle === 'true' || edge.sourceHandle === 'success') {
      edgeStyle = { ...STYLES.SUCCESS };
    } else if (edge.sourceHandle === 'false' || edge.sourceHandle === 'error') {
      edgeStyle = { ...STYLES.ERROR };
    } else if (edge.sourceHandle && (edge.sourceHandle.startsWith('out') || edge.targetHandle?.startsWith('in'))) {
      edgeStyle = { ...STYLES.PARALLEL };
    }

    return {
      ...edge,
      type: edgeType,
      animated: animated,
      style: edgeStyle
    };
  });
}

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
  // Groups nodes by category
  const clusters = {
    events: { x: 50, y: 100 },
    storage: { x: 350, y: 100 },
    logic: { x: 650, y: 100 },
    ai: { x: 650, y: 300 },
    delivery: { x: 950, y: 300 }
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

function applyDiamondLayout(nodes, nodeWidth = 260, nodeHeight = 150) {
  // Symmetrical fork-join tree
  return nodes.map((node, index) => {
    let x = index * nodeWidth;
    let y = 300;

    if (node.id.toLowerCase().includes('bot') || node.id.toLowerCase().includes('error') || index % 2 === 1) {
      y = 150;
    } else if (node.id.toLowerCase().includes('user') || node.id.toLowerCase().includes('lore')) {
      y = 450;
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

function styleGraph(graph, layoutType = 'snake', animated = true) {
  let nodes = graph.nodes || [];
  let edges = graph.edges || [];

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

  edges = styleEdges(edges, animated);

  return {
    ...graph,
    nodes,
    edges
  };
}

module.exports = {
  styleGraph,
  styleEdges,
  applySnakeLayout,
  applyBentoLayout,
  applyDiamondLayout,
  applyWaveLayout,
  STYLES
};

if (require.main === module) {
  console.log('🎨 OpenRP Visual Graph Layout & Edge Styler module loaded.');
  console.log('Supported Layouts: snake, bento, diamond, wave.');
  console.log('Supported Edge Styles: Animated smoothstep, Color-coded (Blue/Green/Red/Purple/Amber).');
}
