import { FunctionDef, Type } from "@tari-project/typescript-bindings";
import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  IsValidConnection,
  XYPosition,
} from "@xyflow/react";
import { SafeParseReturnType } from "zod";
import { LatestPersistedState } from "@/store/persistence/types.ts";

export enum NodeType {
  GenericNode = "genericNode",
  InputParamsNode = "inputParamsNode",
}

export enum GenericNodeType {
  CallNode = "callNode",
  StartNode = "startNode",
  EmitLogNode = "emitLogNode",
  AssertBucketContains = "assertBucketContains",
  AllocateComponentAddress = "allocateComponentAddress",
  AllocateResourceAddress = "allocateResourceAddress",
}

export interface CallNodeMetadata {
  type: GenericNodeType.CallNode;
  isMethod: boolean;
  templateName: string;
  templateAddress: string;
  fn: FunctionDef;
}

export type GenericNodeMetadata = CallNodeMetadata;
export type GenericNodeIcon = "enter" | "rocket" | "home" | "cube" | "check-circled" | "archive" | "component";

export enum InputConnectionType {
  None = 0,
  Parameter,
  ComponentAddress,
}

export interface GenericNodeInputType {
  inputConnectionType: InputConnectionType;
  type: Type;
  name: string;
  label?: string;
  validValues?: string[];
}

export interface GenericNodeOutputType {
  type: Type;
  name: string;
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GenericNodeData = {
  type: GenericNodeType;
  values?: Record<string, SafeParseReturnType<unknown, unknown>>;
  metadata?: GenericNodeMetadata;
  hasEnterConnection?: boolean;
  hasExitConnection?: boolean;
  icon?: GenericNodeIcon;
  badge?: string;
  title?: string;
  largeCaption?: string;
  inputs?: GenericNodeInputType[];
  output?: GenericNodeOutputType;
};
export type GenericNode = Node<GenericNodeData, NodeType.GenericNode>;

export interface InputParameterType {
  id: string;
  type: Type;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type InputParamsNodeData = {
  title: string;
  values: Record<string, SafeParseReturnType<unknown, unknown>>;
  inputs: InputParameterType[];
};

export type InputParamsNode = Node<InputParamsNodeData, NodeType.InputParamsNode>;

export type CustomNode = GenericNode | InputParamsNode;

export interface SchemaAndVersion {
  $schema: string;
  version: string;
}

export interface QueryBuilderState {
  readOnly: boolean;
  nodes: CustomNode[];
  edges: Edge[];
  centerX: number;
  centerY: number;
  changeCounter: number;
  updateCenter: (centerX: number, centerY: number) => void;
  setReadOnly: (value: boolean) => void;
  onNodesChange: OnNodesChange<CustomNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: CustomNode) => void;
  addNodeAt: (node: Omit<CustomNode, "id" | "position">, position?: XYPosition) => void;
  updateNodeArgValue: (nodeId: string, argName: string, value: SafeParseReturnType<unknown, unknown>) => void;
  getNodeById: (nodeId: string) => CustomNode | undefined;
  isValidConnection: IsValidConnection;
  removeNode: (nodeId: string) => void;
  saveStateToString: () => string;
  loadStateFromString: (state: string) => void;
  setState: (state: SchemaAndVersion & LatestPersistedState) => void;
  getState: () => SchemaAndVersion & LatestPersistedState;
  isValidInputParamsTitle: (nodeId: string, title: string) => boolean;
  updateInputParamsTitle: (nodeId: string, title: string) => void;
  updateInputParamsNode: (nodeId: string, paramId: string, value: SafeParseReturnType<unknown, unknown>) => void;
  removeInputParam: (nodeId: string, paramId: string) => void;
  isValidInputParamsName: (nodeId: string, paramId: string, name: string) => boolean;
  updateInputParamsName: (nodeId: string, paramId: string, newName: string) => void;
}
