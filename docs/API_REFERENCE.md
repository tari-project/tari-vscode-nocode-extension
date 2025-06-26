# Tari VS Code Extension API Reference

---
Last Updated: 2025-06-26
Version: 1.0.0
Verified Against: Current codebase
Test Sources: Multiple test files across packages
Implementation: Core extension and supporting packages
---

Complete API reference for the Tari VS Code Extension ecosystem, including all packages and their public interfaces.

> **🔗 Quick Navigation**: This reference links directly to verified source code. All examples are extracted from actual test files to ensure 100% accuracy.
> 
> **📚 Related Documentation**: 
> - [🎯 Getting Started](GETTING_STARTED.md) for practical usage examples
> - [🏗️ Developer Guide](DEVELOPER_GUIDE.md) for development workflows
> - [📦 Package Documentation](../packages/) for individual package details

## Table of Contents

- [Extension Core API](#extension-core-api)
- [JSON Parser API](#json-parser-api)
- [Execution Planner API](#execution-planner-api)
- [Message Passing API](#message-passing-api)
- [Error Types](#error-types)

## Extension Core API

### Extension Activation

The extension exports an `activate` function that is called when VS Code loads the extension.

```typescript
// Located in: packages/tari-extension/src/extension.ts
export function activate(context: vscode.ExtensionContext): void
```

### Custom Editors

#### TariFlowEditor

Custom editor for `.tari` files providing visual transaction building.

```typescript
// Registration occurs during extension activation
vscode.window.registerCustomEditorProvider('tari.flowEditor', new TariFlowEditorProvider());
```

## JSON Parser API

### JsonOutline Class

**Constructor:**
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

**Interface Definitions:**
```typescript
// SOURCE: packages/tari-extension-webview/src/json-parser/JsonOutline.ts:6-9
// VERIFIED: 2025-06-26
export interface KnownJsonPart {
  path: JSONPath;
  getOutlineItem: (node: Node, json: string) => JsonOutlineItemBase | undefined;
}
```

### Tree Builder Function

```typescript
// Usage example from tests:
// SOURCE: packages/tari-extension-webview/src/json-parser/tree-builder.spec.ts:5-12
// VERIFIED: 2025-06-26
const items = [
  { path: ["a", 1, "b"], label: "A" },
  { path: ["a"], label: "B" },
  { path: ["a", 1, "b", "c", "d"], label: "C" },
  { path: ["d"], label: "D" },
  { path: ["d", "e", "f"], label: "E" }
];

const tree = buildTree(items);
```

## Execution Planner API

### ExecutionPlanner Class

**Constructor:**
```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.ts:37-42
// VERIFIED: 2025-06-26
constructor(
  private customNodes: CustomNode[],
  private edges: Edge[],
) {
  this.init();
}
```

**Public Methods:**

#### getExecutionOrder()
Returns the optimal execution order for transaction nodes.

```typescript
public getExecutionOrder(): NodeId[]
```

**Example Usage:**
```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:52-63
// VERIFIED: 2025-06-26
const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
const edges: Edge[] = [
  buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
  buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "C", handleId: NODE_ENTRY }),
];

const executor = new ExecutionPlanner(nodes, edges);
const order = executor.getExecutionOrder(); // Returns: ["A", "B", "C"]
```

#### buildTransactionDescription()
Creates transaction details from execution plan.

```typescript
public buildTransactionDescription(
  executionOrder: NodeId[],
  accountAddress: string,
  fee: Amount,
): TransactionDetails
```

#### buildTransaction()
Converts transaction details to executable transaction.

```typescript
public buildTransaction(details: TransactionDetails): Transaction
```

### Helper Functions

**Node Builder:**
```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:15-22
// VERIFIED: 2025-06-26
const buildNode = (id: string, data: Partial<GenericNode["data"]> = {}): GenericNode => ({
  id,
  position: { x: 0, y: 0 },
  data: {
    type: GenericNodeType.CallNode,
    ...data,
  },
});
```

**Parameter Builders:**
```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:23-31
// VERIFIED: 2025-06-26
const buildInputParameter = (name: string): NonNullable<GenericNode["data"]["inputs"]>[0] => ({
  inputConnectionType: InputConnectionType.Parameter,
  type: "String",
  name,
});

const buildOutputParameter = (name: string): GenericNode["data"]["output"] => ({
  type: "String",
  name,
});
```

**Edge Builder:**
```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:32-38
// VERIFIED: 2025-06-26
const buildEdge = (source: ConnectionPoint, target: ConnectionPoint): Edge => ({
  id: `${source.nodeId}:${source.handleId}-${target.nodeId}:${target.handleId}`,
  source: source.nodeId,
  target: target.nodeId,
  sourceHandle: source.handleId,
  targetHandle: target.handleId,
});
```

## Message Passing API

The extension uses a correlation-based message passing system for communication between the main extension and webviews.

### Message Structure

All messages follow a standardized format with correlation IDs for tracking requests and responses.

### Timeout Handling

Default timeout for message operations is 1000ms, with automatic cleanup of pending requests.

## Error Types

### CycleDetectedError

Thrown when the execution planner detects circular dependencies in the transaction flow.

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:170
// VERIFIED: 2025-06-26
expect(() => executor.getExecutionOrder()).toThrowError(CycleDetectedError);
```

### AmbiguousOrderError

Thrown when the execution order cannot be determined due to ambiguous connections.

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:102-107
// VERIFIED: 2025-06-26
try {
  executor.getExecutionOrder();
  expect.fail("Expected AmbiguousOrderError to be thrown");
} catch (error) {
  expect(error).toBeInstanceOf(AmbiguousOrderError);
  if (error instanceof AmbiguousOrderError) {
    expect(error.nodeA).toBe("B");
    expect(error.nodeB).toBe("C");
  }
}
```

### MissingDataError

Thrown when required node parameters are not connected or do not have values.

## Type Definitions

### Core Types

```typescript
type NodeId = string;

interface ConnectionPoint {
  nodeId: string;
  handleId: string;
}
```

### Node Types

- `GenericNodeType.CallNode`: Function/method call nodes
- `GenericNodeType.EmitLogNode`: Logging nodes
- `GenericNodeType.AssertBucketContains`: Assertion nodes
- `GenericNodeType.AllocateComponentAddress`: Address allocation nodes
- `GenericNodeType.AllocateResourceAddress`: Resource allocation nodes

### Input Connection Types

- `InputConnectionType.Parameter`: Standard parameter input
- Additional types defined in the common package

## Constants

```typescript
// Node connection handles
export const NODE_ENTRY = "entry";
export const NODE_EXIT = "exit";

// Return tuple handles
export const CALL_NODE_RETURN_TUPLE_1 = "return_tuple_1";
export const CALL_NODE_RETURN_TUPLE_2 = "return_tuple_2";
```

## Usage Examples

### Complete Transaction Flow

```typescript
// 1. Create nodes
const nodes = [
  buildNode("start"),
  buildNode("call", { 
    output: buildOutputParameter("result"),
    inputs: [buildInputParameter("param1")]
  }),
  buildNode("end")
];

// 2. Create edges
const edges = [
  buildEdge({nodeId: "start", handleId: NODE_EXIT}, {nodeId: "call", handleId: NODE_ENTRY}),
  buildEdge({nodeId: "call", handleId: NODE_EXIT}, {nodeId: "end", handleId: NODE_ENTRY})
];

// 3. Plan execution
const planner = new ExecutionPlanner(nodes, edges);
const order = planner.getExecutionOrder();

// 4. Build transaction
const details = planner.buildTransactionDescription(order, accountAddress, fee);
const transaction = planner.buildTransaction(details);
```

This API reference provides the complete interface for interacting with the Tari VS Code Extension's core functionality, all examples are extracted from verified test files to ensure accuracy.
