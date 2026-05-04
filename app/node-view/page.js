"use client";

import React, { use, useCallback } from "react";
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { CardNode } from "./_components/CardNode";
import { CenterNode } from "./_components/CenterNode";
import { useRouter } from "next/navigation";

import useGesture from "@/hooks/useGesture";

import FloatingEdge from "./_components/FloatingEdge";
import FloatingConnectionLine from "./_components/FloatingConnectionLine";

import { useGlobalContext } from "../global-provider";
import { useEffect } from "react";

export default function NodeView() {
  const { notes, setNotes } = useGlobalContext();

  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
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

  useEffect(() => {
    initializeNodes(notes, setNodes);
  }, []);

  useGesture(50, (direction) => {
    if (direction === "right") router.push("/note-editor");
  });
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
  note: CardNode,
  center: CenterNode,
};

function initializeNodes(notes, setNodes) {
  const initialNodes = [
    {
      id: "n1",
      position: { x: 0, y: 0 },
      type: "center",
      data: { label: "Node 1" },
    },
    {
      id: "n2",
      position: { x: 0, y: 100 },
      type: "note",
      data: { label: "Node 2" },
    },
  ];

  setNodes(initialNodes);
}

const initialEdges = [
  {
    id: "n1-n2",
    source: "n1",
    target: "n2",
    type: "floating",
  },
];
