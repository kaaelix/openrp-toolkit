# OpenRP Behavior Graph Visual Spatial Layout Reference

This document defines the spatial positioning standards and coordinate layout algorithms for OpenRP Behavior Graphs to ensure clean, untangled, and readable DAG visualizations.

---

## 1. Core Visual ReactFlow Invariants

1. **Port Direction Standard**:
   - **Input Ports (`previous`, `in1`, `in2`, `loopEnd`)**: Located on the **LEFT** side of each node.
   - **Output Ports (`next`, `out1`, `out2`, `true`, `false`, `loopStart`, `error`)**: Located on the **RIGHT** side of each node.
2. **Monotonic X-Coordinate Rule ($X_{\text{target}} > X_{\text{source}}$)**:
   - To prevent cables from looping 180° backward around node bodies, **every downstream node must be positioned to the right of its upstream source node ($X \ge X_{\text{prev}} + 300$)**.
   - Backward loops (where $X_{\text{target}} \le X_{\text{source}}$) cause ReactFlow bezier curves to cross over node bodies and appear tangled or disconnected.
3. **Execution Continuity Guarantee ("Tidak Terpotong")**:
   - Every execution path must reach a terminal delivery node (`storage/insert_chat_message`, `storage/broadcast_failed_chat_message`).
   - Every typing activation (`storage/update_typing_status: isTyping = true`) must have a corresponding deactivation (`isTyping = false`) on all terminal branches.

---

## 2. The 4 Official Layout Styles

### Style A: Pure Linear Pipeline (`linear`)
* **Best For**: Sequential roleplay bots, linear story pipelines, direct prompt-to-response generation.
* **Coordinate Formula**:
  $$X_i = 50 + i \times 350, \quad Y_i = 150$$
* **Visual Effect**: A perfectly straight horizontal pipeline where cables connect smoothly from right output to left input without any vertical slope or bend.

---

### Style B: Symmetrical Diamond / Fork-Join (`diamond`)
* **Best For**: Concurrent vector search, parallel lore & user memory ingestion, or dual-path combat processing.
* **Coordinate Scheme**:
  * Shared Ingestion Nodes (Event, GetChat): $X = 0 \to 700, Y = 250$
  * Top Parallel Lane (e.g. Lorebook Vector Query): $X = 1050 \to 1750, Y = 110$
  * Bottom Parallel Lane (e.g. User History & State): $X = 1050 \to 1750, Y = 390$
  * Barrier Sync / Join Nodes (`control_flow/sync`): $X = 2100, Y = 250$
  * Inference & Delivery (`ai/llm`, `insert_chat_message`): $X = 2450 \to 3150, Y = 250$
* **Visual Effect**: Splits into an elegant top and bottom diamond shape and cleanly merges back into the center line with graceful bezier curves.

---

### Style C: Hierarchical Functional Waterfall (`waterfall`)
* **Best For**: Large-scale complex architectures (15+ nodes) with distinct lifecycle stages.
* **Tiered Y-Offset Scheme**:
  * **Tier 1 (Ingestion & Events)**: $Y = 100$
  * **Tier 2 (Transformation & Memory RAG)**: $Y = 240$
  * **Tier 3 (Reasoning, LLM & Control Flow)**: $Y = 380$
  * **Tier 4 (Delivery & Cleanup)**: $Y = 520$
  * **Horizontal Step**: $X_i = 50 + i \times 320$
* **Visual Effect**: Stepwise diagonal progression from top-left to bottom-right, visually separating data collection from reasoning and message delivery.

---

### Style D: Scoped Block / Error Boundary Layout (`scoped`)
* **Best For**: Robust production graphs with `control_flow/try` or `control_flow/repeat_until`.
* **Coordinate Scheme**:
  * Container Node (`try` / `repeat_until`): $X = K \times 350, Y = 150$
  * Main Success Path (Inner Block): $X = (K + 1 \dots K + M) \times 350, Y = 150$
  * Fallback / Error Lane: $X = (K + 1 \dots K + M) \times 350, Y = 350$ (Lower horizontal track)
  * Final Convergence & Typing Stop: $X = (K + M + 1) \times 350, Y = 250$
* **Visual Effect**: Main flow continues horizontally across the top, while error and fallback routes remain cleanly visible in the lower lane without intersecting.
