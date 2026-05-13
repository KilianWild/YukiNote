import { useCallback } from "react";

import { Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export function CardNodeInquiryOpen({ height, data }) {
  const { note, onClickEdit, deltaNoteDist, deltaCenterDist } = data;

  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div
      style={{ width: `${height}px`, height: `${height}px` }}
      onDoubleClick={() => onClickEdit(note._id)}
      className="flex items-center justify-center rounded-md border-2 border-teal-600 bg-gray-800 px-1 py-0.5"
    >
      <div className="absolute top-2 right-2 left-2 text-xs">{note.title}</div>
      <div className="h-12 w-16 border border-gray-600 bg-gray-900"></div>
      <div className="absolute right-2 bottom-1 text-right text-xs text-gray-500">
        {note.location}
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
