// ============================================================
//  OVERLAYS — DOM-based UI (title / intros / compose / final)
// ============================================================
'use strict';

// Tracks how many words were added in the current compose visit
// (between hits). Player must add at least 1 before continuing/done.
let composeAddedThisVisit = 0;

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
// Called every time the boss is hit. Each visit, the player MUST add
// at least one word before they can Continue or Done.
function showCompose(idx, onContinueFight, onDone) {
  const lvl = LEVELS[idx];
  composeAddedThisVisit = 0;  // reset counter for this hit

  document.getElementById('compose-label').textContent = `LEVEL ${idx + 1} — BUILD LINE ${idx + 1}`;
  document.getElementById('compose-endword').textContent = lvl.endWord;

  // typed-input
  const typedInput = document.getElementById('compose-typed-input');
  typedInput.value = '';
  typedInput.placeholder = '…or type your own word';

  refreshCompose(idx, onContinueFight, onDone);
  showOverlay('overlay-compose');

  // bind once-per-show: typed add
  const addTypedBtn = document.getElementById('btn-compose-add-typed');
  addTypedBtn.onclick = () => {
    handleTypedAdd(idx, onContinueFight, onDone);
  };
  typedInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTypedAdd(idx, onContinueFight, onDone);
    }
  };
}

function handleTypedAdd(idx, onContinueFight, onDone) {
  const typedInput = document.getElementById('compose-typed-input');
  const raw = typedInput.value.trim();
  if (!raw) return;
  // simple sanitization — keep letters, spaces, hyphens, apostrophes
  const cleaned = raw.replace(/[^\p{L}\p{M}\s'-]/gu, '').slice(0, 24).trim();
  if (!cleaned) {
    typedInput.value = '';
    return;
  }
  Audio.collectWord();
  GAME.currentLineWords.push(cleaned);
  composeAddedThisVisit++;
  typedInput.value = '';
  refreshCompose(idx, onContinueFight, onDone);
  // give focus back to input so they can keep typing if they want
  typedInput.focus();
}

// re-render the dynamic parts (poem, word bank, buttons)
function refreshCompose(idx, onContinueFight, onDone) {
  document.getElementById('full-poem-display').innerHTML = renderFullPoem(idx);
  document.getElementById('compose-word-count').textContent = GAME.currentLineWords.length;

  const grid = document.getElementById('compose-wordbank');
  grid.innerHTML = '';
  if (GAME.wordBank.length === 0) {
    grid.innerHTML = '<p class="wordbank-empty">No collected words yet — break W blocks or stomp enemies during the level. You can also type any word above.</p>';
  } else {
    // count usage so duplicates can be marked unused
    const used = {};
    for (const w of GAME.currentLineWords) used[w] = (used[w] || 0) + 1;
    const remaining = {};
    for (const w of GAME.wordBank) remaining[w] = (remaining[w] || 0) + 1;
    for (const w in used) remaining[w] = Math.max(0, (remaining[w] || 0) - used[w]);
    GAME.wordBank.forEach((w) => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.textContent = w;
      if ((remaining[w] || 0) <= 0) {
        chip.classList.add('used');
      } else {
        chip.onclick = () => {
          Audio.collectWord();
          GAME.currentLineWords.push(w);
          composeAddedThisVisit++;
          refreshCompose(idx, onContinueFight, onDone);
        };
      }
      grid.appendChild(chip);
    });
  }

  // buttons
  const btnUndo = document.getElementById('btn-compose-undo');
  const btnContinue = document.getElementById('btn-compose-continue');
  const btnDone = document.getElementById('btn-compose-done');

  btnUndo.disabled = GAME.currentLineWords.length === 0;
  btnUndo.style.opacity = btnUndo.disabled ? 0.4 : 1;
  btnUndo.onclick = () => {
    if (GAME.currentLineWords.length === 0) return;
    Audio.click();
    GAME.currentLineWords.pop();
    if (composeAddedThisVisit > 0) composeAddedThisVisit--;
    refreshCompose(idx, onContinueFight, onDone);
  };

  // Must have added at least one word THIS visit before continuing/done
  const addedSomething = composeAddedThisVisit > 0;
  btnContinue.disabled = !addedSomething;
  btnContinue.title = addedSomething ? '' : 'Add a word first.';
  btnContinue.onclick = () => {
    if (!addedSomething) return;
    Audio.click();
    onContinueFight();
  };

  btnDone.disabled = !addedSomething || GAME.currentLineWords.length < 5;
  if (!addedSomething) {
    btnDone.title = 'Add a word first.';
  } else if (GAME.currentLineWords.length < 5) {
    btnDone.title = `Need ${5 - GAME.currentLineWords.length} more word${5 - GAME.currentLineWords.length === 1 ? '' : 's'} (5 minimum).`;
  } else {
    btnDone.title = '';
  }
  btnDone.onclick = () => {
    if (btnDone.disabled) return;
    Audio.click();
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
    let txt = 'The Golden Shovel of Nature\n\n';
    for (let i = 0; i < LEVELS.length; i++) {
      const line = GAME.poemLines[i];
      if (!line) continue;
      txt += line.join(' ') + '\n';
    }
    txt += `\n— after Yeats, "${YEATS_FULL_LINE}"`;
    try {
      navigator.clipboard.writeText(txt).then(() => {
        showToast('📋 Poem copied!');
      }).catch(() => fallbackCopy(txt));
    } catch (e) {
      fallbackCopy(txt);
    }
    Audio.click();
  };

  document.getElementById('btn-final-restart').onclick = () => {
    Audio.click();
    resetGame();
    hideAllOverlays();
    showOverlay('overlay-title');
  };
}

function fallbackCopy(txt) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('📋 Poem copied!'); }
  catch (e) { showToast('Copy failed — select manually.'); }
  document.body.removeChild(ta);
}
