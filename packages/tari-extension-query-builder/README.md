# Tari Extension Query Builder

---

Last Updated: 2025-06-26
Version: 1.0.0
Verified Against: Current codebase
Test Sources: execute/ExecutionPlanner.spec.ts
Implementation: execute/ExecutionPlanner.ts

---

React-based visual query builder for creating and executing Tari blockchain transactions through a drag-and-drop interface using ReactFlow.

## Features

- **Visual Transaction Builder**: Drag-and-drop interface for creating transaction flows
- **Execution Planning**: Intelligent ordering and validation of transaction steps
- **Node-Based Architecture**: Generic nodes for various Tari operations (calls, parameters, logs)
- **Cycle Detection**: Prevents invalid transaction flows with circular dependencies
- **Parameter Validation**: Ensures all required inputs are connected or have values

## Core Components

### ExecutionPlanner

Manages transaction execution order and validates node connections.

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

**Basic Execution Order Example:**

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:52-63
// VERIFIED: 2025-06-26
const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
const edges: Edge[] = [
  buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
  buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "C", handleId: NODE_ENTRY }),
];

const executor = new ExecutionPlanner(nodes, edges);
const order = executor.getExecutionOrder();

expect(order).toEqual(["A", "B", "C"]);
```

**Parameter Connection Example:**

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:65-82
// VERIFIED: 2025-06-26
const nodes: GenericNode[] = [
  buildNode("Start"),
  buildNode("A", { output: buildOutputParameter("output_a") }),
  buildNode("B", { inputs: [buildInputParameter("input_b")] }),
  buildNode("End"),
];
const edges: Edge[] = [
  buildEdge({ nodeId: "Start", handleId: NODE_EXIT }, { nodeId: "A", handleId: NODE_ENTRY }),
  buildEdge({ nodeId: "A", handleId: "output_a" }, { nodeId: "B", handleId: "input_b" }),
  buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "End", handleId: NODE_ENTRY }),
];

const executor = new ExecutionPlanner(nodes, edges);
const order = executor.getExecutionOrder();

expect(order).toEqual(["Start", "A", "B", "End"]);
```

## Error Handling

### Cycle Detection

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:161-171
// VERIFIED: 2025-06-26
const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
const edges: Edge[] = [
  buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
  buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "C", handleId: NODE_ENTRY }),
  buildEdge({ nodeId: "C", handleId: NODE_EXIT }, { nodeId: "A", handleId: NODE_ENTRY }),
];

const executor = new ExecutionPlanner(nodes, edges);
expect(() => executor.getExecutionOrder()).toThrowError(CycleDetectedError);
```

### Ambiguous Order Detection

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:87-108
// VERIFIED: 2025-06-26
const nodes: GenericNode[] = [
  buildNode("A", { output: buildOutputParameter("output_a") }),
  buildNode("B", { inputs: [buildInputParameter("input_b")] }),
  buildNode("C", { inputs: [buildInputParameter("input_c")] }),
];
const edges: Edge[] = [
  buildEdge({ nodeId: "A", handleId: "output_a" }, { nodeId: "B", handleId: "input_b" }),
  buildEdge({ nodeId: "A", handleId: "output_a" }, { nodeId: "C", handleId: "input_c" }),
];

const executor = new ExecutionPlanner(nodes, edges);
try {
  executor.getExecutionOrder();
  expect.fail("Expected AmbiguousOrderError to be thrown");
} catch (error) {
  expect(error).toBeInstanceOf(AmbiguousOrderError);
}
```

## API Reference

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

**Key Methods:**

- `getExecutionOrder()`: Returns ordered array of node IDs for execution
- `buildTransactionDescription()`: Creates transaction details from execution plan
- `buildTransaction()`: Converts transaction details to executable transaction

### Helper Functions

**Building Input Parameters:**

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:23-27
// VERIFIED: 2025-06-26
const buildInputParameter = (name: string): NonNullable<GenericNode["data"]["inputs"]>[0] => ({
  inputConnectionType: InputConnectionType.Parameter,
  type: "String",
  name,
});
```

**Building Output Parameters:**

```typescript
// SOURCE: packages/tari-extension-query-builder/src/execute/ExecutionPlanner.spec.ts:28-31
// VERIFIED: 2025-06-26
const buildOutputParameter = (name: string): GenericNode["data"]["output"] => ({
  type: "String",
  name,
});
```

**Building Edges:**

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

- Execution order calculation with various node configurations
- Cycle detection in transaction flows
- Ambiguous order error handling
- Parameter connection validation

## Integration

This package provides the core logic for the visual query builder used in the Tari VS Code extension, handling the complex task of converting visual node graphs into executable Tari transactions.
