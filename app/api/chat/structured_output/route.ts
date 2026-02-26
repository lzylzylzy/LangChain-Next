/**
 * 结构化输出 API
 * 使用 Zod 定义输出 schema，通过 withStructuredOutput 让模型返回固定结构的 JSON（语气、实体、字数、回复等）
 */
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { PromptTemplate } from "@langchain/core/prompts";
import { createQwenModel } from "@/utils/qwenConfig";

export const runtime = "edge";

/** 提示：从输入中抽取指定字段并以 JSON 返回 */
const TEMPLATE = `Extract the requested fields from the input and return them as a JSON object.

The field "entity" refers to the first mentioned entity in the input.

You must respond with valid JSON format only.

Input:

{input}`;

/**
 * This handler initializes and calls an OpenAI Functions powered
 * structured output chain. See the docs for more information:
 *
 * https://js.langchain.com/v0.2/docs/how_to/structured_output
 */
/** POST：取最后一条用户消息，返回符合 Zod schema 的 JSON 对象 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const currentMessageContent = messages[messages.length - 1].content;

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const model = createQwenModel({
      temperature: 0.8,
    });

    // 使用 Zod 定义输出结构（也可传 JSON Schema）
    const schema = z
      .object({
        tone: z
          .enum(["positive", "negative", "neutral"])
          .describe("The overall tone of the input"),
        entity: z.string().describe("The entity mentioned in the input"),
        word_count: z.number().describe("The number of words in the input"),
        chat_response: z.string().describe("A response to the human's input"),
        final_punctuation: z
          .optional(z.string())
          .describe("The final punctuation mark in the input, if any."),
      })
      .describe("Should always be used to properly format output");

    // 将 schema 绑定到模型，后续调用会按该结构返回（内部走 tool calling）
    const functionCallingModel = model.withStructuredOutput(schema, {
      name: "output_formatter",
    });

    const chain = prompt.pipe(functionCallingModel);

    const result = await chain.invoke({
      input: currentMessageContent,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
