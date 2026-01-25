# 🎮 游戏创建事件流程

## 触发创建游戏的方式

### 方式一：通过对话流程（推荐）

这是标准的游戏创建流程，通过 AI 对话完成配置：

#### 步骤 1: 开始对话
用户与 AI 游戏主持人对话，例如：
```
用户: "我想玩狼人杀"
AI: "太好了！你需要多少玩家？"
```

#### 步骤 2: 完成配置
按照 AI 引导完成：
- 选择游戏类型（Werewolf/Undercover/Custom）
- 设置玩家数量
- 配置游戏规则
- 选择 AI 主持人

#### 步骤 3: 触发创建
当 `conversationState === "confirmation"` 且用户选择了主持人后，会显示 **"Create Game"** 按钮。

**代码位置**: `src/app/components/game-master-chat.tsx:830-857`

```typescript
// 当用户点击 "Create Game" 按钮时
onClick={() => {
  setConversationState("completed");
  const host = HOST_PERSONALITIES.find(h => h.id === selectedHostId);
  addGMMessage(
    `🎉 Fantastic! ${host?.name} will be your guide.\n\n` +
    `Your game is being created now. See you in the game room!`
  );
  
  setTimeout(() => {
    onCreateGame({
      name: gameName || selectedTemplate!.name,
      template: selectedTemplate!.id,
      playerCount: playerCount,
      rules: customRules || selectedTemplate!.defaultRules,
      customRoles: selectedTemplate!.roles,
      hostId: selectedHostId
    });
    
    setTimeout(() => {
      onBack();
    }, 1500);
  }, 1000);
}}
```

### 方式二：直接调用 onCreateGame

如果你想在代码中直接触发创建游戏，可以调用 `onCreateGame` 回调：

```typescript
// 在 game-master-chat.tsx 组件中
onCreateGame({
  name: "My Game",
  template: "werewolf", // 或 "undercover" 或 "custom"
  playerCount: 6,
  rules: "游戏规则...",
  customRoles: ["Villager", "Werewolf", "Seer"],
  hostId: "host-1" // 主持人 ID
});
```

## 游戏创建事件流程

### 1. 状态管理

游戏创建流程使用以下状态：

```typescript
type ConversationState = 
  | "greeting"           // 初始问候
  | "game-type"          // 选择游戏类型
  | "player-count"       // 设置玩家数量
  | "rules-discussion"   // 讨论规则
  | "confirmation"       // 确认配置
  | "completed";         // 已完成
```

### 2. 状态转换

```
greeting 
  → (选择游戏类型)
game-type / player-count
  → (设置玩家数量)
rules-discussion
  → (确认规则)
confirmation
  → (选择主持人)
showHostSelector = true
  → (点击 Create Game)
completed
  → onCreateGame() 被调用
```

### 3. 创建游戏的数据结构

```typescript
interface GameConfig {
  name: string;              // 游戏名称
  template: string;           // 游戏模板 ID ("werewolf" | "undercover" | "custom")
  playerCount: number;        // AI 玩家数量
  rules: string;             // 游戏规则
  customRoles?: string[];     // 自定义角色（可选）
  hostId: string;            // 主持人 ID
}
```

## 在代码中如何触发

### 方法 1: 通过按钮点击

在 `game-master-chat.tsx` 中，当满足条件时显示按钮：

```typescript
{conversationState === "confirmation" && showHostSelector && (
  <Button onClick={handleCreateGame}>
    Create Game
  </Button>
)}
```

### 方法 2: 通过对话状态

AI 可以引导用户到确认状态，然后用户说 "create" 或 "start"：

```typescript
// 在 getGMResponse 函数中
if (conversationState === "confirmation") {
  if (lowerInput.includes("create") || lowerInput.includes("start")) {
    setShowHostSelector(true);
  }
}
```

### 方法 3: 直接调用（编程方式）

如果你想在代码中直接创建游戏：

```typescript
// 在父组件中（page.tsx）
const handleCreateGame = (config: GameConfig) => {
  const newGame: Game = {
    id: `game-${Date.now()}`,
    name: config.name,
    icon: config.template === "werewolf" ? "🐺" : "🕵️",
    color: "#7c3aed",
    config,
    isActive: false
  };

  setGames(prev => [...prev, newGame]);
  setSelectedGameId(newGame.id);
  initializeGame(config);
  toast.success(`Game "${config.name}" created!`);
};
```

## 关键代码位置

### 1. 创建游戏按钮
**文件**: `src/app/components/game-master-chat.tsx`
**行数**: 830-857

### 2. 游戏创建处理
**文件**: `src/app/page.tsx`
**行数**: 206-221

### 3. 状态检测逻辑
**文件**: `src/app/components/game-master-chat.tsx`
**行数**: 497-503 (confirmation 状态检测)

## 示例：完整创建流程

```typescript
// 1. 用户开始对话
用户: "我想玩狼人杀"
→ conversationState: "greeting"
→ selectedTemplate: GAME_TEMPLATES[0] (Werewolf)
→ conversationState: "player-count"

// 2. 设置玩家数量
用户: "6个"
→ playerCount: 6
→ conversationState: "rules-discussion"

// 3. 确认规则
用户: "保持默认规则"
→ customRules: selectedTemplate.defaultRules
→ conversationState: "confirmation"

// 4. 选择主持人
用户: "选择 Luna"
→ selectedHostId: "host-1"
→ showHostSelector: true

// 5. 点击创建按钮
点击 "Create Game"
→ conversationState: "completed"
→ onCreateGame({
     name: "Werewolf",
     template: "werewolf",
     playerCount: 6,
     rules: "...",
     hostId: "host-1"
   })
```

## 调试技巧

### 检查当前状态

在浏览器控制台中：

```javascript
// 查看当前对话状态
console.log(conversationState);

// 查看选中的模板
console.log(selectedTemplate);

// 查看玩家数量
console.log(playerCount);

// 查看是否显示创建按钮
console.log(conversationState === "confirmation" && showHostSelector);
```

### 手动触发创建（开发测试）

在 `game-master-chat.tsx` 中添加测试按钮：

```typescript
<Button onClick={() => {
  onCreateGame({
    name: "Test Game",
    template: "werewolf",
    playerCount: 6,
    rules: "Test rules",
    hostId: "host-1"
  });
}}>
  Test Create Game
</Button>
```

## 常见问题

### Q: 为什么 "Create Game" 按钮不显示？

A: 检查以下条件：
1. `conversationState` 必须是 `"confirmation"`
2. `showHostSelector` 必须是 `true`
3. `selectedTemplate` 不能为 `null`
4. `selectedHostId` 必须有值

### Q: 如何跳过对话直接创建游戏？

A: 可以直接调用 `onCreateGame` 回调，传入完整的 `GameConfig` 对象。

### Q: 创建游戏后会发生什么？

A: 
1. `onCreateGame` 被调用
2. 父组件 (`page.tsx`) 的 `handleCreateGame` 执行
3. 创建新的 Game 对象
4. 初始化游戏（创建玩家、消息等）
5. 切换到游戏房间视图
6. 显示成功提示

---

**总结**: 游戏创建主要通过对话流程触发，最终通过点击 "Create Game" 按钮调用 `onCreateGame` 回调完成。
