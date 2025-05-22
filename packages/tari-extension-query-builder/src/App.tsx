import "./root.css";
import QueryBuilder from "./components/query-builder/query-builder";
import { useEffect, useRef } from "react";
import tariSwapPoolFunctions from "./stories/data/tari-swap-pool.json";
import { TemplateDef } from "@tari-project/typescript-bindings";
import useStore from "./store/store";
import { TemplateReader } from "./query-builder/template-reader";
import { GenericNodeType, InputConnectionType, NodeType } from "./store/types";

function App() {
  const added = useRef<boolean>(false);
  const addNodeAt = useStore((store) => store.addNodeAt);

  useEffect(() => {
    if (!added.current) {
      addNodeAt({
        type: NodeType.InputParamsNode,
        data: {
          title: "input1",
          values: {},
          inputs: [],
        },
      });
      addNodeAt({
        type: NodeType.InputParamsNode,
        data: {
          title: "input2",
          values: {},
          inputs: [],
        },
      });

      const tariSwapPoolReader = new TemplateReader(
        tariSwapPoolFunctions as TemplateDef,
        "d7032a35cac0a7c4c8dafa4dc0bd76c54b3ceb842540d16c77450f5b6fc5111f",
      );
      const nodeData = tariSwapPoolReader.getGenericNode("add_liquidity");
      if (nodeData) {
        addNodeAt(nodeData, { x: 400, y: 400 });
      }

      addNodeAt({
        type: NodeType.GenericNode,
        data: {
          type: GenericNodeType.CallNode,
          hasEnterConnection: true,
          hasExitConnection: true,
          icon: "cube",
          badge: "TariSwapPool",
          title: "swap",
          inputs: [
            {
              inputConnectionType: InputConnectionType.Parameter,
              name: "fee",
              label: "Fee",
              type: "U16",
            },
            {
              inputConnectionType: InputConnectionType.Parameter,
              name: "input_bucket",
              label: "input_bucket",
              type: {
                Other: {
                  name: "Bucket",
                },
              },
            },
            {
              inputConnectionType: InputConnectionType.Parameter,
              name: "is_valid",
              label: "is_valid",
              type: "Bool",
            },
            {
              inputConnectionType: InputConnectionType.Parameter,
              name: "log_level",
              label: "Log Level",
              type: "String",
              validValues: ["Error", "Warn", "Info", "Debug"],
            },
            {
              inputConnectionType: InputConnectionType.Parameter,
              name: "output_resource",
              label: "output_resource",
              type: {
                Other: {
                  name: "ResourceAddress",
                },
              },
            },
          ],
          output: {
            name: "input_bucket",
            label: "input_bucket",
            type: {
              Other: {
                name: "Bucket",
              },
            },
          },
        },
      });

      added.current = true;
    }
  }, [addNodeAt]);
  return (
    <>
      <QueryBuilder theme="dark" />
    </>
  );
}

export default App;
