// lib/mermaid_renderer.js
function renderGraphToMermaid(graph) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Invalid graph format. Needs nodes and edges arrays.');
  }

  let mermaid = 'graph LR\n';

  graph.nodes.forEach(node => {
    if (node.id == null) return;
    const cleanId = String(node.id).replace(/[^a-zA-Z0-9_-]/g, '');
    let customData = '';
    
    if (node.data?.prompt) customData = node.data.prompt;
    else if (node.data?.text) customData = node.data.text;
    
    if (customData) {
      let strData = String(customData).replace(/"/g, "'");
      if (strData.length > 30) {
        strData = strData.substring(0, 30) + '...';
      }
      customData = ' ' + strData;
    }
    
    let nodeType = node.type || 'unknown_type';
    mermaid += `    ${cleanId}["[${nodeType}]${customData}"]\n`;
  });

  graph.edges.forEach(edge => {
    if (edge.source == null || edge.target == null) return;
    const src = String(edge.source).replace(/[^a-zA-Z0-9_-]/g, '');
    const tgt = String(edge.target).replace(/[^a-zA-Z0-9_-]/g, '');
    const label = edge.sourceHandle ? `|${edge.sourceHandle}|` : '';
    mermaid += `    ${src} -->${label} ${tgt}\n`;
  });

  return mermaid;
}

module.exports = { renderGraphToMermaid };
