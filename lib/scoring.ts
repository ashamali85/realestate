/**
 * Evaluation scoring.
 *
 * Rules (per product decisions):
 *  - Each measure's score = the score of its selected status (0–3).
 *  - Measures with no status selected are EXCLUDED from averages.
 *  - A criteria's score = average of its scored measures.
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

/** Format a 0–3 score for display, e.g. 2.33 → "2.33 / 3". */
export function formatScore(score: number | null): string | null {
  if (score === null) return null;
  return `${score.toFixed(2)} / 3`;
}
