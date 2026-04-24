import { Scene } from 'phaser';
import { GAME_WIDTH } from '../utils/constants';

export class UIScene extends Scene {
  private hpBar!: Phaser.GameObjects.Graphics;
  private mpBar!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  private hp = 100;
  private maxHp = 100;
  private mp = 80;
  private maxMp = 80;
  private level = 1;
  private exp = 0;

  constructor() {
    super('UIScene');
  }

  create() {
    const barWidth = 120;
    const barHeight = 10;
    const startX = 10;
    const startY = 10;

    this.add.rectangle(startX + barWidth / 2, startY + barHeight / 2, barWidth + 4, barHeight + 4, 0x000000, 0.5)
      .setOrigin(0.5).setScrollFactor(0);
    this.add.rectangle(startX + barWidth / 2, startY + barHeight + 10, barWidth + 4, barHeight + 4, 0x000000, 0.5)
      .setOrigin(0.5).setScrollFactor(0);

    this.hpBar = this.add.graphics().setScrollFactor(0);
    this.mpBar = this.add.graphics().setScrollFactor(0);

    this.levelText = this.add.text(startX, startY + 32, `Lv.${this.level}`, {
      fontSize: '14px',
      color: '#ffdd44',
      fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(100);

    this.scoreText = this.add.text(GAME_WIDTH - 10, startY, `EXP: ${this.exp}`, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    this.add.text(startX, startY + barHeight + 2, 'MP', {
      fontSize: '8px',
      color: '#66aaff',
    }).setScrollFactor(0).setDepth(101);

    this.add.text(startX, startY + 2, 'HP', {
      fontSize: '8px',
      color: '#ff6666',
    }).setScrollFactor(0).setDepth(101);

    this.drawBars();
  }

  private drawBars() {
    const barWidth = 120;
    const barHeight = 10;
    const startX = 10;
    const startY = 10;

    this.hpBar.clear();
    this.hpBar.fillStyle(0xff4444, 1);
    this.hpBar.fillRect(startX, startY, barWidth * (this.hp / this.maxHp), barHeight);

    this.mpBar.clear();
    this.mpBar.fillStyle(0x4488ff, 1);
    this.mpBar.fillRect(startX, startY + barHeight + 8, barWidth * (this.mp / this.maxMp), barHeight);
  }

  updateStats(hp: number, mp: number, level: number, exp: number) {
    this.hp = hp;
    this.mp = mp;
    this.level = level;
    this.exp = exp;
    this.levelText.setText(`Lv.${this.level}`);
    this.scoreText.setText(`EXP: ${this.exp}`);
    this.drawBars();
  }
}
