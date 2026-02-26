# Supabase 向量库（LangChain 检索）

本目录包含 LangChain 使用 Supabase 做 RAG 检索所需的数据库结构。

## 一键执行

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 选择你的项目  
2. 左侧 **SQL Editor** → **New query**  
3. 复制并执行 `migrations/20250101000000_langchain_documents.sql` 中的全部 SQL  
4. 执行成功后即可使用「检索」「检索 Agent」页面的上传与对话

## 说明

- **表** `public.documents`：存 `content`、`metadata`、`embedding`（向量）
- **函数** `public.match_documents(filter, match_count, query_embedding)`：按向量相似度搜索，供 LangChain 调用
- 当前迁移按 **通义 text-embedding-v3** 的 **1024 维** 编写；若你只用 OpenAI `text-embedding-ada-002`（1536 维），需把 SQL 里所有 `1024` 改成 `1536` 再执行

若之前已经建过表但结构不对，可先执行：

```sql
drop function if exists public.match_documents(jsonb, int, vector);
drop table if exists public.documents;
```

再重新执行迁移 SQL。
