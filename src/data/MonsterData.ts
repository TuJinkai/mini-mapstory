export interface MonsterStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  expReward: number;
  detectRange: number;
  attackRange: number;
  attackCooldown: number;
}

export interface MonsterConfig {
  key: string;
  stats: MonsterStats;
  patrolRange: number;
  behavior: 'aggressive' | 'passive' | 'coward';
}

export const MONSTER_CONFIGS: Record<string, MonsterConfig> = {
  pig: {
    key: 'pig',
    stats: {
      hp: 50, maxHp: 50,
      atk: 8, def: 2,
      speed: 80,
      expReward: 15,
      detectRange: 150,
      attackRange: 35,
      attackCooldown: 1500,
    },
    patrolRange: 80,
    behavior: 'passive',
  },
};
