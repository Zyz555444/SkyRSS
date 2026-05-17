import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Code2,
  Folder,
  Layers,
  Palette,
  Box,
  Newspaper,
} from "lucide-react";

const PRESET: Record<string, LucideIcon> = {
  科技: Layers,
  设计: Palette,
  产品: Box,
  开发: Code2,
  商业: BarChart3,
  新闻: Newspaper,
};

const FALLBACK: LucideIcon[] = [Layers, Palette, Box, Code2, BarChart3, Folder];

export function getCategoryIcon(name: string, index = 0): LucideIcon {
  const preset = PRESET[name.trim()];
  if (preset) return preset;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % FALLBACK.length;
  }
  return FALLBACK[(hash + index) % FALLBACK.length] ?? Folder;
}
