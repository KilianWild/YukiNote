import { useCallback } from "react";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function CenterNode(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="rounded-full border border-stone-500 bg-gray-700 px-4 py-2 shadow-md">
      <div className="flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          Hello
        </div>
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
