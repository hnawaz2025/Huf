import type { Item } from "./types";

const firstName = (p: string) => p.trim().split(/\s+/)[0].toLowerCase();

/**
 * Saved people who might be the one you meant. "Sarah" → ["Sarah from work", "Sarah Chen"].
 * Huf never picks for you; the Review card offers these as choices.
 */
export function possibleMatches(person: string | null, saved: Item[]): string[] {
  if (!person?.trim()) return [];
  const key = firstName(person);
  const said = person.trim().toLowerCase();
  const seen = new Map<string, string>();
  for (const item of saved) {
    if (!item.person) continue;
    const p = item.person.trim();
    if (firstName(p) === key && p.toLowerCase() !== said && !seen.has(p.toLowerCase())) {
      seen.set(p.toLowerCase(), p);
    }
  }
  return [...seen.values()];
}
