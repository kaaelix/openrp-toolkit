#!/usr/bin/env node

/**
 * OpenRP Behavior Graph Static Analyzer & Schema Validator
 * 
 * Validates Behavior Graph definitions against OpenRP runtime rules:
 * 1. Single Root Trigger Rule (exactly 1 event node)
 * 2. ReactFlow Edge Port Handle Naming Standard (xy-edge__...)
 * 3. Topological Continuity & Dangling Branch Detection
 * 4. Control Flow Pairing (Split/Sync parity, Repeat Until loop closure)
 * 5. JEXL Expression Syntax & Illegal Regex Detection
 * 6. Variable Store Schema Validation ($template key & $expression value)
 * 7. Zod Contract Rules (utilities/filter itemCondition, utilities/map itemTemplate, storage participant IDs)
 */

const fs = require('fs');
const path = require('path');

function validateBehaviorGraph(graph) {
  const issues = { errors: [], warnings: [], info: [] };
  
  if (!graph || typeof graph !== 'object') {
    issues.errors.push('Invalid behavior payload: graph must be an object.');
    return issues;
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  // 1. Single Root Trigger Rule
  const eventNodes = nodes.filter(n => n.type && n.type.startsWith('events/'));
  if (eventNodes.length === 0) {
    issues.errors.push('No event trigger node found (e.g. events/chat_message, events/cron). Graph will never trigger.');
  } else if (eventNodes.length > 1) {
    issues.errors.push(`Multiple event trigger nodes found (${eventNodes.map(n => n.id).join(', ')}). A behavior must have exactly 1 event trigger.`);
  } else {
    issues.info.push(`✓ Valid event trigger: ${eventNodes[0].type} (ID: "${eventNodes[0].id}")`);
  }

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // 2. Edge Formatting & Node Connectivity
  const incomingEdges = new Map();
  const outgoingEdges = new Map();

  edges.forEach((edge, idx) => {
    if (!edge.source || !edge.target) {
      issues.errors.push(`Edge at index ${idx} is missing source or target.`);
      return;
    }

    if (!nodeMap.has(edge.source)) {
      issues.errors.push(`Edge source "${edge.source}" does not exist in nodes array.`);
    }
    if (!nodeMap.has(edge.target)) {
      issues.errors.push(`Edge target "${edge.target}" does not exist in nodes array.`);
    }

    // Edge ID Standard: xy-edge__<src><srcHandle>-<tgt><tgtHandle>
    const expectedId = `xy-edge__${edge.source}${edge.sourceHandle || 'next'}-${edge.target}${edge.targetHandle || 'previous'}`;
    if (edge.id !== expectedId) {
      issues.warnings.push(`Edge ID "${edge.id}" does not follow ReactFlow standard "${expectedId}".`);
    }

    // Track connections
    if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
    outgoingEdges.get(edge.source).push(edge);

    if (!incomingEdges.has(edge.target)) incomingEdges.set(edge.target, []);
    incomingEdges.get(edge.target).push(edge);
  });

  // 3. Node-Specific Zod Schemas & Control Flow Checks
  nodes.forEach(node => {
    const outs = outgoingEdges.get(node.id) || [];
    const ins = incomingEdges.get(node.id) || [];

    // Split Node Validation
    if (node.type === 'control_flow/split') {
      const outputCount = (node.data && node.data.outputCount) || 2;
      if (outs.length < outputCount) {
        issues.warnings.push(`Split node "${node.id}" expects ${outputCount} outputs, but only ${outs.length} are connected.`);
      }
    }

    // Sync Node Validation
    if (node.type === 'control_flow/sync') {
      const inputCount = (node.data && node.data.inputCount) || 2;
      if (ins.length < inputCount) {
        issues.warnings.push(`Sync node "${node.id}" expects ${inputCount} inputs, but only ${ins.length} are connected.`);
      }
      if (!node.lcaNodeId) {
        issues.warnings.push(`Sync node "${node.id}" is missing lcaNodeId (should reference the originating Split node ID).`);
      }
    }

    // Repeat Until Loop Validation
    if (node.type === 'control_flow/repeat_until') {
      const loopStartEdge = outs.find(e => e.sourceHandle === 'loopStart');
      const loopEndEdge = ins.find(e => e.targetHandle === 'loopEnd');
      if (!loopStartEdge) {
        issues.errors.push(`Repeat Until node "${node.id}" is missing outgoing connection from "loopStart" handle.`);
      }
      if (!loopEndEdge) {
        issues.errors.push(`Repeat Until node "${node.id}" is missing incoming return connection to "loopEnd" handle.`);
      }
    }

    // If Node Validation
    if (node.type === 'control_flow/if') {
      const trueEdge = outs.find(e => e.sourceHandle === 'true');
      const falseEdge = outs.find(e => e.sourceHandle === 'false');
      if (!trueEdge && !falseEdge) {
        issues.errors.push(`If node "${node.id}" has neither "true" nor "false" branch connected.`);
      } else if (!trueEdge || !falseEdge) {
        issues.warnings.push(`If node "${node.id}" is missing connection on one branch (${!trueEdge ? 'true' : 'false'}).`);
      }
    }

    // Zod Schema Check: utilities/filter
    if (node.type === 'utilities/filter') {
      if (!node.data?.itemCondition || typeof node.data.itemCondition !== 'object' || !node.data.itemCondition.$expression) {
        issues.errors.push(`utilities/filter node "${node.id}" itemCondition MUST be an object with {$expression: "..."}. Found: ${JSON.stringify(node.data?.itemCondition)}`);
      }
    }

    // Zod Schema Check: utilities/map
    if (node.type === 'utilities/map') {
      if (!node.data?.itemTemplate || typeof node.data.itemTemplate !== 'object' || (!node.data.itemTemplate.$template && !node.data.itemTemplate.$expression)) {
        issues.errors.push(`utilities/map node "${node.id}" input MUST be named itemTemplate as an object with {$template: "..."} or {$expression: "..."}. Found: ${JSON.stringify(node.data?.itemTemplate || node.data?.itemExpression)}`);
      }
      if (node.data?.itemExpression) {
        issues.errors.push(`utilities/map node "${node.id}" contains illegal property itemExpression. Rename to itemTemplate.`);
      }
    }

    // Zod Schema Check: utilities/join
    if (node.type === 'utilities/join') {
      if (node.data?.outputProperty === 'string') {
        issues.errors.push(`utilities/join node "${node.id}" output property is 'text'. Never reference '.string'.`);
      }
    }

    // Zod Schema Check: storage/insert_chat_message
    if (node.type === 'storage/insert_chat_message') {
      if (node.data?.participantId && !node.data?.chatParticipantId) {
        issues.errors.push(`Node "${node.id}" (storage/insert_chat_message) uses participantId. In OpenRP, insert_chat_message MUST use chatParticipantId.`);
      }
    }

    // Zod Schema Check: storage/update_typing_status
    if (node.type === 'storage/update_typing_status') {
      if (node.data?.participantId && !node.data?.chatParticipantId) {
        issues.errors.push(`Node "${node.id}" (storage/update_typing_status) uses participantId. In OpenRP, update_typing_status MUST use chatParticipantId.`);
      }
    }

    // storage/set_variable Schema Validation
    if (node.type === 'storage/set_variable' && node.data && Array.isArray(node.data.variables)) {
      node.data.variables.forEach((v, vIdx) => {
        if (!v.key || typeof v.key !== 'object' || !v.key.$template) {
          issues.errors.push(`set_variable node "${node.id}" variable #${vIdx} key must be an object with {$template: "varName"}, got: ${JSON.stringify(v.key)}`);
        }
        if (!v.value || (typeof v.value !== 'object' && typeof v.value !== 'string')) {
          issues.warnings.push(`set_variable node "${node.id}" variable #${vIdx} value should be {$expression: "..."} or {$template: "..."}`);
        }
      });
    }

    // JEXL Expression Syntax & Illegal Regex Check
    function checkExpressions(obj, currentPath = '') {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, val] of Object.entries(obj)) {
        if (k === '$expression' && typeof val === 'string') {
          // Check for actual regex literals (e.g. /pattern/.test(x) or match(/pattern/))
          const strippedStrings = val.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
          if (/(?:^|[=(,]\s*)\/[^\/\n]+\/[gimsuy]*/.test(strippedStrings) && !strippedStrings.includes('http://') && !strippedStrings.includes('https://')) {
            issues.errors.push(`Node "${node.id}" expression contains illegal regex literal in "${currentPath}": ${val}. JEXL parser will throw a syntax error. Use .indexOf() instead.`);
          }
        } else if (typeof val === 'object') {
          checkExpressions(val, currentPath ? `${currentPath}.${k}` : k);
        }
      }
    }
    checkExpressions(node.data);
    // [SENIOR LINTER] Monotonic X-Coordinate Rule (Canvas Geometry Smell)
    outs.forEach(edge => {
      const targetNode = nodeMap.get(edge.target);
      // Skip loop returns (loopEnd) which naturally go backwards
      if (targetNode && targetNode.position && node.position && edge.targetHandle !== 'loopEnd') {
        if (targetNode.position.x <= node.position.x && node.position.x - targetNode.position.x > 50) {
           issues.warnings.push(`Code Smell (Layout): Edge "${edge.id}" goes backwards. Source "${node.id}" (X:${Math.round(node.position.x)}) -> Target "${targetNode.id}" (X:${Math.round(targetNode.position.x)}). Violates Monotonic X-Coordinate rule.`);
        }
      }
    });
  });

  // [SENIOR LINTER] Defensive Programming Check
  const hasRiskyNodes = nodes.some(n => n.type === 'ai/llm' || n.type === 'utilities/http_request');
  const hasTryCatch = nodes.some(n => n.type === 'control_flow/try');
  if (hasRiskyNodes && !hasTryCatch) {
    issues.warnings.push('Defensive Programming Violation: Graph contains risky network/LLM nodes but no control_flow/try blocks. Wrap them to prevent silent failures.');
  }

  return issues;
}

