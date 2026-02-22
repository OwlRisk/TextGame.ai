# GameMaster - AI Game Master Platform

An AI-powered intelligent game master platform that supports various social deduction games (such as Werewolf, Undercover, etc.), providing an immersive gaming experience with personalized AI host characters.

## ✨ Features

### Core Features
- 🤖 **AI Game Master System** - Intelligent AI hosts with multiple personalized characters
- 🎮 **Multiple Game Templates** - Built-in classic game templates including Werewolf, Undercover, and more
- 🎨 **Custom Game Creation** - Flexible game rule configuration and customization
- 💬 **Real-time Chat Interaction** - Smooth conversational gaming experience
- 🔊 **Voice Input Support** - Speech-to-text input capability
- 👥 **Multi-player Management** - Complete player panel and role assignment system
- 📊 **Game Session Management** - Support for saving, resuming, and managing multiple sessions
- 🎭 **Personalized Hosts** - Multiple AI host characters to choose from, each with unique styles

### UI Features
- 🎨 **Modern UI Design** - Beautiful interface based on shadcn/ui
- 📱 **Responsive Design** - Perfect adaptation to various device sizes
- 🌙 **Dark Theme** - Immersive dark theme design
- ✨ **Smooth Animations** - Rich interactive animation effects

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 16** - React framework using App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### UI Component Library
- **Radix UI** - Accessible component foundation
- **shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Other Dependencies
- **Sonner** - Toast notifications
- **React Hook Form** - Form management
- **Motion** - Animation library
- **Recharts** - Chart library

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm / pnpm / yarn
- OpenAI API Key (for AI features)
- PostgreSQL database (optional, for data persistence)

### Installation Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd GameMaster
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Configure environment variables**

Create a `.env` file and add the necessary environment variables:

```env
# OpenAI API configuration (required)
OPENAI_API_KEY=your_openai_api_key

# Database configuration (optional, for data persistence)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

4. **Start the development server**

```bash
npm run dev
```

5. **Access the application**

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

### Deployment (Production)

若部署后出现 `/api/user/balance`、`/api/stripe/subscription-details`、`/api/avatar`、`/api/chat/stream` 等返回 **503**，多为环境或数据库未配置：

1. **数据库**：在部署环境设置 `DATABASE_URL`（或 `DIRECT_URL`），并在该数据库上执行一次：
   ```bash
   npm run db:setup
   ```
2. **必选环境变量**：`OPENAI_API_KEY`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`；订阅/支付需 `STRIPE_SECRET_KEY` 等；头像生成需 `OPENAI_API_KEY` 或 `REPLICATE_API_TOKEN`；语音 TTS 需 `INWORLD_BASIC_BASE64`。
3. **503 响应体**会提示具体缺失项（如 "Database not configured"），便于排查。

### Code Linting

```bash
npm run lint
```

## 📁 Project Structure

```
GameMaster/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout component
│   │   ├── page.tsx                      # Main page
│   │   ├── components/                   # Components directory
│   │   │   ├── game-master-chat.tsx     # AI game master chat interface
│   │   │   ├── game-creator-form.tsx    # Game creation form
│   │   │   ├── game-setup-dialog.tsx    # Game setup dialog
│   │   │   ├── my-games-page.tsx        # My games page
│   │   │   ├── player-board.tsx         # Player panel
│   │   │   ├── chat-area.tsx            # Chat area
│   │   │   ├── welcome-page.tsx         # Welcome page
│   │   │   ├── discover-page.tsx        # Discover page
│   │   │   ├── host-selector.tsx        # Host selector
│   │   │   └── ui/                      # UI component library (shadcn/ui)
│   │   └── config/
│   │       └── host-config.ts           # Host configuration file
│   └── styles/                           # Style files
│       ├── index.css                     # Main style file
│       ├── tailwind.css                  # Tailwind styles
│       └── theme.css                    # Theme styles
├── public/                                # Static assets
├── .env                                  # Environment variables (create yourself)
├── package.json                          # Project configuration
├── tailwind.config.js                    # Tailwind configuration
├── tsconfig.json                         # TypeScript configuration
└── README.md                             # Project documentation
```

## 🎮 Usage Guide

### Creating a New Game

1. Click the "Create New Game" button
2. Select a game template (Werewolf, Undercover, or Custom)
3. Configure game parameters (player count, rules, etc.)
4. Choose an AI host character
5. Start the game

### Managing Games

- **My Games** - View all created games
- **Continue Game** - Resume unfinished game sessions
- **View History** - Browse completed game records
- **Delete Game** - Clean up unwanted games

### AI Host Features

- Intelligent conversational game guidance
- Automatic game flow and phase management
- Role assignment and rule explanation
- Real-time game state updates

## 🔧 Development Guide

### Adding a New Game Template

Add a new template to the `GAME_TEMPLATES` array in `src/app/components/game-master-chat.tsx`:

```typescript
{
  id: "new-game",
  name: "New Game",
  description: "Game description",
  minPlayers: 4,
  maxPlayers: 10,
  defaultRules: "Game rules...",
  roles: ["Role1", "Role2"]
}
```

### Adding a New Host Character

Add a new character to the `HOST_PERSONALITIES` array in `src/app/config/host-config.ts`.

### Style Customization

The project uses Tailwind CSS. You can customize themes and styles in `tailwind.config.js`.

## 📝 Design Reference

This project is developed based on a Figma design:
- [Game Platform Design](https://www.figma.com/design/MpzvYw3r2IcvwjJUNloup6/%E6%B8%B8%E6%88%8F%E5%B9%B3%E5%8F%B0%E8%AE%BE%E8%AE%A1)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.

## 📄 License

This project is private.

## 🔗 Related Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
