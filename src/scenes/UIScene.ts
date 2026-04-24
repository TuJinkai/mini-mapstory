import { Scene } from 'phaser';
import { GAME_WIDTH } from '../utils/constants';

export class UIScene extends Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private expBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private expText!: Phaser.GameObjects.Text;

  private hp = 100;
  private maxHp = 100;
  private mp = 80;
  private maxMp = 80;
  private level = 1;
  private exp = 0;
  private expToNext = 50;

  private levelUpText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('UIScene');
  }

  create() {
    const barWidth = 120;
    const barHeight = 8;
    const startX = 10;
    const startY = 10;

    // 背景条
    this.add.rectangle(startX + barWidth / 2, startY + barHeight / 2, barWidth + 4, barHeight + 4, 0x000000, 0.5)
      .setOrigin(0.5).setScrollFactor(0);
    this.add.rectangle(startX + barWidth / 2, startY + barHeight + 10, barWidth + 4, barHeight + 4, 0x000000, 0.5)
      .setOrigin(0.5).setScrollFactor(0);
    this.add.rectangle(startX + barWidth / 2, startY + barHeight * 2 + 20, barWidth + 4, barHeight + 4, 0x000000, 0.5)
      .setOrigin(0.5).setScrollFactor(0);

    this.hpBar = this.add.graphics().setScrollFactor(0);
    this.mpBar = this.add.graphics().setScrollFactor(0);
    this.expBar = this.add.graphics().setScrollFactor(0);

    this.levelText = this.add.text(startX, startY + barHeight * 2 + 30, `Lv.${this.level}`, {
      fontSize: '12px',
      color: '#ffdd44',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100);

    this.expText = this.add.text(startX + 50, startY + barHeight * 2 + 30, `EXP: ${this.exp}/${this.expToNext}`, {
      fontSize: '10px',
      color: '#aaaaaa',
    }).setScrollFactor(0).setDepth(100);

    this.add.text(startX, startY + 1, 'HP', {
      fontSize: '7px', color: '#ff6666',
    }).setScrollFactor(0).setDepth(101);
    this.add.text(startX, startY + barHeight + 11, 'MP', {
      fontSize: '7px', color: '#66aaff',
    }).setScrollFactor(0).setDepth(101);

    this.drawBars();

    // 监听 PlayScene 的更新事件
    this.scene.get('PlayScene').events.on('update-stats', (data: {
      hp: number; maxHp: number; mp: number; maxMp: number;
      level: number; exp: number; expToNext: number;
    }) => {
      this.hp = data.hp;
      this.maxHp = data.maxHp;
      this.mp = data.mp;
      this.maxMp = data.maxMp;
      this.level = data.level;
      this.exp = data.exp;
      this.expToNext = data.expToNext;
      this.levelText.setText(`Lv.${this.level}`);
      this.expText.setText(`EXP: ${this.exp}/${this.expToNext}`);
      this.drawBars();
    });

    // 监听升级特效
    this.events.on('show-level-up', () => {
      this.showLevelUpEffect();
    });
  }

  private drawBars() {
    const barWidth = 120;
    const barHeight = 8;
    const startX = 10;
    const startY = 10;

    this.hpBar.clear();
    this.hpBar.fillStyle(0xff4444, 1);
    this.hpBar.fillRect(startX, startY, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);

    this.mpBar.clear();
    this.mpBar.fillStyle(0x4488ff, 1);
    this.mpBar.fillRect(startX, startY + barHeight + 8, barWidth * Math.max(0, this.mp / this.maxMp), barHeight);

    this.expBar.clear();
    this.expBar.fillStyle(0x44ff44, 1);
    this.expBar.fillRect(startX, startY + barHeight * 2 + 16, barWidth * (this.expToNext > 0 ? this.exp / this.expToNext : 0), barHeight);
  }

  private showLevelUpEffect() {
    if (this.levelUpText) {
      this.levelUpText.destroy();
    }

    this.levelUpText = this.add.text(GAME_WIDTH / 2, 80, 'LEVEL UP!', {
      fontSize: '32px',
      color: '#ffdd44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

    this.tweens.add({
      targets: this.levelUpText,
      y: 60,
      scale: 1.2,
      duration: 500,
      ease: 'Back.easeOut',
      yoyo: false,
    });

    this.tweens.add({
      targets: this.levelUpText,
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        this.levelUpText?.destroy();
        this.levelUpText = null;
      },
    });
  }
}