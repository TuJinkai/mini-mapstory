import { Player } from '../objects/Player';

export interface LevelUpEventData {
  newLevel: number;
  statChanges: {
    maxHp: number;
    maxMp: number;
    atk: number;
    def: number;
  };
}

// 每级所需经验值（递增公式）
function expToNextLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

// 升级属性提升
const LEVEL_UP_BONUSES = {
  maxHp: 20,
  maxMp: 10,
  atk: 3,
  def: 1,
};

export class ExpSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private level: number = 1;
  private exp: number = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
  }

  getExpInfo(): { level: number; exp: number; expToNext: number; progress: number } {
    const expToNext = expToNextLevel(this.level);
    const progress = this.exp / expToNext;
    return { level: this.level, exp: this.exp, expToNext, progress };
  }

  addExp(amount: number): boolean {
    this.exp += amount;

    // 发射经验获得事件
    this.scene.events.emit('exp-gained', { amount, exp: this.exp, level: this.level });

    // 检查升级
    let leveledUp = false;
    while (this.exp >= expToNextLevel(this.level)) {
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  private levelUp(): void {
    const expToNext = expToNextLevel(this.level);
    this.exp -= expToNext;
    this.level++;

    // 提升属性
    this.player.addStats(LEVEL_UP_BONUSES);

    // 升级回满血蓝
    this.player.fullHeal();

    // 发射升级事件
    const eventData: LevelUpEventData = {
      newLevel: this.level,
      statChanges: LEVEL_UP_BONUSES,
    };
    this.scene.events.emit('level-up', eventData);
  }

  getLevel(): number {
    return this.level;
  }

  getExp(): number {
    return this.exp;
  }
}