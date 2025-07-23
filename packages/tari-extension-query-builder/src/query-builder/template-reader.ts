import { CALL_NODE_RETURN } from "@/components/query-builder/nodes/call-node.types";
import { GenericNodeType, InputConnectionType, NodeType, QueryBuilderState } from "@/store/types";
import { TemplateDef } from "@tari-project/typescript-bindings";

export const COMPONENT_ADDRESS_NAME = "__component_address___";

type GenericNodeDescription = Parameters<QueryBuilderState["addNodeAt"]>[0];

export class TemplateReader {
  constructor(
    public templateDef: TemplateDef,
    public templateAddress: string,
  ) {}

  public get templateName(): string {
    return this.templateDef.V1.template_name;
  }

  public getGenericNode(functionName: string): GenericNodeDescription | null {
    const fn = this.templateDef.V1.functions.find((f) => f.name === functionName);
    if (!fn) {
      return null;
    }
    const args = fn.arguments;
    const isMethod = !!(args.length && args[0].name === "self");
    const inputs = args.map((arg) => {
      if (arg.name === "self") {
        return {
          inputConnectionType: InputConnectionType.ComponentAddress,
          name: COMPONENT_ADDRESS_NAME,
          label: "Component Address",
          type: { Other: { name: "Component" } },
        };
      }
      return {
        inputConnectionType: InputConnectionType.Parameter,
        name: arg.name,
        type: arg.arg_type,
      };
    });

    return {
      type: NodeType.GenericNode,
      data: {
        type: GenericNodeType.CallNode,
        metadata: {
          type: GenericNodeType.CallNode,
          isMethod,
          templateName: this.templateName,
          templateAddress: this.templateAddress,
          fn,
        },
        hasEnterConnection: true,
        hasExitConnection: true,
        icon: isMethod ? "cube" : "home",
        badge: this.templateName,
        title: functionName,
        inputs,
        output: {
          type: fn.output,
          name: CALL_NODE_RETURN,
        },
      },
    };
  }
}
