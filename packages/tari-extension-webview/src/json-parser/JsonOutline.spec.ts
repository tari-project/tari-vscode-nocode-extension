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
        title: "Address",
        details: undefined,
        icon: "briefcase",
        open: undefined,
        draggable: undefined,
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["account", "address"],
        offset: 21,
        length: 9,
      },
      {
        title: "Account Name",
        details: undefined,
        icon: "account",
        open: undefined,
        draggable: undefined,
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["account", "name"],
        offset: 159,
        length: 6,
      },
      {
        title: "Public Key",
        details: undefined,
        icon: "key",
        open: undefined,
        draggable: undefined,
        actions: undefined,
        value: undefined,
        hoverMessage: undefined,
        path: ["public_key"],
        offset: 185,
        length: 12,
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
