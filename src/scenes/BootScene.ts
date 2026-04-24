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

    // 攻击动画素材
    this.load.image('char_attack1', 'assets/images/attack1.png');
    this.load.image('char_attack2', 'assets/images/attack2.png');
    this.load.image('char_attack3', 'assets/images/attack3.png');

    // 猪猪怪物素材
    this.load.image('pig_idle', 'assets/images/pig_idle.png');
    this.load.image('pig_run', 'assets/images/pig_run.png');
    this.load.image('pig_hurt', 'assets/images/pig_hurt.png');
  }

  create() {
    this.createPlayerAnimations();
    this.createPigAnimations();
    this.scene.start('PlayScene');
  }

  private createPlayerAnimations() {
    // 帧高度统一为 632（与站立帧一致）
    const frameH = 632;

    // 攻击帧原始尺寸 → 缩放到 frameH 高度
    const attackOrig = [
      { w: 875, h: 660 },  // attack1
      { w: 1062, h: 660 }, // attack2
      { w: 617, h: 644 },  // attack3
    ];
    const attackScaled = attackOrig.map(s => ({
      w: Math.round(s.w * frameH / s.h),
      h: frameH,
    }));

    // 帧宽度取所有帧中最大值（攻击帧比站立帧宽）
    const frameW = Math.max(474, ...attackScaled.map(s => s.w));
    const totalFrames = 8;

    const canvas = document.createElement('canvas');
    canvas.width = frameW * totalFrames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    // 行走/站立/攀爬帧（面向左，无需翻转）
    const standKeys = ['char_stand', 'char_run', 'char_run_end', 'char_climb1', 'char_climb2'];
    for (let i = 0; i < standKeys.length; i++) {
      const tex = this.textures.get(standKeys[i]);
      const src = tex.getSourceImage() as HTMLImageElement;
      const dx = Math.round((frameW - src.width) / 2);
      const dy = Math.round((frameH - src.height) / 2);
      ctx.drawImage(src, i * frameW + dx, dy);
    }

    // 攻击帧（水平翻转使面向左，缩放到 frameH 高度保持一致性）
    const attackKeys = ['char_attack1', 'char_attack2', 'char_attack3'];
    for (let i = 0; i < attackKeys.length; i++) {
      const tex = this.textures.get(attackKeys[i]);
      const src = tex.getSourceImage() as HTMLImageElement;
      const scaled = attackScaled[i];
      const dx = Math.round((frameW - scaled.w) / 2);
      const dy = Math.round((frameH - scaled.h) / 2);

      ctx.save();
      ctx.translate((5 + i) * frameW + frameW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(src, dx, dy, scaled.w, scaled.h);
      ctx.restore();
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
    // 攻击动画（帧5-7）
    this.anims.create({
      key: 'player_attack',
      frames: this.anims.generateFrameNumbers('player', { start: 5, end: 7 }),
      frameRate: 10,
      repeat: 0,
    });
  }

  private createPigAnimations() {
    // 猪猪怪物动画
    const srcW = 604;
    const srcH = 413;
    const frameW = srcW;
    const frameH = srcH;
    const totalFrames = 3;

    const canvas = document.createElement('canvas');
    canvas.width = frameW * totalFrames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    // 站立、跑动、受伤
    const keys = ['pig_idle', 'pig_run', 'pig_hurt'];
    for (let i = 0; i < keys.length; i++) {
      const tex = this.textures.get(keys[i]);
      const src = tex.getSourceImage() as HTMLImageElement;
      ctx.drawImage(src, i * frameW, 0, frameW, frameH);
    }

    const texture = this.textures.addCanvas('pig', canvas)!;
    for (let i = 0; i < totalFrames; i++) {
      texture.add(i, 0, i * frameW, 0, frameW, frameH);
    }

    // 站立动画（帧0）
    this.anims.create({
      key: 'pig_idle',
      frames: this.anims.generateFrameNumbers('pig', { start: 0, end: 0 }),
      frameRate: 4,
      repeat: -1,
    });
    // 跑动动画（帧1）
    this.anims.create({
      key: 'pig_run',
      frames: this.anims.generateFrameNumbers('pig', { start: 1, end: 1 }),
      frameRate: 6,
      repeat: -1,
    });
    // 受伤动画（帧2）
    this.anims.create({
      key: 'pig_hurt',
      frames: this.anims.generateFrameNumbers('pig', { start: 2, end: 2 }),
      frameRate: 8,
      repeat: 0,
    });
  }
}
