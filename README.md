# Arena of Time

A 3D hand-to-hand fighting game that runs in the browser. Two fighters are locked in a hexagonal cage in the middle of a sold-out arena (about 17,000 spectators are rendered). Punch, kick and grapple until the other fighter is **knocked out** or **taps out** of a submission hold — and spend blue **mana** to slow time for precise strikes and parries.

## Run it

It is a static site with no build step. Serve the folder and open it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. (Opening `index.html` straight from disk will not work, because browsers block ES modules on `file://`.)

## Controls

### Player 1 — keyboard + mouse

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Move around the cage (relative to the camera) |
| Mouse pointer | Aim at the opponent's **head, body or legs** — sets where you strike and where you block |
| Left click | Power cross (aimed) |
| Right click | Roundhouse kick (aimed) |
| `F` / `R` | Quick jab / push kick |
| `Shift` (hold) | Block the zone you are aiming at |
| `Space` | Dash toward the mouse pointer (brief dodge) |
| `E` | Grapple. In the clinch: `F` knees, `R` throw, `E` submission hold |
| `Q` | Toggle **Focus** (slow time) |
| `Esc` | Pause / move list |

### Player 2 — keyboard (2-player mode)

Arrow keys move, `J` jab, `K` push kick, `Y` power cross, `H` roundhouse, `L` grapple, `O` block, `U` Focus, `Enter` dash, hold `I` / `M` to aim high / low.

### Special and advanced attacks

`←` means away from your opponent, `→` toward them.

| Input | Move |
| --- | --- |
| `←` `→` `F` | Special 1 |
| `S` `W` `R` | Special 2 |
| `→` `←` `→` + Left click | Signature **advanced** attack — the most damage, the hardest to land |
| `S` `S` + Right click | **Time Breaker** — advanced, only during Focus, costs 20 mana, unblockable |

## How it plays

- **Life bar** — empty it for a knockout. Best of three rounds, 99 seconds each.
- **Submission** — grapple, then choose the hold. Both players mash; the more hurt the victim is, the faster they tap.
- **Blocking** — a block only fully stops attacks aimed at the zone being guarded. Grapples go through blocks.
- **Focus (mana)** — time slows for everyone, but a focused fighter moves about twice as fast as an unfocused one, gains *Precision* damage, and turns a well-timed correct-zone block into a *Parry* that stuns the attacker. Vision tunnels in on the opponent the longer Focus is held. If both fighters Focus, neither has a speed edge. When Focus ends the fighter is *fatigued* and slower for a moment. Mana refills slowly.

## Fighters

| Fighter | Style | Illegal edge |
| --- | --- | --- |
| **Eric** | Balanced, buff American kid | None — fights clean. Faster mana recovery and a once-per-round Second Wind |
| **Shredder** | Scrawny, fast, frightening | Retractable knuckle spikes: punches cause bleeding |
| **Titan** | 7'6", huge power, slow | Weighted glove inserts: punches crush through blocks |
| **Ragnar** | Viking berserker | Hits harder as his health drops; specials cannot be interrupted |
| **Mr. Smiles** | Psychotic clown | Gains mana when hit; a glove sprays an irritant that blurs your vision |
| **El Diablo Rojo** | Matador, elegant counters | Rigid-framed cape: his block covers every zone |
| **Osaka** | 500 lb sumo | Hydraulic belt: throws and submissions are 60% stronger; signature body crush |
| **Kyoto** | Masked assassin | Dodge is a teleport; wired mask sometimes auto-corrects his guard |

## Tech notes

- Rendering: [three.js](https://threejs.org) r160 (vendored in `vendor/`, MIT licence).
- Graphics quality steps down automatically on slow machines; force a level with `?q=0` (lowest) to `?q=3`.
- In-ring fighters are procedural jointed models animated from a pose library (`src/anim.js`, `src/fighterModel.js`); no external art assets are required.
- Sound is synthesised with WebAudio.
- Character portraits (select screen, HUD, pre-fight splash) are AI-generated images in `assets/portraits/`. To replace one, drop a JPEG at `assets/portraits/<id>.jpg` (`eric`, `shredder`, `titan`, `ragnar`, `smiles`, `diablo`, `osaka`, `kyoto`).

| File | Purpose |
| --- | --- |
| `src/main.js` | Boot, menus, camera, frame loop |
| `src/match.js` | Rounds, time dilation, hit resolution, clinch / throws / submissions |
| `src/fighter.js` | Per-fighter state machine and movement |
| `src/characters.js` | Roster stats and move data |
| `src/ai.js` | CPU opponent |
| `src/input.js` | Keyboard / mouse and combo detection |
| `src/arena.js` | Cage, arena bowl, crowd, lighting |
