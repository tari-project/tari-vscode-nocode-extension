import { Handle, Position } from "@xyflow/react";
import { NODE_ENTRY } from "./generic-node.types";

function EnterConnection() {
  return (
    <Handle
      id={NODE_ENTRY}
      type="target"
      position={Position.Left}
      className="enter-connection"
      style={{ top: "20px" }}
    />
  );
}

export default EnterConnection;
