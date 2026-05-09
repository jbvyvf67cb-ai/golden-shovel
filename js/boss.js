// ============================================================
//  BOSS — controller for the per-level boss fight
//
//  Behavior:
//   - Patrols horizontally with sine motion + occasional dash
//     toward the player.
//   - Cycles between SHIELD_UP (~4-5s, invulnerable) and
//     VULNERABLE (~1.5-2s, can be hit). Shield is visible.
//   - During SHIELD_UP, telegraphs throw attacks: a brief
//     wind-up tint, then launches an arcing seed-pod projectile
//     at the player.
//   - When hit while vulnerable -> opens compose UI.
//   - Each cycle (after the player adds a word and continues),
//     boss gets a little harder: shorter vulnerable window,
//     more frequent throws, slightly faster movement.
//
//  Tunables live in the BOSS_CFG block at top.
// ============================================================
'use strict';

const BOSS_CFG = {
  shieldUpFrames:    300,     // ~5 sec at 60fps
  vulnerableFrames:  120,     // ~2 sec at 60fps
  shieldUpFramesMin: 180,     // minimum shield duration after multiple hits
  throwIntervalMin:  90,      // frames between throws (when shielded)
  throwIntervalMax:  180,
  throwTelegraph:    25,      // wind-up frames before launch
  throwSpeedX:       260,
  throwSpeedY:      -340,     // launches up-and-toward
  throwGravity:      720,     // gravity applied to projectiles
  moveRange:         140,
  moveSpeed:         0.022,
  dashChance:        0.004,   // per frame while shielded
  dashSpeed:         180,
  invulnAfterCompose: 36,     // grace frames so player can't insta-hit
};

