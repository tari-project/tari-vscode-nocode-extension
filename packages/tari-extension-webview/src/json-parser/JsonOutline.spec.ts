import { describe, expect, it } from "vitest";
import { JsonOutline, KnownJsonPart } from "./JsonOutline";
import { JsonDocument } from "./JsonDocument";
import path from "path";
import { readFile } from "fs/promises";
import { ACCOUNT_KNOWN_PARTS } from "./known-parts/account";

describe(JsonOutline, () => {
  it.skip("can parse account details", async () => {
    throw new Error("Not implemented");
    const data = await fetchTestData("account.json");
    const outline = parseDocument("Account", data, ACCOUNT_KNOWN_PARTS);

    expect(outline.items).toStrictEqual([
      {
        actions: undefined,
        details: undefined,
        draggable: undefined,
        hoverMessage: undefined,
        icon: "account",
        length: 12,
        offset: 4,
        open: undefined,
        path: ["account_id"],
        title: "Account ID",
        value: undefined,
      },
      {
        actions: undefined,
        details: undefined,
        draggable: undefined,
        hoverMessage: undefined,
        icon: "briefcase",
        length: 9,
        offset: 23,
        open: undefined,
        path: ["address"],
        title: "Address",
        value: undefined,
      },
      {
        actions: undefined,
        details: undefined,
        draggable: undefined,
        hoverMessage: undefined,
        icon: "key",
        length: 12,
        offset: 114,
        open: undefined,
        path: ["public_key"],
        title: "Public Key",
        value: undefined,
      },
      {
        actions: undefined,
        details: undefined,
        draggable: undefined,
        hoverMessage: undefined,
        icon: "book",
        length: 11,
        offset: 198,
        open: true,
        path: ["resources"],
        title: "Resources",
        value: undefined,
      },
      {
        actions: undefined,
        details: "XTR",
        draggable: undefined,
        hoverMessage: undefined,
        icon: "book",
        length: 6,
        offset: 225,
        open: undefined,
        path: ["resources", 0, "type"],
        title: 'Resource "Confidential"',
        value: undefined,
      },
      {
        actions: undefined,
        details: "token-a",
        draggable: undefined,
        hoverMessage: undefined,
        icon: "book",
        length: 6,
        offset: 519,
        open: undefined,
        path: ["resources", 1, "type"],
        title: 'Resource "Fungible"',
        value: undefined,
      },
      {
        actions: undefined,
        details: "token-b",
        draggable: undefined,
        hoverMessage: undefined,
        icon: "book",
        length: 6,
        offset: 807,
        open: undefined,
        path: ["resources", 2, "type"],
        title: 'Resource "Fungible"',
        value: undefined,
      },
      {
        actions: undefined,
        details: "LP",
        draggable: undefined,
        hoverMessage: undefined,
        icon: "book",
        length: 6,
        offset: 1095,
        open: undefined,
        path: ["resources", 3, "type"],
        title: 'Resource "Fungible"',
        value: undefined,
      },
    ]);
  });
});

function parseDocument(title: string, json: string, knownParts: KnownJsonPart[]): JsonOutline {
  const document = new JsonDocument(title, JSON.parse(json) as object);
  return new JsonOutline(document, knownParts);
}

async function fetchTestData(name: string): Promise<string> {
  const fileName = path.join(__dirname, "__test_data__", name);
  const contents = await readFile(fileName, { encoding: "utf-8" });
  return contents;
}
