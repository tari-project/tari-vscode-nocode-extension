import { Handle, NodeProps, Position } from "@xyflow/react";
import { TrashIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import useStore from "@/store/store";
import { InputConnectionType, NodeType, type GenericNode } from "@/store/types";
import ExitConnection from "../exit-connection";
import EnterConnection from "../enter-connection";
import NodeIcon from "./node-icon";
import { Badge } from "@/components/ui/badge";
import { InputControlType, TariType } from "@/query-builder/tari-type";
import CallInputText from "../../input/call-input-text";
import { OUTPUT_HEIGHT, ROW_HEIGHT, ROW_HEIGHT_PX, ROW_PADDING } from "../constants";
import CallInputCheckbox from "../../input/call-input-checkbox";
import { Separator } from "@/components/ui/separator";
import { CALL_NODE_RETURN, CALL_NODE_RETURN_TUPLE_1, CALL_NODE_RETURN_TUPLE_2 } from "../call-node.types";
import { useCallback, useEffect } from "react";
import { SafeParseReturnType, z } from "zod";
import CallInputSelect from "../../input/call-input-select";
import { Label } from "@/components/ui/label";

const HANDLE_STARTING_OFFSET = 98;
const FULL_ROW_HEIGHT = ROW_HEIGHT + ROW_PADDING;

function GenericNode(props: NodeProps<GenericNode>) {
  const { id, data } = props;
  const { hasEnterConnection, hasExitConnection, icon, badge, title, largeCaption, inputs, output } = data;

  const removeNode = useStore((store) => store.removeNode);
  const readOnly = useStore((store) => store.readOnly);
  const getNodeById = useStore((store) => store.getNodeById);
  const updateNodeArgValue = useStore((store) => store.updateNodeArgValue);
  const edges = useStore((store) => store.edges);

  const outputType = output ? new TariType(output.type) : undefined;

  const getOutputOffset = (idx = 0) => {
    const offset = HANDLE_STARTING_OFFSET + FULL_ROW_HEIGHT * (inputs ? inputs.length : 0) + 25 + idx * OUTPUT_HEIGHT;
    return `${offset.toString()}px`;
  };

  const getNodeValue = useCallback(
    (name: string) => {
      const node = getNodeById(id);
      if (!node || node.type !== NodeType.GenericNode || !node.data.values) {
        return undefined;
      }
      return node.data.values[name];
    },
    [id, getNodeById],
  );
  const hasConnection = useCallback(
    (handle: string) => edges.some((edge) => edge.target === id && edge.targetHandle === handle),
    [id, edges],
  );

  const handleOnChange = (argName: string, value: SafeParseReturnType<unknown, unknown>) => {
    updateNodeArgValue(id, argName, value);
  };

  useEffect(() => {
    if (!inputs) {
      return;
    }
    // Update initial checkbox values to false (instead of leaving it undefined)
    for (const input of inputs) {
      const type = new TariType(input.type);
      if (type.getInputControlType() === InputControlType.CheckBoxInput) {
        const value = getNodeValue(input.name);
        if (value == null) {
          updateNodeArgValue(id, input.name, {
            success: true,
            data: false,
          });
        }
      }
    }
  }, [id, inputs, getNodeValue, updateNodeArgValue]);

  return (
    <>
      {hasEnterConnection && <EnterConnection />}
      {hasExitConnection && <ExitConnection />}
      {(!!icon || !!badge) && (
        <div className="absolute top-3 left-3 flex items-center">
          {icon && <NodeIcon icon={icon} className="h-5 w-5 mr-1" />}
          {badge && <Badge>{badge}</Badge>}
        </div>
      )}
      <div className="absolute top-1 right-2 nodrag nopan">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            removeNode(id);
          }}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      {largeCaption && <Label className="text-4xl font-bold p-8 font-stretch-expanded">{largeCaption}</Label>}

      {inputs?.map((input, idx) => {
        switch (input.inputConnectionType) {
          case InputConnectionType.Parameter:
            return (
              <Handle
                key={input.name}
                id={input.name}
                type="target"
                position={Position.Left}
                style={{
                  border: "2px solid green",
                  top: `${(HANDLE_STARTING_OFFSET + idx * FULL_ROW_HEIGHT).toString()}px`,
                }}
              />
            );
          case InputConnectionType.ComponentAddress:
            return (
              <Handle
                key={input.name}
                id={input.name}
                type="target"
                position={Position.Left}
                style={{
                  border: "2px solid orange",
                  top: `${(HANDLE_STARTING_OFFSET + idx * FULL_ROW_HEIGHT).toString()}px`,
                }}
              />
            );
        }
      })}

      {title && <h3 className="text-center font-bold pt-1 pb-3 border-b">{title}</h3>}

      {inputs?.length ? (
        <form noValidate>
          {inputs.map((input) => {
            const type = new TariType(input.type);
            switch (type.getInputControlType()) {
              case InputControlType.TextBoxInput: {
                return input.validValues ? (
                  <CallInputSelect
                    readOnly={readOnly}
                    key={input.name}
                    name={input.name}
                    label={input.label}
                    choices={[...input.validValues]}
                    validate={(data) => {
                      const validValues = input.validValues;
                      if (!validValues) {
                        return {
                          success: true,
                          data: undefined,
                        };
                      }
                      return z
                        .string()
                        .refine((val) => validValues.includes(val), {
                          message: `Invalid value. Must be one of: ${validValues.join(", ")}`,
                        })
                        .safeParse(data);
                    }}
                    value={getNodeValue(input.name)}
                    onChange={(value) => {
                      handleOnChange(input.name, value);
                    }}
                    rowHeight={ROW_HEIGHT_PX}
                  />
                ) : (
                  <CallInputText
                    readOnly={readOnly}
                    key={input.name}
                    name={input.name}
                    label={input.label}
                    placeHolder={type.prompt}
                    type={type.inputType}
                    min={type.min?.toString()}
                    max={type.max?.toString()}
                    hasIncomingConnection={hasConnection(input.name)}
                    validate={(data) => type.validate(data)}
                    value={getNodeValue(input.name)}
                    onChange={(value) => {
                      handleOnChange(input.name, value);
                    }}
                    rowHeight={ROW_HEIGHT_PX}
                  />
                );
              }
              case InputControlType.CheckBoxInput:
                return (
                  <CallInputCheckbox
                    readOnly={readOnly}
                    key={input.name}
                    name={input.name}
                    label={input.label}
                    value={getNodeValue(input.name)}
                    onChange={(value) => {
                      handleOnChange(input.name, value);
                    }}
                    rowHeight={ROW_HEIGHT_PX}
                  />
                );
            }
          })}
        </form>
      ) : null}

      {outputType && renderOutputs(outputType, getOutputOffset)}
    </>
  );
}

