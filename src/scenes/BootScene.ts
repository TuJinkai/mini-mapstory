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

    this.load.image('bg001', 'assets/images/bg001.png');
    this.load.image('pt001', 'assets/images/pt001.png');
    this.load.image('pt002', 'assets/images/pt002.png');
    this.load.image('tizi01', 'assets/images/tizi01.png');
    this.load.image('char_stand', 'assets/images/stand_left.png');
    this.load.image('char_run', 'assets/images/run_left.png');
    this.load.image('char_run_end', 'assets/images/run_end_left.png');
    this.load.image('char_climb1', 'assets/images/climb1.png');
    this.load.image('char_climb2', 'assets/images/climb2.png');
  }

  create() {
    this.createPlayerAnimations();
    this.scene.start('PlayScene');
  }

  private createPlayerAnimations() {
    // 用5张图拼成一个 spritesheet 作为动画帧
    // 素材 474x632，取合理裁剪区域后缩放
    const srcW = 474;
    const srcH = 632;
    const frameW = srcW;
    const frameH = srcH;
    const totalFrames = 5;

    const canvas = document.createElement('canvas');
    canvas.width = frameW * totalFrames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    // 从已加载的纹理中提取像素绘制到 canvas
    const keys = ['char_stand', 'char_run', 'char_run_end', 'char_climb1', 'char_climb2'];
    for (let i = 0; i < keys.length; i++) {
      const tex = this.textures.get(keys[i]);
      const src = tex.getSourceImage() as HTMLImageElement;
      ctx.drawImage(src, i * frameW, 0, frameW, frameH);
    }

    const texture = this.textures.addCanvas('player', canvas)!;
    for (let i = 0; i < totalFrames; i++) {
      texture.add(i, 0, i * frameW, 0, frameW, frameH);
    }

    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 2 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 1 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player_climb',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 4 }),
      frameRate: 4,
      repeat: -1,
    });
  }
}
