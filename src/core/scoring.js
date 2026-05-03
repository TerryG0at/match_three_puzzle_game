import { SCORING_RULES } from "../config/foodConfig.js";

export function getScoreForMatchLength(matchLength) {
  if (matchLength >= 5) {
    return SCORING_RULES[5];
  }

  return SCORING_RULES[matchLength] ?? 0;
}

export function summarizeMatchScore(matchGroups) {
  return matchGroups.reduce(
    (summary, matchGroup) => {
      const score = getScoreForMatchLength(matchGroup.length);
      summary.points += score;

      if (matchGroup.length === 4) {
        summary.createdSpecialDishes += 1;
      }

      return summary;
    },
    {
      points: 0,
      createdSpecialDishes: 0
    }
  );
}
