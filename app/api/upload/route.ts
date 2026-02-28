/**
 * 文件上传 API
 * POST multipart/form-data，字段名：file
 * 表格文件（CSV/xlsx）会解析为 JSON 并打印到控制台，同时随响应返回
 */
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
];

/** 解析单行 CSV（支持双引号包裹的逗号） */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
  return result;
}

/** CSV 文本转 JSON（首行为表头） */
function csvToJSON(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return Object.fromEntries(
      headers.map((h, i) => [h, values[i] ?? ""]),
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "请选择要上传的文件，且表单字段名为 file" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    const isAllowed =
      ALLOWED_TYPES.includes(file.type) ||
      file.name.match(/\.(txt|md|csv|json|xlsx)$/i);
    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "仅支持：.txt, .md, .csv, .json, .xlsx 或对应 MIME 类型",
        },
        { status: 400 },
      );
    }

    const isCSV = /\.csv$/i.test(file.name) || file.type === "text/csv";
    const isXLSX = /\.xlsx$/i.test(file.name) ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const isTextType = /\.(txt|md|csv|json)$/i.test(file.name) ||
      ["text/plain", "text/markdown", "text/csv", "application/json"].includes(file.type);
    let text: string | null = null;
    if (isTextType) {
      try {
        text = await file.text();
      } catch {
        // 读取失败时忽略
      }
    }

    let tableJSON: Record<string, string>[] | null = null;

    if (isCSV && text) {
      tableJSON = csvToJSON(text);
      console.log(`[upload] 表格文件 ${file.name} 解析为 JSON:\n${JSON.stringify(tableJSON, null, 2)}`);
    } else if (isXLSX) {
      try {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        if (firstSheet) {
          const sheet = wb.Sheets[firstSheet];
          tableJSON = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
          console.log(`[upload] 表格文件 ${file.name} 解析为 JSON:\n${JSON.stringify(tableJSON, null, 2)}`);
        }
      } catch (e) {
        console.warn("[upload] xlsx 解析失败（需安装 xlsx 依赖）:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
      ...(text !== null && { content: text }),
      ...(tableJSON !== null && { table: tableJSON }),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "上传处理失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
