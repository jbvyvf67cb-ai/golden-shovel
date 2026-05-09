// ============================================================
//  OVERLAYS — DOM-based UI (title / intros / compose / final)
// ============================================================
'use strict';

// Tracks the currently-typed line text. Refreshed every keystroke.
// On Done or timeout, we tokenize this on whitespace and store as
// GAME.currentLineWords.
let composeTypedText = '';

// Timer state for the 60-second compose window. The timer is LAZY —
// it doesn't start when the overlay opens; it starts on the player's
// first keystroke OR first chip click. Cleared on Done or auto-timeout.
let composeTimerInterval = null;
let composeSecondsLeft = 60;
let composeTimerStarted = false;
let composeOnTimeout = null;
const COMPOSE_DURATION_SECONDS = 60;

function clearComposeTimer() {
  if (composeTimerInterval) {
    clearInterval(composeTimerInterval);
    composeTimerInterval = null;
  }
  composeTimerStarted = false;
  composeOnTimeout = null;
}

function armComposeTimer(onTimeout) {
  // Stash the timeout callback but don't start counting yet.
  clearComposeTimer();
  composeSecondsLeft = COMPOSE_DURATION_SECONDS;
  composeOnTimeout = onTimeout;
  // Reset the visible display to show the full duration as a "ready" state.
  updateComposeTimerDisplay(true);
}

function ensureComposeTimerRunning() {
  if (composeTimerStarted || !composeOnTimeout) return;
  composeTimerStarted = true;
  composeSecondsLeft = COMPOSE_DURATION_SECONDS;
  updateComposeTimerDisplay();
  composeTimerInterval = setInterval(() => {
    composeSecondsLeft--;
    updateComposeTimerDisplay();
    if (composeSecondsLeft <= 0) {
      const cb = composeOnTimeout;
      clearComposeTimer();
      if (cb) cb();
    }
  }, 1000);
}

function updateComposeTimerDisplay(idle = false) {
  const el = document.getElementById('compose-timer');
  const secEl = document.getElementById('compose-timer-seconds');
  if (!el || !secEl) return;
  secEl.textContent = composeSecondsLeft;
  el.classList.remove('warning', 'urgent', 'idle');
  if (idle) {
    el.classList.add('idle');
    return;
  }
  if (composeSecondsLeft <= 10) el.classList.add('urgent');
  else if (composeSecondsLeft <= 20) el.classList.add('warning');
}

// Tokenize typed text into words on whitespace (including newlines).
// Filters out empty strings. Used for both word counting and saving
// to GAME.currentLineWords at end-of-compose.
function tokenizeTypedText(text) {
  if (!text) return [];
  return text.split(/\s+/).map(s => s.trim()).filter(s => s.length > 0);
}

function showOverlay(id) {
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function hideOverlay(id) { document.getElementById(id).classList.add('hidden'); }
function hideAllOverlays() {
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
}

// ----- Render Yeats source poem with current target highlighted -----
function renderSourcePoem(currentIdx) {
  const parts = YEATS_LINE.map((w, i) => {
    if (i === currentIdx) return `<span class="target-word">${w}</span>`;
    return `<span class="end-word">${w}</span>`;
  });
  return `"${parts.join(' ')}"<span class="author">— ${YEATS_AUTHOR}, <i>${YEATS_POEM_TITLE}</i></span>`;
}

// ----- Render full poem-so-far with right-aligned Yeats end-words -----
// Each row has: [num] [your line text] [dotted leader] [endWord]
// The end-word is pinned to the right edge so it visually "buries"
// at the line ending — emphasizing the golden-shovel structure.
function renderFullPoem(currentIdx) {
  const escapeHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let html = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const endWord = LEVELS[i].endWord;
    const lineWords = GAME.poemLines[i];
    const isCurrent = (i === currentIdx);
    let textHtml;
    if (lineWords) {
      // completed line — already includes endWord at the end
      const before = lineWords.slice(0, -1).map(escapeHtml).join(' ');
      textHtml = before;
    } else if (isCurrent) {
      const cur = GAME.currentLineWords;
      if (cur.length === 0) {
        textHtml = `<span class="pl-empty">…</span>`;
      } else {
        textHtml = cur.map(escapeHtml).join(' ');
      }
    } else {
      textHtml = `<span class="pl-empty">…</span>`;
    }
    html += `<div class="pl-row${isCurrent ? ' current' : ''}">
      <span class="pl-num">${i + 1}.</span>
      <span class="pl-text">${textHtml}</span>
      <span class="pl-leader"></span>
      <span class="pl-end">${escapeHtml(endWord)}</span>
    </div>`;
  }
  return html;
}

