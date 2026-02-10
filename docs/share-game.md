# 分享游戏功能（Share Game）

## 已就绪的 schema

- **games.share_token**：可选，唯一。有值表示该游戏已生成分享链接。
- 迁移：`database/migrations/002_game_drafts_and_share.sql` 已添加 `ALTER TABLE games ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`。

## 推荐流程

### 1. 生成分享链接（你来实现或接 API）

- 用户在某局游戏中点击「分享」→ 调用 **生成 share_token**：
  - 若该游戏已有 `share_token`，直接用它拼链接。
  - 若没有，则生成一个唯一 token（如 `crypto.randomUUID().slice(0, 8)` 或 nanoid），调用 `updateGame(gameId, { share_token: token })`，再拼链接。
- 链接形如：`https://你的域名/play/TOKEN` 或 `/invite/TOKEN`。
- 生成后复制到剪贴板或弹出「链接已复制」。

### 2. 通过链接访问（公开页）

- 路由：`/play/[token]`（或 `/invite/[token]`）。
- 服务端用 **service role** 查游戏（避免 RLS 限制）：
  - `supabaseAdmin.from('games').select('*').eq('share_token', token).single()`。
- 拿到游戏后可：
  - **只读预览**：展示游戏名、规则摘要、人数等，按钮「加入游戏」或「在 GameMaster 中打开」。
  - **加入游戏**：若你的设计是「分享链接 = 邀请别人一起玩」，则跳转到 `/?game=TOKEN` 或 `/game/ID?invite=TOKEN`，未登录先登录再进房。

### 3. 撤销分享

- 清空 token：`updateGame(gameId, { share_token: null })`，旧链接即失效。

## 已提供的 API

- **POST /api/games/[gameId]/share**  
  - 需登录，且该游戏须属于当前用户。  
  - 若游戏已有 `share_token` 则直接返回；否则生成 12 位 token 并写入。  
  - 返回：`{ shareToken, shareUrl }`，其中 `shareUrl = NEXT_PUBLIC_APP_URL/play/{shareToken}`（未配置则用当前请求 origin）。  

- **GET /api/share/[token]**  
  - 公开接口，用 service role 按 `share_token` 查游戏。  
  - 返回：`{ id, name, icon, color, config }`，供 `/play/[token]` 使用。  

前端在游戏房间或侧栏加「分享」按钮时：请求 `POST /api/games/{gameId}/share`（带 Authorization），拿到 `shareUrl` 后复制到剪贴板或展示给用户。访问者打开 `/play/[token]` 时，页面可 fetch `GET /api/share/[token]` 展示游戏信息并引导「在 GameMaster 中打开」或「加入游戏」。
