# TextGame.ai 彻底改造方案（单机版）

> 状态：草案 · 待主理人审定后按里程碑落地
> 适用版本：post-`refactor/rpg-only-community` (2026-05)
> **2026-05-10 修订**：基于"用户量少 + 转向单机"决定，删除原 M2/M4/M5 中所有多人 / UGC / 创作者经济相关内容；新增"AI 同伴深度"为核心支柱

---

## 0. TL;DR

1. **战略**：放弃"AI 桌游平台"定位，转向 **"一款带 AI-DM 的单机文字 RPG"**。卖的是**游戏**而不是**平台**。
2. **护城河**：六层校验器 + 结构化 GM 状态 + 类型化 adventure schema —— 这套技术单机用同样有效，且单机场景下更易做出"叙事一致性"的体验差。
3. **北极星**：**"你的角色是你的，世界会记得你做过什么，AI 同伴会陪你走完整个 campaign"**。参考形态：Wildermyth × AI Dungeon × 永续角色。
4. **大砍**：删多人 / Realtime / 邀请 / 大厅 / 公开分享 / UGC / 创作者分成 —— 这些都是为"用户量"服务，用户量少时是负资产。
5. **大补**：AI 同伴深度（永续陪伴 + 个人弧线）、长篇 campaign（多 adventure 串成大世界）、程序化无限内容、premium content 模式（季票 / DLC 风格）。
6. **节奏**：5 个里程碑、约 3–4 个月（比原计划缩短 1–2 个月，因为不再做大厅 / UGC / 分成）。M0 顺便清掉多人代码，是净减法。

---

## 1. 现状诊断

### 1.1 真正的护城河（保留并强化）
- `lib/gm-state.ts` 802 行的六层校验：ingredient ledger、encounter ledger、boss phase、NPC 连续性、ROOM_UPDATE、quest 自动完成。**这是 AI Dungeon 类竞品做不到的**。
- 类型化 adventure schema：[`src/lib/rpg/adventures.ts`](../src/lib/rpg/adventures.ts) 1248 行。冒险是数据不是 prose，可以验证。
- 多模板架构：dungeon / open-world / scene 三种 driver 已经收敛到 `game-template-driver.ts`。

### 1.2 真正的瓶颈（必须破）
| 瓶颈 | 表现 | 后果 |
|---|---|---|
| 内容稀缺 | 仅 5 个手写冒险 | 用户 2 小时玩完核心内容；LTV 上不去 |
| 角色非持久 | 每局重新建角色 | 没有"养成感"，跟 AI Dungeon 的水平体验差距没拉开 |
| AI 同伴扁平 | 每局新生成，互不相识，没有弧线 | 单机模式下同伴 = 全部社交结构，扁平化等于体验崩 |
| 多人代码包袱 | Realtime / Presence / Guest 这一整套，但实际无人共玩 | 维护成本 + bundle 体积 + 复杂度都白付，且生硬地侵入了所有热路径 |
| 货币化错位 | 按 token 售卖 → 用户感觉是"买 AI 调用" | 与"我在玩一款游戏"的心智冲突；高玩反而买不下去 |

### 1.3 工程债（同等紧迫）
- [`GameRoomContext.tsx`](../src/app/contexts/GameRoomContext.tsx) 927 行、~40 个 `useState`、30+ 个 `setX` 全暴露：任何状态变都让所有订阅者重渲染。
- [`useHostRound.ts`](../src/hooks/useHostRound.ts) 1389 行：网络 + prompt 构建 + 校验 + 计费混在一起。
- [`i18n.ts`](../src/lib/i18n.ts) 4252 行：11 种语言全量打进 bundle。
- [`adventures.ts`](../src/lib/rpg/adventures.ts) 1248 行：5 个冒险全量加载。
- [`game-master-chat.tsx`](../src/app/components/game-master-chat.tsx) 1611 行：上帝组件。
- 27 个 Radix 包，半数未被使用（推测，需 bundle analyze 验证）。
- 127 处 `console.*` 散落，已有 `lib/logger.ts` 但未被强制使用。
- `pg` + `@supabase/supabase-js` 双客户端并存。

---

## 2. 产品北极星

