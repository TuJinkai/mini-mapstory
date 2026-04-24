import { Physics } from 'phaser';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_VELOCITY, PLAYER_CLIMB_SPEED, PLAYER_DISPLAY_H, HURT_INVINCIBLE_TIME } from '../utils/constants';

type TouchInput = { left: boolean; right: boolean; jump: boolean };

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  critRate: number;
}

const INITIAL_PLAYER_STATS: PlayerStats = {
  hp: 100, maxHp: 100,
  mp: 80, maxMp: 80,
  atk: 15, def: 5,
  critRate: 0.1,
};

const CHAR_ORIG_W = 1017;  // 最大帧宽度（attack2 缩放后）
const CHAR_ORIG_H = 632;
const DISPLAY_SCALE = PLAYER_DISPLAY_H / CHAR_ORIG_H;
// 攀爬时的缩放比例（比正常稍小）
const CLIMB_SCALE = 0.8;
// 碰撞体参数（源像素 = 帧坐标，Phaser setSize/setOffset 使用此坐标系）
// 角色在各帧中居中，碰撞体也居中
const BODY_W = Math.round(28 / DISPLAY_SCALE);  // 显示28px → ≈277源像素
const BODY_H = Math.round(48 / DISPLAY_SCALE);  // 显示48px → ≈474源像素
const BODY_OFFSET_X = Math.round((CHAR_ORIG_W - BODY_W) / 2);  // 水平居中
const BODY_OFFSET_Y = CHAR_ORIG_H - BODY_H;  // 贴底部

export class Player extends Physics.Arcade.Sprite {
  private touchInput: TouchInput = { left: false, right: false, jump: false };
  private canJump = true;
  private facingRight = true;

  private climbing = false;
  private nearLadder = false;
  private ladderCenterX = 0;
  private ladderTopY = 0;
  private ladderVisualTopY = 0;
  private climbAnimTimer = 0;

