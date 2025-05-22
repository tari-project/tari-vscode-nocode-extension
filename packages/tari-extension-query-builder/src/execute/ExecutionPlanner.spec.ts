import { describe, expect, it } from "vitest";
import { ExecutionPlanner } from "./ExecutionPlanner";
import { InputConnectionType, GenericNode, GenericNodeType } from "@/store/types";
import { Edge } from "@xyflow/react";
import { NODE_ENTRY, NODE_EXIT } from "@/components/query-builder/nodes/generic-node.types";
import { CycleDetectedError } from "./CycleDetectedError";
import { AmbiguousOrderError } from "./AmbiguousOrderError";

interface ConnectionPoint {
  nodeId: string;
  handleId: string;
}

describe(ExecutionPlanner, () => {
  const buildNode = (id: string, data: Partial<GenericNode["data"]> = {}): GenericNode => ({
    id,
    position: { x: 0, y: 0 },
    data: {
      type: GenericNodeType.CallNode,
      ...data,
    },
  });
  const buildInputParameter = (name: string): NonNullable<GenericNode["data"]["inputs"]>[0] => ({
    inputConnectionType: InputConnectionType.Parameter,
    type: "String",
    name,
  });
  const buildOutputParameter = (name: string): GenericNode["data"]["output"] => ({
    type: "String",
    name,
  });
  const buildEdge = (source: ConnectionPoint, target: ConnectionPoint): Edge => ({
    id: `${source.nodeId}:${source.handleId}-${target.nodeId}:${target.handleId}`,
    source: source.nodeId,
    target: target.nodeId,
    sourceHandle: source.handleId,
    targetHandle: target.handleId,
  });

  describe("getExecutionOrder", () => {
    describe("succeeds when", () => {
      it("there are no nodes", () => {
        const nodes: GenericNode[] = [];
        const edges: Edge[] = [];

        const executor = new ExecutionPlanner(nodes, edges);
        const order = executor.getExecutionOrder();

        expect(order).toEqual([]);
      });

      it("order is explicity defined for all nodes", () => {
        const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
        const edges: Edge[] = [
          buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
          buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "C", handleId: NODE_ENTRY }),
        ];

        const executor = new ExecutionPlanner(nodes, edges);
        const order = executor.getExecutionOrder();

        expect(order).toEqual(["A", "B", "C"]);
      });

      it("order of some nodes is deterministically inferred from output parameter connections", () => {
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
      });
    });

    describe("fails when", () => {
      describe("output is not deterministic", () => {
        it("two nodes use output from the same node", () => {
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
            if (error instanceof AmbiguousOrderError) {
              expect(error.nodeA).toBe("B");
              expect(error.nodeB).toBe("C");
            }
          }
        });

        it("some nodes have parameter connections, but a node does not have any connections", () => {
          const nodes: GenericNode[] = [
            buildNode("A", { output: buildOutputParameter("output_a") }),
            buildNode("B", { inputs: [buildInputParameter("input_b")] }),
            buildNode("C"),
          ];
          const edges: Edge[] = [
            buildEdge({ nodeId: "A", handleId: "output_a" }, { nodeId: "B", handleId: "input_b" }),
          ];

          const executor = new ExecutionPlanner(nodes, edges);
          try {
            executor.getExecutionOrder();
            expect.fail("Expected AmbiguousOrderError to be thrown");
          } catch (error) {
            expect(error).toBeInstanceOf(AmbiguousOrderError);
            if (error instanceof AmbiguousOrderError) {
              expect(error.nodeA).toBe("A");
              expect(error.nodeB).toBe("C");
            }
          }
        });

        it("multiple nodes do not have any connections", () => {
          const nodes: GenericNode[] = [buildNode("A"), buildNode("B")];

          const executor = new ExecutionPlanner(nodes, []);
          expect(() => executor.getExecutionOrder()).toThrowError(AmbiguousOrderError);
        });

        it("some nodes have explicit connections, but a node does not have any connections", () => {
          const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
          const edges: Edge[] = [
            buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
          ];

          const executor = new ExecutionPlanner(nodes, edges);
          try {
            executor.getExecutionOrder();
            expect.fail("Expected AmbiguousOrderError to be thrown");
          } catch (error) {
            expect(error).toBeInstanceOf(AmbiguousOrderError);
            if (error instanceof AmbiguousOrderError) {
              expect(error.nodeA).toBe("A");
              expect(error.nodeB).toBe("C");
            }
          }
        });
      });

      it("there is a cycle", () => {
        const nodes: GenericNode[] = [buildNode("A"), buildNode("B"), buildNode("C")];
        const edges: Edge[] = [
          buildEdge({ nodeId: "A", handleId: NODE_EXIT }, { nodeId: "B", handleId: NODE_ENTRY }),
          buildEdge({ nodeId: "B", handleId: NODE_EXIT }, { nodeId: "C", handleId: NODE_ENTRY }),
          buildEdge({ nodeId: "C", handleId: NODE_EXIT }, { nodeId: "A", handleId: NODE_ENTRY }),
        ];

        const executor = new ExecutionPlanner(nodes, edges);
        expect(() => executor.getExecutionOrder()).toThrowError(CycleDetectedError);
      });
    });
  });
});
