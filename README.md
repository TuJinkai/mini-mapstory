# Mini MapStory

一款基于 Phaser 4 开发的横版 2D 动作 RPG 手游，灵感来源于经典游戏《冒险岛》。

## 特性

- **角色系统**：移动、跳跃、攀爬梯子
- **战斗系统**：普通攻击、技能攻击、伤害数字显示
- **怪物 AI**：怪物生成、自动追踪、碰撞伤害
- **成长系统**：经验值、等级提升、属性成长
- **移动端适配**：竖屏自动旋转横屏显示

## 技术栈

- 游戏引擎：Phaser 4 (Beta)
- 开发语言：TypeScript
- 构建工具：Vite
- 容器化：Docker + 阿里云 ACR

## 项目结构

```
src/
├── main.ts                 # 游戏入口
├── scenes/
│   ├── BootScene.ts        # 资源加载场景
│   ├── PlayScene.ts        # 主游戏场景
│   └── UIScene.ts          # UI 覆盖层
├── objects/
│   ├── Player.ts           # 玩家角色
│   └── Monster.ts          # 怪物基类
├── systems/
│   ├── CombatSystem.ts     # 战斗系统
│   ├── DamageNumber.ts     # 伤害数字
│   ├── ExpSystem.ts        # 经验系统
│   └── MonsterSpawner.ts   # 怪物生成器
└── utils/
    └── constants.ts        # 游戏常量
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 类型检查
npx tsc --noEmit
```

## Docker 部署

```bash
# 构建镜像
docker build -t mini-mapstory .

# 运行容器
docker run -p 80:80 mini-mapstory
```

## GitHub Actions

项目配置了自动部署 workflow：
- 推送到 `main` 分支自动触发
- 构建 Docker 镜像推送至阿里云容器镜像服务 (ACR)

需要在 GitHub 设置以下 Secrets：
- `ACR_REGISTRY` - ACR 仓库地址
- `ACR_NAMESPACE` - ACR 命名空间
- `ACR_USERNAME` - ACR 用户名
- `ACR_PASSWORD` - ACR 密码

## 游戏操作

| 操作 | 键盘 | 触屏 |
|------|------|------|
| 移动 | 方向键 ← → | 左下方向按钮 |
| 跳跃 | Space | 右下跳跃按钮 |
| 爬梯子 | 方向键 ↑ | 上方▲按钮 |
| 普通攻击 | Z | ATK 按钮 |
| 技能攻击 | X | SKL 按钮 |

## 开发进度

详见 [游戏设计书.md](./游戏设计书.md)

## License

MIT