import { describe, expect, it } from "vitest";
import { JsonOutline, KnownJsonPart } from "./JsonOutline";
import { JsonDocument } from "./JsonDocument";
import path from "path";
import { readFile } from "fs/promises";
import { ACCOUNT_KNOWN_PARTS } from "./known-parts/account";

describe(JsonOutline, () => {
  it("can parse account details", async () => {
    const data = await fetchTestData("account.json");
    const outline = parseDocument("Account", data, ACCOUNT_KNOWN_PARTS);

    expect(outline.items).toStrictEqual([
      {
        title: "Account ID",
        details: undefined,
        icon: "account",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["account_id"],
        offset: 4,
        length: 12,
      },
      {
        title: "Address",
        details: undefined,
        icon: "briefcase",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["address"],
        offset: 23,
        length: 9,
      },
      {
        title: "Public Key",
        details: undefined,
        icon: "key",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["public_key"],
        offset: 114,
        length: 12,
      },
      {
        title: 'Resource "Confidential"',
        details: "XTR",
        icon: "book",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["resources", 0, "type"],
        offset: 225,
        length: 6,
      },
      {
        title: 'Resource "Fungible"',
        details: "token-a",
        icon: "book",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["resources", 1, "type"],
        offset: 519,
        length: 6,
      },
      {
        title: 'Resource "Fungible"',
        details: "token-b",
        icon: "book",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["resources", 2, "type"],
        offset: 807,
        length: 6,
      },
      {
        title: 'Resource "Fungible"',
        details: "LP",
        icon: "book",
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["resources", 3, "type"],
        offset: 1095,
        length: 6,
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
