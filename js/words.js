// ============================================================
//  WORDS — the nature word bank players draw from
// ============================================================
'use strict';

const NATURE_WORDS = [
  // Nature nouns
  'forest', 'meadow', 'river', 'brook', 'pond', 'mountain', 'valley', 'glade',
  'thicket', 'grove', 'hollow', 'ridge', 'cliff', 'cavern', 'orchard', 'marsh',
  'bramble', 'thorn', 'fern', 'moss', 'lichen', 'bark', 'bough', 'branch',
  'leaf', 'leaves', 'petal', 'pollen', 'seed', 'sprout', 'root', 'stem',
  'blossom', 'flower', 'wildflower', 'clover', 'daisy', 'violet', 'rose', 'iris',

  // Sky / weather
  'cloud', 'sky', 'sun', 'sunlight', 'sunbeam', 'sunset', 'sunrise', 'dawn',
  'dusk', 'twilight', 'moonlight', 'starlight', 'stars', 'rain', 'mist', 'fog',
  'breeze', 'wind', 'thunder', 'rainbow', 'frost', 'dew', 'snow', 'shadow',

  // Animals
  'owl', 'sparrow', 'wren', 'thrush', 'finch', 'robin', 'crow', 'heron',
  'fox', 'deer', 'fawn', 'rabbit', 'hare', 'mouse', 'mole', 'badger',
  'squirrel', 'beetle', 'firefly', 'dragonfly', 'butterfly', 'moth', 'spider', 'cricket',

  // Verbs
  'whispers', 'dances', 'drifts', 'wanders', 'tumbles', 'cradles', 'shimmers', 'glimmers',
  'rustles', 'sighs', 'curls', 'unfurls', 'opens', 'closes', 'rises', 'falls',
  'gathers', 'scatters', 'wraps', 'binds', 'spins', 'weaves', 'breathes', 'sings',
  'hums', 'echoes', 'leaps', 'glides', 'soars', 'creeps', 'sleeps', 'wakes',
  'remembers', 'forgets', 'returns', 'softens', 'sharpens', 'darkens', 'brightens',

  // Adjectives
  'golden', 'silver', 'silken', 'velvet', 'amber', 'emerald', 'crimson', 'azure',
  'tender', 'gentle', 'fragile', 'patient', 'lonely', 'restless', 'wild', 'tame',
  'bright', 'dim', 'pale', 'deep', 'shallow', 'narrow', 'vast', 'tiny',
  'tangled', 'tousled', 'crooked', 'twisted', 'tilted', 'hidden', 'forgotten', 'remembered',
  'hushed', 'quiet', 'silent', 'humming', 'shimmering', 'glowing', 'fading', 'flickering',
  'dappled', 'speckled', 'mottled', 'feathered', 'leafy', 'mossy', 'thorny', 'thirsty',

  // Sensory / sound
  'whisper', 'rustle', 'sigh', 'creak', 'patter', 'hum', 'echo', 'silence',

  // Emotion / abstract
  'wonder', 'longing', 'memory', 'hope', 'sorrow', 'joy', 'patience', 'wildness',

  // Connectives & little words
  'and', 'but', 'or', 'when', 'while', 'where', 'until', 'after', 'before',
  'with', 'beneath', 'above', 'beside', 'between', 'across', 'inside', 'outside',
  'through', 'into', 'under', 'over', 'around', 'among',
  'the', 'an', 'each', 'some', 'every',

  // Pronouns & small
  'her', 'his', 'their', 'its', 'our', 'we', 'they', 'them',

  // Phrases — feel poem-y
  'like a feather', 'like the dawn', 'like soft breath', 'as still as stone',
  'as bright as stars', 'soft as snow', 'old as wind', 'thin as silk',
  'one cool evening', 'one slow morning', 'all at once', 'far away',
  'on a green hill', 'in the garden', 'through the trees',
];
