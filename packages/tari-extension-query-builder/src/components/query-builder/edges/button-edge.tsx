import { Button } from "@/components/ui/button";
import { TrashIcon } from "@radix-ui/react-icons";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react";

export default function ButtonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            position: "absolute",
            pointerEvents: "all",
            transformOrigin: "center",
            transform: `translate(-50%, -50%) translate(${labelX.toString()}px,${labelY.toString()}px)`,
          }}
        >
          <Button variant="ghost" size="icon" onClick={onEdgeClick}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
