// ============================================================
//  CONFIG — game-wide constants, levels, themes, state
// ============================================================
'use strict';

const GAME_W = 960;
const GAME_H = 540;

const PHYS = {
  GRAVITY: 1100,
  MOVE_MAX: 230,
  MOVE_ACCEL: 1400,
  JUMP_POWER: 520,
  DOUBLE_JUMP_POWER: 460,
  FRICTION_AIR: 0.92,
  FRICTION_GROUND: 0.78,
  THROW_VEL_X: 540,
  THROW_VEL_Y: -130,
  THROW_GRAVITY: 750,
};

// ----- YEATS LINE — the spine of the golden shovel -----
const YEATS_LINE = ['I', 'have', 'wrapped', 'my', 'dreams', 'in', 'a', 'silken', 'cloth'];
const YEATS_FULL_LINE = "I have wrapped my dreams in a silken cloth";
const YEATS_POEM_TITLE = "He Wishes For The Cloths Of Heaven";
const YEATS_AUTHOR = "W. B. Yeats";

// ----- LEVELS — one per Yeats word -----
const LEVELS = [
  { num: 1, endWord: 'I', title: 'The Mossy Hollow',
    subtitle: 'Where the shovel finds its first weight',
    intro: 'Mr. Bananagram steps into a green hollow at dawn. The first end-word is the smallest one — the speaker themself. Find your footing.',
    bossName: 'The Bramble Sentinel', theme: 'mossy_dawn' },
  { num: 2, endWord: 'have', title: 'Riverbank Reeds',
    subtitle: 'Possession is a heavy verb',
    intro: 'Reeds whisper. The river carries. Cross the water on shifting platforms and discover what it means to "have" something — a word you must own at line\'s end.',
    bossName: 'The Reed Reaver', theme: 'riverbank' },
  { num: 3, endWord: 'wrapped', title: 'The Twisting Thicket',
    subtitle: 'Vines wind themselves around words',
    intro: 'Branches knot above your head. Vines swing in the wind. To wrap is to enclose, to bind. Find the word that is itself a coiling.',
    bossName: 'The Thorn Wrappling', theme: 'thicket' },
  { num: 4, endWord: 'my', title: 'The Owl Glade',
    subtitle: 'Mine, says the night',
    intro: 'Stars wake first. The smallest word — "my" — opens the largest claim. Possessing nothing, you possess everything.',
    bossName: 'The Hush-Owl', theme: 'owl_glade' },
  { num: 5, endWord: 'dreams', title: 'The Drifting Pollen Pass',
    subtitle: 'Where waking forgets its name',
    intro: 'Golden pollen drifts in slow currents. Platforms float and crumble. Every step is half a dream.',
    bossName: 'The Pollen Drifter', theme: 'pollen_pass' },
  { num: 6, endWord: 'in', title: 'The Sunken Roots',
    subtitle: 'Going under, going through',
    intro: 'Below the forest floor, roots make a cathedral. To be in is to be inside something — find your way through the spike-lined dark.',
    bossName: 'The Root Devourer', theme: 'sunken_roots' },
  { num: 7, endWord: 'a', title: 'The Wildflower Meadow',
    subtitle: 'A small word for a wide field',
    intro: 'A single article — "a" — opens a meadow of possibility. Whatever follows it is brand new, unspecified, full of wonder.',
    bossName: 'The Meadow Mantis', theme: 'meadow' },
  { num: 8, endWord: 'silken', title: 'The Spider\'s Veil',
    subtitle: 'Soft is also strong',
    intro: 'Webs catch the morning light like silk. Saws spin where the silk is torn. Find the word "silken" — softness that holds.',
    bossName: 'The Silken Weaver', theme: 'silken_veil' },
  { num: 9, endWord: 'cloth', title: 'The Loom of the Wood',
    subtitle: 'The final fabric folds in',
    intro: 'The forest reveals its loom: every leaf a thread, every breeze a shuttle. The last word ties the dream-cloth shut.',
    bossName: 'The Loom-Weaver', theme: 'loom' },
];

// ----- THEMES — palette per level -----
const THEMES = {
  mossy_dawn:   { sky: ['#3d4f2a','#6e8b3d','#a8b97a'], ground: 0x3a5230, groundTop: 0x6a8a3a, accent: 0xc4d97a, dust: 0xc4d97a },
  riverbank:    { sky: ['#3d6a8a','#7aaac4','#c8e4d4'], ground: 0x3a5a4a, groundTop: 0x6a9a7a, accent: 0xa4d8c4, dust: 0xc4e4d4, water: true },
  thicket:      { sky: ['#1f2d1a','#3a4d2a','#6a7a4a'], ground: 0x2a3a20, groundTop: 0x4a5a30, accent: 0xa8c038, dust: 0x88a830 },
  owl_glade:    { sky: ['#0d1430','#1a234a','#3a3d6a'], ground: 0x1a2030, groundTop: 0x3a3a5a, accent: 0xb8b0e0, dust: 0xd4d0e8, stars: true },
  pollen_pass:  { sky: ['#7a4a2a','#c48a3a','#e8c478'], ground: 0x6a4a2a, groundTop: 0xa48538, accent: 0xf4d870, dust: 0xf4e090 },
  sunken_roots: { sky: ['#1a0d1f','#2d1a30','#4a2d4a'], ground: 0x2a1a2a, groundTop: 0x4a3a4a, accent: 0x8a6a4a, dust: 0xa48a6a },
  meadow:       { sky: ['#5a8ab4','#a4d0e0','#f0e8c4'], ground: 0x4a6a3a, groundTop: 0x7aa84a, accent: 0xe89ab4, dust: 0xf4d870 },
  silken_veil:  { sky: ['#4a3a5a','#7a6a8a','#c4b8d0'], ground: 0x3a3045, groundTop: 0x6a5a7a, accent: 0xe0d8e8, dust: 0xf0e8f0 },
  loom:         { sky: ['#3a2a1a','#7a5a3a','#d4a878'], ground: 0x4a3a2a, groundTop: 0x8a6a4a, accent: 0xd4a437, dust: 0xf4d890 },
};

// ----- GAME STATE — mutable, lives across scenes -----
const GAME = {
  levelIdx: 0,
  hp: 3,
  maxHp: 3,
  wordBank: [],
  availableWordPool: [],
  poemLines: Array(9).fill(null),
  currentLineWords: [],
  invincibleUntil: 0,
  muted: false,
};

// helpers
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function takeWordFromPool() {
  if (GAME.availableWordPool.length === 0) {
    GAME.availableWordPool = shuffleArr(NATURE_WORDS);
  }
  return GAME.availableWordPool.pop();
}

function resetGame() {
  GAME.levelIdx = 0;
  GAME.hp = GAME.maxHp;
  GAME.wordBank = [];
  GAME.availableWordPool = shuffleArr(NATURE_WORDS);
  GAME.poemLines = Array(9).fill(null);
  GAME.currentLineWords = [];
  GAME.invincibleUntil = 0;
}
