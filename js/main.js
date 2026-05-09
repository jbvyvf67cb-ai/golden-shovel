// ============================================================
//  MAIN — bootstrap and wire up all controls
// ============================================================
'use strict';

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0d1a13',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYS.GRAVITY },
      debug: false,
    }
  },
  scene: [BootScene, PlayScene],
  audio: { disableWebAudio: true }, // we handle audio ourselves
};

let phaserGame = null;

function startPhaser() {
  if (phaserGame) return;
  Audio.init();
  Audio.resume();
  Audio.startMusic();
  phaserGame = new Phaser.Game(phaserConfig);
}

// ---- input setup (touch + keyboard) ----
setupInput();

// ---- title screen ----
document.getElementById('btn-title-start').onclick = () => {
  Audio.init();
  Audio.resume();
  Audio.startMusic();
  Audio.click();
  resetGame();
  hideOverlay('overlay-title');
  startPhaser();
};

// ---- game over retry ----
// On death, the player retries the SAME level with HP and current-level
// progress reset, but completed prior levels' poem lines are kept.
document.getElementById('btn-gameover-retry').onclick = () => {
  Audio.click();
  hideOverlay('overlay-gameover');
  restartLevel();
  if (document.body.classList.contains('touch')) {
    document.getElementById('touch-controls').classList.remove('hidden');
  }
  if (phaserGame) {
    phaserGame.scene.stop('Play');
    phaserGame.scene.start('Boot');
  }
};

// ---- mute button ----
document.getElementById('mute-btn').onclick = () => {
  GAME.muted = !GAME.muted;
  const b = document.getElementById('mute-btn');
  if (GAME.muted) {
    b.classList.add('muted');
    b.textContent = '🔇';
  } else {
    b.classList.remove('muted');
    b.textContent = '🔊';
  }
  Audio.setMuted(GAME.muted);
};

// ---- initial overlay ----
showOverlay('overlay-title');
