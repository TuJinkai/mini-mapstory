import { Physics } from 'phaser';
import { Player } from './Player';
import { MonsterConfig, MonsterStats } from '../data/MonsterData';

// 怪物原始尺寸（用于碰撞体计算）
const MONSTER_ORIG_H = 413;  // 猪猪素材原始高度
const MONSTER_DISPLAY_H = 64;  // 显示高度
const MONSTER_SCALE = MONSTER_DISPLAY_H / MONSTER_ORIG_H;

export enum MonsterAIState {
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  FLEE = 'flee',
  DEAD = 'dead',
}

export class Monster extends Physics.Arcade.Sprite {
  private stats: MonsterStats;
  private aiState: MonsterAIState = MonsterAIState.PATROL;
  private config: MonsterConfig;
  private patrolOriginX: number;
  private patrolRange: number;
  private patrolDirection: number = 1;
  private patrolPauseTimer: number = 0;
  private lastAttackTime: number = 0;
  private isHurt: boolean = false;
  private hurtTimer: number = 0;
  private spawnTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: MonsterConfig) {
    super(scene, x, y, config.key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.config = config;
    this.stats = { ...config.stats };
    this.patrolOriginX = x;
    this.patrolRange = config.patrolRange;
    this.spawnTime = scene.time.now;

    // 缩放怪物
    const scale = MONSTER_DISPLAY_H / MONSTER_ORIG_H;
    this.setScale(scale);
    this.setDepth(10);

    // 物理碰撞体 - 与玩家使用相同的缩放比例和对齐方式
    const body = this.body as Phaser.Physics.Arcade.Body;
    // 使用与玩家相同的参数（内部像素单位）
    const bodyW = Math.round(28 / MONSTER_SCALE);  // 显示28px → 源像素
    const bodyH = Math.round(48 / MONSTER_SCALE);  // 显示48px → 源像素
    body.setSize(bodyW, bodyH);
    // offsetY 使碰撞体底部对齐 sprite 底部
    // 碰撞体顶部 = sprite_bottom - bodyH_display = 32 - 48 = -16 (相对于sprite中心)
    // 在源像素中: -16 / MONSTER_SCALE
    body.setOffset(0, Math.round(-16 / MONSTER_SCALE));
    body.setGravityY(1200);
    body.setCollideWorldBounds(true);
    body.setBounce(0);

    this.play('pig_idle');
  }

  update(player: Player): void {
    if (this.aiState === MonsterAIState.DEAD) return;

    const time = this.scene.time.now;

    // 出生无敌时间
    if (time - this.spawnTime < 500) {
      return;
    }

    // 受伤硬直
    if (this.isHurt) {
      this.hurtTimer -= this.scene.game.loop.delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.clearTint();
      }
      return;
    }

    const dist = this.distanceTo(player);
    const playerAlive = player.isAlive();

    // AI状态切换（移除自动攻击，改为碰撞伤害）
    if (!playerAlive) {
      this.aiState = MonsterAIState.PATROL;
    } else if (this.stats.hp <= 0) {
      this.aiState = MonsterAIState.DEAD;
      this.die();
      return;
    } else if (dist <= this.stats.detectRange) {
      this.aiState = MonsterAIState.CHASE;
    } else if (dist > this.stats.detectRange * 1.5) {
      this.aiState = MonsterAIState.PATROL;
    }

    // 根据状态执行行为（移除 ATTACK 状态）
    switch (this.aiState) {
      case MonsterAIState.PATROL:
        this.patrol();
        break;
      case MonsterAIState.CHASE:
        this.chase(player);
        break;
      case MonsterAIState.FLEE:
        this.flee(player);
        break;
    }
  }

  private patrol(): void {
    const body = this.getBody();
    const time = this.scene.time.now;

    // 暂停计时
    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= this.scene.game.loop.delta;
      body.setVelocityX(0);
      return;
    }

    const leftBound = this.patrolOriginX - this.patrolRange;
    const rightBound = this.patrolOriginX + this.patrolRange;

    // 检查是否到达边界
    if (this.x <= leftBound) {
      this.patrolDirection = 1;
      this.patrolPauseTimer = 800 + Math.random() * 400;
    } else if (this.x >= rightBound) {
      this.patrolDirection = -1;
      this.patrolPauseTimer = 800 + Math.random() * 400;
    }

    const speed = this.stats.speed * 0.5 * this.patrolDirection;
    body.setVelocityX(speed);

    // 翻转朝向（素材默认朝左，向右移动时需要镜像）
    this.setFlipX(this.patrolDirection > 0);

    this.play('pig_idle', true);
  }

  private chase(player: Player): void {
    const body = this.getBody();
    const dx = player.x - this.x;

    const speed = this.stats.speed;
    if (dx > 10) {
      body.setVelocityX(speed);
      this.setFlipX(true);  // 向右追击，镜像
    } else if (dx < -10) {
      body.setVelocityX(-speed);
      this.setFlipX(false);  // 向左追击，不镜像
    } else {
      body.setVelocityX(0);
    }

    this.play('pig_run', true);
  }

  private flee(player: Player): void {
    const body = this.getBody();
    const dx = player.x - this.x;

    const speed = this.stats.speed * 1.2;
    if (dx > 0) {
      body.setVelocityX(-speed);
      this.setFlipX(false);  // 向左逃跑，不镜像
    } else {
      body.setVelocityX(speed);
      this.setFlipX(true);  // 向右逃跑，镜像
    }
  }

  takeDamage(amount: number): void {
    if (this.aiState === MonsterAIState.DEAD) return;
    if (this.scene.time.now - this.spawnTime < 500) return;

    this.stats.hp -= amount;
    this.isHurt = true;
    this.hurtTimer = 200;
    this.setTint(0xff4444);

    // 发射受伤事件（用于显示伤害数字）
    this.scene.events.emit('monster-hurt', { monster: this, damage: amount });

    if (this.stats.hp <= 0) {
      this.aiState = MonsterAIState.DEAD;
      this.die();
    } else if (this.config.behavior === 'coward' && this.stats.hp < this.stats.maxHp * 0.3) {
      this.aiState = MonsterAIState.FLEE;
    } else {
      this.aiState = MonsterAIState.CHASE;
    }
  }

  private die(): void {
    this.getBody().setVelocity(0, 0);
    this.getBody().enable = false;
    this.play('pig_hurt');

    // 死亡动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 20,
      duration: 500,
      onComplete: () => {
        this.scene.events.emit('monster-death', this);
        this.destroy();
      },
    });
  }

  private distanceTo(player: Player): number {
    return Math.abs(this.x - player.x);
  }

  private canAttack(): boolean {
    return this.scene.time.now - this.lastAttackTime >= this.stats.attackCooldown;
  }

  isAlive(): boolean {
    return this.aiState !== MonsterAIState.DEAD && this.stats.hp > 0;
  }

  getExpReward(): number {
    return this.stats.expReward;
  }

  getStats(): MonsterStats {
    return this.stats;
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  // 获取碰撞体底部Y坐标
  getFloorY(): number {
    // 碰撞体底部 = sprite底部 = y + displayHeight/2
    return this.y + MONSTER_DISPLAY_H / 2;
  }
}