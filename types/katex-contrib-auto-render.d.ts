declare module "katex/contrib/auto-render" {
  import type { KatexOptions } from "katex";

  export interface RenderMathInElementOptions
    extends Pick<KatexOptions, "macros" | "trust" | "throwOnError" | "strict"> {
    delimiters?: { left: string; right: string; display: boolean }[];
    ignoredTags?: string[];
    ignoredClasses?: string[];
    preProcess?: (math: string) => string;
    errorCallback?: (msg: string, err: Error) => void;
    displayMode?: boolean;
  }

  export default function renderMathInElement(
    elem: HTMLElement,
    options?: RenderMathInElementOptions,
  ): void;
}
