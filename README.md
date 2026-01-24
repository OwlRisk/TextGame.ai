# 游戏平台设计

This is a code bundle for 游戏平台设计. The original project is available at https://www.figma.com/design/MpzvYw3r2IcvwjJUNloup6/%E6%B8%B8%E6%88%8F%E5%B9%B3%E5%8F%B0%E8%AE%BE%E8%AE%A1.

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI + shadcn/ui
- **状态管理**: React Hooks

## 运行项目

### 安装依赖

```bash
npm install
# 或
pnpm install
# 或
yarn install
```

### 环境变量

创建 `.env` 文件并添加必要的环境变量：

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### 开发模式

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx             # 主页面
│   ├── components/          # 组件目录
│   │   ├── game-master-chat.tsx
│   │   ├── game-creator-form.tsx
│   │   ├── chat-area.tsx
│   │   └── ui/              # UI 组件库
│   └── config/              # 配置文件
└── styles/                  # 样式文件
```

## 功能特性

- 🎮 AI 游戏主持人系统
- 💬 实时聊天功能
- 🎯 多种游戏模板（狼人杀、卧底等）
- 🎨 现代化 UI 设计
- 🔊 语音输入支持
- 📱 响应式设计
