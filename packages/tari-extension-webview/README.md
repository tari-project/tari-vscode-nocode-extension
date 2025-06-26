# Tari Extension Webview

---
Last Updated: 2025-06-26
Version: 1.0.0
Verified Against: Current codebase
Test Sources: json-parser/JsonOutline.spec.ts, json-parser/tree-builder.spec.ts
Implementation: json-parser/JsonOutline.ts, json-parser/tree-builder.ts
---

React-based webview interface for the Tari VS Code extension, providing interactive JSON parsing and tree visualization capabilities for Tari blockchain data.

## Features

- **JSON Outline Parser**: Intelligent parsing of Tari account data with structured outline generation
- **Tree Builder**: Hierarchical data structure visualization for complex JSON objects
- **VS Code Integration**: Seamless webview integration with VS Code's activity bar
- **Tari Data Models**: Specialized handling of Tari blockchain entities (accounts, resources, transactions)

## Core Components

### JsonOutline

Parses JSON documents and generates structured outlines with known Tari data patterns.

```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.spec.ts:122-125
// VERIFIED: 2025-06-26
function parseDocument(title: string, json: string, knownParts: KnownJsonPart[]): JsonOutline {
  const document = new JsonDocument(title, JSON.parse(json) as object);
  return new JsonOutline(document, knownParts);
}
```

**Example Usage with Account Data:**
```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.spec.ts:9-12
// VERIFIED: 2025-06-26
const data = await fetchTestData("account.json");
const outline = parseDocument("Account", data, ACCOUNT_KNOWN_PARTS);
```

**Generated Outline Structure:**
```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.spec.ts:13-118
// VERIFIED: 2025-06-26
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
  // Additional items for public_key, resources, etc.
]);
```

### Tree Builder

Converts flat item arrays into hierarchical tree structures for visualization.

```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/tree-builder.spec.ts:5-12
// VERIFIED: 2025-06-26
const a = { path: ["a", 1, "b"], label: "A" };
const b = { path: ["a"], label: "B" };
const c = { path: ["a", 1, "b", "c", "d"], label: "C" };
const d = { path: ["d"], label: "D" };
const e = { path: ["d", "e", "f"], label: "E" };

const result = buildTree([a, b, c, d, e]);
```

**Expected Tree Structure:**
```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/tree-builder.spec.ts:14-28
// VERIFIED: 2025-06-26
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
```

## API Reference

### JsonOutline Class

```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.ts:11-19
// VERIFIED: 2025-06-26
export class JsonOutline {
  public items: JsonOutlineItem[] = [];

  constructor(
    public document: JsonDocument,
    private knownParts: KnownJsonPart[],
  ) {
    this.parse();
  }
}
```

### KnownJsonPart Interface

```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.ts:6-9
// VERIFIED: 2025-06-26
export interface KnownJsonPart {
  path: JSONPath;
  getOutlineItem: (node: Node, json: string) => JsonOutlineItemBase | undefined;
}
```

## Development

### Building
```bash
pnpm install
pnpm build
```

### Testing
```bash
pnpm test
```

**Test Coverage:**
- JSON outline parsing with Tari account data
- Tree building with nested path structures
- Error handling for malformed JSON

## Integration

This package is integrated into the main Tari VS Code extension as a webview component, providing the user interface for viewing and interacting with Tari blockchain data structures.
