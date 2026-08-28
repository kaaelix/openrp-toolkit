# Visual Graph Layouts & Spatial Geometries Reference

This reference documents how to arrange OpenRP Behavior Graph nodes on the visual 2D canvas using custom **spatial coordinate geometries (`position: { x, y }`)** to prevent long linear graphs and make complex workflows clean and readable.

---

## 1. What OpenRP Supports on the Canvas

1. **Node Spatial Positioning (`position: { x: number, y: number }`)**:
   * **100% Supported**: Every node has `position.x` and `position.y` stored directly in the behavior graph JSON.
   * OpenRP's web editor places each node on the 2D canvas exactly at these coordinates.
   * By customizing coordinates, we can arrange graphs in **Snake / S-Curve Grids**, **Diamond Fork-Joins**, **Bento Clusters**, or **Sine Waves**.
2. **ReactFlow Edge Wires**:
   * OpenRP uses standard ReactFlow Bezier curved lines to connect ports based on `source`, `target`, `sourceHandle`, and `targetHandle`.
   * Custom CSS stroke colors or external animation flags are managed by OpenRP's global canvas theme.

---

## 2. Four Proven Visual Layout Geometries

### A. S-Curve / Snake Grid Layout (Recommended for 10+ Nodes)
Instead of stretching 20 nodes 4000px horizontally or 3000px vertically, nodes wrap in compact 4-column zigzag rows:

```
Row 1: [Node 1] ──> [Node 2] ──> [Node 3] ──> [Node 4]
                                                 │
Row 2: [Node 8] <── [Node 7] <── [Node 6] <── [Node 5]
          │
Row 3: [Node 9] ──> [Node 10] ──> [Node 11] ──> [Node 12]
```
* **Coordinate Formula**:
  * Even rows: `x = col * 240 + 50`, `y = row * 160 + 100`
  * Odd rows: `x = (3 - col) * 240 + 50`, `y = row * 160 + 100`

---

### B. Diamond / Hierarchical Fork-Join Layout
Ideal for workflows with parallel split and barrier sync operations (`control_flow/split` $\to$ `control_flow/sync`):

```
                   ┌──> [Branch A (Upper: y = 160)] ──┐
[Trigger] ──> [Split]                                  ├──> [Sync] ──> [LLM]
                   └──> [Branch B (Lower: y = 440)] ──┘
```

---

### C. Bento Box / Modular Category Clusters
Organizes nodes by functional subsystems into 2D spatial quadrants:
* **Ingestion Quadrant** (`x: 50..300, y: 100..250`): `events/chat_message`, `storage/get_chat`, `utilities/filter`
* **RAG & Memory Quadrant** (`x: 350..600, y: 100..250`): `ai/generate_embeddings`, `storage/get_characters`, `storage/get_lores`
* **LLM & State Quadrant** (`x: 650..900, y: 250..450`): `ai/llm`, `storage/set_variable`
* **Delivery Quadrant** (`x: 950..1200, y: 250..450`): `storage/insert_chat_message`, `storage/update_typing_status`

---

### D. Sine Wave Layout
Alternates nodes along a gentle mathematical wave curve:
* `x = index * 220 + 50`
* `y = 300 + Math.sin(index * 0.8) * 120`

---

## 3. Automated Layout Script

Use the toolkit layout helper:

```javascript
const { layoutGraph } = require('./bin/layout_styler.js');

// Options: 'snake', 'diamond', 'bento', 'wave'
const cleanGraph = layoutGraph(rawGraph, 'snake');
```
