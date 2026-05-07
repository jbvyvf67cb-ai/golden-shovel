// ============================================================
//  BOOT SCENE — programmatic texture generation (no asset files)
//  All sprites for player, enemies, platforms, bosses, etc.
//  are drawn into off-screen graphics objects and registered
//  as Phaser textures.
// ============================================================
'use strict';

class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // -- player (Mr. Bananagram) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf5d547, 1); g.fillRoundedRect(4, 8, 20, 24, 6);
      g.fillStyle(0xc99728, 1); g.fillRoundedRect(4, 8, 20, 5, { tl: 6, tr: 6, bl: 0, br: 0 });
      g.fillStyle(0x6a4a2a, 1); g.fillRect(11, 2, 4, 8);
      g.fillStyle(0x4a2a1a, 1); g.fillRect(12, 0, 4, 4);
      g.fillStyle(0x000000, 1); g.fillRect(9, 16, 3, 4); g.fillRect(17, 16, 3, 4);
      g.fillStyle(0xffffff, 1); g.fillRect(10, 17, 1, 2); g.fillRect(18, 17, 1, 2);
      g.fillStyle(0x6a3a1a, 1); g.fillRect(11, 24, 6, 1); g.fillRect(10, 23, 1, 1); g.fillRect(17, 23, 1, 1);
      g.fillStyle(0x6a4a2a, 1); g.fillRect(8, 32, 4, 4); g.fillRect(16, 32, 4, 4);
      g.generateTexture('player', 28, 36);
      g.destroy();
    }
    // -- shovel projectile --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8a5a2a, 1); g.fillRect(0, 8, 18, 4);
      g.fillStyle(0x6a4a1f, 1); g.fillRect(0, 11, 18, 1);
      g.fillStyle(0xd4a437, 1); g.fillTriangle(18, 4, 28, 10, 18, 16);
      g.fillStyle(0xf5d870, 1); g.fillTriangle(18, 4, 26, 10, 18, 9);
      g.fillStyle(0xa8821f, 1); g.fillRect(16, 6, 3, 8);
      g.generateTexture('shovel', 28, 20);
      g.destroy();
    }
    // -- generic block tile (32x32) for tinting --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 32, 32);
      g.generateTexture('tile', 32, 32);
      g.destroy();
    }
    // -- ground tile --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 4, 32, 28);
      g.fillStyle(0xeeeeee, 1); g.fillRect(0, 0, 32, 4);
      g.lineStyle(1, 0x000000, 0.15);
      for (let i = 0; i < 32; i += 4) g.lineBetween(i, 4, i, 32);
      g.generateTexture('ground_tile', 32, 32);
      g.destroy();
    }
    // -- platform --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRoundedRect(0, 0, 96, 16, 5);
      g.fillStyle(0xeeeeee, 1);
      g.fillRect(4, 2, 88, 4);
      g.generateTexture('platform', 96, 16);
      g.destroy();
    }
    // -- W block --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd4a437, 1); g.fillRoundedRect(0, 0, 28, 28, 4);
      g.fillStyle(0xf5d870, 1); g.fillRoundedRect(2, 2, 24, 6, 2);
      g.lineStyle(2, 0x6a4a1a, 1); g.strokeRoundedRect(0, 0, 28, 28, 4);
      g.fillStyle(0x6a4a1a, 1);
      g.fillRect(6, 9, 2, 12);  g.fillRect(11, 9, 2, 12); g.fillRect(15, 9, 2, 12); g.fillRect(20, 9, 2, 12);
      g.fillRect(8, 18, 3, 3);  g.fillRect(13, 18, 2, 3); g.fillRect(17, 18, 3, 3);
      g.generateTexture('wblock', 28, 28);
      g.destroy();
    }
    // -- spike --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xb0b0b8, 1);
      g.fillTriangle(0, 16, 4, 0, 8, 16);
      g.fillTriangle(8, 16, 12, 0, 16, 16);
      g.fillStyle(0x808088, 1);
      g.fillTriangle(0, 16, 2, 0, 4, 16);
      g.fillTriangle(8, 16, 10, 0, 12, 16);
      g.generateTexture('spike', 16, 16);
      g.destroy();
    }
    // -- saw --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc0c0c8, 1); g.fillCircle(16, 16, 14);
      g.fillStyle(0xa0a0a8, 1);
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const tx = 16 + Math.cos(ang) * 14;
        const ty = 16 + Math.sin(ang) * 14;
        g.fillTriangle(
          tx, ty,
          16 + Math.cos(ang + 0.2) * 18, 16 + Math.sin(ang + 0.2) * 18,
          16 + Math.cos(ang - 0.2) * 18, 16 + Math.sin(ang - 0.2) * 18
        );
      }
      g.fillStyle(0x404048, 1); g.fillCircle(16, 16, 4);
      g.fillStyle(0xc0c0c8, 1); g.fillCircle(16, 16, 2);
      g.generateTexture('saw', 36, 36);
      g.destroy();
    }
    // -- vine link --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a6a2a, 1); g.fillRect(2, 0, 4, 8);
      g.fillStyle(0x6a8a3a, 1); g.fillRect(3, 0, 1, 8);
      g.generateTexture('vine', 8, 8);
      g.destroy();
    }
    // -- vine grip --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a6a2a, 1); g.fillCircle(8, 8, 8);
      g.fillStyle(0x6a8a3a, 1); g.fillCircle(6, 6, 4);
      g.fillStyle(0x8aa83a, 1); g.fillCircle(5, 5, 2);
      g.generateTexture('vine_grip', 16, 16);
      g.destroy();
    }
    // -- crumble --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xa48050, 1); g.fillRoundedRect(0, 0, 96, 14, 3);
      g.lineStyle(1, 0x4a2a10, 0.6);
      g.lineBetween(20, 2, 16, 12); g.lineBetween(50, 2, 56, 11); g.lineBetween(78, 3, 72, 12);
      g.lineBetween(35, 4, 40, 13); g.lineBetween(65, 1, 60, 11);
      g.generateTexture('crumble', 96, 14);
      g.destroy();
    }
    // -- moving platform --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x7a8a9a, 1); g.fillRoundedRect(0, 0, 96, 14, 3);
      g.fillStyle(0x9aaab8, 1); g.fillRect(4, 2, 88, 3);
      g.fillStyle(0x4a5a6a, 1); g.fillRect(0, 11, 96, 3);
      for (let i = 8; i < 96; i += 16) {
        g.fillStyle(0x404050, 1); g.fillCircle(i, 9, 1.5);
      }
      g.generateTexture('mover', 96, 14);
      g.destroy();
    }
    // -- one-way --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8a5a2a, 1); g.fillRect(0, 0, 96, 8);
      g.fillStyle(0xa86a3a, 1); g.fillRect(0, 0, 96, 2);
      g.fillStyle(0x6a3a1a, 1); g.fillRect(0, 7, 96, 1);
      g.generateTexture('oneway', 96, 8);
      g.destroy();
    }
    // -- jaguar enemy --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc88a2a, 1); g.fillRoundedRect(2, 12, 28, 14, 5);
      g.fillStyle(0xa86a1a, 1); g.fillRoundedRect(2, 12, 28, 4, 3);
      g.fillStyle(0x6a3a0a, 1);
      g.fillCircle(8, 18, 2); g.fillCircle(16, 20, 2); g.fillCircle(24, 17, 2);
      g.fillStyle(0xc88a2a, 1); g.fillRoundedRect(22, 6, 10, 10, 3);
      g.fillStyle(0xff3a3a, 1); g.fillRect(28, 9, 2, 2);
      g.fillStyle(0x6a3a0a, 1); g.fillRect(4, 26, 4, 4); g.fillRect(22, 26, 4, 4);
      g.fillStyle(0xc88a2a, 1); g.fillRect(0, 14, 4, 6);
      g.generateTexture('jaguar', 32, 32);
      g.destroy();
    }
    // -- spider --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4a2a4a, 1); g.fillCircle(14, 16, 10);
      g.fillStyle(0x6a3a6a, 1); g.fillCircle(11, 13, 5);
      g.fillStyle(0xff5a5a, 1); g.fillRect(10, 12, 2, 2); g.fillRect(15, 12, 2, 2);
      g.lineStyle(2, 0x2a1a2a, 1);
      for (let i = 0; i < 4; i++) {
        const y = 12 + i * 2;
        g.lineBetween(4, y, 0, y - 2); g.lineBetween(24, y, 28, y - 2);
      }
      g.generateTexture('spider', 28, 28);
      g.destroy();
    }
    // -- parrot --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x3a8a3a, 1); g.fillEllipse(14, 14, 22, 16);
      g.fillStyle(0xc02a2a, 1); g.fillEllipse(14, 10, 16, 8);
      g.fillStyle(0x2a6a2a, 1); g.fillTriangle(10, 12, 4, 6, 14, 14);
      g.fillStyle(0xf4a44a, 1); g.fillTriangle(22, 12, 28, 14, 22, 16);
      g.fillStyle(0x000000, 1); g.fillRect(18, 11, 2, 2);
      g.generateTexture('parrot', 28, 24);
      g.destroy();
    }
    // -- specter --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc4c0e8, 0.85); g.fillEllipse(16, 14, 28, 20);
      g.fillStyle(0xc4c0e8, 0.55);
      g.fillCircle(8, 28, 3); g.fillCircle(16, 30, 4); g.fillCircle(24, 28, 3);
      g.fillStyle(0x1a1430, 1); g.fillRect(10, 12, 3, 4); g.fillRect(19, 12, 3, 4);
      g.generateTexture('specter', 32, 32);
      g.destroy();
    }
    // -- moth --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xb8a0d0, 1); g.fillTriangle(2, 8, 14, 4, 14, 18);
      g.fillStyle(0xb8a0d0, 1); g.fillTriangle(26, 8, 14, 4, 14, 18);
      g.fillStyle(0xe0d0e8, 1); g.fillCircle(6, 8, 2); g.fillCircle(22, 8, 2);
      g.fillStyle(0x4a3a5a, 1); g.fillEllipse(14, 12, 5, 12);
      g.generateTexture('moth', 28, 22);
      g.destroy();
    }
    // -- BOSSES — one programmatic design per level --
    for (let i = 0; i < 9; i++) this.makeBossTexture(i);

    // -- boss projectile (seed-pod / spore / silken needle) --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      // outer glow
      g.fillStyle(0xd4a437, 0.35); g.fillCircle(10, 10, 10);
      // body
      g.fillStyle(0x8a5a2a, 1); g.fillEllipse(10, 10, 14, 10);
      g.fillStyle(0x6a3a1a, 1); g.fillEllipse(10, 12, 10, 5);
      // highlight
      g.fillStyle(0xf5d870, 1); g.fillEllipse(8, 8, 4, 2);
      g.generateTexture('boss_proj', 20, 20);
      g.destroy();
    }

    // -- particle dot --
    {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4);
      g.generateTexture('dot', 4, 4);
      g.destroy();
    }

    this.scene.start('Play');
  }

  makeBossTexture(idx) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const W = 96, H = 96;
    switch (idx) {
      case 0: // Bramble Sentinel
        g.fillStyle(0x3a4a1a, 1); g.fillRoundedRect(8, 24, 80, 64, 12);
        g.fillStyle(0x5a6a2a, 1); g.fillRoundedRect(12, 28, 72, 30, 10);
        g.fillStyle(0x8a8a4a, 1);
        for (let t = 0; t < 8; t++) {
          const tx = 14 + t * 9;
          g.fillTriangle(tx, 24, tx + 4, 16, tx + 8, 24);
        }
        g.fillStyle(0xff3a3a, 1); g.fillCircle(48, 50, 12);
        g.fillStyle(0x6a0000, 1); g.fillCircle(48, 50, 6);
        g.fillStyle(0xffffff, 1); g.fillCircle(45, 47, 2);
        break;
      case 1: // Reed Reaver
        g.fillStyle(0x6a8a4a, 1); g.fillRoundedRect(32, 8, 32, 80, 8);
        g.fillStyle(0x4a6a2a, 1); g.fillRect(34, 12, 4, 76);
        g.fillStyle(0xfff8c4, 1); g.fillCircle(48, 36, 14);
        g.fillStyle(0x000000, 1); g.fillRect(42, 32, 4, 4); g.fillRect(50, 32, 4, 4);
        g.fillStyle(0x6a0000, 1);
        g.fillTriangle(40, 42, 42, 50, 44, 42);
        g.fillTriangle(44, 42, 46, 50, 48, 42);
        g.fillTriangle(48, 42, 50, 50, 52, 42);
        g.fillTriangle(52, 42, 54, 50, 56, 42);
        g.fillStyle(0x6a8a4a, 1); g.fillRect(8, 50, 24, 4); g.fillRect(64, 50, 24, 4);
        break;
      case 2: // Thorn Wrappling
        g.fillStyle(0x3a4a1a, 1); g.fillCircle(48, 50, 38);
        g.lineStyle(4, 0x6a3a1a, 1);
        for (let r = 14; r < 38; r += 7) g.strokeCircle(48, 50, r);
        g.fillStyle(0xa8a87a, 1);
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          g.fillTriangle(
            48 + Math.cos(ang) * 38, 50 + Math.sin(ang) * 38,
            48 + Math.cos(ang + 0.1) * 46, 50 + Math.sin(ang + 0.1) * 46,
            48 + Math.cos(ang - 0.1) * 46, 50 + Math.sin(ang - 0.1) * 46
          );
        }
        g.fillStyle(0xffaa3a, 1); g.fillCircle(48, 50, 8);
        g.fillStyle(0x000000, 1); g.fillRect(45, 48, 6, 2);
        break;
      case 3: // Hush-Owl
        g.fillStyle(0x6a5a8a, 1); g.fillEllipse(48, 56, 70, 60);
        g.fillStyle(0x4a3a6a, 1); g.fillEllipse(48, 70, 70, 30);
        g.fillStyle(0xfff8c4, 1); g.fillCircle(32, 44, 12); g.fillCircle(64, 44, 12);
        g.fillStyle(0xd4a437, 1); g.fillCircle(32, 44, 8); g.fillCircle(64, 44, 8);
        g.fillStyle(0x000000, 1); g.fillCircle(32, 44, 4); g.fillCircle(64, 44, 4);
        g.fillStyle(0xa86a2a, 1); g.fillTriangle(44, 56, 52, 56, 48, 64);
        g.fillStyle(0x6a5a8a, 1);
        g.fillTriangle(20, 30, 26, 14, 30, 32);
        g.fillTriangle(66, 32, 70, 14, 76, 30);
        break;
      case 4: // Pollen Drifter
        g.fillStyle(0xf4d870, 0.4); g.fillCircle(48, 48, 44);
        g.fillStyle(0xf4d870, 1); g.fillCircle(48, 48, 24);
        g.fillStyle(0xfff8c4, 0.7);
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * Math.PI * 2;
          g.fillCircle(48 + Math.cos(ang) * 36, 48 + Math.sin(ang) * 36, 4);
        }
        g.fillStyle(0x000000, 1); g.fillRect(40, 44, 3, 5); g.fillRect(53, 44, 3, 5);
        g.fillStyle(0x6a3a1a, 1); g.fillRect(42, 54, 12, 2);
        break;
      case 5: // Root Devourer
        g.fillStyle(0x4a3a2a, 1); g.fillRoundedRect(8, 16, 80, 72, 14);
        g.fillStyle(0x2a1a1a, 1); g.fillEllipse(48, 56, 50, 36);
        g.fillStyle(0xfff8c4, 1);
        for (let i = 0; i < 5; i++) g.fillTriangle(28 + i*10, 40, 32 + i*10, 52, 36 + i*10, 40);
        for (let i = 0; i < 5; i++) g.fillTriangle(28 + i*10, 72, 32 + i*10, 60, 36 + i*10, 72);
        g.fillStyle(0xff3a3a, 1); g.fillRect(20, 24, 14, 6); g.fillRect(60, 24, 14, 6);
        g.fillStyle(0x4a3a2a, 1);
        g.fillTriangle(8, 16, 20, 4, 24, 18);
        g.fillTriangle(40, 14, 50, 0, 56, 16);
        g.fillTriangle(70, 16, 80, 4, 88, 18);
        break;
      case 6: // Meadow Mantis
        g.fillStyle(0x4aa84a, 1); g.fillEllipse(48, 56, 56, 50);
        g.fillStyle(0x6ac86a, 1); g.fillEllipse(48, 38, 28, 28);
        g.fillStyle(0xfff870, 1); g.fillCircle(38, 36, 6); g.fillCircle(58, 36, 6);
        g.fillStyle(0x000000, 1); g.fillCircle(38, 36, 2); g.fillCircle(58, 36, 2);
        g.fillStyle(0x2a6a2a, 1);
        g.fillTriangle(40, 50, 36, 56, 44, 54);
        g.fillTriangle(56, 50, 60, 56, 52, 54);
        g.fillStyle(0x4aa84a, 1);
        g.fillRect(8, 32, 18, 6); g.fillRect(8, 32, 6, 16);
        g.fillRect(70, 32, 18, 6); g.fillRect(82, 32, 6, 16);
        break;
      case 7: // Silken Weaver
        g.fillStyle(0x6a5a8a, 1); g.fillCircle(48, 50, 36);
        g.fillStyle(0x4a3a6a, 1); g.fillCircle(48, 50, 22);
        g.fillStyle(0xff5a8a, 1);
        g.fillCircle(38, 42, 3); g.fillCircle(58, 42, 3);
        g.fillCircle(34, 50, 2); g.fillCircle(62, 50, 2);
        g.fillCircle(42, 56, 2); g.fillCircle(54, 56, 2);
        g.lineStyle(3, 0x2a1a3a, 1);
        for (let a = 0; a < 6; a++) {
          const ang = (a / 6) * Math.PI * 2 - Math.PI / 4;
          g.lineBetween(
            48 + Math.cos(ang) * 36, 50 + Math.sin(ang) * 36,
            48 + Math.cos(ang) * 50, 50 + Math.sin(ang) * 50
          );
        }
        break;
      case 8: // Loom-Weaver
        g.fillStyle(0x8a6a3a, 1); g.fillRoundedRect(8, 12, 80, 76, 12);
        g.fillStyle(0xd4a437, 1); g.fillRoundedRect(14, 18, 68, 64, 8);
        g.fillStyle(0xf5d870, 1);
        for (let i = 0; i < 4; i++) g.fillTriangle(20 + i*16, 12, 28 + i*16, 0, 36 + i*16, 12);
        g.fillStyle(0x4a3a1a, 1); g.fillRect(28, 36, 8, 10); g.fillRect(60, 36, 8, 10);
        g.fillStyle(0xfff8c4, 1); g.fillCircle(48, 60, 12);
        g.fillStyle(0xd4a437, 1); g.fillCircle(48, 60, 6);
        g.lineStyle(1, 0xfff8c4, 0.7);
        for (let i = 0; i < 5; i++) {
          g.lineBetween(14 + i*14, 18, 14 + i*14, 82);
        }
        break;
    }
    g.generateTexture('boss' + idx, W, H);
    g.destroy();
  }
}
