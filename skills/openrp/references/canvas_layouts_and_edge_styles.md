# Canvas Layouts & Edge Styling Reference

This guide provides options for customizing OpenRP Behavior Graph **visual geometry layouts** and **ReactFlow edge wire styling** so developers and users can tailor graphs to their aesthetic preferences instead of plain linear lines.

---

## 1. Five Visual Geometry Layout Styles

Developers and users can choose from 5 visual layout modes depending on graph complexity:

```
1. SNAKE / S-CURVE (Compact Grid)
[Node 1] ──> [Node 2] ──> [Node 3] ──> [Node 4]
                                          │
[Node 8] <── [Node 7] <── [Node 6] <── [Node 5]
   │
[Node 9] ──> [Node 10] ──> [Node 11]

2. DIAMOND / HIERARCHICAL FORK-JOIN
                   ┌──> [Branch A (Upper)] ──┐
[Trigger] ──> [Split]                        ├──> [Sync] ──> [LLM]
                   └──> [Branch B (Lower)] ──┘

3. BENTO BOX / MODULAR CLUSTERS
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Ingestion Hub   │  │ Semantic RAG    │  │ LLM Engine      │
│ [Msg] ──> [Chat]│  │ [Embed]──>[Lore]│  │ [LLM]──>[Stream]│
└─────────────────┘  └─────────────────┘  └─────────────────┘

4. CYBERPUNK WAVE (Alternating Sine Wave)
[Node 1]          [Node 3]          [Node 5]
    ╲                ╱  ╲                ╱
     ╲              ╱    ╲              ╱
      [Node 2] ────┘      [Node 4] ────┘

5. RADIAL / GALAXY ORBIT
               [Character A]
                     ▲
                     │
    [Lore RAG] ── [Master Hub] ── [Image Gen]
                     │
                     ▼
               [Character B]
```

---

## 2. ReactFlow Edge Aesthetics & Animated Data Wires

OpenRP edges support ReactFlow custom styling properties:

```json
{
  "id": "xy-edge__generateReplynext-insertMessageprevious",
  "source": "generateReply",
  "sourceHandle": "next",
  "target": "insertMessage",
  "targetHandle": "previous",
  "type": "smoothstep",
  "animated": true,
  "style": {
    "stroke": "#3b82f6",
    "strokeWidth": 2
  }
}
```

### Color Coding Conventions:
* 🔵 **Primary Control Flow (`#3b82f6`)**: Standard execution flow (`next` $\to$ `previous`).
* 🟢 **Success Branches (`#10b981`)**: True/Success paths (`true` on `if`, `success` on `try`).
* 🔴 **Error / Fallback Branches (`#ef4444`, dashed)**: False/Error paths (`error` on `try`, `false` on `if`).
* 🟣 **Parallel Branches (`#8b5cf6`)**: Multithreaded execution (`out1`, `out2` on `split` $\to$ `in1`, `in2` on `sync`).
* 🟡 **Vector RAG Wires (`#f59e0b`)**: Context & semantic embeddings transport.

---

## 3. Automated Layout Utility

Use the built-in layout styler tool in `openrp-toolkit`:

```javascript
const { styleGraph } = require('./bin/layout_styler.js');

// Available styles: 'snake', 'diamond', 'bento', 'wave'
const styledGraph = styleGraph(rawGraph, 'snake', true);
```
