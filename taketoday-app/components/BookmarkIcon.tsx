export function BookmarkIcon({
  filled,
  size = 14,
}: {
  filled: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 16 / 14)}
      viewBox="0 0 14 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 1h12v14L7 11 1 15V1z" />
    </svg>
  );
}