### 2.1 一句话定位
**"一款 AI 主持的单机文字 RPG。你的角色是你的、世界会记得你做过什么、AI 同伴会陪你走完整个 campaign。"**

### 2.2 与竞品的差异化
- AI Dungeon / NovelAI：生成混乱、无规则、无角色、无世界记忆。我方：**结构化 + 校验 + 持久角色 + 持久世界**。
- Friends & Fables / Hidden Door：相似定位的早期玩家。我方：**六层校验 + 多模板，技术领先 6–12 个月**。
- 传统 CRPG（Baldur's Gate / Pillars）：固定剧本、高制作成本。我方：**无限程序化冒险 + AI 同伴个性化反应**，制作成本几乎为零。
- Wildermyth：手绘风、回合制 + 涌现叙事。我方：**纯文字、AI 驱动、更便宜更深更快迭代**——但要警惕这个对标对手做得已经很好，叙事质量必须打过它才有立足之地。

### 2.3 两个核心循环（替代原三个）
```
[角色循环]   建角色 → 进 adventure → 战利品 / 同伴关系变化 / 世界印记 →
            回宿营地 → 升级 / 同伴对话 / 整理背包 → 选下一个 adventure
[世界循环]   adventure A 的选择 → 留下世界印记（NPC、派系、地点状态）→
            adventure B 的开局对此做出反应 → 形成跨剧本的连续叙事
```
单机模式下两循环互相喂养：每个 adventure 是独立短篇，但**你的角色 + 世界状态**是贯穿整个游戏寿命的长篇。

### 2.4 内容供给：手写 + 程序生成（删除 UGC）
- **authored adventures** = 主线 / 精品店（手工调过，质量最高）
- **procedural adventures** = 每日 dungeon / 无限模式（用 LLM 生成符合 schema 的结构化冒险，走同一套校验器；validator 失败重生成）
- **不做 UGC** = 没用户量，社区会是死镇

校验器是中立的、不关心 adventure 来自手写还是生成，两类共用同一个 runtime。

### 2.5 AI 同伴的深度（新增核心支柱）
单机模式下，AI 同伴 = 整个社交结构。当前同伴每局新生成、互不相识 —— 这是体验最大短板。
- **同伴持久化**：同伴是独立实体，跨 adventure 跟随你。每个同伴有自己的等级、装备、记忆。
- **同伴弧线**：每个同伴有 1–3 个"个人任务"，在某个 adventure 触发；解锁后忠诚度上升 / 解锁专属技能。
- **同伴关系网**：同伴之间相互看法（喜欢 / 厌恶 / 中立），影响营地对话氛围。
- **永久死亡选项**：可开关。开则同伴战死永久离队（Wildermyth 模式），关则只是临时退场。
- **告别**：同伴可以在某些条件下永久离开你（达成目标 / 价值观冲突太大），这种"失去"是单机叙事最高级的张力。

这一支柱是**单机模式下相对 AI Dungeon 的最大差异**——AI Dungeon 的 NPC 是无状态文本，我方的同伴是有状态实体。

---

## 3. 新架构

### 3.1 目录重构

