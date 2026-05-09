// ============================================================
//  OBSTACLES — modular obstacle factories
//
//  Reusable in any future Phaser 3 platformer. Each factory
//  takes a Phaser scene `s` and creates one obstacle of that
//  kind, attaching it to the proper physics group.
//
//  The scene must define these groups before calling:
//    s.platforms      (staticGroup)
//    s.crumbles       (group, allowGravity:false, immovable:true)
//    s.movers         (group, allowGravity:false, immovable:true)
//    s.oneWayGroup    (staticGroup)
//    s.spikes         (staticGroup)
//    s.saws           (group, allowGravity:false)
//    s.vines          (plain JS array — pendulum simulation)
//    s.theme          { accent: 0x... }   for tinting
//
//  And these textures must exist:
//    'platform','crumble','mover','oneway','spike','saw',
//    'vine','vine_grip'
// ============================================================
'use strict';

const Obstacles = {

  // standard floating platform
  platform(s, cx, cy, w) {
    const p = s.platforms.create(cx, cy, 'platform');
    p.setOrigin(0.5, 0.5);
    p.displayWidth = w;
    p.displayHeight = 16;
    p.refreshBody();
    if (s.theme && s.theme.accent) p.setTint(s.theme.accent);
    return p;
  },

  // crumbling platform — solid until stepped on, then drops; respawns after 4s
  crumble(s, cx, cy, w) {
    const c = s.crumbles.create(cx, cy, 'crumble');
    c.setOrigin(0.5, 0.5);
    c.displayWidth = w;
    c.displayHeight = 14;
    c.body.setSize(w, 14);
    c.body.checkCollision.down = false;
    c.body.checkCollision.left = false;
    c.body.checkCollision.right = false;
    c.crumbling = false;
    c.crumbleTimer = 0;
    c.originalY = cy;
    if (s.theme && s.theme.accent) c.setTint(s.theme.accent);
    return c;
  },

  // sine-wave moving platform — axis: 'horizontal' or 'vertical'
  mover(s, cx, cy, w, axis, range) {
    const m = s.movers.create(cx, cy, 'mover');
    m.setOrigin(0.5, 0.5);
    m.displayWidth = w;
    m.displayHeight = 14;
    m.body.setSize(w, 14);
    m.body.checkCollision.down = false;
    m.axis = axis;
    m.range = range;
    m.center = { x: cx, y: cy };
    m.phase = Math.random() * Math.PI * 2;
    m.speed = 0.7 + Math.random() * 0.4;
    return m;
  },

  // jump-up-through platform
  oneWay(s, cx, cy, w) {
    const o = s.oneWayGroup.create(cx, cy, 'oneway');
    o.setOrigin(0.5, 0.5);
    o.displayWidth = w;
    o.displayHeight = 8;
    o.body.setSize(w, 8);
    o.refreshBody();
    o.body.checkCollision.down = false;
    o.body.checkCollision.left = false;
    o.body.checkCollision.right = false;
    return o;
  },

  // rotating saw blade with motion
  saw(s, cx, cy, axis, speed, range) {
    const sw = s.saws.create(cx, cy, 'saw');
    sw.setOrigin(0.5, 0.5);
    sw.body.setCircle(16);
    sw.body.setOffset(2, 2);
    sw.axis = axis;
    sw.speed = speed;
    sw.range = range;
    sw.center = { x: cx, y: cy };
    sw.phase = Math.random() * Math.PI * 2;
    return sw;
  },

  // swinging vine — pendulum simulation. Returns a plain object,
  // not a Phaser sprite.
  vine(s, cx, anchorY, length) {
    const v = {
      anchor: { x: cx, y: anchorY },
      length: length,
      angle: 0,
      angleVel: 0,
      damping: 0.997,
      gripX: 0, gripY: 0,
      gripSprite: null,
      links: [],
      attached: false,
    };
    const linkCount = Math.floor(length / 8);
    for (let i = 0; i < linkCount; i++) {
      const link = s.add.image(cx, anchorY + i * 8, 'vine');
      link.setOrigin(0.5, 0);
      v.links.push(link);
    }
    v.gripSprite = s.add.image(cx, anchorY + length, 'vine_grip');
    v.gripSprite.setOrigin(0.5, 0.5);
    s.vines.push(v);
    return v;
  },

  // a row of spikes filling a horizontal pit
  spikePit(s, x, w, groundY) {
    const numSpikes = Math.ceil(w / 16);
    const startX = x + (w - numSpikes * 16) / 2;
    for (let i = 0; i < numSpikes; i++) {
      const spk = s.spikes.create(startX + i * 16 + 8, groundY + 50, 'spike');
      spk.setOrigin(0.5, 1);
      spk.refreshBody();
    }
  },
};

