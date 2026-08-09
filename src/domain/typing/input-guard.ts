const NATURAL_ENGLISH_WORDS = new Set([
  "a", "an", "and", "are", "as", "be", "build", "can", "do", "file", "for", "from", "have", "i", "in", "is", "it",
  "make", "my", "of", "on", "or", "same", "that", "the", "this", "to", "want", "with", "you", "your",
]);

export function looksLikeNaturalEnglish(value: string) {
  const words = value.toLocaleLowerCase().match(/[a-z]+(?:'[a-z]+)?/gu) ?? [];
  if (words.length < 5) return false;
  const commonWords = words.filter((word) => NATURAL_ENGLISH_WORDS.has(word)).length;
  const longReadableWords = words.filter((word) => word.length >= 5 && /[aeiou]/u.test(word)).length;
  return commonWords >= 3 || (words.length >= 10 && longReadableWords >= 4);
}