```
src/
├── app/                          # Next.js 路由层（保留）
│   └── (pages)/
│       ├── home/                 # 新：主菜单（继续游戏 / 新建角色 / 设置）
│       ├── character/[id]/       # 新：角色详情页 + 同伴列表 + 世界印记
│       ├── camp/[characterId]/   # 新：宿营地（adventure 之间的中转）
│       ├── adventure/[id]/       # 新：冒险预览页（开始前）
│       └── play/[runId]/         # 现：游戏房间（重命名 gameId → runId 强调单局）
│
├── engine/                       # 新：纯函数游戏引擎（无 React、无 Next）
│   ├── gm/                       # 从 lib/gm-state.ts、host-actions.ts 提取
│   │   ├── state.ts
│   │   ├── reconciler/           # 六层校验，每层一个文件
│   │   │   ├── ingredients.ts
│   │   │   ├── encounters.ts
│   │   │   ├── boss-phase.ts
│   │   │   ├── npc-continuity.ts
│   │   │   ├── room-update.ts
│   │   │   └── quests.ts
│   │   └── directives/           # 从 host-output-parser.ts 拆
│   ├── rpg/
│   │   ├── character.ts          # 新：持久角色模型
│   │   ├── progression.ts        # 新：升级 / 经验曲线
│   │   ├── inventory.ts          # 新：装备 / 词缀
│   │   └── resolution.ts         # 现 d20 解析（已有）
│   ├── adventure/
│   │   ├── schema.ts             # 从 adventures.ts 提取
│   │   ├── validator.ts          # 新：跑 UGC / 生成内容前的校验
│   │   └── generator.ts          # 新：procedural 生成器
│   ├── prompt/                   # 从 host-prompt-builder.ts 拆
│   │   ├── system.ts
│   │   ├── adventure-context.ts
│   │   ├── player-speak.ts
│   │   └── cache-keys.ts         # 标识哪些 prompt 段是稳定的（喂 prompt cache）
│   └── pace/                     # 从 game-pace.ts
│
├── content/                      # 新：内容数据
│   ├── adventures/               # 一个冒险一个文件，按 id 动态 import
│   │   ├── jade-peak.ts
│   │   ├── starfall-dungeon.ts
│   │   └── ...
│   ├── classes/
│   ├── archetypes/
│   └── worlds/
│
├── ai/                           # 新：AI provider 抽象
│   ├── client.ts                 # 统一接口 chat() / stream() / generateImage()
│   ├── providers/
│   │   ├── openai.ts
│   │   └── anthropic.ts          # 预留
│   ├── cache.ts                  # prompt cache key 管理
│   ├── budget.ts                 # token 计费（从 lib/tokens.ts 整合）
│   └── retry.ts
│
├── stores/                       # 新：zustand
│   ├── auth-store.ts
│   ├── run-store.ts              # 拆 GameRoomContext（rename: room→run，单机语义）
│   │   ├── messages-slice
│   │   ├── party-slice           # 角色 + 同伴（不再是 players）
│   │   ├── gm-state-slice
│   │   └── ui-slice
│   ├── character-store.ts        # 新：持久角色
│   ├── companion-store.ts        # 新：持久同伴
│   └── world-store.ts            # 新：跨 adventure 的世界印记
│
├── features/                     # 新：按业务功能聚合的组件 + hooks
│   ├── character-sheet/
│   ├── companion-roster/         # 新：同伴名册
│   ├── camp/                     # 新：营地 UI
│   ├── adventure-browser/
│   ├── chat/                     # 现 chat-area / chat-input 收敛于此
│   └── settings/
│
├── i18n/                         # 拆 lib/i18n.ts
│   ├── en.ts
│   ├── zh.ts
│   ├── ja.ts
│   └── loader.ts                 # dynamic import by locale
│
├── ui/                           # 现 app/components/ui（Radix wrappers）
└── lib/                          # 仅保留真正的"工具"
    ├── analytics.ts
    ├── logger.ts
    ├── env.ts
    └── ...
```

**关键原则**：
- `engine/` 必须是纯 TS，零 React 依赖。可以单独 `vitest` 测，可以未来发布成 npm 包。
- `features/` 是 UI 与业务逻辑的耦合点；`engine/` 是业务逻辑的纯化层。
- `stores/` 替代 5 个 Context；用 selector 订阅，组件只重渲染自己关心的切片。

### 3.2 状态管理：Context → zustand

```ts
// stores/room-store.ts
export const useRoomStore = create<RoomState>()(
  subscribeWithSelector((set, get) => ({
    messages: [],
    addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),

    players: [],
    updatePlayer: (id, patch) => set((s) => ({
      players: s.players.map(p => p.id === id ? { ...p, ...patch } : p)
    })),

    gmState: null,
    setGmState: (gs) => set({ gmState: gs }),
    // ...
  }))
);

// 消费侧
const messages = useRoomStore(s => s.messages);  // 只重渲染 messages 变时
```

收益：组件级 re-render 控制；逻辑可以在 store 外（在 engine/ 里）调用；测试时直接 `useRoomStore.setState({ ... })` 即可。

### 3.3 AI Provider 抽象

