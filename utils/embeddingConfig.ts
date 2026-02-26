/**
 * Embedding 配置：与 qwenConfig 共用 OPENAI_BASE_URL / OPENAI_API_KEY，
 * 使用 OPENAI_EMBEDDING_MODEL（通义/DashScope 用 text-embedding-v3，OpenAI 用 text-embedding-ada-002）
 */
import { OpenAIEmbeddings } from "@langchain/openai";

export function createEmbeddings(model?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const defaultModel =
    process.env.OPENAI_EMBEDDING_MODEL ||
    (baseURL?.includes("dashscope") ? "text-embedding-v3" : "text-embedding-ada-002");

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    throw new Error(
      "请设置 OPENAI_API_KEY 环境变量。请在 .env.local 中设置（与对话模型共用）。"
    );
  }

  return new OpenAIEmbeddings({
    model: model ?? defaultModel,
    openAIApiKey: apiKey,
    ...(baseURL && {
      configuration: { baseURL },
    }),
  });
}