// =================== LEVEL INTRO ===================
function showLevelIntro(idx, onContinue) {
  const lvl = LEVELS[idx];
  document.getElementById('level-intro-num').textContent = `LEVEL ${lvl.num} / 9`;
  document.getElementById('level-intro-title').textContent = lvl.title;
  document.getElementById('level-intro-subtitle').textContent = lvl.subtitle;
  document.getElementById('level-intro-text').textContent = lvl.intro;
  document.getElementById('level-intro-poem').innerHTML = renderSourcePoem(idx);
  document.getElementById('level-intro-endword').textContent = lvl.endWord;

  showOverlay('overlay-level-intro');
  document.getElementById('hud').classList.add('hidden');
  document.body.classList.remove('hud-visible');

  const btn = document.getElementById('btn-level-go');
  btn.onclick = () => {
    Audio.click();
    hideOverlay('overlay-level-intro');
    onContinue();
  };
}

// =================== COMPOSE ===================
// Called every time the boss is hit. The player has 60s (lazy-start) to
// type a line in the textarea. Chips append to the textarea. Done button
// requires >=5 whitespace-separated tokens. Timeout auto-saves what's
// typed and returns to the boss fight.
function showCompose(idx, onContinueFight, onDone) {
  const lvl = LEVELS[idx];

  document.getElementById('compose-label').textContent = `LEVEL ${idx + 1} — BUILD LINE ${idx + 1}`;
  document.getElementById('compose-endword').textContent = lvl.endWord;

  // Restore any words typed/added in a prior visit (currentLineWords)
  // by prefilling the textarea with them. That way the player picks up
  // exactly where they left off after a timeout.
  const typedInput = document.getElementById('compose-typed-input');
  const hadPriorWords = (GAME.currentLineWords || []).length > 0;
  composeTypedText = (GAME.currentLineWords || []).join(' ');
  typedInput.value = composeTypedText;
  typedInput.placeholder = 'Type your line here…';

  refreshCompose(idx, onContinueFight, onDone);
  showOverlay('overlay-compose');

  // 60-second window. Armed but not yet ticking. Starts on first keystroke
  // or first chip click. On timeout, save typed text → currentLineWords
  // and return to fighting.
  armComposeTimer(() => {
    finalizeTypedToWords();
    onContinueFight();
  });

  // If we re-opened compose with words already from a prior visit, start
  // the timer immediately — the player has already been working on this
  // line, so they're "in progress" already. This also makes the Done
  // button immediately usable for the corner case where 5+ words are
  // already typed: no further interaction required.
  if (hadPriorWords) {
    ensureComposeTimerRunning();
  }

  // typing handler — updates state and refreshes UI
  typedInput.oninput = () => {
    composeTypedText = typedInput.value;
    if (composeTypedText.length > 0) ensureComposeTimerRunning();
    refreshCompose(idx, onContinueFight, onDone);
  };
  // ignore Enter / Tab as form-submit; allow newlines (textarea handles it)
  typedInput.onkeydown = (e) => {
    // No special behavior — textarea allows multiline naturally.
    // We don't bind Enter to add anymore; words are tokens of typed text.
  };
}

// Save the textarea contents into GAME.currentLineWords as tokenized words.
// Called from the Done click and timeout paths.
function finalizeTypedToWords() {
  GAME.currentLineWords = tokenizeTypedText(composeTypedText);
}

// re-render the dynamic parts (poem, word bank, button states)
function refreshCompose(idx, onContinueFight, onDone) {
  const tokens = tokenizeTypedText(composeTypedText);

  // Show the line as it will be rendered — in the FullPoem display we use
  // GAME.currentLineWords. Update it from the live textarea so the player
  // sees their work in context.
  GAME.currentLineWords = tokens;
  document.getElementById('full-poem-display').innerHTML = renderFullPoem(idx);
  document.getElementById('compose-word-count').textContent = tokens.length;

  // word bank chips: each chip click appends the word to the textarea
  const grid = document.getElementById('compose-wordbank');
  const typedInput = document.getElementById('compose-typed-input');
  grid.innerHTML = '';
  if (GAME.wordBank.length === 0) {
    grid.innerHTML = '<p class="wordbank-empty">No collected words yet — break W blocks or stomp enemies during the level. You can also type any word in the box above.</p>';
  } else {
    GAME.wordBank.forEach((w) => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.textContent = w;
      chip.onclick = () => {
        ensureComposeTimerRunning();
        Audio.collectWord();
        // Append to textarea with a leading space if needed.
        const cur = typedInput.value;
        const sep = (cur.length === 0 || /\s$/.test(cur)) ? '' : ' ';
        typedInput.value = cur + sep + w + ' ';
        composeTypedText = typedInput.value;
        // Keep focus in the textarea so the player can keep typing.
        typedInput.focus();
        // Move caret to end
        typedInput.setSelectionRange(typedInput.value.length, typedInput.value.length);
        refreshCompose(idx, onContinueFight, onDone);
      };
      grid.appendChild(chip);
    });
  }

  // Done button
  const btnDone = document.getElementById('btn-compose-done');
  btnDone.disabled = tokens.length < 5;
  if (tokens.length < 5) {
    const need = 5 - tokens.length;
    btnDone.title = `Need ${need} more word${need === 1 ? '' : 's'} (5 minimum).`;
  } else {
    btnDone.title = '';
  }
  btnDone.onclick = () => {
    if (btnDone.disabled) return;
    Audio.click();
    finalizeTypedToWords();
    clearComposeTimer();
    onDone();
  };
}

