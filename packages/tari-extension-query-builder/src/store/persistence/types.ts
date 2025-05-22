import { z } from "zod";
import { Edge } from "@xyflow/react";
import { CustomNode } from "../types";

export interface PersistedStateV1 {
  version: "1.0";
  nodes: CustomNode[];
  edges: Edge[];
}

export type LatestPersistedState = PersistedStateV1;
export type AnyPersistedState = PersistedStateV1;

export type ValidationResult<T> = { success: true; data: T } | { success: false; error: z.ZodError };