```ts
// ai/client.ts
export interface AiClient {
  stream(opts: StreamOpts): AsyncIterable<StreamChunk>;
  complete(opts: CompleteOpts): Promise<Completion>;
  generateImage(opts: ImageOpts): Promise<ImageResult>;
}

// 调用点统一从 ai/client.ts 拿
const ai = getAiClient();  // 根据 env 选 provider
```

收益：
- prompt cache 命中由 client 内部管理（OpenAI 自动；其他厂商需要 prefix-stable）。
- 重试 / Sentry 标签 / token 计费集中处理。
- 未来接 Claude / Gemini 做 fallback 改 1 处即可。

### 3.4 校验器流水线独立化

把 `gm-state.ts` 里的六层 `reconcile*` 拆成 `engine/gm/reconciler/<layer>.ts`，每层是纯函数：

```ts
// engine/gm/reconciler/index.ts
export function runReconcilers(
  state: GmState,
  output: ParsedGmOutput,
  adventure: Adventure,
): { state: GmState; alerts: ValidatorAlert[] } {
  return [
    ingredients,
    encounters,
    bossPhase,
    npcContinuity,
    roomUpdate,
    quests,
  ].reduce((acc, fn) => fn(acc, output, adventure), { state, alerts: [] });
}
```

这是**最值得做的工程改造**——校验器是产品的护城河，单独抽出意味着：
- 可以单独发布 npm 包 / SDK，让外部 UGC 工具用同一套校验。
- 单元测试覆盖率直观可量化（每层一个文件）。
- 加新校验层（比如"inventory consistency"、"faction reputation"）只加文件不改主流程。

---

## 4. 数据模型迁移

### 4.1 新增表

```sql
-- 持久角色
CREATE TABLE characters (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  world_id TEXT NOT NULL,           -- western-fantasy / ...
  class_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  exp INT NOT NULL DEFAULT 0,
  stats JSONB NOT NULL,             -- STR/DEX/INT/...
  inventory JSONB NOT NULL DEFAULT '[]',
  backstory TEXT,
  portrait_url TEXT,
  is_dead BOOLEAN DEFAULT FALSE,    -- 单机才有意义的字段
  death_record JSONB,               -- 死在哪 / 怎么死 / 第几级
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ
);

-- 持久同伴（核心新模型）
CREATE TABLE companions (
  id UUID PRIMARY KEY,
  owner_character_id UUID REFERENCES characters(id),
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  stats JSONB NOT NULL,
  personality JSONB NOT NULL,       -- 性格 / 背景 / 目标 / 恐惧 / 怪癖
  loyalty INT NOT NULL DEFAULT 50,  -- 0-100
  status TEXT NOT NULL DEFAULT 'active', -- active / dismissed / dead / departed
  arc_progress JSONB,               -- 个人任务进度
  relationships JSONB,              -- 与其他同伴的看法
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ
);

-- 单局游玩记录（runs，不再是 games）
CREATE TABLE runs (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  adventure_id TEXT NOT NULL,
  party_companion_ids UUID[],       -- 这次带的同伴
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,                     -- victory / defeat / abandoned
  exp_gained INT,
  loot JSONB,
  world_impact JSONB,               -- 在世界印记表里产生的变更
  -- 进行中的局的完整 GM state snapshot（替代 game_room_state）
  state_snapshot JSONB
);

-- 世界印记：跨 adventure 的持久影响
CREATE TABLE world_imprints (
  id UUID PRIMARY KEY,
  character_id UUID REFERENCES characters(id),
  kind TEXT NOT NULL,               -- npc_state / faction_rep / location_state / rumor
  ref_id TEXT NOT NULL,             -- 例如 "npc:elara"，"faction:thieves_guild"
  data JSONB NOT NULL,              -- 详细状态
  source_run_id UUID REFERENCES runs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (character_id, kind, ref_id)
);

-- 冒险目录（authored + procedural；不需 author / community 字段）
CREATE TABLE adventures (
  id TEXT PRIMARY KEY,              -- 'jade-peak' 或 'proc-{uuid}'
  source TEXT NOT NULL,             -- 'authored' | 'procedural'
  title TEXT NOT NULL,
  world_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  est_minutes INT,
  level_min INT, level_max INT,
  data JSONB NOT NULL,              -- 完整 Adventure schema
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 内容包 / 季票（M4）
CREATE TABLE content_packs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INT,
  adventure_ids TEXT[],
  released_at TIMESTAMPTZ
);

CREATE TABLE user_pack_entitlements (
  user_id TEXT NOT NULL,
  pack_id TEXT NOT NULL REFERENCES content_packs(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,                      -- 'purchase' | 'subscription' | 'gift'
  PRIMARY KEY (user_id, pack_id)
);
```

