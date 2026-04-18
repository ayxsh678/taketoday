/**
 * TakeToday mark — rendered as inline SVG so it stays crisp at every size,
 * works in dark mode via `currentColor`, and ships with zero image payload.
 * Geometry mirrors the original monogram: two interrupted Ts with beveled caps.
 */
export function Logo({
  size = 24,
  className = "",
  title = "TakeToday",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      {/* top T — beveled cap + vertical stem */}
      <path d="M22 18 L52 18 L50 22 L24 22 Z" fill="currentColor" />
      <rect x="34" y="18" width="4" height="34" fill="currentColor" />
      {/* bottom T — mirrored */}
      <rect x="42" y="28" width="4" height="34" fill="currentColor" />
      <path d="M30 62 L60 62 L58 58 L32 58 Z" fill="currentColor" />
    </svg>
  );
}
