import { Physics } from 'phaser';
import { GRAVITY, PLAYER_SPEED, PLAYER_JUMP_VELOCITY, PLAYER_CLIMB_SPEED } from '../utils/constants';

type TouchInput = { left: boolean; right: boolean; jump: boolean };

export class Player extends Physics.Arcade.Sprite {
  private touchInput: TouchInput = { left: false, right: false, jump: false };
  private canJump = true;
  private facingRight = true;

  private climbing = false;
  private nearLadder = false;
  private ladderCenterX = 0;
  private ladderTopY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.getBody().setGravityY(GRAVITY);
    this.getBody().setSize(20, 44);
    this.getBody().setOffset(6, 4);
    this.setBounce(0.05);
    this.play('player_idle');
  }

  setNearLadder(near: boolean, ladderX: number, topY?: number) {
    this.nearLadder = near;
    if (near) {
      this.ladderCenterX = ladderX;
      if (topY !== undefined) this.ladderTopY = topY;
    }
    // 不在梯子范围时自动退出爬梯
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

    // 按左右离开梯子
    if (moveLeft || moveRight) {
      this.exitLadder();
      return;
    }

    // 手动移动，完全绕过物理碰撞
    const delta = this.scene.game.loop.delta;
    if (upPressed) {
      this.y -= PLAYER_CLIMB_SPEED * delta / 1000;
    } else if (downPressed) {
      this.y += PLAYER_CLIMB_SPEED * delta / 1000;
    }

    // 对齐梯子x
    this.x = this.ladderCenterX;

    // 爬到顶端：玩家脚底(body bottom = y + 48)到达平台表面
    // 把玩家放到平台上方的站立位置
    const bodyBottom = this.y + 48;
    if (bodyBottom <= this.ladderTopY) {
      this.y = this.ladderTopY - 48;
      this.exitLadder();
    }

    this.play('player_idle', true);
  }

  private updateNormal(cursors: Phaser.Types.Input.Keyboard.CursorKeys, spaceKey: Phaser.Input.Keyboard.Key) {
    const body = this.getBody();
    const onGround = body.blocked.down || body.touching.down;
    const upPressed = cursors.up.isDown;
    const downPressed = cursors.down.isDown;

    let moveLeft = cursors.left.isDown || this.touchInput.left;
    let moveRight = cursors.right.isDown || this.touchInput.right;
    const jump = spaceKey.isDown || this.touchInput.jump;

    // 进入梯子：按上键且靠近梯子
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
      this.setFlipX(true);
      this.facingRight = false;
    } else if (moveRight) {
      body.setVelocityX(PLAYER_SPEED);
      this.setFlipX(false);
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
    body.enable = false; // 完全关闭物理体，手动控制坐标
    this.x = this.ladderCenterX;
  }

  private exitLadder() {
    this.climbing = false;
    const body = this.getBody();
    body.enable = true; // 恢复物理体
    body.setAllowGravity(true);
    body.setVelocity(0, 0);
  }

  setTouchInput(direction: 'left' | 'right' | 'jump', active: boolean) {
    this.touchInput[direction] = active;
  }

  isFacingRight(): boolean {
    return this.facingRight;
  }

  private updateAnimation(onGround: boolean) {
    if (!onGround) {
      this.play('player_jump', true);
    } else if (Math.abs(this.getBody().velocity.x) > 10) {
      this.play('player_walk', true);
    } else {
      this.play('player_idle', true);
    }
  }

  private getBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}