// -------------------------------------------------------------
//  Per-frame updaters for the obstacles. Call these from the
//  scene's update() loop.
// -------------------------------------------------------------
const ObstaclesUpdate = {

  crumbles(s) {
    s.crumbles.children.iterate(c => {
      if (!c || !c.active) return;
      if (c.crumbling) {
        c.crumbleTimer++;
        if (c.crumbleTimer > 36) {
          c.body.checkCollision.up = false;
          c.body.allowGravity = true;
          c.body.gravity.y = 800;
          if (c.crumbleTimer > 90) {
            c.disableBody(true, true);
            s.time.delayedCall(4000, () => {
              if (!c.scene) return;
              c.enableBody(true, c.x, c.originalY, true, true);
              c.body.allowGravity = false;
              c.body.checkCollision.up = true;
              c.crumbling = false;
              c.crumbleTimer = 0;
            });
          }
        }
      }
    });
  },

  movers(s) {
    s.movers.children.iterate(m => {
      if (!m || !m.active) return;
      m.phase += 0.016 * m.speed;
      if (m.axis === 'horizontal') {
        const targetX = m.center.x + Math.sin(m.phase) * m.range;
        m.setVelocityX((targetX - m.x) * 30);
      } else {
        const targetY = m.center.y + Math.sin(m.phase) * m.range;
        m.setVelocityY((targetY - m.y) * 30);
      }
    });
  },

  // Carry the player along when they're standing on top of a moving platform.
  // Phaser arcade physics doesn't do this automatically, so each frame we add
  // the platform's per-frame velocity to the player's position when their feet
  // are on top of it. Call AFTER `movers(s)` (so the velocity is up to date).
  carryPlayerOnMovers(s, player) {
    if (!player || !player.body) return;
    const onGround = player.body.blocked.down || player.body.touching.down;
    if (!onGround) return;
    const dt = 1 / 60;
    const playerBottom = player.body.y + player.body.height;
    s.movers.children.iterate(m => {
      if (!m || !m.active || !m.body) return;
      const platTop = m.body.y;
      // close-enough vertical alignment: player's feet near platform top
      if (Math.abs(playerBottom - platTop) > 6) return;
      // horizontal overlap
      const halfW = m.body.width / 2;
      if (Math.abs(player.x - m.x) > halfW + player.body.width / 2) return;
      // displace player by this frame's platform motion
      const dx = m.body.velocity.x * dt;
      const dy = m.body.velocity.y * dt;
      if (dx) player.x += dx;
      if (dy) player.y += dy;
    });
  },

  saws(s) {
    s.saws.children.iterate(sw => {
      if (!sw || !sw.active) return;
      sw.phase += 0.02 * (sw.speed / 60);
      sw.rotation += 0.4;
      if (sw.axis === 'horizontal') {
        const targetX = sw.center.x + Math.sin(sw.phase) * sw.range;
        sw.setVelocityX((targetX - sw.x) * 30);
      } else {
        const targetY = sw.center.y + Math.sin(sw.phase) * sw.range;
        sw.setVelocityY((targetY - sw.y) * 30);
      }
    });
  },

  vines(s, player) {
    if (player.vineCooldown > 0) player.vineCooldown--;
    for (const v of s.vines) {
      const gravTorque = -Math.sin(v.angle) * 0.012;
      v.angleVel += gravTorque;
      v.angleVel *= v.damping;
      v.angle += v.angleVel;
      v.gripX = v.anchor.x + Math.sin(v.angle) * v.length;
      v.gripY = v.anchor.y + Math.cos(v.angle) * v.length;
      for (let i = 0; i < v.links.length; i++) {
        const t = (i + 1) / v.links.length;
        v.links[i].x = v.anchor.x + Math.sin(v.angle) * v.length * t;
        v.links[i].y = v.anchor.y + Math.cos(v.angle) * v.length * t;
        v.links[i].rotation = -v.angle;
      }
      v.gripSprite.x = v.gripX;
      v.gripSprite.y = v.gripY;
      v.gripSprite.rotation = -v.angle;
      // attach
      if (!player.onVine && !v.attached && player.vineCooldown <= 0) {
        const dx = player.x - v.gripX;
        const dy = player.y - v.gripY;
        if (dx * dx + dy * dy < 32 * 32 && player.body.velocity.y > 30) {
          player.onVine = true;
          v.attached = true;
          player.attachedVine = v;
          v.angleVel += player.body.velocity.x * 0.0003;
        }
      }
      if (v.attached) {
        player.body.allowGravity = false;
        player.setPosition(v.gripX, v.gripY + 6);
        player.setVelocity(0, 0);
      }
    }
  },
};
