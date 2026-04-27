import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Monster } from '../objects/Monster';
import { MONSTER_CONFIGS, MonsterConfig } from '../data/MonsterData';

export interface SpawnPoint {
  x: number;
  y: number;
  monsterType: string;
  respawnTime: number;
  id: string;
}

export class MonsterSpawner {
  private scene: Scene;
  private player: Player;
  private spawnPoints: SpawnPoint[];
  private activeMonsters: Monster[] = [];
  private deathTimers: Map<string, number> = new Map();
  private monsterGroup!: Phaser.Physics.Arcade.Group;
  private lastRespawnCheck: number = 0;

  constructor(scene: Scene, player: Player, spawnPoints: SpawnPoint[]) {
    this.scene = scene;
    this.player = player;
    this.spawnPoints = spawnPoints;
  }

  init(): void {
    this.monsterGroup = this.scene.physics.add.group();

    for (const sp of this.spawnPoints) {
      this.spawnMonster(sp);
    }
  }

  update(time: number): void {
    // 更新所有活跃怪物
    for (const monster of this.activeMonsters) {
      if (monster.isAlive()) {
        monster.update(this.player);
      }
    }

    // 定期检查刷新
    if (time - this.lastRespawnCheck >= 1000) {
      this.lastRespawnCheck = time;
      this.checkRespawns(time);
    }
  }

  private checkRespawns(time: number): void {
    for (const sp of this.spawnPoints) {
      const deathTime = this.deathTimers.get(sp.id);
      if (deathTime !== undefined) {
        if (time - deathTime >= sp.respawnTime) {
          this.deathTimers.delete(sp.id);
          this.spawnMonster(sp);
        }
      }
    }
  }

  private spawnMonster(spawnPoint: SpawnPoint): void {
    const config = MONSTER_CONFIGS[spawnPoint.monsterType];
    if (!config) return;

    const monster = new Monster(this.scene, spawnPoint.x, spawnPoint.y, config);
    this.activeMonsters.push(monster);
    this.monsterGroup.add(monster);

    // 监听怪物死亡
    const onDeath = (deadMonster: Monster) => {
      if (deadMonster === monster) {
        this.deathTimers.set(spawnPoint.id, this.scene.time.now);
        this.scene.events.off('monster-death', onDeath);
      }
    };
    this.scene.events.on('monster-death', onDeath);

    // 发射怪物生成事件
    this.scene.events.emit('monster-spawned', monster);
  }

  getActiveMonsters(): Monster[] {
    return this.activeMonsters.filter(m => m.isAlive());
  }

  getMonsterGroup(): Phaser.Physics.Arcade.Group {
    return this.monsterGroup;
  }

  removeDeadMonster(monster: Monster): void {
    const idx = this.activeMonsters.indexOf(monster);
    if (idx !== -1) {
      this.activeMonsters.splice(idx, 1);
    }
  }

  destroy(): void {
    for (const monster of this.activeMonsters) {
      if (monster.active) {
        monster.destroy();
      }
    }
    this.activeMonsters = [];
  }
}