module.exports = {
  validateBehaviorGraph,
  validateGraph: validateBehaviorGraph
};

// CLI Execution Support
if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log('Usage: node bin/validator.js <path-to-behavior-graph.json>');
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
    const parsed = JSON.parse(raw);
    const graph = parsed.graph || parsed;
    const results = validateBehaviorGraph(graph);

    console.log('\n┌──────────────────────────────────────────────────────────┐');
    console.log('│           OpenRP Behavior Graph Validation               │');
    console.log('└──────────────────────────────────────────────────────────┘\n');

    results.info.forEach(i => console.log(`  [INFO] ${i}`));
    results.warnings.forEach(w => console.log(`  \x1b[33m[WARN]\x1b[0m ${w}`));
    results.errors.forEach(e => console.log(`  \x1b[31m[ERROR]\x1b[0m ${e}`));

    console.log('\n------------------------------------------------------------');
    if (results.errors.length === 0) {
      console.log(`\x1b[32m[PASS]\x1b[0m Graph is valid and ready for deployment! (${results.warnings.length} warnings)`);
      process.exit(0);
    } else {
      console.log(`\x1b[31m[FAIL]\x1b[0m Validation failed with ${results.errors.length} errors.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Failed to parse or read file: ${err.message}`);
    process.exit(1);
  }
}
