import { useCallback } from "react";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function CenterNode({ data, height }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div
      style={{ width: `${height}px`, height: `${height}px` }}
      className="flex items-center justify-center rounded-full border border-gray-600 bg-gray-800 px-1 py-0.5"
    >
      <div className="flex items-center justify-center text-center">
        {data.inquiry}
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
