'use client';

/**
 * Displays a 0–`max` score as a circular percentage gauge (percentage =
 * score / max * 100). A gradient arc fills clockwise from the top, with the
 * percentage in the middle — this replaced the old star rating everywhere, so
 * the export name is kept as StarRating for compatibility with existing callers.
 * A null score renders an empty ring with "—".
 */
export function StarRating({
  score,
  max = 3,
  size = 20,
  showNumber = true
}: {
  score: number | null;
  max?: number;
  size?: number;
  /** Kept for API compatibility with the old star component; ignored here. */
  showNumber?: boolean;
}) {
  // The old callers pass star-ish sizes (16–34). Scale up to a ring diameter.
  const diameter = Math.round(size * 2.4);
  const pct = score === null ? 0 : Math.max(0, Math.min(100, (score / max) * 100));
  const stroke = Math.max(4, Math.round(diameter * 0.12));
  const r = (diameter - stroke) / 2;
  const c = diameter / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  const gid = `rg-${Math.round(diameter)}-${Math.round(pct)}`;

  return (
    <span
      className="rating-gauge"
      role="img"
      aria-label={score === null ? 'not rated' : `${Math.round(pct)}%`}
      style={{ width: diameter, height: diameter, display: 'inline-block', verticalAlign: 'middle' }}
    >
      <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fd1e0" />
            <stop offset="100%" stopColor="#0f2a44" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#e6ebf1" strokeWidth={stroke} />
        {score !== null && pct > 0 && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={circumference * 0.25}
            transform={`rotate(-90 ${c} ${c})`}
          />
        )}
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="rating-gauge-text"
          style={{ fontSize: Math.max(9, Math.round(diameter * 0.26)), fontWeight: 800, fill: '#0f2a44' }}
        >
          {score === null ? '\u2014' : `${Math.round(pct)}%`}
        </text>
      </svg>
    </span>
  );
}
