-- LangChain Supabase 向量库：表 documents + 函数 match_documents
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本，或使用 supabase db push
--
-- 向量维度说明：
-- - 通义 text-embedding-v3 默认 1024 维，下面已用 1024
-- - OpenAI text-embedding-ada-002 为 1536 维，若只用 OpenAI 请把 1024 改为 1536

-- 启用 pgvector 扩展
create extension if not exists vector;

-- 文档表：id, content, metadata, embedding（1024 维适配通义 v3）
create table if not exists public.documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1024) not null
);

-- 相似度搜索函数（参数名须为 filter, match_count, query_embedding，与 LangChain 一致）
create or replace function public.match_documents(
  filter jsonb default '{}',
  match_count int default 5,
  query_embedding vector(1024) default null
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  embedding vector(1024),
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    d.embedding,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 便于按相似度查询的索引（可选，提升检索速度）
create index if not exists documents_embedding_idx on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
