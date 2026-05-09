export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);
}

export function scoreTextOverlap(query: string, candidate: string): number {
  const queryWords = new Set(tokenize(query));
  const candidateWords = new Set(tokenize(candidate));

  if (queryWords.size === 0 || candidateWords.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of queryWords) {
    if (candidateWords.has(word)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(queryWords.size, candidateWords.size);
}
