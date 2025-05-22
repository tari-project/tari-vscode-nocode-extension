import { Segment } from "jsonc-parser";

export function pathMatches(pattern: Segment[], path: Segment[]): boolean {
  let k = 0;
  let i = 0;
  for (i = 0; k < pattern.length && i < path.length; i++) {
    if (pattern[k] === path[i] || pattern[k] === "*") {
      k++;
    } else if (pattern[k] !== "**") {
      return false;
    }
  }
  return k === pattern.length && i === path.length;
}
