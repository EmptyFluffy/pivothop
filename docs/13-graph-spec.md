# PivotHop — Career Graph Spec

*The technical specification for the instrument. This replaces the radar entirely. Reference implementation: `pivothop-swiss.html` (the graph module inside the single `<script>` block). Every value here was tuned empirically and verified by DOM measurement — treat them as findings, not preferences.*

---

## What it is

A force-directed graph of career adjacency. **The origin can be any occupation in the global taxonomy** — the user's "Current role" selects it, and `ROLES`/`NEXT` are that origin's *query result* (its top-8 first-hop routes and their kids), not a fixed dataset. The reference implementation's demo dataset uses Architect as origin. The layout is count-agnostic (5–10 first hops by product rule); the demo ships 8 first-hop + 16 second-hop nodes with 34 edges in four kinds. The origin sits at center as a typographic wordmark of its name.

The user hovers to light a layer, clicks to isolate a route, and drags to rearrange. Physics runs live.

---

## Data model

Derived from the existing `ROLES` array and `NEXT` map — do not duplicate the data, derive from it.

```js
GNODES = [{id:'you', type:'you', label:'Architect', match:100}]
       + ROLES.map(r => ({id:r.id, type:'first', label:r.title, match:r.match}))
       + NEXT[pid].map((k,i) => ({id:pid+'_'+i, type:'kid', label:k.t, match:k.m, parent:pid}))
```

**Kid IDs are `parentId_index`** (`comp_0`, `comp_1`). This is load-bearing: `id.indexOf('_') > -1` is how the detail/trail code distinguishes a second-hop node and recovers its parent. Do not change the ID scheme without updating `updateTrail` and `updateDetailForId`.

### Edges — 34 total, four kinds

| Kind | Count | Source | Ideal length | Stroke |
|---|---|---|---|---|
| `primary` | 8 | `you → each first-hop`, weight = `match/100` | 150 | cobalt, `0.6 + w*0.8` |
| `kid` | 16 | `parent → each kid`, weight = `m/100` | 92 | `#7d86f2`, `0.4 + w*0.5` |
| `cross` | 6 | skill-overlap between first-hops | 240 | `--rule-2`, `0.35 + w*0.4`, solid |
| `bridge` | 4 | a kid reachable from a *second* parent | 170 | cobalt, `0.3 + w*0.4`, dash `2 3` |

**Cross-links** (hardcoded, from skill overlap):
`comp↔crt .55` · `comp↔bim .45` · `ux↔prd .70` · `bim↔int .50` · `crt↔ux .40` · `data↔urb .40`

**Bridges** (the most interesting edges in the graph — a destination reachable two ways):
`crt→comp_0 .55` · `ux→comp_1 .35` · `prd→data_0 .55` · `data→urb_0 .65`

Bridges are why the click-focus path-back rule matters: clicking a bridged kid lights *two* routes home.

### Cached label dimensions — computed once, never measured

```js
if (type === 'you')   { lblW = 108; lblH = 24; }              // wordmark clearance zone
else if (first)       { lblW = max(len*12.5*0.6, 9*9.5*0.72) + 8; lblH = 30; }
else                  { lblW = len*10.5*0.6 + 8; lblH = 16; }
```

**Never call `getBBox()` in the simulation loop.** An earlier build measured live and it caused layout thrashing, lag, and offset bugs. The text is static; the dimensions are static. The `0.72` factor on the match line is a mono-width correction (Space Mono runs wider than Grotesk).

---

## Node physics

```
REPULSE    = 3600        // pairwise, inverse-square
CENTER_GX  = 0.00045     // horizontal gravity — deliberately weaker
CENTER_GY  = 0.00105     // vertical gravity
DAMPING    = 0.86 at rest / 0.82 during drag
radius     = you: n/a (wordmark) | first: 3 + match/24 | kid: 3 (2.8 rendered)
bounds     = x ∈ [40, 860], y ∈ [36, 604]
```

**Anisotropic gravity is the fix for "the graph looks small."** Isotropic gravity settles the cloud into a circle; the stage is a landscape rectangle; the result is dead margin on both sides. Weakening horizontal gravity relative to vertical settles it into a wide ellipse that matches the container. Combined with the auto-fit viewBox below, utilization went from 56% to ~100%.

**Springs:** `f = (d - IDEAL[kind]) * (w * 0.055)`.

**The `you` node is pinned** (`fixed = true`) and is not draggable or hoverable.

---

## Auto-fit viewBox

After settling, compute the content bounding box across all nodes **and all label boxes** (not just visible ones — hover states must stay inside frame), pad 22px, set the viewBox to exactly that.

```js
viewBox = `${minX-22} ${minY-22} ${(maxX-minX)+44} ${(maxY-minY)+44}`
```

A fixed viewBox always wastes space, because force layouts settle into ellipses and viewBoxes are rectangles. Fit the frame to the content, not the content to the frame.

---

## Label physics

