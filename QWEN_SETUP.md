# 通义千问配置说明

## 解决 401 API Key 错误

如果遇到 "401 Incorrect API key provided" 错误，请按以下步骤检查：

### 1. 检查 API Key 是否正确设置

在 `.env.local` 文件中，确保 `OPENAI_API_KEY` 已设置为你的真实阿里云 API Key：

```bash
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"  # 替换为你的真实 API Key
```

**重要**：不要使用 `"YOUR_API_KEY"` 占位符，必须使用真实的 API Key。

### 2. 检查 API Key 和 Base URL 的地域匹配

确保你的 API Key 和 Base URL 属于同一地域：

#### 中国大陆（北京）地域：
```bash
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
```

#### 国际（新加坡）地域：
```bash
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"
OPENAI_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
```

### 3. 获取阿里云 API Key

1. 登录 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
2. 进入 **API-KEY 管理** 页面
3. 创建新的 API Key 或使用现有的
4. 复制 API Key 到 `.env.local` 文件

### 4. 验证配置

重启开发服务器后，如果仍然出现 401 错误，请检查：

- API Key 是否有效（未被删除或禁用）
- API Key 是否有访问通义千问模型的权限
- 网络连接是否正常
- Base URL 是否正确

### 5. 环境变量示例

完整的 `.env.local` 文件示例：

```bash
# 阿里云通义千问配置
OPENAI_API_KEY="sk-你的真实API_KEY"
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_MODEL="qwen-turbo"

LANGCHAIN_CALLBACKS_BACKGROUND=false
```

### 支持的模型

- `qwen-turbo` - 快速响应
- `qwen-plus` - 平衡性能
- `qwen-max` - 最强性能
- `qwen-max-longcontext` - 长上下文版本

### 故障排除

如果问题仍然存在：

1. 检查控制台日志中的详细错误信息
2. 确认 API Key 的格式正确（通常以 `sk-` 开头）
3. 尝试使用不同的模型（如 `qwen-plus`）
4. 检查阿里云账户余额和配额

## 通义千问特殊要求

### JSON 格式输出要求

当使用 `withStructuredOutput` 或 `response_format: json_object` 时，**提示词中必须包含 "json" 这个词**。

这是通义千问模型的特殊要求。如果提示词中没有包含 "json"，会出现以下错误：

```
400 InternalError.Algo.InvalidParameter: 'messages' must contain the word 'json' in some form, to use 'response_format' of type 'json_object'.
```

**解决方案**：在提示词中添加 "json" 相关词汇，例如：
- "return them as a JSON object"
- "respond in JSON format"
- "output as JSON"

### 已修复的文件

以下文件已更新，确保提示词包含 "json"：
- `app/api/chat/structured_output/route.ts`
- `app/ai_sdk/tools/action.ts`

如果你在其他地方使用结构化输出，请确保提示词中包含 "json" 相关词汇。
