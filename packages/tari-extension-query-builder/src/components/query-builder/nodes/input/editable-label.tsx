import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { ChangeEvent, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const ICON_WIDTH = 30;
const SPACE_WIDTH = 8;

export interface EditableLabelProps {
  initialLabel: string;
  isValidLabel?: (label: string) => boolean;
  onLabelChange?: (newLabel: string) => void;
  onRemove?: () => void;
}

function EditableLabel({ initialLabel, onLabelChange, isValidLabel, onRemove }: EditableLabelProps) {
  const [label, setLabel] = useState(initialLabel);
  const [isHovering, setIsHovering] = useState(false);
  const [open, setOpen] = useState(false);
  const [editInputValue, setEditInputValue] = useState(initialLabel);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [controlsPosition, setControlsPosition] = useState({ top: -35, left: 0 });
  const [isInputValid, setIsInputValid] = useState(isValidLabel ? isValidLabel(initialLabel) : true);

  const editEnabled = isValidLabel && onLabelChange;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isValidLabel) {
      return;
    }
    const newValue = event.target.value;
    setEditInputValue(newValue);
    setIsInputValid(isValidLabel(newValue));
  };

  const closeAll = () => {
    setOpen(false);
    setIsHovering(false);
  };

  const handleSave = () => {
    if (!isInputValid || !onLabelChange) {
      return;
    }
    onLabelChange(editInputValue);
    setLabel(editInputValue);
    closeAll();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    closeAll();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!isValidLabel) {
      return;
    }
    if (!newOpen) {
      setEditInputValue(label);
      setIsInputValid(isValidLabel(label));
      closeAll();
    } else {
      setIsInputValid(isValidLabel(editInputValue));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && isInputValid) {
      handleSave();
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (labelRef.current && (isHovering || open)) {
      const labelWidth = labelRef.current.offsetWidth;
      const controlsWidth = ICON_WIDTH + (onRemove ? ICON_WIDTH + SPACE_WIDTH : 0);
      const leftPosition = (labelWidth - controlsWidth) / 2;
      setControlsPosition((prev) => ({ ...prev, left: leftPosition }));
    } else {
      setControlsPosition((prev) => ({ ...prev, left: 0 }));
    }
  }, [isHovering, open, label, onRemove]);

  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
    >
      <span ref={labelRef} className="cursor-pointer block">
        {label}
      </span>
      {editEnabled && (isHovering || open) && (
        <div className="absolute flex space-x-2" style={{ top: controlsPosition.top, left: controlsPosition.left }}>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button className="nodrag" size="icon" variant="default">
                <Pencil1Icon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="flex items-center space-x-2">
                <Input
                  className={cn(
                    "flex-grow nodrag border",
                    !isInputValid
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500 !ring-red-500"
                      : "border-gray-400 dark:border-gray-700 focus:border-primary focus:ring-primary",
                  )}
                  value={editInputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <Button className="nodrag" size="sm" onClick={handleSave} disabled={!isInputValid}>
                  Update
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {onRemove && (
            <Button className="nodrag" size="icon" variant="destructive" onClick={handleRemove}>
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EditableLabel;
