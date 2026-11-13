# Room Twin

Interactive, to-scale 3D/2D digital twin of the room, reconstructed from the floor-plan sketch and the
16 photographs in `the private reference collection`. Move, rotate, resize, recolour, duplicate and delete furniture;
walk through the room; compare your layout with the original.

## Run

```bash
cd ~/data/office
npm install        # first time only
npm run dev        # → http://127.0.0.1:9999/
```

`npm run build` type-checks and creates a production bundle in `dist/` (`npm run preview` serves it on port 4173).
Needs Node 24+ and a browser with WebGL 2.

## Using it

| Action | How |
| --- | --- |
| Orbit / pan / zoom | left-drag / right-drag (or Ctrl-drag) / wheel |
| Select, move | click furniture, drag it (3D or 2D) |
| Rotate | drag the round knob (5° steps, Shift 45°, Alt free), `R` / `Shift+R` ±15°, or type the angle |
| Precise edit | inspector on the right: X/Z, rotation, elevation, W/D/H in cm; arrow keys nudge 1 cm (Shift 10 cm) |
| Snapping | `G` 10 cm grid, `W` wall snapping; hold Alt while dragging to bypass |
| Duplicate / delete / hide | `Ctrl+D` / `Delete` / `H` |
| Undo / redo | `Ctrl+Z` / `Ctrl+Y` |
| Views | `1` 3D, `2` 2D plan, `3` split; `T` top, `I` isometric, `Home` reset, eye menu = photo viewpoints |
| Walk-through | `F`, then WASD + mouse (Shift = faster, Esc = leave); walls and furniture block you |
| Measure | `M`, click two points (3D or 2D) |
| Original ↔ my layout | `O` (original is read-only); "Restore" in the inspector resets one object |
| Lighting | `L` evening (as photographed) / daylight through the two windows |
| Save | automatic (browser localStorage); `Ctrl+S` exports JSON, toolbar imports it; `P` saves a PNG of the 3D view |

Placements that overlap a wall or another object are outlined red; with "Block overlaps" on (default) the
object returns to its last free position when dropped.

URL helpers: `?view=door|sofa|stove|living|tv|window|wardrobe|bed|frombed|kitchen` starts at a photo viewpoint,
`?ui=0` hides the interface, `?light=day|evening`.

## Structure

```
src/data/        room.ts (walls, openings – permanent architecture), catalog.ts (furniture types, sizes,
                 sources, confidence), originalLayout.ts (photographed arrangement), referenceViews.ts
src/state/       store.ts (Zustand: one item list shared by 2D and 3D, history, persistence), editing.ts
src/lib/         geometry.ts (collisions, snapping, clearances), textures.ts + materials.ts (procedural PBR)
src/three/       Scene, RoomShell (architecture), Lighting, CameraRig (orbit/fly-to/walk), FurnitureLayer
                 (selection + dragging), Overlays, furniture/* (one parametric model per furniture type)
src/two/         FloorPlan2D.tsx (Konva plan editor)
src/ui/          Toolbar, ObjectPanel, Inspector, Help, shortcuts
```

Coordinates: 1 unit = 1 m. `x` runs along the straight sofa wall (0 = kitchen/door wall, 7.20 = bed wall),
`z` across the room (0 = sofa wall, towards the windows), `y` up.

Stack: React 19, TypeScript, Vite, three.js 0.176, React Three Fiber, drei, postprocessing (N8AO ambient
occlusion, bloom, tone mapping), Zustand, react-konva, Tailwind CSS 4, lucide icons.
Deviations from the suggested stack: no Rapier (collisions are exact 2D rectangle tests shared by both
editors, which is simpler and deterministic) and no shadcn/ui (a handful of small Tailwind components instead).
three.js is pinned to 0.176 because the ambient-occlusion pass does not work with 0.187.

## Reconstruction: what is measured, what is estimated

**Measured (your sketch):** room length 720, kitchen-end wall 295, middle width ≈ 230 (model: 233.5);
kitchenette 190 × 63, fridge 52 × 52, sofa 180 × 80, wardrobe 115 × 55, bed 170 × 200, chest of drawers
60 × 40, coffee table 100 × 50, and the order of everything along the walls.

**Changed on purpose:** the bed-end wall is 172 cm instead of "cca 160" – a 170 cm bed standing wall to wall
(photo 203151) cannot fit into 160.

**Estimated from photographs (medium confidence):** ceiling height 2.60 m; door 80 × 200 at the sofa-wall
corner; both windows (sill 82 cm, head 220 cm, positions ±15 cm); all furniture heights; kitchen cabinet
split; stove body 40 × 38 × 88 and flue route; TV ≈ 43″ on a swivel arm; wall cabinets, fan, basket, picture.
Every object's source and confidence is shown in the inspector ("Reconstruction notes").

## Validation

Each of the ten viewpoints in `referenceViews.ts` was rendered in a real browser (headless Chrome) and
compared side by side with its photograph over several correction rounds, plus one independent critic pass.
Interactions were exercised with scripted mouse/keyboard input: click-select, 3D and 2D dragging, wall
snapping, blocked overlaps, rotate, nudge, duplicate, delete, undo/redo, measuring, persistence across reload,
JSON export/import, walk mode entry/exit. Walk collision was checked numerically.
Not verified: frame rate on a real GPU (the test browser renders in software at ~1 fps) and pointer-lock
mouse look (unavailable headless; drag-to-look is the fallback).

## Known remaining differences

- Camera positions of the photo viewpoints are estimates; framing differs from the photos.
- Coffee table: the sketch puts it ~50 cm from the window wall, the photos suggest closer; the model uses 30 cm.
- Windows: exact widths/sill height are uncertain (always behind curtains). The dark panel next to the bed in
  photo 203200 could be an opened window sash – not modelled.
- Curtains, bedding, sofa throw and pillows are simplified shapes, not cloth simulations; curtains are fixed.
- The canvas picture is an abstract black-and-white stand-in, and its size (50 × 38) is a guess.
- Folding stools are an approximation (low confidence). Slippers, cables, items under the bed, hallway
  contents and the lint roller are omitted.
- Stove flue moves with the stove; in reality the wall thimble is fixed.
- Stacked items are independent: moving the fridge leaves the microwave where it is.
- Kitchen sink is rectangular (real one has rounded corners); sink/hob positions are approximate.
- Lighting is two point lights plus ambient fill – softer and flatter than the photos, no global illumination.
- Floor is modelled as 19 cm 3-strip laminate from the photos; plank format not measured.

## Security

This is a browser-only editor; layouts stay in localStorage or exported files. There are no accounts, API keys or server-side storage. Imported layouts are limited to 1 MB and 200 items, with validated types, bounded dimensions and unique IDs. Do not put credentials in frontend code or VITE_ variables.

The development server binds to loopback only. For internet hosting, serve only `dist/` over HTTPS, never the project directory or the Vite development server. Configure the host to send `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`. CI builds and audits dependencies; Dependabot proposes weekly updates. These are baseline protections, not a guarantee against every attack.

In the original managed workspace, `.git` is read-only, so Git metadata lives in `.git-local/`. Use `git --git-dir=.git-local status` (and the same prefix for other Git commands). A normal clone from GitHub uses standard Git commands.
