/**
 * 基础对话 API
 * 使用 LangChain 的 PromptTemplate + 聊天模型 + 输出解析器 组成简单链，流式返回回复
 */
// Next 服务端请求/响应类型
import { NextRequest, NextResponse } from "next/server";
// Vercel AI SDK：消息类型、流式文本响应
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
// LangChain 提示模板
import { PromptTemplate } from "@langchain/core/prompts";
// 将模型输出转为 HTTP 流式字节
import { HttpResponseOutputParser } from "langchain/output_parsers";
// 项目内通义千问模型创建函数
import { createQwenModel } from "@/utils/qwenConfig";

// 使用 Edge Runtime，支持流式响应
export const runtime = "edge";

// 将单条 Vercel 消息格式化为 "role: content" 字符串，用于拼成对话历史
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

// 系统提示词模板：{chat_history} 为历史对话，{input} 为当前用户输入
const TEMPLATE = `你是我的智能助手，我需要你回答我的问题。

Current conversation:
{chat_history}

User: {input}
AI:`;

// POST 处理器：接收消息列表，流式返回模型回复
export async function POST(req: NextRequest) {
  try {
    // 解析请求体 JSON
    const body = await req.json();
    // 取消息列表，缺省为空数组
    const messages = body.messages ?? [];
    // 除最后一条外全部格式化为对话历史字符串数组
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    // 当前用户输入：取最后一条消息的 content
    const currentMessageContent = messages[messages.length - 1].content;
    // 用模板创建 LangChain 提示
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    // 调试日志：可删除
    console.log("+++++++");
    console.log(prompt);
    console.log("-----");
    console.log(formattedPreviousMessages);
    console.log("-----");
    console.log(currentMessageContent);
    console.log("-----");

    // 创建通义千问聊天模型，temperature 控制随机性
    const model = createQwenModel({
      temperature: 0.8,
    });

    // 输出解析器：把模型流式消息块序列化为 HTTP 可用的字节流
    const outputParser = new HttpResponseOutputParser();

    // 组装链：提示 -> 模型 -> 解析器（也可用 RunnableSequence.from([...])）
    const chain = prompt.pipe(model).pipe(outputParser);

    // 传入对话历史和当前输入，得到流式输出
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });
    // 调试日志：可删除
    console.log("+++++++");
    console.log(stream);

    // 以流式文本响应返回给前端
    return new StreamingTextResponse(stream);
  } catch (e: any) {
    // 出错时返回 JSON 错误信息，状态码优先用 e.status，否则 500
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
