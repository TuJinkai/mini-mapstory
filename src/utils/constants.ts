export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;
export const BG_ORIG_W = 1774;
export const BG_ORIG_H = 887;
export const WORLD_WIDTH = Math.round(BG_ORIG_W * GAME_HEIGHT / BG_ORIG_H);
export const GRAVITY = 1200;
export const PLAYER_SPEED = 250;
export const PLAYER_JUMP_VELOCITY = -520;
export const PLAYER_CLIMB_SPEED = 150;
export const PLAYER_DISPLAY_H = 64;
export const BG_COLOR = '#1a1a2e';

// ===== 战斗相关常量 =====
export const ATTACK_RANGE = 65;
export const SKILL_RANGE = 80;
export const NORMAL_ATTACK_COOLDOWN = 400;
export const POWER_STRIKE_COOLDOWN = 3000;
export const POWER_STRIKE_MP_COST = 15;
export const POWER_STRIKE_MULTIPLIER = 2.5;
export const CRIT_RATE = 0.1;
export const CRIT_MULTIPLIER = 1.5;
export const DAMAGE_FLOAT_DURATION = 800;
export const HURT_INVINCIBLE_TIME = 2000;
export const MONSTER_SPAWN_INVINCIBLE = 500;
export const RESPAWN_CHECK_INTERVAL = 1000;

// MP自然回复
export const MP_REGEN_RATE = 2;
export const MP_REGEN_INTERVAL = 3000;