### 4.2 一次性 migration（顺便删多人）

```sql
-- 1. 5 个 authored adventures 写入 adventures with source='authored'。
-- 2. 给每个有过游玩的 user 创建一个 "Legacy Hero" 角色（弹窗征求是否保留）。
-- 3. game_room_state 中的进行中游戏，迁到 runs.state_snapshot。
-- 4. DROP 表 / 字段：multiplayer-related rows in 016_multiplayer.sql、guest player 相关字段、
--    共享 / 邀请相关 columns（具体清单在 M0 的工作中确定）。
-- 5. token 余额保留；不强制清算。
```

向后兼容性（单机版下大幅放宽）：
- 现有 `/play/[gameId]` 路由 301 重定向到 `/play/[runId]`，URL 兼容。
- 现有 share 链接：M2 后变成只读的"战报回放"，不再支持 join。
- token 包继续可用（M4 引入内容包后变成"双轨"）。
- 在线多人 / 邀请功能：M0 直接下线（先做用户公告）。

---

## 5. 里程碑

> 每个里程碑都**独立交付价值**，可以独立上线 / 回滚。单机定位下共 5 个，约 3–4 个月。

### M0 — 工程底盘 + 移除多人代码（3 周，0 玩法变化）

**目标**：清掉技术债 + 把多人 / Realtime / 邀请这一大块从代码里剥离干净。零叙事 UX 变化。

- [ ] 公告下线多人功能（保留单人入口）；旧 share 链接降级为只读战报
- [ ] **删除多人代码**：
  - `useGameChannels.ts`、`speaker-queue.ts` 中的多人分支
  - `app/api/join/`、`app/api/share/` 中的协作端点
  - Supabase Realtime Presence / Broadcast 订阅
  - Guest player 全套代码 + 测试（释放 ~10 个测试文件）
- [ ] 引入 zustand，把 `GameRoomContext` 拆成 4 个 slice → `run-store` / `character-store` / `companion-store`（占位）/ `ui-store`
- [ ] 提取 `engine/gm/reconciler/` 子目录，每层独立文件
- [ ] 拆 `useHostRound`：`useHostStream` / `useGmReconciler` / `useHostScheduler`
- [ ] `lib/i18n.ts` → `src/i18n/<lang>.ts` + dynamic import
- [ ] `lib/rpg/adventures.ts` → `content/adventures/<id>.ts` + dynamic import
- [ ] Bundle audit：删 27 → 约 10 个 Radix；`optimizePackageImports` 补全
- [ ] 127 处 `console.*` → `logger.*`
- [ ] AI 调用统一走 `ai/client.ts`，加 prompt cache key（长 system prompt 作稳定前缀）

**验收**：
- 全部测试通过（应该从 114 → 约 90，因为多人测试被删）
- bundle size 下降 ≥ 40%（多人代码 + Radix 双重瘦身）
- Lighthouse FCP/LCP 提升 ≥ 25%

**风险**：低。纯减法 + 重构。多人公告下线需要提前一周通知（数据看起来基本无人用，但要走流程）。

### M1 — 持久角色 + 永续同伴（3 周）

**目标**：让用户第一次有"我的英雄 + 我的队伍"。这是单机叙事的根。

- [ ] `characters` + `companions` 表 + `/character/[id]` 路由
- [ ] **角色侧**：1–20 级成长曲线、装备槽（武器 / 护甲 / 饰品）、属性页
- [ ] **同伴侧**：进 adventure 前从同伴名册里挑 2–3 个；同伴的属性 / 装备 / 等级独立持久
- [ ] 局末弹窗：保存角色 + 同伴；战利品 / 经验入账
- [ ] 角色履历页：玩过的 adventure 时间线 + 关键决定
- [ ] **死亡机制（设置项）**：永久死亡开关；死亡的角色保留为"墓碑"可查阅
- [ ] migration：现有完成游戏可选转化为 Legacy Hero

