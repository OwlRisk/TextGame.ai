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

### 3. 数据库 Schema 设置

运行以下 SQL 在 Supabase 数据库中创建表结构：

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 `database/schema.sql` 文件的内容
4. 在 SQL Editor 中执行

或者使用 Supabase CLI：

```bash
supabase db push
```

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
