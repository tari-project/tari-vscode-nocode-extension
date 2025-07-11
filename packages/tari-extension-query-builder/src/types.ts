import { TemplateDef } from "@tari-project/typescript-bindings";

export interface TariFlowNodeDetails {
  template: TemplateDef;
  templateAddress: string;
  functionName: string;
}

// Extend BigInt to support JSON serialization
declare global {
  interface BigInt {
    toJSON(): string | number;
  }
}

BigInt.prototype.toJSON = function () {
  // if the number is too large, return it as a string
  // otherwise return it as a number
  const int = this.valueOf();
  if (int > BigInt(Number.MAX_SAFE_INTEGER) || int < BigInt(Number.MIN_SAFE_INTEGER)) {
    return this.toString();
  }
  return Number(this);
};
