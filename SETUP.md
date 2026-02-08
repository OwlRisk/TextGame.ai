# 集成设置指南

## 环境变量配置

### 1. OpenAI API 配置

已配置 `OPENAI_API_KEY`，可以直接使用。

### 2. Supabase 配置

要使用 Supabase 数据库功能，需要添加以下环境变量到 `.env` 文件：

```env
# 从 Supabase 项目设置中获取: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**如何获取这些值：**

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (用于服务器端操作)

### 2.1 Google 登录与 Redirect URL（必做才能用「用 Google 登录」）

1. Supabase Dashboard → **Authentication** → **Providers** → **Google**：填好 Client ID、Client Secret，并确保 **Callback URL** 为 Supabase 提供的 `https://<项目ref>.supabase.co/auth/v1/callback`（与上图一致即可）。
2. **Authentication** → **URL Configuration**：
   - **Site URL**：本地开发可填 `http://localhost:3000`，上线后改为你的生产域名（如 `https://yourdomain.com`）。
   - **Redirect URLs**：必须把应用的回调地址加入白名单，否则登录后会报错。请至少添加：
     - 本地：`http://localhost:3000/auth/callback`
     - 生产：`https://你的域名/auth/callback`
   - 若用 Vercel 等预览环境，可再加一条如 `https://*.vercel.app/auth/callback`（按 Supabase 支持的通配符规则）。
3. Google Cloud Console 里 OAuth 客户端的 **已授权的重定向 URI** 中，要有上面 Supabase 的 Callback URL（即 `https://<项目ref>.supabase.co/auth/v1/callback`），不要直接写 `http://localhost:3000/auth/callback`。

做完以上后，再在应用里点「Continue with Google」重试登录。

### 3. 数据库 Schema 设置

如果控制台出现 **"Could not find the table 'public.games' in the schema cache"**，按下面做（注意：**必须用和 `.env` 里 `NEXT_PUBLIC_SUPABASE_URL` 对应的同一个项目**）：

**方式 A：Supabase SQL Editor（最稳妥，推荐）**

1. 打开 [Supabase Dashboard](https://app.supabase.com)，选中 **与 `NEXT_PUBLIC_SUPABASE_URL` 一致** 的项目（例如 `https://xxxx.supabase.co` 里的 `xxxx` 就是项目 ref）。
2. 左侧进入 **SQL Editor** → New query。
3. 复制并粘贴 **`database/schema.sql`** 的**完整**内容，点击 **Run**。
4. 再新建一个 query，执行下面一句并 Run，刷新 API 的 schema 缓存：
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
5. 刷新你的应用页面。

**方式 B：本地脚本**

确保 `.env` 里的 **`DATABASE_URL`（或 `DIRECT_URL`）和 `NEXT_PUBLIC_SUPABASE_URL` 是同一个 Supabase 项目**（Dashboard → Settings → Database → Connection string → URI）：

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@...pooler.supabase.com:6543/postgres
```

然后执行：

```bash
npm run db:setup
```

脚本会在执行完 schema 后自动发送 `NOTIFY pgrst, 'reload schema'`。若仍报错，请用方式 A 在同一项目的 SQL Editor 里执行 `database/schema.sql` 并执行一次 `NOTIFY pgrst, 'reload schema';`。

## 功能说明

### OpenAI API 集成

- **API 路由**: `/api/chat` - 非流式响应
- **流式 API 路由**: `/api/chat/stream` - 流式响应
- **客户端库**: `src/lib/openai.ts` - 封装了 API 调用

### Supabase 数据库集成

- **客户端配置**: `src/lib/supabase.ts`
- **数据库操作**: `src/lib/db.ts`
- **表结构**:
  - `game_sessions` - 游戏会话数据
  - `games` - 游戏配置数据

## 使用示例

### 使用 OpenAI API

```typescript
import { getAIChatResponse } from '@/lib/openai';

const response = await getAIChatResponse({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  hostId: 'host-1',
  gameContext: {
    template: 'werewolf',
    playerCount: 6
  }
});
```

### 使用 Supabase 数据库

```typescript
import { getGames, createGame } from '@/lib/db';

// 获取用户的所有游戏
const { data: games, error } = await getGames('user-id');

// 创建新游戏
const { data: game, error } = await createGame({
  user_id: 'user-id',
  name: 'My Game',
  icon: '🎮',
  color: '#6366f1',
  config: { /* game config */ }
});
```

## 下一步

1. 添加 Supabase 环境变量到 `.env` 文件
2. 在 Supabase 中运行数据库 schema
3. 更新组件以使用新的 API 和数据库函数
4. 测试 OpenAI API 调用
5. 测试数据库操作
