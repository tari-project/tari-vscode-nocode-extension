import { Checkbox } from "@/components/ui/checkbox";
import CallInput, { CallInputProps } from "./call-input";
import { useState } from "react";
import { SafeParseReturnType } from "zod";
import { CheckedState } from "@radix-ui/react-checkbox";
import { EditableLabelProps } from "../nodes/input/editable-label";

type CallInputCheckboxProps = {
  readOnly?: boolean;
  value?: SafeParseReturnType<unknown, unknown>;
  onChange?: (value: SafeParseReturnType<unknown, unknown>) => void;
} & Omit<CallInputProps, "children"> &
  Omit<EditableLabelProps, "initialLabel">;

function CallInputCheckbox({
  readOnly = false,
  name,
  labelWidth,
  value,
  onChange,
  isValidLabel,
  onLabelChange,
  onRemove,
}: CallInputCheckboxProps) {
  const [checked, setChecked] = useState(value?.success ? (value.data as boolean) : false);

  const handleChange = (checkedState: CheckedState) => {
    const checked = typeof checkedState === "boolean" && checkedState;
    setChecked(checked);
    if (onChange) {
      onChange({ success: true, data: checked });
    }
  };

  return (
    <CallInput
      name={name}
      labelWidth={labelWidth}
      isValidLabel={isValidLabel}
      onLabelChange={onLabelChange}
      onRemove={onRemove}
    >
      <Checkbox
        disabled={readOnly}
        name={name}
        className="nodrag flex justify-start border border-gray-400 dark:border-gray-700"
        checked={checked}
        onCheckedChange={handleChange}
      />
    </CallInput>
  );
}

export default CallInputCheckbox;
