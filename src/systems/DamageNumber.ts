export class DamageNumber {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Text[] = [];
  private poolSize = 10;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 创建文字对象池
    for (let i = 0; i < this.poolSize; i++) {
      const text = scene.add.text(0, 0, '', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        fontFamily: 'Arial',
      });
      text.setOrigin(0.5);
      text.setScrollFactor(1);
      text.setDepth(200);
      text.setVisible(false);
      this.pool.push(text);
    }
  }

  show(x: number, y: number, damage: number, isCrit: boolean = false, isPlayerHurt: boolean = false): void {
    const text = this.getTextFromPool();
    if (!text) return;

    // 设置文字内容
    text.setText(damage.toString());

    // 设置颜色和大小
    const fontSize = isCrit ? 22 : 16;
    const color = isPlayerHurt ? '#ff4444' : (isCrit ? '#ffdd44' : '#ffffff');

    text.setFontSize(fontSize);
    text.setColor(color);

    // 设置位置
    text.setPosition(x, y - 10);
    text.setVisible(true);
    text.setAlpha(1);

    // 浮动动画
    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'ease-out',
      onComplete: () => {
        text.setVisible(false);
      },
    });

    // 缩放动画（暴击时更明显）
    const scaleStart = isCrit ? 1.5 : 1.2;
    text.setScale(scaleStart);
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 200,
      ease: 'ease-out',
    });
  }

  showMultiple(targets: Array<{ x: number; y: number; damage: number; isCrit: boolean }>): void {
    for (const t of targets) {
      this.show(t.x, t.y, t.damage, t.isCrit);
    }
  }

  private getTextFromPool(): Phaser.GameObjects.Text | null {
    // 找一个不可见的文字对象
    for (const text of this.pool) {
      if (!text.visible) {
        return text;
      }
    }

    // 如果池满了，扩展一个
    const newText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    newText.setOrigin(0.5);
    newText.setScrollFactor(1);
    newText.setDepth(200);
    newText.setVisible(false);
    this.pool.push(newText);
    return newText;
  }

  destroy(): void {
    for (const text of this.pool) {
      text.destroy();
    }
    this.pool = [];
  }
}