const Boss = {
  // create boss + arena wall + UI hooks. Stash boss on scene.boss.
  spawn(s) {
    if (s.bossSpawned) return;
    s.bossSpawned = true;
    const groundY = s.groundY;

    // invisible wall to keep player in arena
    s.bossWall = s.physics.add.staticImage(s.bossSpawnX - 240, GAME_H / 2, 'tile');
    s.bossWall.displayWidth = 8;
    s.bossWall.displayHeight = GAME_H + 200;
    s.bossWall.setVisible(false);
    s.bossWall.refreshBody();
    s.physics.add.collider(s.player, s.bossWall);
    s.physics.add.collider(s.enemies, s.bossWall);

    // boss sprite
    const bx = s.bossSpawnX + 200;
    const by = groundY - 50;
    const b = s.physics.add.sprite(bx, by, 'boss' + s.levelIdx);
    b.setOrigin(0.5, 1);
    b.body.allowGravity = false;
    // Body extends from the boss's head DOWN to the ground. The boss sprite
    // floats 50px above the ground, but the hitbox should reach the ground
    // so that shovels thrown at player chest height can connect with it.
    // Body height = 80 (sprite hitbox) + 50 (floating gap) = 130.
    b.body.setSize(72, 130).setOffset(12, 12);
    b.setDepth(5);
    b.setAlpha(1);
    b.setScale(1);
    b.setAngle(0);
    b.clearTint();

    b.center = { x: bx, y: by };
    b.dir = -1;
    b.range = BOSS_CFG.moveRange;
    b.speed = BOSS_CFG.moveSpeed * (1 + s.levelIdx * 0.05);
    b.phase = 0;

    b.shieldUp = true;
    b.shieldFrames = BOSS_CFG.shieldUpFrames; // counts down
    b.invulnFrames = 0;                       // post-compose grace
    b.vulnerableFrames = BOSS_CFG.vulnerableFrames;

    b.throwTimer = 60 + Math.random() * 60;
    b.throwTelegraph = 0;     // counts down during wind-up
    b.cycleCount = 0;         // increments each shield-up cycle

    b.flashTimer = 0;
    b.dashVel = 0;

    // shield graphics
    b.shieldGfx = s.add.graphics();
    b.shieldGfx.setDepth(6);

    // boss projectiles group
    s.bossProjectiles = s.physics.add.group({ allowGravity: false });

    // collisions
    // Phaser sometimes swaps the order of args in overlap callbacks
    // depending on which object is the Group, which is a single sprite,
    // and physics tree internals. We normalize inside each callback by
    // detecting which arg is the boss.
    s.physics.add.overlap(s.player, b, (a1, a2) => {
      const boss = (a1 === b) ? a1 : a2;
      const player = (a1 === b) ? a2 : a1;
      Boss.onPlayerHit(s, player, boss);
    });
    s.physics.add.overlap(s.projectiles, b, (a1, a2) => {
      const boss = (a1 === b) ? a1 : a2;
      const proj = (a1 === b) ? a2 : a1;
      Boss.onShovelHit(s, proj, boss);
    });
    s.physics.add.overlap(s.player, s.bossProjectiles, (p, pr) => Boss.onPlayerProjHit(s, p, pr));
    s.physics.add.collider(s.bossProjectiles, s.platforms, (pr, _g) => { pr.destroy(); });

    s.boss = b;
    s.bossActive = true;
    showBossBanner(s.level.bossName, s.level.endWord);
    GAME.currentLineWords = [];
  },

  // per-frame update
  update(s) {
    const b = s.boss;
    if (!b || !b.active) return;

    // movement: sine sweep + optional dash
    b.phase += b.speed;
    let targetX = b.center.x + Math.sin(b.phase) * b.range;

    // occasional dash toward player while shielded
    if (b.shieldUp && Math.random() < BOSS_CFG.dashChance) {
      const dirToPlayer = (s.player.x < b.x) ? -1 : 1;
      b.dashVel = dirToPlayer * BOSS_CFG.dashSpeed;
    }
    if (b.dashVel !== 0) {
      targetX += b.dashVel * (1/60);
      b.dashVel *= 0.93;
      if (Math.abs(b.dashVel) < 8) b.dashVel = 0;
    }
    // ALWAYS clamp inside the arena so a large `range` value can't swing the
    // boss past the world bounds and make it visually disappear.
    const arenaMin = s.bossSpawnX - 100;
    const arenaMax = s.levelWidth - 80;
    if (targetX < arenaMin) targetX = arenaMin;
    if (targetX > arenaMax) targetX = arenaMax;
    b.x = targetX;
    // face the player
    b.setFlipX(s.player.x > b.x);

    // ----- shield cycle -----
    if (b.invulnFrames > 0) {
      b.invulnFrames--;
      // post-compose grace: shield up & no throws
      b.shieldUp = true;
    } else if (b.shieldUp) {
      b.shieldFrames--;
      // throw attacks while shielded
      if (b.throwTelegraph > 0) {
        b.throwTelegraph--;
        if (b.throwTelegraph === 0) {
          Boss.fireProjectile(s, b);
        }
      } else {
        b.throwTimer--;
        if (b.throwTimer <= 0) {
          // start telegraph
          b.throwTelegraph = BOSS_CFG.throwTelegraph;
          b.setTint(0xffaaaa);
          Audio.shieldHit();
        }
      }
      // drop shield when timer expires
      if (b.shieldFrames <= 0) {
        b.shieldUp = false;
        b.vulnerableFrames = Math.max(60, BOSS_CFG.vulnerableFrames - b.cycleCount * 8);
        b.throwTelegraph = 0;
        b.clearTint();
      }
    } else {
      // VULNERABLE
      b.vulnerableFrames--;
      // pulsing red
      if (Math.floor(b.vulnerableFrames / 6) % 2 === 0) b.setTint(0xff7777);
      else b.clearTint();
      if (b.vulnerableFrames <= 0) {
        b.shieldUp = true;
        b.cycleCount++;
        b.shieldFrames = Math.max(BOSS_CFG.shieldUpFramesMin,
                                  BOSS_CFG.shieldUpFrames - b.cycleCount * 18);
        b.throwTimer = BOSS_CFG.throwIntervalMin
          + Math.random() * (BOSS_CFG.throwIntervalMax - BOSS_CFG.throwIntervalMin);
        b.clearTint();
      }
    }

    // post-hit flash
    if (b.flashTimer > 0) {
      b.flashTimer--;
      if (b.flashTimer === 0 && b.shieldUp) b.clearTint();
    }

    // ----- shield graphic -----
    Boss.drawShield(s, b);

    // ----- update boss projectiles (manual gravity) -----
    if (s.bossProjectiles) {
      s.bossProjectiles.children.iterate(p => {
        if (!p || !p.active) return;
        p.body.velocity.y += BOSS_CFG.throwGravity * (1/60);
        p.rotation += 0.18;
        if (p.x < -50 || p.x > s.levelWidth + 50 || p.y > GAME_H + 100) {
          p.destroy();
        }
      });
    }
  },

  drawShield(s, b) {
    const gfx = b.shieldGfx;
    gfx.clear();
    if (b.shieldUp) {
      // hex/circular shield
      const pulse = 0.85 + Math.sin(s.time.now * 0.006) * 0.15;
      gfx.lineStyle(4, 0xa0d0ff, 0.7 * pulse);
      gfx.strokeCircle(b.x, b.y - 40, 58);
      gfx.lineStyle(2, 0xffffff, 0.45 * pulse);
      gfx.strokeCircle(b.x, b.y - 40, 50);
      // little hex pattern hints around the rim
      gfx.lineStyle(1, 0xa0d0ff, 0.45 * pulse);
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2 + s.time.now * 0.0007;
        const ix = b.x + Math.cos(ang) * 56;
        const iy = (b.y - 40) + Math.sin(ang) * 56;
        gfx.strokeCircle(ix, iy, 4);
      }
      // wind-up flash
      if (b.throwTelegraph > 0) {
        const tf = b.throwTelegraph / BOSS_CFG.throwTelegraph;
        gfx.fillStyle(0xff8855, 0.4 * (1 - tf));
        gfx.fillCircle(b.x, b.y - 40, 30 + (1 - tf) * 30);
      }
    } else {
      // VULNERABLE — make this VERY obvious. The shield is gone; the boss
      // pulses with a red aura, has a thick dashed red attack ring, and
      // shows a big bold "HIT!" arrow above the head.
      const phase = s.time.now * 0.014;
      const pulse = 0.6 + Math.sin(phase) * 0.4;
      // Large red glow halo around the boss
      gfx.fillStyle(0xff2244, 0.18 * pulse);
      gfx.fillCircle(b.x, b.y - 40, 75);
      gfx.fillStyle(0xff5577, 0.30 * pulse);
      gfx.fillCircle(b.x, b.y - 40, 60);
      // Thick outer red dashed ring (the "target")
      gfx.lineStyle(6, 0xff3355, 0.85);
      const segs = 12;
      for (let i = 0; i < segs; i += 2) {
        const a1 = (i / segs) * Math.PI * 2 + phase * 0.4;
        const a2 = ((i + 1) / segs) * Math.PI * 2 + phase * 0.4;
        gfx.beginPath();
        gfx.arc(b.x, b.y - 40, 70, a1, a2, false);
        gfx.strokePath();
      }
      // Inner thinner ring rotating opposite
      gfx.lineStyle(3, 0xffaaaa, 0.7);
      for (let i = 0; i < segs; i += 2) {
        const a1 = (i / segs) * Math.PI * 2 - phase * 0.6;
        const a2 = ((i + 1) / segs) * Math.PI * 2 - phase * 0.6;
        gfx.beginPath();
        gfx.arc(b.x, b.y - 40, 56, a1, a2, false);
        gfx.strokePath();
      }
      // Big bouncing red downward-pointing arrow above the boss head
      // pointing at the boss to say "hit me here"
      const bounce = Math.sin(s.time.now * 0.012) * 4;
      const ay = b.y - 120 + bounce;
      gfx.fillStyle(0xff2244, 1);
      // arrow shaft
      gfx.fillRect(b.x - 4, ay, 8, 18);
      // arrow head (downward triangle)
      gfx.fillTriangle(b.x - 14, ay + 18, b.x + 14, ay + 18, b.x, ay + 32);
      // small "HIT!" label-ish marks around the arrow
      gfx.fillStyle(0xffff66, 0.9);
      gfx.fillCircle(b.x - 22, ay + 8, 2);
      gfx.fillCircle(b.x + 22, ay + 8, 2);
    }
  },

  fireProjectile(s, b) {
    if (!s.player || !s.player.active) return;
    const proj = s.bossProjectiles.create(b.x, b.y - 40, 'boss_proj');
    proj.setOrigin(0.5, 0.5);
    proj.body.allowGravity = false;
    // aim toward where player is
    const dx = s.player.x - b.x;
    const dist = Math.max(40, Math.abs(dx));
    const t = dist / BOSS_CFG.throwSpeedX; // approx travel time horizontally
    let vx = (dx >= 0 ? 1 : -1) * BOSS_CFG.throwSpeedX;
    // slight randomization
    vx *= 0.85 + Math.random() * 0.3;
    let vy = BOSS_CFG.throwSpeedY * (0.85 + Math.random() * 0.25);
    proj.setVelocity(vx, vy);
    proj.body.setSize(14, 14).setOffset(3, 3);
    Audio.bossThrow();
    // little muzzle flash
    if (s.dustParticles) s.dustParticles.emitParticleAt(b.x, b.y - 40, 6);
    // clear tint after launch
    s.time.delayedCall(120, () => { if (b.active && b.shieldUp && b.throwTelegraph === 0) b.clearTint(); });
  },

  onShovelHit(s, proj, b) {
    if (!s.bossActive || s.bossDefeated) return;
    if (!b || !b.active) return;
    if (b.invulnFrames > 0) {
      proj.setVelocity(-proj.body.velocity.x * 0.6, -200);
      Audio.shieldHit();
      return;
    }
    if (b.shieldUp) {
      // bounce off shield
      proj.setVelocity(-proj.body.velocity.x * 0.6, -200);
      Audio.shieldHit();
      return;
    }
    // hit!
    proj.destroy();
    Audio.bossHit();
    b.setTint(0xff8888);
    b.flashTimer = 14;
    s.cameras.main.shake(180, 0.008);
    // open compose
    s.openCompose();
  },

  onPlayerHit(s, player, b) {
    if (!s.bossActive || s.bossDefeated) return;
    if (s.time.now < GAME.invincibleUntil) return;
    s.damagePlayer(1);
    const dx = player.x - b.x;
    player.setVelocity(dx >= 0 ? 280 : -280, -360);
  },

  onPlayerProjHit(s, player, proj) {
    if (!s.bossActive || s.bossDefeated) return;
    if (s.time.now < GAME.invincibleUntil) return;
    proj.destroy();
    s.damagePlayer(1);
    const dx = player.x - (proj.x);
    player.setVelocity(dx >= 0 ? 220 : -220, -300);
  },

  // called after compose closes (timeout OR Continue Fight, but NOT Done).
  // We reset the existing boss sprite's state in-place. Destroy/respawn was
  // attractive for cleanliness but caused stale overlap colliders: Phaser
  // arcade physics doesn't auto-remove a collider when the body is
  // destroyed, so old destroyed bosses kept "catching" projectiles with
  // wiped properties (shieldUp=undefined → falsy → bypass shield).
  resumeAfterCompose(s) {
    const b = s.boss;
    if (!b) return;
    // Kill any tween still targeting the boss sprite — that's the most
    // likely cause of "boss disappears" (a leftover tween fading alpha or
    // shrinking scale to 0).
    if (s.tweens && s.tweens.killTweensOf) s.tweens.killTweensOf(b);
    // Reset every visual property the boss could possibly be in.
    b.setAlpha(1);
    b.setScale(1);
    b.setAngle(0);
    b.setVisible(true);
    if (!b.active) b.setActive(true);
    b.clearTint();
    // Re-set the texture from the level's known boss texture so that even
    // if something corrupted it, it's restored.
    try { b.setTexture('boss' + s.levelIdx); } catch (e) { /* ignore */ }
    // Snap position back into the arena center if x/y went non-finite.
    if (!isFinite(b.x) || !isFinite(b.y)) {
      b.x = b.center.x;
      b.y = b.center.y;
    }
    // Reset gameplay state — bump cycle so difficulty progresses.
    b.cycleCount = (b.cycleCount || 0) + 1;
    b.shieldUp = true;
    b.shieldFrames = Math.max(BOSS_CFG.shieldUpFramesMin,
                              BOSS_CFG.shieldUpFrames - b.cycleCount * 18);
    b.vulnerableFrames = Math.max(60, BOSS_CFG.vulnerableFrames - b.cycleCount * 8);
    b.invulnFrames = BOSS_CFG.invulnAfterCompose;
    b.throwTimer = 30 + Math.random() * 60;
    b.throwTelegraph = 0;
    b.flashTimer = 0;
    b.dashVel = 0;
    b.range = Math.min((b.range || BOSS_CFG.moveRange) + 12, 180);
    // Make sure the physics body is enabled (in case something disabled it).
    if (b.body) {
      b.body.enable = true;
      b.body.checkCollision.none = false;
    }
  },

  // hard despawn on defeat
  despawn(s) {
    if (!s.boss) return;
    if (s.bossProjectiles) s.bossProjectiles.clear(true, true);
    s.boss.shieldGfx.destroy();
    s.boss.destroy();
    s.boss = null;
  },
};
