import { Game, Types } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from './utils/constants';
import { BootScene } from './scenes/BootScene';
import { PlayScene } from './scenes/PlayScene';
import { UIScene } from './scenes/UIScene';

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: BG_COLOR,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PlayScene, UIScene],
};

new Game(config);