Every visible label is an independent physics body with `{lx, ly, lvx, lvy}`. Four forces:

**1. Spring to ideal position** — `ANCHOR = 0.09`, ideal is radially outward from graph center: `push = 52` (first-hop) / `32` (kid).

**2. Label-label collision** — axis-aligned box overlap, `PAD = 5`, resolved along the axis of *least* penetration (the shorter move, not always horizontal), push `overlap * 0.55 * 0.5` per body.

**3. Node avoidance** — circle cushion `nodeRadius + 8` for normal nodes. The `you` wordmark uses **rectangle-vs-point** with the `PILL_W/PILL_H` zone + 8px, resolved on the axis of least penetration. The center is a rectangle of text; approximating it as a circle leaves labels sitting on the letters.

**4. Edge avoidance — the important one.** For every label against **all 34 edges, unconditionally, every step** — including edges currently dimmed to invisible. This is the requirement: text must never cross a wire in any state, and a wire that's faint in one state is bright in another.

```js
// clamped projection of label center onto the segment
t = clamp01( ((px-x1)*ex + (py-y1)*ey) / (ex*ex + ey*ey) )
C = A + t*(B-A)

// true box-to-point distance: clamp C into the label's box, measure the residual
q  = clamp(C, boxMin, boxMax)
gap = |q - C|          // 0 ⇒ the line passes through the box

if (gap < 16) push label away along (labelCenter - C), magnitude (16 - gap) * 0.55
```

Measuring center-to-line instead of box-to-line is the bug that lets long labels poke a corner into a wire while their midpoint reads clear.

### Stability — the oscillation trap

A label whose ideal position sits inside a repulsion zone will hunt forever: spring pulls in, repulsion pushes out, they cancel at a small orbit, and total system energy never drops below the loop's exit threshold. Symptom: one label vibrates permanently and the animation loop never stops. Three defenses, all required:

1. **Damping `0.62`** (not 0.70 — motion must decay faster than the forces re-excite it)
2. **Velocity dead-zone** — `|v| < 0.04 → v = 0`
3. **Running-average snap** — each label tracks `lAvg = lAvg*0.85 + pos*0.15`. If deviation² `< 0.6` **and** velocity² `< 0.4` for **6 consecutive frames**, the label is orbiting an equilibrium: snap to the average, zero the velocity. Forces cancel at equilibrium, so it stays.

Plus: **hard-freeze on loop exit** (zero every velocity when the loop stops), and **reset `lAvg`/`lStable` on every state change** so labels can travel to new positions without the average dragging them back.

**Verification:** sample a label's `x`/`y` over 20 frames in every state. Interior Technologist — the worst case, dense neighborhood — measures **0.00px range**. That is the acceptance bar.

---

## State machine

Four states. `clickedNode` beats `hoveredLayer` beats default.

| | Edges | Nodes | Labels |
|---|---|---|---|
| **Default** | all at `0.15` | all at `1` | You + 8 first-hop |
| **Hover first-hop** | primary + cross `0.8`, rest `0.05` | first-hop `1` @ **1.2×**, kids `0.05` | unchanged |
| **Hover kid** | kid + bridge `0.8`, rest `0.05` | kids `1` @ **1.3×**, first-hop `0.35` | **all 25 fire at once** |
| **Click** | see below | focused `1` @ 1.35×, neighbors `1` @ 1.15×, rest `0` | focused + neighbors |

**Hovering any first-hop lights the whole first-hop layer** — not just the one under the cursor. Same for kids. The layer is the unit of attention, not the node.

### Click focus — the path back to the origin

An edge is visible iff **both endpoints are in the focused set**, where the set is `{clicked node} ∪ {origin} ∪ {direct neighbors of clicked}`.

```js
const inSet = id => id === cid || id === 'you' || nbrs[id];
if (!inSet(e.from) || !inSet(e.to)) return 0;
if (e.from === cid || e.to === cid)  return 0.88;   // direct
return 0.55;                                        // path back + context
```

Because the origin is always in the set, every primary edge from a neighbor to the origin lights automatically. **This is the feature, not a side effect** — clicking a second-hop role shows the complete route home, through both parents when the node is bridged.

Verified: clicking Design Technologist (bridged) yields `comp↔k_ct` and `ux↔k_ct` at 0.88, plus `you↔comp` and `you↔ux` at 0.55. The reading is *You → Computational Designer → Design Technologist ← UX Designer ← You*.

Two tiers so the eye still leads with the clicked node. Same principle as the ink hierarchy.

**Click focus is sticky** — hover is ignored while focused. Release: same node again, background click, or undo.

---

## Rendering — persistent DOM

**Build the SVG once. Never rebuild it.** Cache references:

```js
el = { edges:{}, firstNodes:{}, kidNodes:{}, labels:{},
       labelLeaders:{}, labelTexts:{}, pill:null, labelsLayer:null }
```

