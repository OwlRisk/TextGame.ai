<p align="center">
  <img src="public/icon.svg" width="80" alt="TextGame.ai logo" />
</p>

<h1 align="center">TextGame.ai</h1>

<p align="center">
  <strong>AI-driven text RPG platform</strong><br>
  An AI Game Master runs cooperative dungeon crawls and open-world adventures with a party of AI companions — anyone can sit down and play.
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

**TextGame.ai** is an AI-hosted text RPG platform. An autonomous Game Master narrates the world, runs combat, controls a party of AI companions with their own personalities, and adapts the story to what the human player does.

Three play modes are currently shipped:

| Mode | What it is | Driver |
|---|---|---|
| **RPG Dungeon Crawl** | A cooperative party of 3–6 fights through 4–5 themed dungeon rooms to a final boss. d20 + stat resolution, class skills, knockouts and revives. | `templates/rpg-dungeon` |
| **Open-World RPG** | Pick a world (Western Fantasy or Wuxia), build a party, and explore a MUD-style room graph. The GM generates rooms, NPCs, quests, and loot on the fly. | `worlds/*` + `buildRpgDirectorPrompt` |
| **Scene Adventure** | Authored short-form interactive stories (lighthouse mystery, supernatural town, museum heist, ghost train) with hand-tuned characters and a "GM brain" that releases plot ingredients at the right moment. | `scenes/*` + `buildSceneDirectorPrompt` |

