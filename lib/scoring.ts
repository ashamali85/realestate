/**
 * Evaluation scoring.
 *
 * Rules (per product decisions):
 *  - Each measure's score = the percentage (0–100) of its selected status.
 *  - Measures with no status selected are EXCLUDED from averages.
 *  - A criteria's score = average of its scored measures' percentages.
 *  - The request's overall score = average of criteria scores (each criteria
 *    weighted equally), considering only criteria that have at least one
 *    scored measure.
 */

export type ScoredMeasure = { score: number | null };

/** Average score of a criteria's measures, or null if none are scored. */
export function criteriaScore(measures: ScoredMeasure[]): number | null {
  const scored = measures.map((m) => m.score).filter((s): s is number => s !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((a, b) => a + b, 0);
  return sum / scored.length;
}

/** Overall request score = average of criteria scores, or null if none. */
export function overallScore(criteriaScores: (number | null)[]): number | null {
  const scored = criteriaScores.filter((s): s is number => s !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((a, b) => a + b, 0);
  return sum / scored.length;
}

/** Format a percentage score for display, e.g. 83.5 → "84%". */
export function formatScore(score: number | null): string | null {
  if (score === null) return null;
  return `${Math.round(score)}%`;
}

/** Maps an aggregate percentage (0–100) to the nearest rating label key.
 *  Thresholds align with the default status percentages (Excellent 95, Very
 *  good 87, Good 72, Poor 50) using sensible midpoints. */
export function scoreLabelKey(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 91) return 'rating_excellent';
  if (score >= 80) return 'rating_verygood';
  if (score >= 61) return 'rating_good';
  return 'rating_poor';
}
