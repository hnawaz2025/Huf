type IconProps = { size?: number };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MicIcon({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="9" y="3" width="6" height="11.5" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

export function BookmarkIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" />
    </svg>
  );
}

export function ClockIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function HomeIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />
    </svg>
  );
}

export function StackIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
    </svg>
  );
}

export function AskIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M5 5.5h14v10H10l-4.5 4v-4H5z" />
      <path d="M10.2 9.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1M12 13.6v.1" />
    </svg>
  );
}

export function SendIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function PersonIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
    </svg>
  );
}