**验收**：
- 第二次进局时复用既有角色的比例 ≥ 60%（单机模式下应该比多人版高）
- 至少 30% 的角色累计带过 ≥ 2 个不同同伴跑过 ≥ 3 个 adventure

**风险**：低-中。机制成熟参考多。注意 UI 不要做成"养成游戏"——重点是"我的"，不是"数值堆砌"。

### M2 — 程序化无限内容（3 周）

**目标**：把内容供给从"5 个"拓到"无限"。这是单机模式下提升 LTV 的最大杠杆。

- [ ] `engine/adventure/generator.ts`：给定 world + difficulty + length + 角色等级 → 输出 Adventure JSON
- [ ] **生成器流程**：种子（玩家选标签 / 长度 / 难度）→ LLM 生成结构化 JSON → validator 校验 → 失败重生成（最多 3 次）→ 持久化到 `adventures` 表
- [ ] **种子模式**：每日 Dungeon（固定种子全服共享）+ 自定义种子（玩家描述："我想要一个雪山遗迹找失踪商队的故事"）
- [ ] **生成结果可重玩**：生成的 Adventure 一旦合格就持久化，可以分享给自己的另一个角色玩
- [ ] **缓存与预生成**：常用 (世界 + 难度 + 长度) 组合后台预生成 20–50 个，玩家点开秒进

**验收**：
- 生成 Adventure 一次校验通过率 ≥ 70%
- 完成率（玩到 GAME_OVER）≥ 50%
- 玩家手动评分（局末 1–5 星）平均 ≥ 3.7

**风险**：高。质量参差是主风险。
**缓解**：
- validator 兜底，垃圾进不了运行时
- 评分 < 3 星的种子标记下架；高分种子打"精选"标签
- 提供"重新生成"按钮（同种子换一个生成结果）

### M3 — 同伴弧线 + 世界印记（4 周）

**目标**：让 adventure 之间不再相互独立——你的选择和同伴的故事开始累积。这是相对 AI Dungeon 的**最大叙事差**。

- [ ] **同伴弧线**：每个同伴 1–3 个个人任务，被某些 Adventure 中的触发器激活
  - 触发器格式：`adventure trigger: {kind: 'encounter_fired'|'ingredient_used'|'npc_met', ref: ...}`
  - 完成解锁专属技能 / 忠诚度 +20 / 解锁同伴对话
- [ ] **世界印记**：
  - `world_imprints` 表记录跨 adventure 的状态（NPC 还活着 / 派系敌对 / 地点已毁）
  - 新生成 Adventure 的 prompt 加入"该角色的世界印记摘要"作为种子
  - validator 加第 7 层：印记一致性（不能在已死的 NPC 处遇到 ta）
- [ ] **营地系统** `/camp/[characterId]`：
  - adventure 之间的中转空间
  - 同伴可点击对话（基于关系网 / 弧线状态生成）
  - 整理背包 / 升级技能 / 选下一个 adventure
- [ ] **同伴关系网**：同伴 A 喜欢同伴 B 但讨厌同伴 C 这种基本关系；进 adventure 前同伴有"我不想跟 X 一起"的拒绝可能

**验收**：
- 同伴弧线触发率 ≥ 60%（即至少有一个同伴在角色生涯里推进过弧线）
- 含世界印记的 Adventure 中，印记被新 Adventure 引用 ≥ 50%（说明真的"被记住"）

**风险**：高。validator 第 7 层涉及跨局状态，复杂。
**缓解**：印记表 schema 严格收口（仅四种 kind），不允许自由文本字段做条件判定。

### M4 — 货币化：内容包 + 季票（2 周）

**目标**：从 token-only 转向"游戏型"商品结构。

- [ ] **内容包 / 季票**：每月发布一个手工调过的精品 Adventure 包（3–5 个 Adventure + 限定同伴 + 限定装备外观）
- [ ] 定价档：
  - 单包 ¥18
  - 季票 ¥49（4 个内容包，包含未来 3 个月）
  - 终身解锁 ¥199（含所有内容包，新内容包不再收费）
