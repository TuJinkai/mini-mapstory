# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 2D side-scrolling action RPG mobile game built with Phaser 4, inspired by MapleStory (冒险岛). Core features: character movement/jumping, platform exploration, real-time combat, monster AI, experience/leveling, equipment system, and multi-scene transitions.

## Tech Stack

- **Game Engine:** Phaser 4 (Beta)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Assets:** Sprite Sheets, Tiled Maps
- **Target Platform:** Mobile-first (responsive design)

## Architecture

```
src/
├── main.ts                 # Game entry point
├── scenes/
│   ├── BootScene.ts        # Asset loading scene
│   ├── PlayScene.ts        # Main gameplay scene
│   └── UIScene.ts          # UI overlay scene
├── objects/
│   ├── Player.ts           # Player character class
│   ├── Monster.ts          # Monster base class
│   └── Item.ts             # Item/equipment class
├── systems/
│   ├── CombatSystem.ts     # Combat system
│   └── InventorySystem.ts  # Inventory/backpack system
├── assets/
│   ├── images/             # Image assets
│   ├── audio/              # Audio assets
│   └── maps/               # Tiled map files
└── utils/
    └── constants.ts        # Game constants
```

The design document is in `游戏设计书.md` (Chinese). Refer to it for phased development plans and detailed feature specs.

## Development Phases

Development follows a phased approach defined in the design doc:
1. **Phase 1:** Project init & basic framework — scene switching, player movement
2. Subsequent phases add combat, AI, equipment, and more (see design doc for details)

## Common Commands

Once the project is initialized with `npm init` / Vite setup:
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npx tsc --noEmit` — Type check without emitting
