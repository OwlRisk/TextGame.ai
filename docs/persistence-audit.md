# 持久化检查：哪些该存库、哪些还没存

## 已正确保存到数据库（登录用户）

| 数据 | 表/存储 | 说明 |
|------|---------|------|
| **游戏列表** | `games` | GameContext：登录时从 DB 拉取，新建/更新/删除都写 DB；未登录用 localStorage |
| **GM 聊天会话** | `game_sessions` | game-master-chat：登录时从 DB 拉取，创建/更新/删除会话都写 DB；未登录用 localStorage |
| **游戏房间状态** | `game_room_state` | GameRoomContext：登录时从 DB 拉取与保存（messages、players、phase、humanGameIdentity 等）；未登录用 localStorage |
| **AI 头像** | Supabase Storage `avatars` | 生成后上传到 Storage，同身份同路径，不会重复生成 |

---

## 仅在前端（localStorage），建议或可考虑存库的

### 1. 游戏草稿 `gameDrafts`（建议存库）

- **位置**：`src/app/components/drafts-page.tsx`，key: `"gameDrafts"`
- **内容**：未完成的游戏配置草稿列表（id, config, createdAt, updatedAt）
- **现状**：仅 localStorage，换设备/清缓存即丢失
- **建议**：若希望跨设备、长期保留草稿，可新增表 `game_drafts (user_id, config JSONB, created_at, updated_at)`，登录时读写 DB，未登录仍用 localStorage

### 2. 当前选中的游戏 ID `selectedGameId`（可选存库）

- **位置**：`src/app/contexts/GameContext.tsx`，key: `"selectedGameId"`
- **内容**：上次选中的游戏 ID（侧栏高亮）
- **现状**：仅 localStorage
- **建议**：属 UI 状态，一般保留 localStorage 即可；若要做「上次玩到哪」的跨设备同步，可存 user 偏好（例如单独 user_preferences 表或 last_selected_game_id）

### 3. 上次选择的 Host `lastSelectedHostId`（可选存库）

- **位置**：`src/app/config/host-config.ts`，key: `"lastSelectedHostId"`
- **内容**：创建游戏时上次选的主持人 ID
- **现状**：仅 localStorage
- **建议**：可视为用户偏好，保持 localStorage 或并入 user_preferences 表

### 4. 已生成的主持人列表 `GENERATED_HOSTS_KEY`（可选存库）

- **位置**：`src/app/components/host-selector.tsx`
- **内容**：生成过的主持人列表缓存（避免重复生成）
- **现状**：仅 localStorage
- **建议**：若希望多设备共享「我生成过的主持人」列表可存 DB；否则保持本地缓存即可

---

## 仅前端即可、无需存库的

| 数据 | 位置 | 说明 |
|------|------|------|
| **登录会话开始时间** | AuthContext，`gm_session_started_at` | 用于 30 天登出逻辑，纯前端会话状态 |
| **头像缓存** | `src/lib/avatar.ts`，`gm_avatar_*` | 头像已在 Storage，这里只是前端去重/加速，不必再入 DB |
| **导航图标缓存** | `src/lib/use-nav-icon.ts` | 前端资源缓存 |
| **未登录时的 games/sessions/room** | 各处 localStorage 回退 | 未登录时无 user_id，用 localStorage 是合理设计 |

---

## 小结与建议

- **已存库且逻辑正确**：games、game_sessions、game_room_state、头像 Storage。
- **最值得加存库的**：**游戏草稿** `gameDrafts`，若产品上希望草稿跨设备、长期保留。
- **可选**：selectedGameId、lastSelectedHostId、GENERATED_HOSTS 若要做「跨设备偏好/历史」再考虑 user_preferences 或小表；否则保持 localStorage 即可。