// =================== LEVEL COMPLETE ===================
function showLevelComplete(idx, onContinue) {
  const lvl = LEVELS[idx];
  document.getElementById('level-complete-label').textContent = `LEVEL ${idx + 1} COMPLETE`;
  const line = GAME.poemLines[idx];
  const before = line.slice(0, -1).join(' ');
  document.getElementById('level-complete-line').innerHTML =
    `<span class="filled">${escapeHTML(before)}</span> <span class="pending-end">${escapeHTML(lvl.endWord)}</span>`;
  document.getElementById('level-complete-endword').textContent = lvl.endWord;
  document.getElementById('level-complete-fullpoem').innerHTML = renderFullPoem(-1);
  showOverlay('overlay-level-complete');

  const btn = document.getElementById('btn-level-continue');
  btn.textContent = (idx >= LEVELS.length - 1) ? 'SEE YOUR POEM' : 'NEXT LEVEL';
  btn.onclick = () => {
    Audio.click();
    onContinue();
  };

  // Copy-poem-so-far button: copies whatever lines have been completed
  // up to this point. Available after every boss, not just the final one.
  const copyBtn = document.getElementById('btn-level-copy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      Audio.click();
      copyCurrentPoem();
    };
  }
}

// Build plain-text poem from completed lines and copy to clipboard.
// Used by the level-complete overlay AND the final-poem overlay.
function copyCurrentPoem() {
  let txt = 'The Golden Shovel of Nature\n\n';
  let lineCount = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const line = GAME.poemLines[i];
    if (!line) continue;
    txt += line.join(' ') + '\n';
    lineCount++;
  }
  if (lineCount === 0) {
    showToast('Nothing to copy yet.');
    return;
  }
  // attribution always added
  txt += `\n— after Yeats, "${YEATS_FULL_LINE}"`;
  const successMsg = lineCount === LEVELS.length
    ? '📋 Poem copied!'
    : `📋 Copied ${lineCount} of ${LEVELS.length} lines!`;
  try {
    navigator.clipboard.writeText(txt).then(() => {
      showToast(successMsg);
    }).catch(() => fallbackCopy(txt, successMsg));
  } catch (e) {
    fallbackCopy(txt, successMsg);
  }
}

function escapeHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// =================== FINAL POEM ===================
function showFinalPoem() {
  Audio.victory();
  let html = `<div class="fp-title">The Golden Shovel of Nature</div>`;
  for (let i = 0; i < LEVELS.length; i++) {
    const line = GAME.poemLines[i];
    if (!line) continue;
    const endWord = LEVELS[i].endWord;
    const before = line.slice(0, -1).join(' ');
    html += `<div class="fp-line">
      <span class="fp-line-text">${escapeHTML(before)}</span>
      <span class="fp-line-leader"></span>
      <span class="endword">${escapeHTML(endWord)}</span>
    </div>`;
  }
  html += `<div class="fp-byline">— after Yeats, "${YEATS_FULL_LINE}"</div>`;
  document.getElementById('final-poem-display').innerHTML = html;
  showOverlay('overlay-final');
  document.getElementById('hud').classList.add('hidden');
  document.body.classList.remove('hud-visible');

  document.getElementById('btn-final-copy').onclick = () => {
    Audio.click();
    copyCurrentPoem();
  };

  document.getElementById('btn-final-restart').onclick = () => {
    Audio.click();
    resetGame();
    hideAllOverlays();
    showOverlay('overlay-title');
  };
}

function fallbackCopy(txt, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast(successMsg || '📋 Poem copied!'); }
  catch (e) { showToast('Copy failed — select manually.'); }
  document.body.removeChild(ta);
}
