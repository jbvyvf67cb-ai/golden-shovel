// ============================================================
//  INPUT — keyboard + touch button state shared with Phaser
// ============================================================
'use strict';

const Input = {
  left: false, right: false, jump: false, throw: false,
  jumpPressed: false, throwPressed: false,
  _prevJump: false, _prevThrow: false,
  tick() {
    this.jumpPressed  = this.jump  && !this._prevJump;
    this.throwPressed = this.throw && !this._prevThrow;
    this._prevJump = this.jump;
    this._prevThrow = this.throw;
  }
};

function bindTouchButton(id, prop) {
  const el = document.getElementById(id);
  if (!el) return;
  const press   = (e) => { e.preventDefault(); Input[prop] = true;  el.classList.add('pressed'); Audio.resume(); };
  const release = (e) => { e.preventDefault(); Input[prop] = false; el.classList.remove('pressed'); };
  el.addEventListener('touchstart', press,   { passive: false });
  el.addEventListener('touchend',   release, { passive: false });
  el.addEventListener('touchcancel',release, { passive: false });
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup',   release);
  el.addEventListener('mouseleave',release);
}

function setupInput() {
  bindTouchButton('tc-left',  'left');
  bindTouchButton('tc-right', 'right');
  bindTouchButton('tc-jump',  'jump');
  bindTouchButton('tc-throw', 'throw');

  // touch device detection
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch');
  }

  // keyboard — but ignore if a text input has focus (so typing in compose box works)
  const isTextInputFocused = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  };

  window.addEventListener('keydown', e => {
    if (isTextInputFocused()) return;
    if (['ArrowLeft','a','A'].includes(e.key)) Input.left = true;
    if (['ArrowRight','d','D'].includes(e.key)) Input.right = true;
    if (['ArrowUp','w','W',' '].includes(e.key)) { Input.jump = true; e.preventDefault(); }
    if (['x','X','j','J'].includes(e.key)) Input.throw = true;
  });
  window.addEventListener('keyup', e => {
    if (isTextInputFocused()) {
      // safety: still release keys we may have started before focus moved
      Input.left = Input.right = Input.jump = Input.throw = false;
      return;
    }
    if (['ArrowLeft','a','A'].includes(e.key)) Input.left = false;
    if (['ArrowRight','d','D'].includes(e.key)) Input.right = false;
    if (['ArrowUp','w','W',' '].includes(e.key)) Input.jump = false;
    if (['x','X','j','J'].includes(e.key)) Input.throw = false;
  });
}

// ----- Toast helper -----
let _toastEl = null, _toastTimer = null;
function showToast(text, dur = 1400) {
  if (!_toastEl) {
    _toastEl = document.createElement('div');
    _toastEl.className = 'toast';
    document.body.appendChild(_toastEl);
  }
  _toastEl.textContent = text;
  _toastEl.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => _toastEl.classList.remove('show'), dur);
}

function showBossBanner(name, endWord) {
  const b = document.getElementById('boss-banner');
  document.getElementById('boss-banner-name').textContent = name;
  document.getElementById('boss-banner-word').textContent = endWord;
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), 2200);
}
