import { describe, it, expect } from "vitest";
import { buildTree } from "./tree-builder";

describe(buildTree, () => {
  it("arranges items as a tree", () => {
    const a = { path: ["a", 1, "b"], label: "A" };
    const b = { path: ["a"], label: "B" };
    const c = { path: ["a", 1, "b", "c", "d"], label: "C" };
    const d = { path: ["d"], label: "D" };
    const e = { path: ["d", "e", "f"], label: "E" };

    const result = buildTree([a, b, c, d, e]);

    expect(result).toStrictEqual([
      {
        item: b,
        children: [
          {
            item: a,
            children: [{ item: c }],
          },
        ],
      },
      {
        item: d,
        children: [{ item: e }],
      },
    ]);
  });
});
