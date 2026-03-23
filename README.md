<p align="center">
  <img src="public/icon.svg" width="80" alt="TextGame.ai logo" />
</p>

<h1 align="center">TextGame.ai</h1>

<p align="center">
  <strong>AI-powered multiplayer text game platform</strong><br>
  An AI Game Master hosts social deduction, RPG, and party games — so everyone can play, no human moderator needed.
</p>

<p align="center">
  <a href="https://textgame.ai">Live Site</a> · 
  <a href="#features">Features</a> · 
  <a href="#tech-stack">Tech Stack</a> · 
  <a href="#architecture">Architecture</a> · 
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

**TextGame.ai** is a full-stack AI game platform where an intelligent Game Master runs entire game sessions autonomously — assigning roles, managing phases, narrating the story, and driving AI characters that think and strategize alongside human players.

Players can jump into 20+ built-in game templates (Werewolf, Mafia, Undercover, 20 Questions, Escape Room, Debate, and more), create custom games with their own rules, or play solo with a full table of AI opponents.

**Live at [textgame.ai](https://textgame.ai)**

---

## Features

### AI Game Engine
- **Autonomous Game Master** — Parses structured directives (`ASSIGN_ROLE`, `NEXT_SPEAKER`, `ELIMINATE`, `GAME_OVER`, etc.) to drive game state without manual intervention.
- **AI Player Characters** — Each AI player has a unique personality, strategy style, and optional voice. They deliberate, bluff, vote, and react in real time.
- **20+ Game Templates** — Werewolf, Mafia, Undercover, Spyfall, Codenames, 20 Questions, Escape Room, Debate, Improv Comedy, and more.
- **Custom Game Creation** — Define your own rules, roles, phases, and win conditions.

### Multiplayer & Social
- **Real-time Multiplayer** — Invite friends via shareable links; mix human and AI players.
- **Private Boards** — Per-player secret information (roles, notes) managed by the host.
- **Channel System** — Separate rooms for game chat, rules, private boards, and custom sections.
- **Guest Join** — No account required for invited players.

### Voice & Media
- **Speech-to-Text** — Voice input via OpenAI Whisper.
- **Text-to-Speech** — AI characters speak with unique voices (Cartesia, Inworld.ai).
- **AI Avatar Generation** — Character portraits via DALL-E or Replicate (Flux / Stable Diffusion).

### Monetization
- **Token System** — Pay-as-you-go credits with model-aware cost estimation.
- **Subscription Plans** — Stripe-powered Pro/Plus/Ultra tiers.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS, Motion (Framer), Tiptap |
| **Backend** | Next.js API Routes (serverless), OpenAI API (GPT-4o / GPT-5.3, Whisper, DALL-E) |
| **Database** | PostgreSQL via Supabase (Auth, RLS, Realtime, Storage) |
| **Payments** | Stripe (subscriptions + one-time purchases) |
| **Voice** | Cartesia TTS, Inworld.ai TTS |
| **Monitoring** | Sentry, Vercel Analytics |
| **Testing** | Vitest, Playwright, Storybook |

---

## Architecture

```
src/
├── app/
│   ├── (pages)/                  # Route groups
│   │   ├── game/[gameId]/        # Game room — real-time play
│   │   ├── discover/             # Browse & search templates
│   │   ├── my-games/             # User's game library
│   │   ├── profile/              # User profile & settings
│   │   ├── subscription/         # Stripe subscription management
│   │   └── recharge/             # Token purchase
│   ├── api/                      # Serverless API routes
│   │   ├── chat/                 #   Streaming AI chat & player-speak
│   │   ├── characters/           #   Character CRUD & generation
│   │   ├── games/[gameId]/       #   Multiplayer room management
│   │   ├── stripe/               #   Payment webhooks & checkout
│   │   └── voice/                #   Transcribe & TTS
│   ├── components/               # React components (shadcn/ui based)
│   └── config/                   # Host personalities, game phases, branding
├── hooks/                        # Custom hooks (useHostRound, useGameInit, useChatTTS)
├── lib/                          # Core logic
│   ├── gm-system-prompt.ts       #   Game Master system prompt builder
│   ├── host-prompt-builder.ts    #   Per-template prompt adaptation
│   ├── game-templates.ts         #   20+ template definitions
│   ├── game-template-driver.ts   #   Template-specific game mechanics
│   └── __tests__/                #   Comprehensive unit tests
├── contexts/                     # React contexts (Auth, Game, GameRoom)
├── types/                        # TypeScript type definitions
└── data/                         # Discovery templates, presets, SEO data
```

### Core Game Loop

```
Lobby → Host Intro → [Turn Cycle] → Game Over
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          Host Turn  AI Turn   Human Turn
         (stream)   (player-   (user input)
                     speak)
              │          │          │
              └──────────┼──────────┘
                         ▼
              Parse Host Directives
         (ASSIGN_ROLE, NEXT_SPEAKER,
          ELIMINATE, GAME_OVER, ...)
                         │
                         ▼
              Update Game State
         (roles, boards, phase, votes)
```

The AI Game Master's output is parsed for structured directives that drive the entire game state machine — role assignments, speaker ordering, eliminations, private board updates, and game conclusion — all without manual intervention.

---

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key
- Supabase project (auth + database)
- Stripe account (optional, for payments)

### Installation

```bash
git clone https://github.com/BrookeMa/TextGame.ai.git
cd TextGame.ai
npm install
```

### Environment Variables

Copy `.env.example` and fill in:

```env
# Required
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Optional
STRIPE_SECRET_KEY=
REPLICATE_API_TOKEN=
INWORLD_BASIC_BASE64=
```

### Run

```bash
npm run dev          # Development server at localhost:3000
npm run build        # Production build
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run storybook    # Component playground
```

---

## License

This project is proprietary. All rights reserved.
