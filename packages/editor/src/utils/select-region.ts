/**
 * Order or importance is reverse (for matching by index would make sense):
 *  1. All words, letters and numbers
 *  2. All whitespace
 *  3. All other symbols
 */
const SELECTION_GROUPS = /([^\s\w]+)|(\s+)|(\w+)/g;

function getMatchType(group: RegExpMatchArray | undefined): number {
  if (!group) {
    return -1;
  }

  if (group[1] !== undefined) {
    return 1;
  }

  if (group[2] !== undefined) {
    return 2;
  }

  if (group[3] !== undefined) {
    return 3;
  }

  return -1;
}

export function selectRegion(line: string, x: number): [number, number] {
  const matches = line.matchAll(SELECTION_GROUPS);

  let lastMatch: RegExpMatchArray | undefined;
  let nextMatch: RegExpMatchArray | undefined;

  for (const match of matches) {
    const length = match[0].length;
    const s = match.index!;
    const e = s + length;

    if (s < x && e > x) {
      lastMatch = match;

      break;
    }

    if (s === x) {
      nextMatch = match;

      break;
    }

    lastMatch = match;
  }

  const lastMatchType = getMatchType(lastMatch);
  const nextMatchType = getMatchType(nextMatch);

  if (lastMatchType > nextMatchType) {
    return [
      lastMatch!.index!,
      lastMatch!.index! + lastMatch![0].length,
    ];
  }

  if (lastMatchType < nextMatchType) {
    return [
      nextMatch!.index!,
      nextMatch!.index! + nextMatch![0].length,
    ];
  }

  return [0, 0];
}
