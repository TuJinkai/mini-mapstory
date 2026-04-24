import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH } from '../utils/constants';

interface LadderZone {
  x: number;
  topY: number;       // 梯子实际顶部
  visualTopY: number; // 虚拟延伸顶部（角色在此范围内隐藏攀爬显示）
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
    // 背景图：1774x887，缩放到游戏高度并铺满世界宽度
    const bg = this.add.image(0, 0, 'bg001');
    bg.setOrigin(0, 0);
    const bgScale = GAME_HEIGHT / 887;
    bg.setScale(bgScale);

    this.player = new Player(this, 100, GAME_HEIGHT - 60);
    this.createPlatforms();
    this.createLadders();

    this.physics.add.collider(this.player, this.platforms);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.scene.launch('UIScene');

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
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
    let nearestVisualTopY = 0;
    let minDist = Infinity;

    for (const z of this.ladderZones) {
      const inX = Math.abs(px - z.x) < z.halfWidth + 10;
      const inY = py > z.visualTopY - 30 && py < z.bottomY + 20;
      if (inX && inY) {
        found = true;
        const d = Math.abs(px - z.x);
        if (d < minDist) {
          minDist = d;
          nearestX = z.x;
          nearestTopY = z.topY;
          nearestVisualTopY = z.visualTopY;
        }
      }
    }

    this.player.setNearLadder(found, nearestX, nearestTopY, nearestVisualTopY);
  }

  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    // 全局地面（不可见，仅碰撞）
    const ground = this.platforms.create(WORLD_WIDTH / 2, GAME_HEIGHT - 8, 'pt001')
      .setDisplaySize(WORLD_WIDTH, 16)
      .refreshBody();
    ground.setVisible(false);

    // 浮动平台，每个指定显示宽高
    // offsetY: 碰撞体从精灵顶部向下偏移，让站立面低于视觉顶部
    const platformData: { x: number; y: number; w: number; h: number; offsetY: number }[] = [
      { x: 120, y: 300, w: 120, h: 40, offsetY: 10 },
      { x: 350, y: 240, w: 100, h: 36, offsetY: 10 },
      { x: 580, y: 300, w: 120, h: 40, offsetY: 10 },
      { x: 200, y: 170, w: 100, h: 36, offsetY: 10 },
      { x: 450, y: 130, w: 110, h: 36, offsetY: 10 },
      { x: 680, y: 180, w: 100, h: 36, offsetY: 10 },
      // 右半区
      { x: 750, y: 280, w: 120, h: 40, offsetY: 10 },
      { x: 850, y: 200, w: 100, h: 36, offsetY: 10 },
    ];

    for (const p of platformData) {
      const plat = this.platforms.create(p.x, p.y, 'pt002');
      plat.setDisplaySize(p.w, p.h).refreshBody();
      const body = plat.body as Phaser.Physics.Arcade.StaticBody;
      body.setOffset(0, p.offsetY);
      body.setSize(plat.displayWidth, p.h - p.offsetY, false);
    }
  }

  private createLadders() {
    const ladderData = [
      // 左半区
      { x: 120, bottomY: 434, topY: 292 },
      { x: 580, bottomY: 434, topY: 292 },
      { x: 350, bottomY: 292, topY: 232 },
      { x: 200, bottomY: 292, topY: 162 },
      { x: 450, bottomY: 232, topY: 122 },
      { x: 680, bottomY: 172, topY: 122 },
      // 右半区
      { x: 750, bottomY: 434, topY: 272 },
      { x: 850, bottomY: 272, topY: 192 },
    ];

    for (const l of ladderData) {
      const height = l.bottomY - l.topY;
      const centerY = l.topY + height / 2;

      // 梯子宽度按素材比例动态计算，高度拉伸到实际间距
      const ladderWidth = Math.round(169 * height / 866);
      const sprite = this.add.image(l.x, centerY, 'tizi01');
      sprite.setDisplaySize(ladderWidth, height);

      // 虚拟延伸顶部（比实际顶部高14像素，让角色能爬到平台上）
      const visualTopY = l.topY - 14;

      this.ladderZones.push({
        x: l.x,
        topY: l.topY,
        visualTopY: visualTopY,
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
