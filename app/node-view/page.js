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

function initializeNodes(notes, setNodes) {
  const deltaDist = 200;
  const cardHeight = 140;
  console.log("notes", notes);

  const centerNode =
    notes && notes.length > 0
      ? {
          id: "c1",
          position: { x: 0, y: 0 },
          type: "center",
          data: { inquiry: notes[0]?.inquiry },
          height: cardHeight,
        }
      : null;

  const cardNotes = notes.slice(0, 6).map((note, index) => {
    const rotationShift = index <= 2 ? 0 : 60;

    if (index >= 6) return;

    return {
      id: "n" + index,
      position: {
        x:
          Math.cos(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
          deltaDist,
        y:
          Math.sin(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
          deltaDist,
      },
      type: "note",
      data: { title: note.title, location: note.location },
      height: cardHeight,
    };
  });
  console.log("[centerNode ? [centerNode] : [], ...cardNotes]", [
    centerNode ? [centerNode] : [],
    ...cardNotes,
  ]);
  console.log("centerNode", centerNode);
  setNodes([...(centerNode ? [centerNode] : []), ...cardNotes]);
}

const initialEdges = Array.from({ length: 6 }, (_, i) => {
  return { id: "c1-n" + i, source: "c1", target: "n" + i, type: "floating" };
});
console.log("initialEdges", initialEdges);

const edgeTypes = {
  floating: FloatingEdge,
};

const nodeTypes = {
  note: CardNode,
  center: CenterNode,
};
