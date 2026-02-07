# 还缺什么 — 功能与体验缺口清单

基于当前代码与 TODO / UI 优化建议整理，按「可先做」和「后续做」分类。

---

## 一、建议优先补上的（小改动、收益高）

| 项目 | 说明 | 参考 |
|------|------|------|
| **1. 聊天区空状态** | 无消息时显示一句引导（如「发送第一条消息开始游戏」）+ 小图标，避免空白一片 | UI_OPTIMIZATION_IDEAS §16 |
| **2. 全局 Error Boundary** | 捕获 React 报错，显示友好错误页而不是白屏 | TODO §3，可加 `app/error.tsx` + `global-error.tsx` |
| **3. 主题 class 挂载** | `theme.css` 里 `.dark` 的变量目前未挂到 DOM，若要用 CSS 变量需在根节点加 `class="dark"` | layout.tsx 的 `<html>` |
| **4. 发送防连点** | 发送后短时禁用发送按钮或显示「发送中…」，避免重复提交 | UI_OPTIMIZATION_IDEAS §8 |
| **5. 关键路由 loading** | 首页或游戏切换时加 `loading.tsx` 或顶层进度条，减少空白闪烁 | UI_OPTIMIZATION_IDEAS §9 |
| **6. 键盘与焦点** | 聊天输入框、主要按钮有可见 focus 环；Enter 发送在 UI 上提示（若尚未写） | UI_OPTIMIZATION_IDEAS §11 |

---

## 二、已有基础、可逐步完善

| 项目 | 说明 | 备注 |
|------|------|------|
| **数据持久化** | 有 `database/schema.sql`、`lib/db.ts`、Supabase，游戏列表/会话是否已接 DB 需确认 | TODO §1 |
| **分享功能** | 分享弹窗存在，文案为「coming soon」— 后端/链接持久化未实现 | page.tsx Share Dialog |
| **用户与多端** | 无登录体系，当前多为单机/本地状态；要做「多设备、多会话」需认证 | TODO §2 |
| **API 与流式** | 已有 `/api/chat`、`/stream` 等，需确认错误处理、重试、用量/成本控制 | TODO §4 |

---

## 三、体验与可访问性

| 项目 | 说明 |
|------|------|
| **响应式 / 小屏** | 侧栏、玩家面板在窄屏下的折叠/抽屉；聊天区小屏全宽 | UI_OPTIMIZATION_IDEAS §10 |
| **深色/浅色切换** | 若有需求，可在设置或侧栏加开关，切换 `document.documentElement.classList.toggle('dark')` | theme 已支持 .dark |
| **无障碍** | ARIA、键盘导航、焦点顺序、对比度（当前文案已用 zinc/white，可再跑一遍 a11y 检查） | TODO §18 |

---

## 四、测试与质量

| 项目 | 说明 |
|------|------|
| **单元 / 集成测试** | 核心逻辑（如游戏阶段、投票、Host 决策）可先加测试 | TODO §13 |
| **E2E** | 关键路径：创建游戏 → 进入房间 → 发消息 → 结束一局 | TODO §13 |

---

## 五、建议的「下一步 3 件」

1. **聊天空状态** — 在 `ChatArea` 里当 `messages.length === 0` 时渲染一句引导 + 图标。  
2. **Error Boundary** — 新增 `src/app/error.tsx`（和可选 `global-error.tsx`），出错时显示友好页。  
3. **发送防连点** — 在 `handleSend` 里加短时 loading/disabled 或「发送中」状态。

做完这三项，再按 TODO 的「数据持久化 → 用户认证 → 错误处理」顺序推进会更稳。