**Live at [textgame.ai](https://textgame.ai)**

---

## Features

### AI Game Master
- **Autonomous director** — Parses structured directives (`NEXT_SPEAKER`, `ROOM_UPDATE`, `COMBAT_START/END`, `PLAYER_UPDATE`, `ENCOUNTER_FIRED`, `CHANNEL_GOAL`, `QUICK_ACTIONS`, `GAME_OVER`, …) to drive the entire game state without human moderation.
- **Persistent GM state** — A typed `GmState` object carries across turns (act, tension, ingredients used/available, what the player knows vs doesn't, active threats, mood, world rooms, combat, encounters fired, active boss with phase tracking, NPCs introduced, quests completed) so the GM has memory.
- **Character whispering** — `CHARACTER_DIRECTION: <name> | <instruction>` lets the GM secretly steer individual party members for drama, conflict, and reveals.

### Authored RPG Adventures (5 shipped)
Adventures are typed data — not prose blobs — so the runtime can validate them. Each declares NPCs, encounters with stable ids, boss phase HP thresholds, ingredients, secrets, threats, and quests with auto-completion triggers + rewards.

| Adventure | World | Length |
|---|---|---|
| The Tournament of Jade Peak | Wuxia | 30–60 min |
| The Iron Bell of Heishan | Wuxia | 20–30 min |
| The Dungeon of Starfall | Western Fantasy | 30–60 min |
| The Beggar's Coin | Western Fantasy | 20–30 min |
| The Cursed Crossroads | Mixed | 30–60 min |

### Six-Layer Validator Pipeline
On every GM turn the runtime cross-checks the GM's output against the structured adventure to prevent the failure modes that plague prose-only LLM RPGs. Each layer is a pure function (`reconcile*` in `lib/gm-state.ts`) covered by unit tests:

| Layer | What it catches | Player-visible? |
|---|---|---|
| **Ingredient ledger** | Re-introducing an already-used plot beat | No (internal correction) |
| **Encounter ledger** | Firing the same authored encounter twice | No |
| **Boss phase tracker** | Forgetting to enter Phase 2 when boss HP crosses the threshold | No |
| **NPC continuity** | NPCs who should have appeared by Act N still missing; consistency reminder for already-on-stage NPCs | No |
| **ROOM_UPDATE missing** | Narration says "you enter the chapel" but no room update was emitted | Yes — keeps room panel in sync |
| **Quest completion** | Auto-detects when a quest's `completedWhen` ID enters the encounter or ingredient ledger; auto-grants exp/items; shows quest progress in a sidebar; prompts the GM to narrate resolution without double-granting | Yes — sidebar + chat banner |

Each layer surfaces validator alerts at the top of the *next* GM prompt so the GM corrects course on the next turn rather than compounding errors.

### AI Players
- **Distinct personalities** — Each AI companion has personality, background, goal, fear, speech style, quirk, and an attitude toward the human player.
- **Class & skills (RPG)** — Warrior / Mage / Rogue / Healer (dungeon) plus world-specific classes (Western Fantasy, Wuxia) with skills, MP costs, and level-up progression.
- **World-aware vocabulary** — Wuxia companions say "运起内力" / "招式" instead of "spell / mana / MP"; the player-speak prompt is parameterised by the world's terminology block.

### Multiplayer
- **Real-time rooms** — Multiple humans can join a single game via shareable links; mix with AI companions to fill the party.
- **Guest join** — No account required for invitees.
- **Per-player private boards** — HP, inventory, role, hidden notes managed by the host.

### Monetization
- **Token system** — Pay-as-you-go credits with model-aware cost estimation.
- **Stripe** — One-time credit pack purchases (no subscriptions).

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS, Motion (Framer), Tiptap |
| **Backend** | Next.js API Routes (serverless), OpenAI API, optional Gemini fallback |
| **Database** | PostgreSQL via Supabase (Auth, RLS, Realtime, Storage) |
| **Payments** | Stripe (one-time credit purchases) |
| **Email** | Nodemailer (contact / feedback form) |
| **Monitoring** | Sentry, Vercel Analytics |
| **Testing** | Vitest (unit), Playwright (E2E) |

---

## Architecture

```
src/
├── app/
│   ├── (pages)/                  # Route groups
│   │   ├── game/[gameId]/        #   Game room — real-time play
│   │   ├── discover/             #   Browse RPG worlds & scenes
│   │   ├── my-games/             #   User's game library
│   │   ├── profile/              #   User profile & settings
│   │   ├── recharge/             #   Token purchase
│   │   ├── create/               #   New-game wizard
│   │   └── play/[token]/         #   Guest invite landing
│   ├── [locale]/                 # Locale-aware SEO routes (zh/ja/ko/...)
│   ├── api/                      # Serverless API routes
│   │   ├── chat/                 #   GM streaming + player-speak
│   │   ├── characters/           #   AI character generation
│   │   ├── games/[gameId]/       #   Multiplayer room management
│   │   ├── community/            #   Published-game feed
│   │   ├── stripe/               #   Checkout + webhook
│   │   └── share/                #   Invite-token resolution
│   ├── components/               # React components (shadcn/ui based)
│   └── config/                   # Host personalities, branding
├── hooks/                        # useHostRound, useGameInit, useChatTTS, …
├── lib/
│   ├── gm-system-prompt.ts       #   Setup-phase GM prompt
│   ├── host-prompt-builder.ts    #   Three runtime GM prompts: dungeon, scene, RPG
│   ├── player-speak-prompt.ts    #   AI-player character prompts
│   ├── ai-player-briefing.ts     #   Per-turn role briefings (i18n)
│   ├── gm-state.ts               #   Typed GM brain + ROOM_UPDATE/CHARACTER_DIRECTION parser
│   ├── host-output-parser.ts     #   Parses NEXT_SPEAKER, COMBAT_*, PLAYER_UPDATE, QUICK_ACTIONS, …
│   ├── host-actions.ts           #   Parses [BOARD], [SECTION], [GAME_OVER], MOOD, REACT, …
│   ├── templates/                #   Game templates (rpg-dungeon, custom)
│   ├── scenes/                   #   Authored scene adventures
│   ├── rpg/                      #   Worlds, classes, archetypes, regions
│   └── __tests__/                #   Vitest unit tests (~2700 cases)
├── contexts/                     # React contexts (Auth, Game, GameRoom)
├── types/                        # TypeScript type definitions
├── data/                         # Discovery templates, presets, SEO data
└── proxy.ts                      # Next 16 proxy (formerly middleware.ts)
```

### Core Game Loop

```
Lobby → Host Intro → [Turn Cycle] → Game Over
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
          GM Turn    AI Turn    Human Turn
         (stream)  (player-     (user input)
                    speak)
              │          │          │
              └──────────┼──────────┘
                         ▼
              Parse Directives
   (NEXT_SPEAKER, ROOM_UPDATE, COMBAT_*,
    PLAYER_UPDATE, CHARACTER_DIRECTION,
    GM_STATE, QUICK_ACTIONS, GAME_OVER, ...)
                         │
                         ▼
              Update Game State
   (rooms, HP, inventory, party, phase, gmState)
```

The GM's output is split by `---` into a **NARRATION** half (visible to players) and a **DIRECTIVES** half (machine-parsed and stripped before display). The directives are what drive the room graph, combat, party stats, character whispers, and the persistent `GmState`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key
- Supabase project (auth + database)
- Stripe account (optional, for credit purchases)

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
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=
DIRECT_URL=

# Optional
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GEMINI_API_KEY=             # cheaper fallback chat model
EMAIL_HOST= EMAIL_USER= ... # contact form
```

### Run

```bash
npm run dev          # Development server at http://localhost:3000
npm run build        # Production build
npm run lint         # tsc --noEmit + eslint src/
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E
npm run db:setup     # Apply schema.sql + run all database/migrations/*.sql
npm run db:migrate   # Run all (or one) migration only
```

> **TLS note:** if your local Supabase pooler complains with `SELF_SIGNED_CERT_IN_CHAIN`, set `DATABASE_SSL_REJECT_UNAUTHORIZED=0` in `.env` (only the PG client reads it). Avoid setting `NODE_TLS_REJECT_UNAUTHORIZED=0` globally — that disables TLS for every outbound HTTPS call (OpenAI, Stripe, Sentry…).

---

## License

This project is proprietary. All rights reserved.
