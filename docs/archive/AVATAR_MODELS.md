# 头像生成模型配置指南

本项目支持多个 AI 图片生成模型，你可以根据需求选择最适合的模型。

## 支持的模型

### 1. **DALL-E 3** (默认)
- **提供商**: OpenAI
- **优点**: 
  - 质量稳定，理解 prompt 能力强
  - 支持中文 prompt
  - 响应速度快
- **缺点**: 
  - 头像风格可能偏统一
  - 写实度相对较低
- **配置**: 只需 `OPENAI_API_KEY`

### 2. **FLUX** (推荐用于写实头像)
- **提供商**: Replicate (Black Forest Labs)
- **优点**: 
  - **写实度最高** (9.5/10)
  - 文本渲染准确 (95%)
  - 头像看起来更像真实人类
- **缺点**: 
  - 需要 Replicate API token
  - 生成时间稍长
- **配置**: 
  - `REPLICATE_API_TOKEN` (从 https://replicate.com/account/api-tokens 获取)
  - `AVATAR_GENERATION_MODEL=flux`

### 3. **Stable Diffusion XL**
- **提供商**: Replicate (Stability AI)
- **优点**: 
  - 开源生态，可定制
  - 质量不错，成本较低
- **缺点**: 
  - 需要 Replicate API token
  - 写实度略低于 FLUX
- **配置**: 
  - `REPLICATE_API_TOKEN`
  - `AVATAR_GENERATION_MODEL=stable-diffusion`

## 配置方法

### 1. 使用 DALL-E 3 (默认)
```env
OPENAI_API_KEY=your_openai_api_key_here
# 不需要设置 AVATAR_GENERATION_MODEL，默认使用 DALL-E 3
```

### 2. 使用 FLUX (推荐)
```env
OPENAI_API_KEY=your_openai_api_key_here  # 作为 fallback
REPLICATE_API_TOKEN=your_replicate_api_token_here
AVATAR_GENERATION_MODEL=flux
```

### 3. 使用 Stable Diffusion XL
```env
OPENAI_API_KEY=your_openai_api_key_here  # 作为 fallback
REPLICATE_API_TOKEN=your_replicate_api_token_here
AVATAR_GENERATION_MODEL=stable-diffusion
```

## 获取 API Token

### Replicate API Token
1. 访问 https://replicate.com
2. 注册/登录账号
3. 前往 https://replicate.com/account/api-tokens
4. 创建新的 API token
5. 复制到 `.env` 文件

### 定价参考
- **FLUX**: ~$0.003-0.01 per image
- **Stable Diffusion XL**: ~$0.002-0.005 per image
- **DALL-E 3**: ~$0.04 per image (1024x1024)

## 自动 Fallback

如果配置的模型失败（如 Replicate 服务不可用），系统会自动回退到 DALL-E 3，确保头像生成不会中断。

## 推荐配置

**追求写实人类头像**: 使用 `FLUX`
```env
AVATAR_GENERATION_MODEL=flux
REPLICATE_API_TOKEN=your_token
```

**平衡质量和成本**: 使用 `stable-diffusion`
```env
AVATAR_GENERATION_MODEL=stable-diffusion
REPLICATE_API_TOKEN=your_token
```

**稳定可靠**: 使用 `dalle-3` (默认)
```env
# 只需 OPENAI_API_KEY，无需额外配置
```
