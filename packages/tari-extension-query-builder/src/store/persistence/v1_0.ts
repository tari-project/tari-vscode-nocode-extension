import { z } from "zod";
import { CustomNode, QueryBuilderState } from "../types";
import { PersistedStateV1, ValidationResult } from "./types";
import { Edge } from "@xyflow/react";

const persistedStateV1Schema = z.object({
  version: z.literal("1.0"),
  nodes: z.unknown(),
  edges: z.unknown(),
});

export const saveStateV1 = (state: QueryBuilderState): PersistedStateV1 => ({
  version: "1.0",
  nodes: state.nodes,
  edges: state.edges,
});

export const loadStateV1 = (storedState: unknown): ValidationResult<PersistedStateV1> => {
  const result = persistedStateV1Schema.safeParse(storedState);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const { version, nodes, edges } = result.data;
  if (!nodes || !edges) {
    return { success: false, error: new z.ZodError([]) };
  }
  return {
    success: true,
    data: {
      version,
      nodes: nodes as CustomNode[],
      edges: edges as Edge[],
    },
  };
};