- [ ] token 包**保留**作为"想多玩程序生成内容"用户的备选（程序内容是 AI 调用，按 token 计）；手写内容包不消耗 token
- [ ] Steam-like 库页面 `/library`：已购内容包 / 未购的预告 / 限时折扣

**验收**：
- 上线第一个内容包后 30 天，付费转化率 ≥ 8%
- 终身解锁购买占比 ≥ 15%（反映重度玩家比例）

**风险**：中。需要持续产出手工内容包（每月 1 个 ≈ 1 周制作）。
**缓解**：每个内容包 = 1 个手写主线 + 2-3 个程序生成精修。

---

> **不做** 的事（明确放弃）：
> - 大厅 / 多人 / 观战 / 邀请
> - UGC 编辑器 / 创作者市场 / 收益分成
> - 公开评论 / 评分广场
> - 实时社交功能

---

## 6. 风险与回退

| 风险 | 等级 | 缓解 |
|---|---|---|
| 多人下线引起老用户抱怨 | 低 | 用户量本就少；提前一周公告 + 给 token 补偿 |
| LLM 成本爆炸（程序生成爆量） | 高 | M0 prompt cache；M2 生成器流水线复用结果；按级别限制每日生成上限 |
| 程序生成内容质量参差 | 高 | validator 兜底；评分淘汰；预生成精选库 |
| 同伴弧线 / 世界印记机制设计错 | 中-高 | M3 上线前用 1 周做内部纸面推演；schema 收口 |
| zustand 重构引入 bug | 中 | M0 完成时保证测试通过 |
| migration 错杀生产数据 | 高 | 全量备份；staging dry-run；多人数据归档不直接删 |
| 内容包产能跟不上 | 中 | M4 上线前先攒 3 个内容包做"前期库存" |

---

## 7. 关键决策（请主理人拍板）

下列决策一旦定下，整个方案不再回头改：

1. **多人功能下线方式**：M0 直接删 vs. 留代码但隐藏入口？
   - 建议：**直接删**（代码体量减少 ≥ 20%，bundle 显著瘦身，是单机版的核心收益之一）。
2. **token 模型是否保留**：M4 是否保留 token 作为程序生成内容的计费方式？
   - 建议：保留双轨。手写内容包 = 买断；程序生成 = token / 订阅档包含每日额度。
3. **多语言策略**：i18n 拆包后是否所有新 feature 立即支持 11 种语言？
   - 建议：M1–M3 仅做 zh + en；M4 之后再补语言。
4. **Scene Adventure（已有的 4 个短篇）去留**：与角色养成模型契合度低。
   - 建议：保留作"短篇剧情模式"，独立入口、不进入角色履历，不强制带入持久角色。
5. **死亡机制是否默认开启**：永久死亡是 Wildermyth 式叙事的核心，但劝退新手。
   - 建议：默认关，但开局选择难度时给出"硬核 / 故事"两档；硬核档默认开死亡。
6. **是否引入 Steam / itch.io 发行**：单机定位 + 买断制 → 天然适合 Steam。
   - 建议：M4 上线后立即评估打包成 Electron / Tauri 发 Steam 的工作量。这是单机定位下的**最大新增机会**。

---

## 8. 第一步建议

**从 M0 起。** 理由：

- M0 是纯技术债 + 删多人代码。这两件事不依赖任何玩法决策，可以立刻开干。
- 删多人代码 = 减法 = 风险最低、收益立竿见影（bundle、复杂度、测试维护成本同步下降）。
- M0 完成后，每个后续里程碑的开发速度会快 2–3 倍。

**M0 推荐起手式（第一周）**：

1. 多人功能用户公告 / Stripe token 补偿方案（你拍板后我起草）
2. 在 `engine/` 目录起一个空的 package boundary（建目录、配 tsconfig path、加 vitest）
3. **拆 `GameRoomContext` 为 zustand slice**（这是最大的杠杆点）

如果你认可这个方案，下一步告诉我：
- "开始 M0" → 我列出 M0 的全部 PR 切片清单（每 PR ≤ 500 行 diff），然后动第一刀。
- 或：先告诉我 §7 的 6 个决策结果，我再开工，避免做完返工。
