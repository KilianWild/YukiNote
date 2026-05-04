"use client";

import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useGesture from "@/hooks/useGesture";
import { useState } from "react";
import { useCallback } from "react";
import { useGlobalContext } from "../global-provider";
import { useRouter } from "next/navigation";

import { TextUpdaterNode } from "./_components/Test";

export default function NodeView() {
  const router = useRouter();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const { notes, setNotes } = useGlobalContext();

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  useGesture(50, (direction) => {
    if (direction === "right") router.push("/note-editor");
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodesDraggable={false}
        fitView
      />
    </div>
  );
}

const initialNodes = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    type: "textUpdater",
    data: { label: "Node 1" },
  },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges = [{ id: "n1-n2", source: "n1", target: "n2" }];

const nodeTypes = {
  textUpdater: TextUpdaterNode,
};
