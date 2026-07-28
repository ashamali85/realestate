'use client';

/**
 * Displays a 0–3 score as 3 stars. Stars fill proportionally to the score
 * (e.g. 1.7 → first star full, second 70% full, third empty) using a clipped
 * gradient overlay, so partial fills render smoothly. The numeric score is
 * shown beside the stars.
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
  showNumber?: boolean;
}) {
  // Fraction of each star that should be filled, 0..1 per star.
  const value = score ?? 0;

  return (
    <span className="star-rating" role="img" aria-label={score === null ? 'not rated' : `${value} of ${max}`}>
      <span className="star-row" style={{ ['--star-size' as string]: `${size}px` }}>
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, value - i)); // 0..1 for this star
          return (
            <span key={i} className="star" style={{ width: size, height: size }}>
              <Star className="star-bg" />
              <span className="star-fill-clip" style={{ width: `${fill * 100}%` }}>
                <Star className="star-fg" size={size} />
              </span>
            </span>
          );
        })}
      </span>
      {showNumber && (
        <span className="star-number">{score === null ? '—' : value.toFixed(1)}</span>
      )}
    </span>
  );
}

function Star({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.06L7.3 14.5 2.6 9.9l6.5-.95L12 2.5z" />
    </svg>
  );
}
