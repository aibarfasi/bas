/** The four brief-category BAS sellers, in brief order. */
export const BRIEF_COMPARE_IDS = [
  "97-bas-rebalance",
  "97-bas-grid",
  "97-bas-health",
  "97-bas-yield",
] as const;

export const COMPARE_LIMIT = 4;

export const BRIEF_COMPARE_HREF = `/compare?ids=${BRIEF_COMPARE_IDS.join(",")}`;
