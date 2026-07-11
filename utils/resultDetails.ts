export interface AnswerDetail {
  questionIndex?: number;
  studentAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  sentence?: string;
}

export function normalizeAnswerDetails(results: unknown): AnswerDetail[] {
  if (!results) return [];

  if (Array.isArray(results)) {
    return results.filter((item): item is AnswerDetail => Boolean(item) && typeof item === 'object');
  }

  if (typeof results === 'object') {
    const value = results as Record<string, unknown>;
    const candidates = [value.answers, value.details, value.items];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter((item): item is AnswerDetail => Boolean(item) && typeof item === 'object');
      }
    }
  }

  return [];
}
