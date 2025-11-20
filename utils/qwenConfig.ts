/**
 * 通义千问模型配置辅助函数
 * 统一管理 ChatOpenAI 的配置，确保正确连接到阿里云通义千问
 */
import { ChatOpenAI } from "@langchain/openai";

export function createQwenModel(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = config?.model || process.env.QWEN_MODEL || "qwen-turbo";

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error(
      "请设置 OPENAI_API_KEY 环境变量。请在 .env.local 文件中设置你的阿里云 API Key。"
    );
  }

  return new ChatOpenAI({
    model,
    temperature: config?.temperature ?? 0.8,
    maxTokens: config?.maxTokens,
    openAIApiKey: apiKey,
    configuration: {
      baseURL,
    },
  });
}

