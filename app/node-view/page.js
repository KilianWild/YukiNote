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

  const handleClickEdit = useCallback(
    (id) => {
      //const noteToEdit = notes.find((note) => note._id === id);
      router.push(`/note-editor?editid=${id}`);
    },
    [router],
  );

  useEffect(() => {
    initializeNodes(notes, setNodes, handleClickEdit);
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
        minZoom={0.1}
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

function initializeNodes(notes, setNodes, handleClickEdit) {
  const deltaNoteDist = 200;
  const deltaCenterDist = 3 * deltaNoteDist;
  const cardHeight = 140;

  //---< get node cluster >---
  const notesSortedByCluster = notes.sort((a, b) =>
    a.inquiry.localeCompare(b.inquiry, undefined, { numeric: true }),
  );

  const clusters = notesSortedByCluster.reduce((acc, note) => {
    const lastCluster = acc[acc.length - 1];

    if (lastCluster && lastCluster.cluster === note.inquiry)
      lastCluster.notes.push(note);
    else acc.push({ cluster: note.inquiry, notes: [note] });

    return acc;
  }, []);

  function buildNodeTree(nodes) {
    const referenceLookup = {};

    nodes.notes.forEach((node) => {
      referenceLookup[node._id] = { node: node, children: [] };
    });

    nodes.notes.forEach((note, index) => {
      if (note.reference) {
        if (!referenceLookup[note.reference]) {
          console.warn(
            "missing parent for note",
            note._id,
            "reference:",
            note.reference,
          );
          return;
        }
        referenceLookup[note.reference].children.push(
          referenceLookup[note._id],
        );
      }
    });
    nodes.notes.forEach((note) => {
      if (note.reference) delete referenceLookup[note._id];
    });
    return referenceLookup;
  }

  const nodeTrees = (() => {
    const tree = [];
    clusters.forEach((cluster, index) => {
      tree.push(buildNodeTree(clusters[index]));
    });
    return tree;
  })();

  console.log("nodeTrees: ", nodeTrees);

  const nodeData = clusters.map((cluster, index) => {
    //---< compute center node >---
    const centerNode =
      notes && notes.length > 0
        ? {
            id: `c${index}`,
            position: { x: 0, y: 0 },
            type: "center",
            data: { inquiry: notes[0]?.inquiry },
            height: cardHeight,
          }
        : null;

    const cardNodes = notes.slice(0, 6).map((note, index) => {
      const rotationShift = index <= 2 ? 0 : 60;

      if (index >= 6) return;

      return {
        id: "n" + index,
        position: {
          x:
            Math.cos(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
            deltaNoteDist,
          y:
            Math.sin(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
            deltaNoteDist,
        },
        type: "note",
        height: cardHeight,
        data: {
          note: note,
          onClickEdit: handleClickEdit,
          deltaNoteDist: deltaNoteDist,
          deltaCenterDist: deltaCenterDist,
        },
      };
    });
  });

  //
  //
  //
  //
  //
  //

  //---< position center node >---
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

  //---< position card nodes >---
  const cardNodes = notes.slice(0, 6).map((note, index) => {
    const rotationShift = index <= 2 ? 0 : 60;

    if (index >= 6) return;

    return {
      id: "n" + index,
      position: {
        x:
          Math.cos(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
          deltaNoteDist,
        y:
          Math.sin(((90 + rotationShift + 120 * index) * Math.PI) / 180) *
          deltaNoteDist,
      },
      type: "note",
      height: cardHeight,
      data: {
        note: note,
        onClickEdit: handleClickEdit,
        deltaNoteDist: deltaNoteDist,
        deltaCenterDist: deltaCenterDist,
      },
    };
  });

  setNodes([...(centerNode ? [centerNode] : []), ...cardNodes]);
}

const initialEdges = Array.from({ length: 6 }, (_, i) => {
  return { id: "c1-n" + i, source: "c1", target: "n" + i, type: "floating" };
});

const edgeTypes = {
  floating: FloatingEdge,
};

const nodeTypes = {
  note: CardNode,
  center: CenterNode,
};
