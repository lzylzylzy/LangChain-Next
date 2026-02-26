/**
 * 类名合并：clsx 合并条件类名，twMerge 去重 Tailwind 冲突
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
