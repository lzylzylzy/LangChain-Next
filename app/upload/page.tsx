"use client";

/**
 * 上传页：输入 + 上传文件，表格展示为柱状图，可导出为图片并下载
 */
import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/** 表格行转为柱状图数据：第一列类别，第一个数值列作为高度 */
function tableToChartData(
  table: Record<string, string>[],
): { name: string; value: number }[] {
  if (!table.length) return [];
  const keys = Object.keys(table[0]);
  const nameKey = keys[0];
  const valueKey =
    keys.find((k) => k !== nameKey && !Number.isNaN(Number(table[0][k]))) ??
    keys[1];
  if (!nameKey || !valueKey) return [];
  return table.map((row) => ({
    name: String(row[nameKey] ?? ""),
    value: Number(row[valueKey]) || 0,
  }));
}

export default function UploadPage() {
  const [inputValue, setInputValue] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tableData, setTableData] = useState<Record<string, string>[] | null>(
    null,
  );
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(
    () => (tableData ? tableToChartData(tableData) : []),
    [tableData],
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setFileName(file.name);
    setTableData(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "上传失败");
        setFileName(null);
        return;
      }

      if (data.content != null) {
        setInputValue((prev) =>
          prev ? `${prev}\n\n${data.content}` : data.content,
        );
      }
      if (Array.isArray(data.table) && data.table.length > 0) {
        setTableData(data.table);
      }
      toast.success(`已上传：${data.file?.name ?? file.name}`);
    } catch {
      toast.error("上传请求失败，请重试");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadChart = async () => {
    const el = chartContainerRef.current;
    if (!el || chartData.length === 0) {
      toast.error("暂无图表可下载");
      return;
    }
    setDownloading(true);
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: "hsl(var(--card))",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `柱状图_${fileName ? fileName.replace(/\.[^.]+$/, "") : "chart"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("图片已下载");
    } catch {
      toast.error("导出图片失败");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 mx-auto max-w-3xl h-full min-h-0">
      <div className="flex flex-col gap-2 flex-shrink-0">
        <h1 className="text-xl font-semibold">输入与上传</h1>
        <p className="text-sm text-muted-foreground">
          上传 CSV/xlsx 表格后将生成柱状图，可导出为图片并下载。
        </p>
      </div>

      <div className="flex flex-col flex-1 gap-4 min-h-0 overflow-auto">
        <Textarea
          placeholder="在此输入或粘贴内容…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="min-h-[120px] resize-y flex-shrink-0"
        />

        <div className="flex flex-wrap gap-3 items-center flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.md,.csv,.json,.xlsx"
            onChange={handleFileChange}
          />
          <Button
            onClick={handleUploadClick}
            variant="outline"
            size="default"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            上传文件
          </Button>
          {fileName && (
            <span className="flex gap-1 items-center text-sm text-muted-foreground">
              <FileText className="size-4" />
              已选：{fileName}
            </span>
          )}
        </div>

        {chartData.length > 0 && (
          <div className="flex flex-col gap-2 flex-1 min-h-[280px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground">柱状图</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadChart}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                下载图片
              </Button>
            </div>
            <div
              ref={chartContainerRef}
              className="flex-1 min-h-[240px] w-full rounded-lg border border-border bg-card p-4"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
