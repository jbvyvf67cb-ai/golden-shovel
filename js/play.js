// ============================================================
//  PLAY SCENE — main gameplay
// ============================================================
'use strict';

class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init() {
    this.levelIdx = GAME.levelIdx;
    this.level = LEVELS[this.levelIdx];
    this.theme = THEMES[this.level.theme];
    this.quizOpen = false;
    this.bossActive = false;
    this.bossDefeated = false;
    this.boss = null;
    this.canDoubleJump = false;
    this.doubleJumpUsed = false;
    this.levelReady = false;
  }

  create() {
    showLevelIntro(this.levelIdx, () => this.startLevel());
  }

  startLevel() {
    this.levelReady = true;
    const w = this.levelWidth = 3400;
    const h = GAME_H;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);

    this.skyGfx = this.add.graphics();
    this.skyGfx.setScrollFactor(0);
    this.drawSky();

    this.hillsGfx = this.add.graphics();
    this.hillsGfx.setScrollFactor(0.3);
    this.drawHills();

    // physics groups
    this.platforms   = this.physics.add.staticGroup();
    this.oneWayGroup = this.physics.add.staticGroup();
    this.crumbles    = this.physics.add.group({ allowGravity: false, immovable: true });
    this.movers      = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spikes      = this.physics.add.staticGroup();
    this.saws        = this.physics.add.group({ allowGravity: false });
    this.vines       = [];
    this.wblocks     = this.physics.add.staticGroup();

    this.buildLevel();

    // player
    this.player = this.physics.add.sprite(80, h - 120, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 32).setOffset(4, 4);
    this.player.facing = 1;
    this.player.canDoubleJump = false;
    this.player.vineCooldown = 0;
    this.player.onVine = false;
    this.player.attachedVine = null;

    // enemies, projectiles
    this.enemies = this.physics.add.group();
    this.spawnEnemies();
    this.projectiles = this.physics.add.group({ allowGravity: false });

    // boss arena
    this.bossSpawnX = w - 380;
    this.bossSpawned = false;
    this.bossWall = null;

    // colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.oneWayGroup, null, this.oneWayCheck, this);
    this.physics.add.collider(this.player, this.crumbles, this.onCrumbleStep, null, this);
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerHazard, null, this);
    this.physics.add.overlap(this.player, this.saws,   this.onPlayerHazard, null, this);
    this.physics.add.overlap(this.player, this.wblocks, this.onPlayerWBlock, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemy, null, this);

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.oneWayGroup, null, this.oneWayCheck, this);
    this.physics.add.collider(this.enemies, this.movers);

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjEnemy, null, this);
    this.physics.add.overlap(this.projectiles, this.wblocks, this.onProjWBlock, null, this);
    this.physics.add.collider(this.projectiles, this.platforms, this.onProjGround, null, this);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(160, 80);

    this.dustParticles = this.add.particles(0, 0, 'dot', {
      lifespan: 400,
      speed: { min: -60, max: 60 },
      gravityY: 200,
      scale: { start: 1.2, end: 0 },
      tint: this.theme.dust,
      emitting: false,
    });

    document.getElementById('hud').classList.remove('hidden');
    document.body.classList.add('hud-visible');
    this.updateHud();

    showToast(`Level ${this.levelIdx + 1}: end-word "${this.level.endWord}"`, 2400);
  }

  // ----- level building -----
  buildLevel() {
    const w = this.levelWidth;
    const h = GAME_H;
    const groundY = h - 64;
    const bossArenaStart = w - 580;
    const gaps = [];
    const gapCount = 3 + (this.levelIdx % 3);
    const minGapX = 480;
    const maxGapX = bossArenaStart - 220;
    for (let i = 0; i < gapCount; i++) {
      const gx = minGapX + ((maxGapX - minGapX) * (i + 0.5) / gapCount) + (Math.random() * 80 - 40);
      const gw = 80 + Math.random() * 60;
      gaps.push({ x: gx, w: gw });
    }

    // ground
    const tileW = 32;
    const groundRows = Math.ceil((GAME_H - groundY) / tileW);
    for (let x = 0; x < w; x += tileW) {
      const inGap = gaps.some(g => x + tileW > g.x && x < g.x + g.w);
      if (inGap) continue;
      const t = this.platforms.create(x + tileW/2, groundY + tileW/2, 'ground_tile');
      t.setOrigin(0.5, 0.5);
      t.refreshBody();
      t.setTint(this.theme.ground);
      for (let r = 1; r < groundRows; r++) {
        const dec = this.add.image(x + tileW/2, groundY + tileW/2 + r * tileW, 'ground_tile');
        dec.setOrigin(0.5, 0.5);
        dec.setTint(this.theme.ground);
      }
      const stripe = this.add.rectangle(x + tileW/2, groundY + 2, tileW, 4, this.theme.groundTop);
      stripe.setDepth(1);
    }
    this.gaps = gaps;
    this.groundY = groundY;
    this.bossArenaStart = bossArenaStart;

    // spike pits
    for (const g of gaps) Obstacles.spikePit(this, g.x, g.w, groundY);

    // obstacle patterns over each gap
    for (const g of gaps) {
      const cx = g.x + g.w / 2;
      const pattern = (this.levelIdx + Math.floor(cx / 200)) % 5;
      const platY = groundY - 100;
      switch (pattern) {
        case 0:
          Obstacles.platform(this, cx, platY, 96);
          break;
        case 1:
          Obstacles.crumble(this, cx - 60, platY, 80);
          Obstacles.crumble(this, cx + 60, platY - 40, 80);
          break;
        case 2:
          Obstacles.mover(this, cx, platY, 96, 'horizontal', 80);
          break;
        case 3:
          Obstacles.mover(this, cx - 50, platY + 30, 80, 'vertical', 60);
          Obstacles.oneWay(this, cx + 80, platY - 60, 96);
          break;
        case 4:
          Obstacles.saw(this, cx, platY + 80, 'horizontal', 60, g.w * 0.7);
          Obstacles.platform(this, cx, platY - 30, 96);
          break;
      }
    }

    // vines
    if (this.levelIdx >= 1) {
      const vineCount = 1 + Math.floor(this.levelIdx / 3);
      for (let i = 0; i < vineCount; i++) {
        if (gaps[i]) {
          const g = gaps[i];
          const vx = g.x + g.w / 2 + (i % 2 === 0 ? -20 : 20);
          Obstacles.vine(this, vx, 60, 220);
        }
      }
    }

    // mid-air one-way platforms
    const oneWayCount = 3 + Math.min(this.levelIdx, 4);
    for (let i = 0; i < oneWayCount; i++) {
      const px = 280 + i * (bossArenaStart / (oneWayCount + 1));
      if (gaps.some(g => Math.abs(px - g.x - g.w/2) < 90)) continue;
      const py = groundY - 110 - (i % 2) * 60;
      Obstacles.oneWay(this, px, py, 96);
    }

    // saws on harder levels
    if (this.levelIdx >= 3) {
      const sawCount = Math.floor(this.levelIdx / 2);
      for (let i = 0; i < sawCount; i++) {
        const sx = 500 + i * 700 + Math.random() * 200;
        if (sx > bossArenaStart - 100) break;
        Obstacles.saw(this, sx, groundY - 18, 'horizontal', 70 + i * 10, 220);
      }
    }

    // W-blocks
    const wblockCount = 6 + Math.min(this.levelIdx, 3);
    const placed = [];
    for (let i = 0; i < wblockCount; i++) {
      let attempts = 0, x, y;
      do {
        x = 220 + Math.random() * (bossArenaStart - 350);
        y = groundY - 70 - Math.random() * 180;
        attempts++;
      } while (
        attempts < 20 &&
        (gaps.some(g => x > g.x - 40 && x < g.x + g.w + 40 && y > groundY - 80) ||
         placed.some(p => Math.abs(p.x - x) < 80 && Math.abs(p.y - y) < 50))
      );
      placed.push({x, y});
      const b = this.wblocks.create(x, y, 'wblock');
      b.setOrigin(0.5, 0.5);
      b.refreshBody();
      b.broken = false;
    }

    // boss marker (visual telegraph)
    this.bossMarker = this.add.text(bossArenaStart + 30, groundY - 200, '⛏', {
      fontSize: '40px', color: '#d4a437'
    });
    this.bossMarker.setAlpha(0.4);
    this.tweens.add({
      targets: this.bossMarker,
      y: '-=10', duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // ----- enemy spawn -----
  spawnEnemies() {
    const enemyCount = 4 + Math.min(this.levelIdx, 5);
    const types = this.chooseEnemyTypes();

    for (let i = 0; i < enemyCount; i++) {
      const x = 320 + ((this.bossArenaStart - 500) * (i + 0.5) / enemyCount) + (Math.random() * 80 - 40);
      if (this.gaps.some(g => x > g.x - 20 && x < g.x + g.w + 20)) continue;
      const tname = types[i % types.length];
      this.makeEnemy(tname, x, this.groundY - 32);
    }
  }

  chooseEnemyTypes() {
    const map = {
      mossy_dawn:   ['jaguar', 'parrot'],
      riverbank:    ['parrot', 'spider'],
      thicket:      ['spider', 'jaguar'],
      owl_glade:    ['specter', 'spider'],
      pollen_pass:  ['parrot', 'moth'],
      sunken_roots: ['spider', 'specter'],
      meadow:       ['parrot', 'moth', 'jaguar'],
      silken_veil:  ['moth', 'spider'],
      loom:         ['specter', 'moth', 'spider'],
    };
    return map[this.level.theme] || ['jaguar', 'spider'];
  }

  makeEnemy(type, x, y) {
    const e = this.enemies.create(x, y, type);
    e.setOrigin(0.5, 1);
    e.kind = type;
    e.hp = 1;
    e.dir = Math.random() > 0.5 ? 1 : -1;
    e.flying = (type === 'parrot' || type === 'specter' || type === 'moth');
    e.baseY = y;
    e.animTime = Math.random() * 100;
    if (e.flying) {
      e.body.allowGravity = false;
      e.speed = 50 + Math.random() * 30;
      e.body.setSize(20, 18).setOffset(4, 3);
      e.setVelocityX(e.dir * e.speed);
      if (type === 'specter') { e.hp = 2; }
    } else {
      e.body.setSize(20, 26).setOffset(6, 6);
      e.speed = 50;
      e.setVelocityX(e.dir * e.speed);
      if (type === 'spider') {
        e.hopTimer = 60 + Math.random() * 60;
      }
    }
  }

  // ----- collision handlers -----
  oneWayCheck(player, plat) {
    if (player.body.velocity.y < 0) return false;
    if (player.body.y + player.body.height > plat.y + 8) return false;
    return true;
  }

  onCrumbleStep(player, plat) {
    if (plat.crumbling) return;
    if (player.body.velocity.y < 0) return;
    if (player.body.y + player.body.height > plat.y + 8) return;
    plat.crumbling = true;
    plat.crumbleTimer = 0;
    this.tweens.add({
      targets: plat, x: plat.x + 2, duration: 60, yoyo: true, repeat: 6,
    });
  }

  onPlayerHazard(player, hazard) {
    if (this.time.now < GAME.invincibleUntil) return;
    this.damagePlayer(1);
    const dx = player.x - hazard.x;
    player.setVelocity(dx >= 0 ? 200 : -200, -300);
  }

  onPlayerEnemy(player, enemy) {
    if (this.time.now < GAME.invincibleUntil) return;
    const stomping = player.body.velocity.y > 50 &&
                     (player.body.y + player.body.height) - enemy.y < 24 &&
                     !enemy.flying;
    if (stomping) {
      this.killEnemy(enemy);
      player.setVelocityY(-380);
      Audio.stomp();
    } else {
      this.damagePlayer(1);
      const dx = player.x - enemy.x;
      player.setVelocity(dx >= 0 ? 220 : -220, -280);
    }
  }

  onPlayerWBlock(player, block) {
    if (block.broken) return;
    if (player.body.velocity.y < -30) {
      const playerTop = player.body.y;
      if (playerTop > block.y - 4) {
        this.breakWBlock(block);
        player.setVelocityY(120);
      }
    }
  }

  onProjEnemy(proj, enemy) {
    enemy.hp--;
    Audio.enemyHit();
    enemy.setTint(0xffffff);
    this.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });
    proj.destroy();
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  onProjWBlock(proj, block) {
    if (block.broken) return;
    this.breakWBlock(block);
    proj.setVelocityX(proj.body.velocity.x * -0.4);
    proj.setVelocityY(-200);
  }

  onProjGround(proj, _plat) {
    if (proj.body.velocity.y > 60) proj.setVelocityY(-Math.abs(proj.body.velocity.y) * 0.5);
    proj.setVelocityX(proj.body.velocity.x * 0.85);
    if (Math.abs(proj.body.velocity.y) < 40) {
      proj.bounceCount = (proj.bounceCount || 0) + 1;
      if (proj.bounceCount > 2) proj.destroy();
    }
  }

  // ----- gameplay events -----
  damagePlayer(amount) {
    GAME.hp -= amount;
    GAME.invincibleUntil = this.time.now + 1100;
    Audio.damage();
    this.cameras.main.shake(160, 0.008);
    this.player.setTint(0xff5577);
    this.time.delayedCall(120, () => { if (this.player.active) this.player.clearTint(); });
    this.updateHud();
    if (GAME.hp <= 0) {
      this.gameOver();
    }
  }

  killEnemy(enemy) {
    this.dustParticles.emitParticleAt(enemy.x, enemy.y - 16, 12);
    enemy.destroy();
    this.dropWordFromKill(enemy.x, enemy.y);
  }

  breakWBlock(block) {
    block.broken = true;
    this.dustParticles.emitParticleAt(block.x, block.y, 14);
    Audio.blockBreak();
    block.disableBody(true, true);
    this.dropWordFromKill(block.x, block.y, true);
  }

  dropWordFromKill(x, y, _fromBlock=false) {
    const word = takeWordFromPool();
    if (word) {
      GAME.wordBank.push(word);
      Audio.collectWord();
      const t = this.add.text(x, y - 20, '+' + word, {
        fontSize: '14px', color: '#d4a437', fontStyle: 'bold',
        stroke: '#0d1a13', strokeThickness: 3,
      });
      t.setOrigin(0.5, 0.5);
      this.tweens.add({
        targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Quad.easeOut',
        onComplete: () => t.destroy(),
      });
      this.updateHud();
    }
  }

  gameOver() {
    document.getElementById('hud').classList.add('hidden');
    document.body.classList.remove('hud-visible');
    this.scene.pause();
    this.physics.pause();
    showOverlay('overlay-gameover');
  }

  // ----- update loop -----
  update(_time, _delta) {
    if (!this.levelReady) return;
    if (this.quizOpen) return;
    Input.tick();

    this.updatePlayer();
    this.updateProjectiles();
    this.updateEnemies();
    ObstaclesUpdate.crumbles(this);
    ObstaclesUpdate.movers(this);
    ObstaclesUpdate.saws(this);
    ObstaclesUpdate.vines(this, this.player);

    if (!this.bossSpawned && this.player.x > this.bossSpawnX - 200) {
      Boss.spawn(this);
    }
    if (this.bossActive && this.boss && !this.bossDefeated) {
      Boss.update(this);
    }
  }

  updatePlayer() {
    const p = this.player;
    const onGround = p.body.blocked.down || p.body.touching.down;

    if (onGround) {
      p.canDoubleJump = true;
    }

    let vx = p.body.velocity.x;
    if (Input.left) {
      vx -= PHYS.MOVE_ACCEL * (1 / 60);
      p.facing = -1;
      p.setFlipX(true);
    } else if (Input.right) {
      vx += PHYS.MOVE_ACCEL * (1 / 60);
      p.facing = 1;
      p.setFlipX(false);
    } else {
      vx *= onGround ? PHYS.FRICTION_GROUND : PHYS.FRICTION_AIR;
    }
    vx = Phaser.Math.Clamp(vx, -PHYS.MOVE_MAX, PHYS.MOVE_MAX);
    p.setVelocityX(vx);

    if (Input.jumpPressed) {
      if (onGround || p.onVine) {
        p.setVelocityY(-PHYS.JUMP_POWER);
        Audio.jump();
        if (p.onVine) {
          this.detachFromVine();
          p.setVelocityX(p.facing * 280);
        }
      } else if (p.canDoubleJump) {
        p.setVelocityY(-PHYS.DOUBLE_JUMP_POWER);
        p.canDoubleJump = false;
        Audio.doubleJump();
        this.dustParticles.emitParticleAt(p.x, p.y + 10, 6);
      }
    }
    if (!Input.jump && p.body.velocity.y < -160) {
      p.setVelocityY(p.body.velocity.y * 0.6);
    }

    if (Input.throwPressed) this.throwShovel();

    if (p.y > GAME_H + 100) {
      this.damagePlayer(1);
      if (GAME.hp > 0) {
        p.setVelocity(0, 0);
        p.setPosition(Math.max(60, p.x - 200), 100);
      }
    }
  }

  detachFromVine() {
    const p = this.player;
    if (!p.attachedVine) return;
    p.attachedVine.attached = false;
    p.attachedVine = null;
    p.onVine = false;
    p.body.allowGravity = true;
    p.vineCooldown = 30;
  }

  throwShovel() {
    const p = this.player;
    const proj = this.projectiles.create(p.x + p.facing * 20, p.y, 'shovel');
    proj.setOrigin(0.5, 0.5);
    proj.body.allowGravity = false;
    proj.setVelocity(p.facing * PHYS.THROW_VEL_X, PHYS.THROW_VEL_Y);
    proj.body.setSize(20, 14).setOffset(4, 3);
    proj.flipX = (p.facing < 0);
    proj.setAngularVelocity(p.facing * 720);
    proj.bounceCount = 0;
    proj.customGravity = PHYS.THROW_GRAVITY;
    Audio.throwShovel();
    this.time.delayedCall(2400, () => { if (proj.active) proj.destroy(); });
  }

  updateProjectiles() {
    const dt = 1 / 60;
    this.projectiles.children.iterate(proj => {
      if (!proj || !proj.active) return;
      if (proj.customGravity) proj.body.velocity.y += proj.customGravity * dt;
      if (proj.x < -50 || proj.x > this.levelWidth + 50 || proj.y > GAME_H + 100) {
        proj.destroy();
      }
    });
  }

  updateEnemies() {
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      e.animTime++;
      if (e.flying) {
        e.body.allowGravity = false;
        e.y = e.baseY + Math.sin(e.animTime * 0.05) * 16;
        const dx = this.player.x - e.x;
        if (Math.abs(dx) < 360) {
          e.dir = dx > 0 ? 1 : -1;
          e.setVelocityX(e.dir * e.speed);
          e.setFlipX(e.dir < 0);
        }
        if (e.x < 30 || e.x > this.levelWidth - 30) {
          e.dir *= -1; e.setVelocityX(e.dir * e.speed);
        }
      } else {
        if (e.body.blocked.right) e.dir = -1;
        if (e.body.blocked.left)  e.dir = 1;
        const aheadX = e.x + e.dir * (e.body.width / 2 + 8);
        let onLedge = false;
        for (const g of this.gaps) {
          if (aheadX > g.x && aheadX < g.x + g.w) { onLedge = true; break; }
        }
        if (onLedge && (e.body.blocked.down || e.body.touching.down)) {
          e.dir *= -1;
        }
        e.setVelocityX(e.dir * e.speed);
        e.setFlipX(e.dir < 0);
        if (e.kind === 'spider' && (e.body.blocked.down || e.body.touching.down)) {
          e.hopTimer--;
          if (e.hopTimer <= 0) {
            e.setVelocityY(-260);
            e.hopTimer = 80 + Math.random() * 60;
          }
        }
      }
    });
  }

  // ----- compose UI integration -----
  openCompose() {
    this.quizOpen = true;
    this.physics.pause();
    document.getElementById('hud').classList.add('hidden');
    document.body.classList.remove('hud-visible');
    if (document.body.classList.contains('touch')) {
      document.getElementById('touch-controls').classList.add('hidden');
    }
    showCompose(this.levelIdx,
      () => this.onComposeReturn(false),  // continue fight
      () => this.onComposeReturn(true)    // done
    );
  }

  onComposeReturn(done) {
    document.getElementById('hud').classList.remove('hidden');
    document.body.classList.add('hud-visible');
    if (document.body.classList.contains('touch')) {
      document.getElementById('touch-controls').classList.remove('hidden');
    }
    hideOverlay('overlay-compose');
    this.quizOpen = false;
    this.physics.resume();

    if (done) {
      this.defeatBoss();
    } else {
      Boss.resumeAfterCompose(this);
    }
  }

  defeatBoss() {
    if (!this.boss) return;
    this.bossDefeated = true;
    Audio.bossDown();
    this.cameras.main.shake(360, 0.014);

    // append the level's end word to the line
    const line = [...GAME.currentLineWords, this.level.endWord];
    GAME.poemLines[this.levelIdx] = line;
    GAME.currentLineWords = [];

    const bx = this.boss.x, by = this.boss.y;

    this.tweens.add({
      targets: this.boss,
      alpha: 0,
      y: this.boss.y + 30,
      duration: 800,
      onComplete: () => Boss.despawn(this)
    });

    this.dustParticles.emitParticleAt(bx, by - 40, 30);

    this.time.delayedCall(1100, () => {
      this.scene.pause();
      this.physics.pause();
      document.getElementById('hud').classList.add('hidden');
      document.body.classList.remove('hud-visible');
      if (document.body.classList.contains('touch')) {
        document.getElementById('touch-controls').classList.add('hidden');
      }
      showLevelComplete(this.levelIdx, () => {
        if (GAME.levelIdx >= LEVELS.length - 1) {
          showFinalPoem();
        } else {
          GAME.levelIdx++;
          this.scene.restart();
        }
      });
    });
  }

  // ----- HUD -----
  updateHud() {
    const hearts = '♥'.repeat(GAME.hp) + '♡'.repeat(Math.max(0, GAME.maxHp - GAME.hp));
    document.getElementById('hud-hearts').textContent = hearts;
    document.getElementById('hud-level').textContent = `Level ${GAME.levelIdx + 1} / 9`;
    document.getElementById('hud-words').textContent = `📚 ${GAME.wordBank.length} words`;
  }

  // ----- background drawing -----
  drawSky() {
    const g = this.skyGfx;
    g.clear();
    const t = this.theme;
    const bands = 32;
    for (let i = 0; i < bands; i++) {
      const f = i / (bands - 1);
      let color;
      if (f < 0.5) color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(t.sky[0]),
        Phaser.Display.Color.HexStringToColor(t.sky[1]),
        100, Math.floor(f * 200)
      );
      else color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(t.sky[1]),
        Phaser.Display.Color.HexStringToColor(t.sky[2]),
        100, Math.floor((f - 0.5) * 200)
      );
      g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      g.fillRect(0, i * (GAME_H / bands), GAME_W, GAME_H / bands + 1);
    }
    if (t.stars) {
      g.fillStyle(0xffffff, 0.85);
      for (let i = 0; i < 60; i++) {
        const sx = (i * 73) % GAME_W;
        const sy = (i * 137) % (GAME_H * 0.6);
        const sz = (i % 3) + 1;
        g.fillRect(sx, sy, sz, sz);
      }
    }
  }

  drawHills() {
    const g = this.hillsGfx;
    g.clear();
    const t = this.theme;
    g.fillStyle(t.ground, 0.4);
    for (let i = 0; i < 8; i++) {
      const cx = i * 240;
      g.fillEllipse(cx, GAME_H - 40, 320, 180);
    }
    g.fillStyle(t.ground, 0.7);
    for (let i = 0; i < 6; i++) {
      const cx = i * 320 + 100;
      g.fillEllipse(cx, GAME_H - 20, 280, 140);
    }
  }
}
