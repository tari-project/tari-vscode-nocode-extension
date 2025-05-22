import { InputParameterType } from "@/store/types";
import { TransactionBuilder } from "@tari-project/tarijs-all";

export interface FeeTransactionPayFromComponentDescription {
  type: "feeTransactionPayFromComponent";
  args: Parameters<TransactionBuilder["feeTransactionPayFromComponent"]>;
}

export interface InputParamsReference {
  name: string;
  inputParam: InputParameterType;
}

export interface ArgValueFromInputParam {
  type: "input";
  value: unknown;
  reference: InputParamsReference;
}

export interface ArgValueFromWorkspace {
  type: "workspace";
  value: string;
}

export interface ArgValueOther {
  type: "other";
  value: unknown;
}

export type ArgValue = ArgValueFromInputParam | ArgValueFromWorkspace | ArgValueOther;

export interface CallMethodDescription {
  type: "callMethod";
  componentAddress: ArgValue;
  methodName: string;
  args: ArgValue[];
}

export interface CallFunctionDescription {
  type: "callFunction";
  function: Parameters<TransactionBuilder["callFunction"]>[0];
  args: ArgValue[];
}

export interface AddInstructionDescription {
  type: "addInstruction";
  name: string;
  args: ArgValue[];
}

export interface AllocateComponentAddress {
  type: "allocateComponentAddress";
  workspaceId: string;
}

export interface AllocateResourceAddress {
  type: "allocateResourceAddress";
  workspaceId: string;
}

export interface SaveVarDescription {
  type: "saveVar";
  key: string;
}

export type TransactionDescription =
  | FeeTransactionPayFromComponentDescription
  | CallMethodDescription
  | CallFunctionDescription
  | AddInstructionDescription
  | AllocateComponentAddress
  | AllocateResourceAddress
  | SaveVarDescription;

export interface InputParameter {
  type: InputParameterType;
  value: unknown;
}

export interface TransactionContext {
  inputParams: Record<string, InputParameter[]>;
}

export interface TransactionDetails {
  context: TransactionContext;
  descriptions: TransactionDescription[];
}
