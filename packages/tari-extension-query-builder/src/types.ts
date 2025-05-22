import { TemplateDef } from "@tari-project/typescript-bindings";

export interface TariFlowNodeDetails {
  template: TemplateDef;
  templateAddress: string;
  functionName: string;
}
