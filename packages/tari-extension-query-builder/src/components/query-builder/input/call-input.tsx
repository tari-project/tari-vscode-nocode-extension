import { Label } from "@/components/ui/label";
import { DotIcon } from "@radix-ui/react-icons";
import EditableLabel, { EditableLabelProps } from "../nodes/input/editable-label";

export type CallInputProps = {
  name: string;
  label?: string;
  labelWidth?: string;
  labelEditable?: boolean;
  rowHeight?: string;
  invalid?: boolean;
  children: React.ReactNode;
} & Omit<EditableLabelProps, "initialLabel">;

function CallInput({
  name,
  label,
  labelWidth = "160px",
  rowHeight = "36px",
  invalid,
  children,
  isValidLabel,
  onLabelChange,
  onRemove,
}: CallInputProps) {
  return (
    <div className="flex items-center mt-1" style={{ height: rowHeight }}>
      {name && (
        <Label
          htmlFor={name}
          style={{
            display: "inline-block",
            textAlign: "right",
            width: labelWidth,
          }}
        >
          <DotIcon className={`inline-block mr-1 text-red-500 ${invalid ? "opacity-100" : "opacity-0"}`} />
          <EditableLabel
            initialLabel={label ?? name}
            isValidLabel={isValidLabel}
            onLabelChange={onLabelChange}
            onRemove={onRemove}
          />
        </Label>
      )}
      <div className={name ? "ml-2 w-[64ch]" : "w-full"}>{children}</div>
    </div>
  );
}

export default CallInput;
