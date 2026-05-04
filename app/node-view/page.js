"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { TextUpdaterNode } from "./_components/Test";

import FloatingEdge from "./_components/FloatingEdge";
import FloatingConnectionLine from "./_components/FloatingConnectionLine";

export default function NodeView() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "floating",
            markerEnd: { type: MarkerType.Arrow },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  return (
    <div className="floating-edges" style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        edgeTypes={edgeTypes}
        nodeTypes={nodeTypes}
        connectionLineComponent={FloatingConnectionLine}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const edgeTypes = {
  floating: FloatingEdge,
};

const nodeTypes = {
  textUpdater: TextUpdaterNode,
};

const initialNodes = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    type: "textUpdater",
    data: { label: "Node 1" },
  },
  {
    id: "n2",
    position: { x: 0, y: 100 },
    type: "textUpdater",
    data: { label: "Node 2" },
  },
];

const initialEdges = [
  {
    id: "n1-n2",
    source: "n1",
    target: "n2",
    type: "floating",
  },
];
