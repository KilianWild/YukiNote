import { useCallback } from "react";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function TextUpdaterNode(props) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="rounded-md border border-stone-500 bg-gray-700 px-4 py-2 shadow-md">
      <div className="flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          Hello
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">Name</div>
          <div className="text-gray-500">Job</div>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-16 bg-teal-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-16 bg-teal-500"
      />
    </div>
  );
}
