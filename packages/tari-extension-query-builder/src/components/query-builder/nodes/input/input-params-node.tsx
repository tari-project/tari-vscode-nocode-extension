import { Button } from "@/components/ui/button";
import useStore from "@/store/store";
import { InputParameterType, NodeType, type InputParamsNode } from "@/store/types";
import { InputIcon, TrashIcon } from "@radix-ui/react-icons";
import { Handle, NodeProps, Position, useUpdateNodeInternals } from "@xyflow/react";
import { NEW_INPUT_PARAM } from "./constants";
import { ROW_HEIGHT, ROW_HEIGHT_PX, ROW_PADDING } from "../constants";
import { Separator } from "@/components/ui/separator";
import { InputControlType, TariType } from "@/query-builder/tari-type";
import CallInputCheckbox from "../../input/call-input-checkbox";
import CallInputText from "../../input/call-input-text";
import EditableLabel from "./editable-label";
import { useCallback, useEffect } from "react";
import { SafeParseReturnType } from "zod";
import { useTranslation } from "react-i18next";

const HANDLE_STARTING_OFFSET = 68;
const FULL_ROW_HEIGHT = ROW_HEIGHT + ROW_PADDING;

function InputParamsNode(props: NodeProps<InputParamsNode>) {
  const { id, data } = props;
  const { title, inputs } = data;
  const { t } = useTranslation();

  const updateNodeInternals = useUpdateNodeInternals();
  const removeNode = useStore((store) => store.removeNode);
  const readOnly = useStore((store) => store.readOnly);
  const getNodeById = useStore((store) => store.getNodeById);
  const isValidInputParamsTitle = useStore((store) => store.isValidInputParamsTitle);
  const updateInputParamsTitle = useStore((store) => store.updateInputParamsTitle);
  const updateInputParamsNode = useStore((store) => store.updateInputParamsNode);
  const removeInputParam = useStore((store) => store.removeInputParam);
  const isValidInputParamsName = useStore((store) => store.isValidInputParamsName);
  const updateInputParamsName = useStore((store) => store.updateInputParamsName);

  const getNewParamOffset = () => {
    const offset = HANDLE_STARTING_OFFSET + FULL_ROW_HEIGHT * inputs.length + 18;
    return `${offset.toString()}px`;
  };

  const getInputNodeValue = useCallback(
    (paramId: string) => {
      const node = getNodeById(id);
      if (!node || node.type !== NodeType.InputParamsNode) {
        return undefined;
      }
      return node.data.values[paramId];
    },
    [id, getNodeById],
  );

  const handleOnChange = (paramId: string, value: SafeParseReturnType<unknown, unknown>) => {
    updateInputParamsNode(id, paramId, value);
  };

  const isValidTitle = (label: string) => {
    return isValidInputParamsTitle(id, label);
  };

  const handleTitleChange = (newLabel: string) => {
    updateInputParamsTitle(id, newLabel);
  };

  const isValidLabel = (input: InputParameterType, label: string) => {
    return isValidInputParamsName(id, input.id, label);
  };

  const handleLabelChange = (input: InputParameterType, newLabel: string) => {
    updateInputParamsName(id, input.id, newLabel);
  };

  const handleRemove = (input: InputParameterType) => {
    removeInputParam(id, input.id);
    updateNodeInternals(id);
  };

  useEffect(() => {
    // TODO: does not seem to help with [React Flow]: Couldn't create edge for source handle id:
    updateNodeInternals(id);
  }, [inputs, id, updateNodeInternals]);

  return (
    <div className="min-w-160">
      <div className="absolute top-3 left-3 flex items-center">
        <InputIcon className="h-5 w-5 mr-1" />
      </div>
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

      <h3 className="text-center font-bold pt-1 pb-3 border-b">
        <EditableLabel initialLabel={title} onLabelChange={handleTitleChange} isValidLabel={isValidTitle} />
      </h3>

      {inputs.map((input, idx) => {
        return (
          <Handle
            key={input.id}
            id={input.id}
            type="source"
            position={Position.Right}
            style={{
              border: "2px solid #608bb9",
              top: `${(HANDLE_STARTING_OFFSET + idx * FULL_ROW_HEIGHT).toString()}px`,
            }}
          />
        );
      })}

      <form noValidate>
        {inputs.map((input) => {
          const type = new TariType(input.type);
          switch (type.getInputControlType()) {
            case InputControlType.TextBoxInput:
              return (
                <CallInputText
                  readOnly={readOnly}
                  key={input.id}
                  name={input.name}
                  placeHolder={type.prompt}
                  type={type.inputType}
                  min={type.min?.toString()}
                  max={type.max?.toString()}
                  validate={(data) => type.validate(data)}
                  value={getInputNodeValue(input.id)}
                  onChange={(value) => {
                    handleOnChange(input.id, value);
                  }}
                  rowHeight={ROW_HEIGHT_PX}
                  isValidLabel={(label) => isValidLabel(input, label)}
                  onLabelChange={(label) => {
                    handleLabelChange(input, label);
                  }}
                  onRemove={() => {
                    handleRemove(input);
                  }}
                />
              );

            case InputControlType.CheckBoxInput:
              return (
                <CallInputCheckbox
                  readOnly={readOnly}
                  key={input.id}
                  name={input.name}
                  value={getInputNodeValue(input.id)}
                  onChange={(value) => {
                    handleOnChange(input.id, value);
                  }}
                  rowHeight={ROW_HEIGHT_PX}
                  isValidLabel={(label) => isValidLabel(input, label)}
                  onLabelChange={(label) => {
                    handleLabelChange(input, label);
                  }}
                  onRemove={() => {
                    handleRemove(input);
                  }}
                />
              );
          }
        })}
      </form>

      <>
        <Separator className="my-4 h-px w-full bg-gray-300 dark:bg-gray-600" />
        <div className="flex justify-end w-full">
          <span className="italic text-xs pr-2">{t("dragToAddParameter")}</span>
        </div>
 
        <Handle
          id={NEW_INPUT_PARAM}
          type="source"
          position={Position.Right}
          style={{
            border: "2px solid #608bb9",
            top: getNewParamOffset(),
          }}
        />
      </>
    </div>
  );
}

export default InputParamsNode;
