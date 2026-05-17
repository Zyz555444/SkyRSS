import { cn } from "@/lib/cn";

type BrandProps = {
  className?: string;
  title?: string;
};

/** 1:1 应用图标（渐变圆角方底 + RSS 信号波 + 中心圆点） */
export function SkyRssIcon({ className, title = "SkyRSS" }: BrandProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="skyrss-icon-bg-inline"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="32" y="32" width="448" height="448" rx="112" fill="url(#skyrss-icon-bg-inline)" />
      <g stroke="#ffffff" strokeLinecap="round" fill="none">
        <path d="M192 336a24 24 0 0 1 24-24" strokeWidth="18" strokeOpacity="0.9" />
        <path d="M160 336a56 56 0 0 1 56-56" strokeWidth="18" strokeOpacity="0.7" />
        <path d="M160 336a88 88 0 0 1 88-88" strokeWidth="18" strokeOpacity="0.5" />
      </g>
      <circle cx="160" cy="336" r="20" fill="#ffffff" />
    </svg>
  );
}

/** 2:1 横版徽标（左侧图标 + 右侧 SkyRSS 双色文字） */
export function SkyRssLogo({ className, title = "SkyRSS" }: BrandProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 512"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="skyrss-logo-bg-inline"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="32" y="64" width="384" height="384" rx="96" fill="url(#skyrss-logo-bg-inline)" />
      <g stroke="#ffffff" strokeLinecap="round" fill="none">
        <path d="M176 368a20 20 0 0 1 20-20" strokeWidth="16" strokeOpacity="0.9" />
        <path d="M149 368a47 47 0 0 1 47-47" strokeWidth="16" strokeOpacity="0.7" />
        <path d="M149 368a74 74 0 0 1 74-74" strokeWidth="16" strokeOpacity="0.5" />
      </g>
      <circle cx="149" cy="368" r="17" fill="#ffffff" />
      <text
        x="480"
        y="320"
        fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
        fontSize="160"
        fontWeight="700"
        letterSpacing="-2"
      >
        <tspan fill="currentColor">Sky</tspan>
        <tspan fill="url(#skyrss-logo-bg-inline)">RSS</tspan>
      </text>
    </svg>
  );
}