function renderOutputPrompt(outputType: TariType) {
  return (
    <div className="flex justify-end w-full">
      <span className="font-semibold text-lg pr-2">{outputType.prompt}</span>
    </div>
  );
}

function renderOutputs(outputType: TariType, getOutputOffset: (idx: number) => string) {
  const [tuple1, tuple2] = outputType.getTupleDetails();
  return (
    <>
      <Separator className="my-4 h-px w-full bg-gray-300 dark:bg-gray-600" />
      {renderOutputPrompt(outputType)}
      {!outputType.isVoid() && (
        <Handle
          id={CALL_NODE_RETURN}
          type="source"
          position={Position.Right}
          style={{
            border: "2px solid #608bb9",
            top: getOutputOffset(0),
          }}
        />
      )}
      {tuple1 && (
        <>
          {renderOutputPrompt(tuple1)}
          <Handle
            id={CALL_NODE_RETURN_TUPLE_1}
            type="source"
            position={Position.Right}
            style={{
              border: "2px solid #49698c",
              top: getOutputOffset(1),
            }}
          />
        </>
      )}
      {tuple2 && (
        <>
          {renderOutputPrompt(tuple2)}
          <Handle
            id={CALL_NODE_RETURN_TUPLE_2}
            type="source"
            position={Position.Right}
            style={{
              border: "2px solid #49698c",
              top: getOutputOffset(2),
            }}
          />
        </>
      )}
    </>
  );
}

export default GenericNode;
