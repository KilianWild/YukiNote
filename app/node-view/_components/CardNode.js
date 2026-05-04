import { useCallback } from "react";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function CardNode({ data, height }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div
      style={{ width: `${height}px`, height: `${height}px` }}
      className="flex items-center justify-center rounded-md border border-gray-600 bg-gray-800 px-1 py-0.5"
    >
      <div className="absolute top-1 left-2 text-xs">{data.title}</div>
      <div className="h-12 w-16 border border-gray-600 bg-gray-900"></div>
      <div className="absolute right-2 bottom-1 text-right text-xs text-gray-500">
        {data.location}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="pointer-events-none opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="pointer-events-none opacity-0"
      />
    </div>
  );
}