State changes call `setAttribute` on existing elements; CSS transitions ease automatically. Geometry updates (physics-driven) write positional attributes every frame.

**Why this matters beyond performance:** with `innerHTML` rebuilds, (a) CSS transitions never fire — the element that would transition no longer exists, and (b) per-element `mouseleave` never fires, because the element under the cursor is destroyed mid-hover and its replacement never received `mouseenter`. That was the "sticky hover state" bug.

**Hover is therefore hit-tested mathematically**, not via element events:

```js
SVG.addEventListener('mousemove', ev => {
  const p = svgPoint(ev);
  const hit = hitTestNode(p.x, p.y);          // radius * 1.8 + 5, nearest wins
  const newLayer = hit ? (hit.type === 'first' ? 'first' : 'kid') : null;
  if (newLayer !== hoveredLayer) { hoveredLayer = newLayer; commitStateChange(); }
})
```

Immune to rebuilds by construction. `SVG.mouseleave` catches pointer exit. State only commits when the derived layer *changes* — no redundant renders.

Labels carry `pointer-events: none` so moving over a label never breaks hover on the node beneath.

---

## Animation loop

```js
tick():
  if (unfolding)  { 3 × stepNodes(0.88); updateGeometry();
                    if (nodeEnergy() < 0.5) { unfolding = false;
                                              initLabels(); 260 × stepLabels();
                                              labelsLayer.classList.remove('hidden') } }
  if (dragging)   { 4 × stepNodes(0.82) }
  3 × stepLabels()
  if (dragging)   { updateEdgeGeometry(); updateNodeGeometry() }
  updateLabels()

  continue if: dragging || labelEnergy > 0.05 || now < activityUntil
  else: zero all velocities, rafId = null
```

`ensureLoop(minMs)` extends an `activityUntil` window — state changes request 500ms so transitions and label settling overlap into one perceived motion. **At rest the loop stops and CPU is zero.**

Per frame: ~300 node-pair repulsions + 34 springs + 25 labels × (24 label pairs + 25 node avoidances + 34 edge projections) ≈ **40k float ops.** Trivial at 60fps. The lag in the old build was never the math — it was `getBBox()` forcing synchronous layout reflows inside the loop.

---

## The unfold

On page load **and** on every "Run the graph":

1. Clear focus/hover, close the detail view, reset the trail
2. `labelsLayer.classList.add('hidden')` — opacity 0, transition off
3. `seedCompressed()` — all nodes to a ~30px cluster at center
4. `unfolding = true`, start the loop
5. Physics expands the network naturally; when `nodeEnergy() < 0.5`, settle labels and fade them in over 420ms

The network visibly assembles itself out of the center wordmark. **This is what makes the search feel causal** rather than decorative — it is the one theatrical moment in the system and it is buying something real.

---

## Interaction summary

| Input | Result |
|---|---|
| Hover first-hop node | whole first-hop layer lights, kids to 0.05 |
| Hover kid node | all 16 kid labels fire, kid+bridge edges light |
| Mouse out | clean teardown to default |
| Click node (< 5px movement) | sticky focus + rail swaps to detail + trail + rail highlight |
| Click same node / background / undo | release to default |
| Drag node (> 5px) | live physics, 1.25× size cue, coast on release |
| Rail item click | same as node click |
| Run the graph | full unfold + no-overshoot scroll |

---

## Acceptance criteria

Verify by DOM measurement, not by eye. These all passed in the reference build:

- [ ] 34 edges, 8 first-hop nodes, 16 kid nodes, 24 label groups in the DOM
- [ ] Zero `getBBox()` calls in the JS
- [ ] Default: edge `stroke-opacity` = `0.15`, 8 first-hop labels visible
- [ ] Hover first-hop: kid opacity = `0.05`
- [ ] Hover kid: 25 labels visible
- [ ] Hover out: returns to default (no sticky state)
- [ ] Click: only focused + neighbors non-zero; path-back edges present at `0.55`
- [ ] Click a bridged kid: **both** parents' primary edges to origin are visible
- [ ] Any label, any state, 20 frames: **0.00px** position range
- [ ] Loop stops at rest (`rafId === null`)
- [ ] viewBox tightly fits content (~100% utilization, not 56%)
- [ ] Run the graph: band top lands flush with sticky search bottom; second click = no-op
- [ ] The persistent-DOM check: the same element reference survives two different hovers

---

## Porting notes

The reference is vanilla ES5-ish JS in one IIFE with no dependencies. It is production-shaped, not throwaway.

If moving to React: the physics and label state must live **outside** React (a ref or a plain module), with the DOM written imperatively as it is now. Reconciling 25 nodes × 34 edges per frame through the virtual DOM will reintroduce exactly the thrashing this design eliminates. React can own the rail, the detail view, the trail, and the page — not the canvas.

Do not reach for D3-force. The physics here is ~60 lines, tuned to this specific graph, and the label-clearance system is the hard part — D3 doesn't solve it either.
