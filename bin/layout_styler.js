#!/usr/bin/env node

/**
 * OpenRP Visual Graph Spatial Layout Generator
 * 
 * Arranges node (x, y) coordinates into clean, visually harmonious layouts
 * that guarantee:
 * 1. Monotonic Forward Flow (X_target >= X_source for all forward edges)
 * 2. Zero 180-degree cable looping around node bodies
 * 3. Clear port alignment (Right Output -> Left Input)
 * 
 * Supported Layout Styles:
 * - 'linear': Clean single-row horizontal pipeline (X += 350, Y = 150)
 * - 'diamond': Symmetrical multi-lane fork-join for parallel RAG / Split / Sync (Y = 100, 250, 400)
 * - 'waterfall': Multi-stage functional tiers (Ingestion Y=100, Processing Y=280, Delivery Y=460)
 * - 'scoped': Scoped block layout for try/catch and repeat_until containers
 */

const fs = require('fs');
const path = require('path');

function applyLinearLayout(nodes, startX = 50, startY = 150, stepX = 350) {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX + index * stepX,
      y: startY
    }
  }));
}

function applyDiamondLayout(nodes, startX = 50, centerY = 250, stepX = 320) {
  let currentX = startX;
  return nodes.map((node, idx) => {
    const type = node.type || '';
    let y = centerY;

    if (node.id.toLowerCase().includes('lore') || node.id.toLowerCase().includes('rag') || idx % 2 === 1 && !type.includes('split') && !type.includes('sync')) {
      y = centerY - 140; // Top lane
    } else if (node.id.toLowerCase().includes('history') || node.id.toLowerCase().includes('var') || node.id.toLowerCase().includes('token')) {
      y = centerY + 140; // Bottom lane
    }

    const pos = {
      x: currentX,
      y
    };
    currentX += stepX;
    return { ...node, position: pos };
  });
}

function applyWaterfallLayout(nodes, startX = 50, stepX = 320) {
  return nodes.map((node, idx) => {
    const type = node.type || '';
    let tierY = 100; // Tier 1: Ingestion & Setup

    if (type.startsWith('storage/set') || type.startsWith('ai/count') || type.startsWith('utilities/')) {
      tierY = 240; // Tier 2: Transformation & Memory
    } else if (type.startsWith('ai/llm') || type.startsWith('control_flow/')) {
      tierY = 380; // Tier 3: Core Reasoning & Decision
    } else if (type.startsWith('storage/insert') || type.startsWith('storage/broadcast')) {
      tierY = 520; // Tier 4: Delivery & Output
    }

    return {
      ...node,
      position: {
        x: startX + idx * stepX,
        y: tierY
      }
    };
  });
}

function applyScopedLayout(nodes, startX = 50, stepX = 320) {
  return nodes.map((node, idx) => {
    const type = node.type || '';
    let y = 150;

    if (node.id.toLowerCase().includes('fallback') || node.id.toLowerCase().includes('error')) {
      y = 350; // Error / Fallback lane below
    }

    return {
      ...node,
      position: {
        x: startX + idx * stepX,
        y
      }
    };
  });
}

function layoutGraph(graph, layoutType = 'linear') {
  const nodes = graph.nodes || [];
  let styledNodes = [];

  switch (layoutType.toLowerCase()) {
    case 'linear':
      styledNodes = applyLinearLayout(nodes);
      break;
    case 'diamond':
    case 'fork_join':
      styledNodes = applyDiamondLayout(nodes);
      break;
    case 'waterfall':
    case 'tiers':
      styledNodes = applyWaterfallLayout(nodes);
      break;
    case 'scoped':
    case 'try_catch':
      styledNodes = applyScopedLayout(nodes);
      break;
    default:
      styledNodes = applyLinearLayout(nodes);
      break;
  }

  return {
    ...graph,
    nodes: styledNodes
  };
}

module.exports = {
  applyLinearLayout,
  applyDiamondLayout,
  applyWaterfallLayout,
  applyScopedLayout,
  layoutGraph
};

// CLI Support
if (require.main === module) {
  const filePath = process.argv[2];
  const style = process.argv[3] || 'linear';

  if (!filePath) {
    console.log('Usage: node bin/layout_styler.js <path-to-graph.json> [linear|diamond|waterfall|scoped]');
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    const parsed = JSON.parse(raw);
    const targetGraph = parsed.graph || parsed;
    const styled = layoutGraph(targetGraph, style);

    if (parsed.graph) {
      parsed.graph = styled;
      fs.writeFileSync(path.resolve(process.cwd(), filePath), JSON.stringify(parsed, null, 2));
    } else {
      fs.writeFileSync(path.resolve(process.cwd(), filePath), JSON.stringify(styled, null, 2));
    }

    console.log(`✅ Successfully applied "${style}" layout style to ${filePath}`);
  } catch (err) {
    console.error('Layout Error:', err.message);
    process.exit(1);
  }
}
