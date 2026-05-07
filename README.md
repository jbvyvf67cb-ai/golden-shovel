# Mr. Bananagrams 3: The Golden Shovel of Nature

A browser-based educational platformer that teaches the **golden shovel** form of poetry. Players run, jump, and fight their way through nine themed nature levels — and at each boss, hits unlock the chance to add words to a poem whose lines must end with the words of W. B. Yeats's "I have wrapped my dreams in a silken cloth."

Built with [Phaser 3](https://phaser.io). All sprites are generated programmatically; the only external dependency is the Phaser library, loaded from a CDN.

## Run locally

Just open `index.html` in a modern browser, or serve the folder with any static server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this folder (with `index.html` at the root) to a GitHub repo.
2. In **Settings → Pages**, set the **Source** to `main` branch, root folder.
3. Wait a minute, then visit `https://<username>.github.io/<repo-name>/`.

Everything is plain static files — no build step required.

## File layout

```
.
├── index.html              ← page shell + DOM overlays
├── css/
│   └── style.css           ← all visual styling
└── js/
    ├── config.js           ← constants, levels, themes, GAME state
    ├── words.js            ← nature word bank (~200 words)
    ├── audio.js            ← SFX + procedural ambient music
    ├── input.js            ← touch + keyboard handling
    ├── textures.js         ← BootScene: programmatic sprite generation
    ├── obstacles.js        ← reusable obstacle factories (platforms, saws, vines, etc.)
    ├── boss.js             ← boss controller (shield cycle, projectiles)
    ├── play.js             ← main PlayScene (level building, player, enemies)
    ├── overlays.js         ← DOM overlay logic (title, compose, final poem)
    └── main.js             ← bootstrap + button wiring
```

Scripts are loaded in the order shown in `index.html`. Each file is plain ES5/ES6 — no modules, no bundler.

## Controls

- **Move:** Arrow keys / `A` `D` / on-screen ◀ ▶ buttons
- **Jump (and double-jump):** `↑` / `W` / Space / on-screen ▲ button
- **Throw shovel:** `X` / `J` / on-screen ⛏ button
- **Mute/unmute:** 🔊 button (top-right)

## Reusable obstacle module

`js/obstacles.js` is designed to be dropped into other Phaser 3 platformers. It exports two namespaces:

- `Obstacles.platform / crumble / mover / oneWay / saw / vine / spikePit` — factories that take a scene reference and create the obstacle
- `ObstaclesUpdate.crumbles / movers / saws / vines` — per-frame helpers to call from `update()`

The scene must define the appropriate physics groups (`platforms`, `crumbles`, `movers`, `oneWayGroup`, `spikes`, `saws`) and a `vines` array; see the comment block at the top of `obstacles.js` for the contract.

## Credits

After W. B. Yeats, *He Wishes For The Cloths Of Heaven*.
