import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Monster } from '../objects/Monster';
import { CombatSystem } from '../systems/CombatSystem';
import { DamageNumber } from '../systems/DamageNumber';
import { ExpSystem } from '../systems/ExpSystem';
import { MonsterSpawner, SpawnPoint } from '../systems/MonsterSpawner';
import { GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, MP_REGEN_RATE, MP_REGEN_INTERVAL } from '../utils/constants';

interface LadderZone {
  x: number;
  topY: number;
  visualTopY: number;
  bottomY: number;
  halfWidth: number;
}

const SPAWN_POINTS: SpawnPoint[] = [
  // 地面怪物
  { x: 300, y: 410, monsterType: 'pig', respawnTime: 5000, id: 'pig1' },
  { x: 500, y: 410, monsterType: 'pig', respawnTime: 5000, id: 'pig2' },
  { x: 700, y: 410, monsterType: 'pig', respawnTime: 6000, id: 'pig3' },
];

export class PlayScene extends Scene {
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private ladderZones: LadderZone[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private zKey!: Phaser.Input.Keyboard.Key;
  private xKey!: Phaser.Input.Keyboard.Key;

  private combatSystem!: CombatSystem;
  private monsterSpawner!: MonsterSpawner;
  private expSystem!: ExpSystem;
  private damageNumber!: DamageNumber;
  private lastMpRegenTime: number = 0;

  constructor() {
    super('PlayScene');
  }

  create() {
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
    this.zKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.xKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // 战斗系统初始化
    this.damageNumber = new DamageNumber(this);
    this.combatSystem = new CombatSystem(this, this.player, this.damageNumber);
    this.expSystem = new ExpSystem(this, this.player);

    // 先注册事件监听器，再初始化怪物生成器（避免事件先触发但监听器未注册）
    this.setupCombatEvents();

    this.monsterSpawner = new MonsterSpawner(this, this.player, SPAWN_POINTS);
    this.monsterSpawner.init();

    // 碰撞：怪物与平台
    this.physics.add.collider(this.monsterSpawner.getMonsterGroup(), this.platforms);

    // 碰撞：怪物与玩家（怪物接触玩家时造成伤害，有冷却）
    this.physics.add.overlap(
      this.player,
      this.monsterSpawner.getMonsterGroup(),
      (_player, monster) => {
        if (this.player.isAlive() && (monster as Monster).canHitPlayer()) {
          this.combatSystem.monsterAttack(monster as Monster);
        }
      }
    );

    this.createTouchControls();

    this.scene.launch('UIScene');

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 初始通知UIScene
    this.time.delayedCall(100, () => {
      this.updateUIScene();
    });
  }

  update(time: number) {
    this.checkLadderProximity();
    this.player.update(this.cursors, this.spaceKey);
    this.monsterSpawner.update(time);

    // 键盘攻击
    if (Phaser.Input.Keyboard.JustDown(this.zKey)) {
      this.combatSystem.playerAttack('normalAttack');
    }
    if (Phaser.Input.Keyboard.JustDown(this.xKey)) {
      this.combatSystem.playerAttack('powerStrike');
    }

    // MP自然回复
    if (time - this.lastMpRegenTime >= MP_REGEN_INTERVAL) {
      this.lastMpRegenTime = time;
      this.player.regenMp(MP_REGEN_RATE);
      this.updateUIScene();
    }
  }

  private setupCombatEvents(): void {
    // 玩家受伤
    this.events.on('player-hurt', () => {
      this.updateUIScene();
    });

    // 怪物死亡 → 给经验 + 通知刷新器
    this.events.on('monster-death', (monster: Monster) => {
      const exp = monster.getExpReward();
      const leveledUp = this.expSystem.addExp(exp);

      // 显示经验数字
      this.damageNumber.show(monster.x, monster.y - 20, exp, false, false);

      // 从战斗系统移除
      this.combatSystem.removeMonster(monster);
      this.monsterSpawner.removeDeadMonster(monster);

      this.updateUIScene();
    });

    // 升级事件
    this.events.on('level-up', () => {
      this.updateUIScene();
      this.scene.get('UIScene').events.emit('show-level-up');
    });

    // 经验获得
    this.events.on('exp-gained', () => {
      this.updateUIScene();
    });

    // 玩家属性更新（技能消耗MP等）
    this.events.on('player-stats-update', () => {
      this.updateUIScene();
    });

    // 怪物生成
    this.events.on('monster-spawned', (monster: Monster) => {
      this.combatSystem.addMonster(monster);
    });
  }

  private updateUIScene(): void {
    const stats = this.player.getStats();
    const expInfo = this.expSystem.getExpInfo();

    this.scene.get('UIScene').events.emit('update-stats', {
      hp: stats.hp,
      maxHp: stats.maxHp,
      mp: stats.mp,
      maxMp: stats.maxMp,
      level: expInfo.level,
      exp: expInfo.exp,
      expToNext: expInfo.expToNext,
    });
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

    const ground = this.platforms.create(WORLD_WIDTH / 2, GAME_HEIGHT - 8, 'pt001')
      .setDisplaySize(WORLD_WIDTH, 16)
      .refreshBody();
    ground.setVisible(false);

    const platformData: { x: number; y: number; w: number; h: number; offsetY: number }[] = [
      { x: 120, y: 300, w: 120, h: 40, offsetY: 10 },
      { x: 350, y: 240, w: 100, h: 36, offsetY: 10 },
      { x: 580, y: 300, w: 120, h: 40, offsetY: 10 },
      { x: 200, y: 170, w: 100, h: 36, offsetY: 10 },
      { x: 450, y: 130, w: 110, h: 36, offsetY: 10 },
      { x: 680, y: 180, w: 100, h: 36, offsetY: 10 },
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
      { x: 120, bottomY: 434, topY: 292 },
      { x: 580, bottomY: 434, topY: 292 },
      { x: 350, bottomY: 292, topY: 232 },
      { x: 200, bottomY: 292, topY: 162 },
      { x: 450, bottomY: 232, topY: 122 },
      { x: 680, bottomY: 172, topY: 122 },
      { x: 750, bottomY: 434, topY: 272 },
      { x: 850, bottomY: 272, topY: 192 },
    ];

    for (const l of ladderData) {
      const height = l.bottomY - l.topY;
      const centerY = l.topY + height / 2;

      const ladderWidth = Math.round(169 * height / 866);
      const sprite = this.add.image(l.x, centerY, 'tizi01');
      sprite.setDisplaySize(ladderWidth, height);

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

    // 方向键
    const leftBtn = this.add.circle(50, buttonY, 28, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(50, buttonY, '◀', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const rightBtn = this.add.circle(130, buttonY, 28, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(130, buttonY, '▶', { fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // 向上按钮（爬梯子）
    const upBtn = this.add.circle(90, buttonY - 45, 24, 0x44aa44, 0.3)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(90, buttonY - 45, '▲', { fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    const jumpBtn = this.add.circle(GAME_WIDTH - 130, buttonY, 32, 0x6c63ff, 0.3)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(GAME_WIDTH - 130, buttonY, '▲', { fontSize: '22px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // 普攻按钮
    const attackBtn = this.add.circle(GAME_WIDTH - 55, buttonY, 28, 0xff4444, 0.4)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(GAME_WIDTH - 55, buttonY, 'ATK', {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // 重击按钮
    const skillBtn = this.add.circle(GAME_WIDTH - 55, buttonY - 60, 24, 0xffaa00, 0.4)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.text(GAME_WIDTH - 55, buttonY - 60, 'SKL', {
      fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // 触摸事件
    this.input.on('gameobjectdown', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === leftBtn) this.player.setTouchInput('left', true);
      if (gameObject === rightBtn) this.player.setTouchInput('right', true);
      if (gameObject === upBtn) this.cursors.up.isDown = true;
      if (gameObject === jumpBtn) this.player.setTouchInput('jump', true);
      if (gameObject === attackBtn) this.combatSystem.playerAttack('normalAttack');
      if (gameObject === skillBtn) this.combatSystem.playerAttack('powerStrike');
    });

    this.input.on('gameobjectup', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      if (gameObject === leftBtn) this.player.setTouchInput('left', false);
      if (gameObject === rightBtn) this.player.setTouchInput('right', false);
      if (gameObject === upBtn) this.cursors.up.isDown = false;
      if (gameObject === jumpBtn) this.player.setTouchInput('jump', false);
    });
  }
}