  private stats: PlayerStats = { ...INITIAL_PLAYER_STATS };
  private isAttacking = false;
  private isDead = false;
  private lastHurtTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(DISPLAY_SCALE);
    this.setCollideWorldBounds(true);
    this.getBody().setGravityY(GRAVITY);
    this.getBody().setSize(BODY_W, BODY_H);
    this.getBody().setOffset(BODY_OFFSET_X, BODY_OFFSET_Y);
    this.setBounce(0.05);
    this.play('player_idle');
  }

  setNearLadder(near: boolean, ladderX: number, topY?: number, visualTopY?: number) {
    this.nearLadder = near;
    if (near) {
      this.ladderCenterX = ladderX;
      if (topY !== undefined) this.ladderTopY = topY;
      if (visualTopY !== undefined) this.ladderVisualTopY = visualTopY;
    }
    if (!near && this.climbing) {
      this.exitLadder();
    }
  }

  isOnLadder(): boolean {
    return this.climbing;
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, spaceKey: Phaser.Input.Keyboard.Key) {
    if (this.climbing) {
      this.updateClimbing(cursors);
    } else {
      this.updateNormal(cursors, spaceKey);
    }
  }

  private updateClimbing(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    const upPressed = cursors.up.isDown;
    const downPressed = cursors.down.isDown;
    const moveLeft = cursors.left.isDown || this.touchInput.left;
    const moveRight = cursors.right.isDown || this.touchInput.right;

    if (moveLeft || moveRight) {
      this.exitLadder();
      return;
    }

    const delta = this.scene.game.loop.delta;
    const bodyBottom = this.y + this.getHalfBodyH();
    // 判断是否在虚拟延伸区域（超过实际梯子顶部）
    const inVirtualZone = bodyBottom < this.ladderTopY;

    // 虚拟区域恢复正常缩放，非虚拟区域保持攀爬缩小
    if (inVirtualZone) {
      this.setScale(DISPLAY_SCALE);
    } else {
      this.setScale(DISPLAY_SCALE * CLIMB_SCALE);
    }

    if (upPressed) {
      this.y -= PLAYER_CLIMB_SPEED * delta / 1000;
      // 虚拟区域显示站立，实体区域播放攀爬动画
      if (inVirtualZone) {
        this.setFrame(0);  // 站立帧
      } else {
        this.climbAnimTimer += delta;
        if (this.climbAnimTimer >= 250) {
          this.climbAnimTimer = 0;
          const currentFrame = parseInt(this.frame.name, 10);
          this.setFrame(currentFrame === 3 ? 4 : 3);
        }
      }
    } else if (downPressed) {
      this.y += PLAYER_CLIMB_SPEED * delta / 1000;
      this.climbAnimTimer = 0;
      // 下移时根据位置显示对应帧
      if (inVirtualZone) {
        this.setFrame(0);  // 站立帧
      } else {
        this.setFrame(3);  // 攀爬1
      }
    } else {
      this.climbAnimTimer = 0;
      // 停止时根据位置显示对应帧
      if (inVirtualZone) {
        this.setFrame(0);  // 站立帧
      } else {
        this.setFrame(3);  // 攀爬1
      }
    }

    this.x = this.ladderCenterX;

    // 到达虚拟顶部时退出梯子
    const newBodyBottom = this.y + this.getHalfBodyH();
    if (newBodyBottom <= this.ladderVisualTopY) {
      this.y = this.ladderVisualTopY - this.getHalfBodyH();
      this.exitLadder();
    }
  }

  private updateNormal(cursors: Phaser.Types.Input.Keyboard.CursorKeys, spaceKey: Phaser.Input.Keyboard.Key) {
    const body = this.getBody();
    const onGround = body.blocked.down || body.touching.down;
    const upPressed = cursors.up.isDown;

    let moveLeft = cursors.left.isDown || this.touchInput.left;
    let moveRight = cursors.right.isDown || this.touchInput.right;
    const jump = spaceKey.isDown || this.touchInput.jump;

    if (upPressed && this.nearLadder) {
      this.enterLadder();
      return;
    }

    if (moveLeft && moveRight) {
      moveLeft = false;
      moveRight = false;
    }

    if (moveLeft) {
      body.setVelocityX(-PLAYER_SPEED);
      this.setFlipX(false);
      this.facingRight = false;
    } else if (moveRight) {
      body.setVelocityX(PLAYER_SPEED);
      this.setFlipX(true);
      this.facingRight = true;
    } else {
      body.setVelocityX(0);
    }

    if (jump && onGround && this.canJump) {
      body.setVelocityY(PLAYER_JUMP_VELOCITY);
      this.canJump = false;
    }

    if (!jump && onGround) {
      this.canJump = true;
    }

    this.updateAnimation(onGround);
  }

  private enterLadder() {
    this.climbing = true;
    const body = this.getBody();
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.enable = false;
    this.x = this.ladderCenterX;
    // 攀爬时缩小
    this.setScale(DISPLAY_SCALE * CLIMB_SCALE);
    this.setFrame(3);  // 默认用攀爬1
  }

  private exitLadder() {
    this.climbing = false;
    const body = this.getBody();
    body.enable = true;
    body.setAllowGravity(true);
    body.setVelocity(0, 0);
    // 恢复正常缩放
    this.setScale(DISPLAY_SCALE);
  }

  setTouchInput(direction: 'left' | 'right' | 'jump', active: boolean) {
    this.touchInput[direction] = active;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }

  private updateAnimation(onGround: boolean) {
    if (this.isAttacking) return;

    if (!onGround) {
      this.play('player_jump', true);
    } else if (Math.abs(this.getBody().velocity.x) > 10) {
      this.play('player_walk', true);
    } else {
      this.play('player_idle', true);
    }
  }

  // 碰撞体底部相对 sprite 中心的距离（用于爬梯着地计算）
  private getHalfBodyH(): number {
    const scale = this.climbing ? DISPLAY_SCALE * CLIMB_SCALE : DISPLAY_SCALE;
    return (BODY_OFFSET_Y + BODY_H - CHAR_ORIG_H / 2) * scale;
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  // ===== 战斗相关方法 =====
  takeDamage(amount: number): void {
    if (this.isDead) return;

    const time = this.scene.time.now;
    if (time - this.lastHurtTime < HURT_INVINCIBLE_TIME) return;

    this.stats.hp -= amount;
    this.lastHurtTime = time;

    // 受击闪烁效果
    this.setTint(0xff4444);
    this.scene.time.delayedCall(100, () => {
      if (!this.isDead) this.clearTint();
    });

    // 发射受伤事件
    this.scene.events.emit('player-hurt', { damage: amount, hp: this.stats.hp, maxHp: this.stats.maxHp });

    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.die();
    }
  }

  addStats(bonus: { maxHp?: number; maxMp?: number; atk?: number; def?: number }): void {
    if (bonus.maxHp) {
      this.stats.maxHp += bonus.maxHp;
      this.stats.hp += bonus.maxHp;
    }
    if (bonus.maxMp) {
      this.stats.maxMp += bonus.maxMp;
      this.stats.mp += bonus.maxMp;
    }
    if (bonus.atk) this.stats.atk += bonus.atk;
    if (bonus.def) this.stats.def += bonus.def;
  }

  heal(hpAmount: number, mpAmount: number): void {
    this.stats.hp = Math.min(this.stats.hp + hpAmount, this.stats.maxHp);
    this.stats.mp = Math.min(this.stats.mp + mpAmount, this.stats.maxMp);
  }

  fullHeal(): void {
    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
  }

  useMp(amount: number): boolean {
    if (this.stats.mp < amount) return false;
    this.stats.mp -= amount;
    return true;
  }

  regenMp(amount: number): void {
    this.stats.mp = Math.min(this.stats.mp + amount, this.stats.maxMp);
  }

  getStats(): PlayerStats {
    return this.stats;
  }

  isAlive(): boolean {
    return !this.isDead && this.stats.hp > 0;
  }

  private die(): void {
    this.isDead = true;
    this.getBody().setVelocity(0, 0);
    this.play('player_idle');
    this.setTint(0x888888);

    this.scene.events.emit('player-death');
  }

  attack(): boolean {
    if (this.isAttacking || this.isDead || this.climbing) return false;

    this.isAttacking = true;
    this.play('player_attack', true);

    // 攻击动画结束后恢复
    this.scene.time.delayedCall(300, () => {
      this.isAttacking = false;
    });

    return true;
  }

  getAttackBox(): Phaser.Geom.Rectangle {
    const range = 45;
    const height = 48 * DISPLAY_SCALE;
    const x = this.facingRight ? this.x : this.x - range;
    const y = this.y - height / 2;

    return new Phaser.Geom.Rectangle(x, y, range, height);
  }

  setIsAttacking(value: boolean): void {
    this.isAttacking = value;
  }

  isPlayerAttacking(): boolean {
    return this.isAttacking;
  }
}
