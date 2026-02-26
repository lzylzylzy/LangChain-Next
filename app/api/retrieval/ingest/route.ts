/**
 * 文档入库 API（Ingest）
 * 接收文本，按 Markdown 递归分块后写入 Supabase 向量库，供后续 RAG/检索 Agent 使用。
 * 使用前需配置 Supabase：https://js.langchain.com/v0.2/docs/integrations/vectorstores/supabase
 */
import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createEmbeddings } from "@/utils/embeddingConfig";

export const runtime = "edge";

/** POST：body.text 分块并嵌入后写入 Supabase 表 documents，demo 模式下禁用 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = body.text;

  if (process.env.NEXT_PUBLIC_DEMO === "true") {
    return NextResponse.json(
      {
        error: [
          "Ingest is not supported in demo mode.",
          "Please set up your own version of the repo here: https://github.com/lzylzylzy/LangChain-Next",
        ].join("\n"),
      },
      { status: 403 },
    );
  }

  try {
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );

    // 按 Markdown 语义递归分块，块大小 256，重叠 20
    const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
      chunkSize: 256,
      chunkOverlap: 20,
    });

    const splitDocuments = await splitter.createDocuments([text]);

    // 用配置的 Embedding 模型向量化并写入 Supabase（表 documents，查询 match_documents）
    const vectorstore = await SupabaseVectorStore.fromDocuments(
      splitDocuments,
      createEmbeddings(),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
