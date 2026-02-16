/**
 * Complexity scoring for Stack Optimizer research protocols
 * Calculates protocol complexity based on frequency, number of compounds, and handling requirements
 */

export interface ComplexityMetrics {
  baseScore: number;
  frequencyScore: number;
  compoundScore: number;
  totalScore: number;
  level: 'simple' | 'moderate' | 'complex';
  factors: string[];
}

/**
 * Calculate base complexity score for a frequency
 * Higher frequency = higher complexity
 */
export function getFrequencyScore(frequency: string): number {
  const scores: Record<string, number> = {
    weekly: 1,
    'eod': 2,
    '2x/week': 2,
    '3x/week': 3,
    daily: 4,
    custom: 2, // Varies, but default moderate
  };
  return scores[frequency] || 2;
}

/**
 * Calculate compound-related complexity
 * More compounds = more handling steps
 */
export function getCompoundScore(count: number): number {
  if (count <= 1) return 0;
  if (count <= 3) return 1;
  if (count <= 5) return 2;
  return 3;
}

/**
 * Calculate handling complexity score
 * Special handling = higher complexity
 */
export function getHandlingScore(requirements: string[]): number {
  let score = 0;
  const high = ['refrigeration', 'light-sensitive', 'inert-atmosphere'];
  const medium = ['room-temperature', 'avoid-moisture'];

  for (const req of requirements) {
    if (high.includes(req)) score += 2;
    else if (medium.includes(req)) score += 1;
  }

  return Math.min(score, 3);
}

/**
 * Calculate total complexity for a protocol
 */
export function calculateComplexity(
  frequency: string,
  compoundCount: number,
  handlingRequirements: string[] = [],
  durationDays: number = 28
): ComplexityMetrics {
  const freqScore = getFrequencyScore(frequency);
  const compScore = getCompoundScore(compoundCount);
  const handlingScore = getHandlingScore(handlingRequirements);

  const baseScore = 1; // Everyone starts at 1
  const totalScore = baseScore + freqScore + compScore + handlingScore;

  const factors: string[] = [];
  if (freqScore > 0) factors.push(`Frequency: ${frequency}`);
  if (compScore > 0) factors.push(`${compoundCount} compound${compoundCount !== 1 ? 's' : ''}`);
  if (handlingScore > 0) factors.push(`Special handling required`);

  let level: 'simple' | 'moderate' | 'complex';
  if (totalScore <= 3) level = 'simple';
  else if (totalScore <= 6) level = 'moderate';
  else level = 'complex';

  return {
    baseScore,
    frequencyScore: freqScore,
    compoundScore: compScore,
    totalScore,
    level,
    factors,
  };
}

/**
 * Get color for complexity level
 */
export function getComplexityColor(level: 'simple' | 'moderate' | 'complex'): string {
  const colors: Record<string, string> = {
    simple: 'text-emerald-700 bg-emerald-50',
    moderate: 'text-amber-700 bg-amber-50',
    complex: 'text-red-700 bg-red-50',
  };
  return colors[level];
}

/**
 * Get emoji for complexity level
 */
export function getComplexityEmoji(level: 'simple' | 'moderate' | 'complex'): string {
  const emojis: Record<string, string> = {
    simple: '✓',
    moderate: '⚠',
    complex: '⚡',
  };
  return emojis[level];
}
