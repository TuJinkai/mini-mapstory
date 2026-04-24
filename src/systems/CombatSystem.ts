import { Player, PlayerStats } from '../objects/Player';
import { Monster } from '../objects/Monster';
import { DamageNumber } from './DamageNumber';
import {
  ATTACK_RANGE,
  SKILL_RANGE,
  NORMAL_ATTACK_COOLDOWN,
  POWER_STRIKE_COOLDOWN,
  POWER_STRIKE_MP_COST,
  POWER_STRIKE_MULTIPLIER,
  CRIT_RATE,
  CRIT_MULTIPLIER,
} from '../utils/constants';

interface SkillData {
  name: string;
  damageMultiplier: number;
  mpCost: number;
  cooldown: number;
  range: number;
  hitArea: 'front' | 'around';
}

const PLAYER_SKILLS: Record<string, SkillData> = {
  normalAttack: {
    name: '普通攻击',
    damageMultiplier: 1.0,
    mpCost: 0,
    cooldown: NORMAL_ATTACK_COOLDOWN,
    range: ATTACK_RANGE,
    hitArea: 'front',
  },
  powerStrike: {
    name: '重击',
    damageMultiplier: POWER_STRIKE_MULTIPLIER,
    mpCost: POWER_STRIKE_MP_COST,
    cooldown: POWER_STRIKE_COOLDOWN,
    range: SKILL_RANGE,
    hitArea: 'front',
  },
};

export class CombatSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private monsters: Monster[];
  private damageNumber: DamageNumber;
  private lastAttackTime: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene, player: Player, damageNumber: DamageNumber) {
    this.scene = scene;
    this.player = player;
    this.damageNumber = damageNumber;
    this.monsters = [];

    // 初始化技能冷却时间
    for (const skillName of Object.keys(PLAYER_SKILLS)) {
      this.lastAttackTime.set(skillName, 0);
    }
  }

  addMonster(monster: Monster): void {
    this.monsters.push(monster);
  }

  removeMonster(monster: Monster): void {
    const idx = this.monsters.indexOf(monster);
    if (idx !== -1) {
      this.monsters.splice(idx, 1);
    }
  }

  playerAttack(skillName: string): boolean {
    const skill = PLAYER_SKILLS[skillName];
    if (!skill) return false;

    const time = this.scene.time.now;
    const lastTime = this.lastAttackTime.get(skillName) || 0;

    // 检查冷却
    if (time - lastTime < skill.cooldown) return false;

    // 检查MP
    if (skill.mpCost > 0) {
      if (!this.player.useMp(skill.mpCost)) {
        this.scene.events.emit('mp-insufficient');
        return false;
      }
    }

    // 记录冷却时间
    this.lastAttackTime.set(skillName, time);

    // 执行攻击
    if (!this.player.attack()) return false;

    // 获取攻击范围内的目标
    const targets = this.getTargetsInRange(skill.range, skill.hitArea);

    // 对每个目标造成伤害
    for (const monster of targets) {
      const result = this.calculateDamage(
        this.player.getStats().atk,
        monster.getStats().def,
        skill.damageMultiplier,
        this.player.getStats().critRate
      );

      monster.takeDamage(result.damage);
      this.damageNumber.show(monster.x, monster.y - 30, result.damage, result.isCrit);

      // 发射攻击命中事件
      this.scene.events.emit('attack-hit', { monster, damage: result.damage, isCrit: result.isCrit });
    }

    // 更新UI
    this.scene.events.emit('player-stats-update', this.player.getStats());

    return true;
  }

  monsterAttack(monster: Monster): void {
    const result = this.calculateDamage(
      monster.getStats().atk,
      this.player.getStats().def,
      1.0,
      0  // 怪物无暴击
    );

    this.player.takeDamage(result.damage);
    this.damageNumber.show(this.player.x, this.player.y - 20, result.damage, false, true);

    // 更新UI
    this.scene.events.emit('player-stats-update', this.player.getStats());
  }

  private calculateDamage(atk: number, def: number, multiplier: number, critRate: number): { damage: number; isCrit: boolean } {
    // 基础伤害浮动 90%~110%
    const baseDamage = atk * (0.9 + Math.random() * 0.2) * multiplier;

    // 减防
    const finalDamage = Math.max(1, Math.floor(baseDamage - def * 0.5));

    // 暴击判定
    const isCrit = Math.random() < critRate;
    const damage = isCrit ? Math.floor(finalDamage * CRIT_MULTIPLIER) : finalDamage;

    return { damage, isCrit };
  }

  private getTargetsInRange(range: number, hitArea: 'front' | 'around'): Monster[] {
    const px = this.player.x;
    const py = this.player.y;
    const facingRight = this.player.isFacingRight();

    const targets: Monster[] = [];

    for (const monster of this.monsters) {
      if (!monster.isAlive()) continue;

      const mx = monster.x;
      const my = monster.y;
      const dx = mx - px;
      const dy = my - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (hitArea === 'front') {
        // 前方区域判定：距离范围内 + 在面向方向
        const inFront = facingRight ? dx > -20 : dx < 20;
        const inRange = dist <= range;

        if (inFront && inRange) {
          targets.push(monster);
        }
      } else {
        // 周围区域判定
        if (dist <= range) {
          targets.push(monster);
        }
      }
    }

    return targets;
  }

  isSkillReady(skillName: string): boolean {
    const skill = PLAYER_SKILLS[skillName];
    if (!skill) return false;

    const time = this.scene.time.now;
    const lastTime = this.lastAttackTime.get(skillName) || 0;

    return time - lastTime >= skill.cooldown;
  }

  getSkillCooldownRemaining(skillName: string): number {
    const skill = PLAYER_SKILLS[skillName];
    if (!skill) return 0;

    const time = this.scene.time.now;
    const lastTime = this.lastAttackTime.get(skillName) || 0;

    return Math.max(0, skill.cooldown - (time - lastTime));
  }

  getSkillCooldownPercent(skillName: string): number {
    const skill = PLAYER_SKILLS[skillName];
    if (!skill) return 0;

    const remaining = this.getSkillCooldownRemaining(skillName);
    return remaining / skill.cooldown;
  }
}