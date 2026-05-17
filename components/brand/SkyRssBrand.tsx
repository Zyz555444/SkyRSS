import { cn } from "@/lib/cn";

type BrandProps = {
  className?: string;
  title?: string;
};

/** 1:1 应用图标（渐变底 + 云弧 + RSS 信号） */
export function SkyRssIcon({ className, title = "SkyRSS" }: BrandProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="skyrss-icon-bg-inline"
          x1="8"
          y1="6"
          x2="58"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#skyrss-icon-bg-inline)" />
      <path
        d="M18 22c5.2 0 9.4 3.4 10.8 8.1"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M24 18c7.8 0 14.1 5.2 16.2 12.3"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M16 46a8 8 0 0 1 8-8" />
        <path d="M16 46a14 14 0 0 1 14-14" />
        <path d="M16 46a20 20 0 0 1 20-20" />
      </g>
      <circle cx="16" cy="46" r="3.5" fill="#fff" />
    </svg>
  );
}

/** 2:1 横版徽标（图标 + Sky/RSS 双色字标） */
export function SkyRssLogo({ className, title = "SkyRSS" }: BrandProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id="skyrss-logo-bg-inline"
          x1="6"
          y1="8"
          x2="58"
          y2="94"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="84" height="84" rx="20" fill="url(#skyrss-logo-bg-inline)" />
      <path
        d="M24 34c6.5 0 11.8 4.3 13.5 10.1"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M31 28c9.8 0 17.6 6.5 20.2 15.4"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <g stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M22 72a10 10 0 0 1 10-10" />
        <path d="M22 72a17.5 17.5 0 0 1 17.5-17.5" />
        <path d="M22 72a25 25 0 0 1 25-25" />
      </g>
      <circle cx="22" cy="72" r="4.5" fill="#fff" />
      <text
        x="104"
        y="62"
        fontFamily="var(--font-geist-sans, system-ui, sans-serif)"
        fontSize="36"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        <tspan fill="currentColor">Sky</tspan>
        <tspan fill="var(--accent)">RSS</tspan>
      </text>
    </svg>
  );
}
