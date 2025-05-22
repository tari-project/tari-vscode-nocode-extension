import { Handle, Position } from "@xyflow/react";
import { NODE_EXIT } from "./generic-node.types";

function ExitConnection() {
  return (
    <Handle
      id={NODE_EXIT}
      type="source"
      position={Position.Right}
      className="exit-connection"
      style={{ top: "20px" }}
    />
  );
}

export default ExitConnection;
