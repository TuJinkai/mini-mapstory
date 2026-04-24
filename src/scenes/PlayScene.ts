import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

interface LadderZone {
  x: number;
  topY: number;
  bottomY: number;
  halfWidth: number;
}

export class PlayScene extends Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladderZones: LadderZone[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('PlayScene');
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');

    this.player = new Player(this, 100, GAME_HEIGHT - 60);
    this.createPlatforms();
    this.createLadders();

    this.physics.add.collider(this.player, this.platforms);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.scene.launch('UIScene');

    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.createTouchControls();
  }

  update() {
    this.checkLadderProximity();
    this.player.update(this.cursors, this.spaceKey);
  }

  private checkLadderProximity() {
    const px = this.player.x;
    const py = this.player.y;
    let found = false;
    let nearestX = 0;
    let nearestTopY = 0;
    let minDist = Infinity;

    for (const z of this.ladderZones) {
      const inX = Math.abs(px - z.x) < z.halfWidth + 10;
      // 虚拟空间向上延伸30px，人物大部分爬过梯子顶端即可
      const inY = py > z.topY - 30 && py < z.bottomY + 20;
      if (inX && inY) {
        found = true;
        const d = Math.abs(px - z.x);
        if (d < minDist) {
          minDist = d;
          nearestX = z.x;
          nearestTopY = z.topY;
        }
      }
    }

    this.player.setNearLadder(found, nearestX, nearestTopY);
  }

  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(GAME_WIDTH / 2, GAME_HEIGHT - 8, 'platform')
      .setDisplaySize(GAME_WIDTH, 16)
      .refreshBody();

    const platformData = [
      { x: 120, y: 300 },
      { x: 350, y: 240 },
      { x: 580, y: 300 },
      { x: 200, y: 170 },
      { x: 450, y: 130 },
      { x: 680, y: 180 },
    ];

    for (const p of platformData) {
      const plat = this.platforms.create(p.x, p.y, 'platform');
      plat.setScale(1.5, 1).refreshBody();
    }
  }

  private createLadders() {
    // 平台表面 y 值（scale=1.5,1 原始高16，表面 = centerY - 8）：
    //   地面=434  (120,300)=292  (580,300)=292
    //   (350,240)=232  (200,170)=162  (450,130)=122  (680,180)=172
    const ladderData = [
      { x: 120, bottomY: 434, topY: 292 },
      { x: 580, bottomY: 434, topY: 292 },
      { x: 350, bottomY: 292, topY: 232 },
      { x: 200, bottomY: 292, topY: 162 },
      { x: 450, bottomY: 232, topY: 122 },
      { x: 680, bottomY: 172, topY: 122 },
    ];

    for (const l of ladderData) {
      const height = l.bottomY - l.topY;
      const centerY = l.topY + height / 2;

      // 只用 sprite 显示，不创建物理体
      const sprite = this.add.image(l.x, centerY, 'ladder');
      sprite.setDisplaySize(20, height);

      // 记录坐标区域用于碰撞检测
      this.ladderZones.push({
        x: l.x,
        topY: l.topY,
        bottomY: l.bottomY,
        halfWidth: 15,
      });
    }
  }

  private createTouchControls() {
    const buttonY = GAME_HEIGHT - 50;

    const leftBtn = this.add.circle(50, buttonY, 28, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(50, buttonY, '◀', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const rightBtn = this.add.circle(130, buttonY, 28, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(130, buttonY, '▶', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const jumpBtn = this.add.circle(GAME_WIDTH - 60, buttonY, 32, 0x6c63ff, 0.3)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(GAME_WIDTH - 60, buttonY, '▲', { fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.input.on('gameobjectdown', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === leftBtn) this.player.setTouchInput('left', true);
      if (gameObject === rightBtn) this.player.setTouchInput('right', true);
      if (gameObject === jumpBtn) this.player.setTouchInput('jump', true);
    });

    this.input.on('gameobjectup', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === leftBtn) this.player.setTouchInput('left', false);
      if (gameObject === rightBtn) this.player.setTouchInput('right', false);
      if (gameObject === jumpBtn) this.player.setTouchInput('jump', false);
    });
  }
}
