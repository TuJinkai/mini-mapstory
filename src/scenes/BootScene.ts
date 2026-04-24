import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from '../utils/constants';

export class BootScene extends Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const barWidth = GAME_WIDTH * 0.6;
    const barHeight = 16;
    const barX = cx - barWidth / 2;
    const barY = cy;

    const bg = this.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const bar = this.add.graphics();
    const text = this.add.text(cx, barY - 30, 'Loading...', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x6c63ff, 1);
      bar.fillRect(barX, barY, barWidth * value, barHeight);
      text.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
      text.destroy();
    });

    this.generatePlaceholderAssets();
  }

  create() {
    this.scene.start('PlayScene');
  }

  private generatePlaceholderAssets() {
    this.createPlayerSpritesheet();
    this.createPlatformGraphics();
    this.createLadderGraphics();
    this.createBackgroundGraphics();
  }

  private createPlayerSpritesheet() {
    const w = 32;
    const h = 48;
    const frames = 4;
    const canvas = document.createElement('canvas');
    canvas.width = w * frames;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const colors = [0x6c63ff, 0x7c73ff, 0x6c63ff, 0x5c53ef];
    for (let i = 0; i < frames; i++) {
      ctx.fillStyle = `#${colors[i].toString(16).padStart(6, '0')}`;
      ctx.fillRect(i * w + 8, 0, 16, 20);

      ctx.fillStyle = '#ffcc88';
      ctx.fillRect(i * w + 10, 4, 12, 12);

      ctx.fillStyle = `#${colors[i].toString(16).padStart(6, '0')}`;
      ctx.fillRect(i * w + 6, 20, 20, 16);

      ctx.fillStyle = '#4444aa';
      ctx.fillRect(i * w + 8, 36, 8, 12);
      ctx.fillRect(i * w + 18, 36, 8, 12);
    }

    const texture = this.textures.addCanvas('player', canvas)!;
    for (let i = 0; i < frames; i++) {
      texture.add(i, 0, i * w, 0, w, h);
    }
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
      frameRate: 8,
      repeat: -1,
    });
  }

  private createPlatformGraphics() {
    const g = this.add.graphics();
    g.fillStyle(0x4a7c59, 1);
    g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x5a9c69, 1);
    g.fillRect(0, 0, 64, 4);
    g.generateTexture('platform', 64, 16);
    g.destroy();
  }

  private createLadderGraphics() {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, 3, 64);
    ctx.fillRect(17, 0, 3, 64);

    ctx.fillStyle = '#A07828';
    for (let y = 6; y < 64; y += 12) {
      ctx.fillRect(3, y, 14, 2);
    }

    this.textures.addCanvas('ladder', canvas);
  }

  private createBackgroundGraphics() {
    const canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(0.5, '#2a2a5e');
    gradient.addColorStop(1, '#3a4a6e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * GAME_WIDTH;
      const sy = Math.random() * GAME_HEIGHT * 0.6;
      const sr = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    this.textures.addCanvas('background', canvas);
  }
}
