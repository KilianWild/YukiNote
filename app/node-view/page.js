"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
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
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleClickEdit = useCallback(
    (id) => {
      router.push(`/note-editor?editid=${id}`);
    },
    [router],
  );

  useEffect(() => {
    initializeNodes(notes, setNodes, setEdges, handleClickEdit);
  }, []);

  useGesture(50, (direction) => {
    if (direction === "right") router.push("/note-editor");
  });

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <div className="floating-edges" style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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

//---< Node Init:
//---------------------------------------------------------------------------------------

function initializeNodes(notes, setNodes, setEdges, handleClickEdit) {
  const deltaNoteDist = 200;
  const deltaCenterDist = 3 * deltaNoteDist;
  const cardHeight = 140;

  // ---< group notes into clusters by inquiry >---
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

  // ---< build the tree structure for every cluster >---
  function buildNodeTree(cluster) {
    const referenceLookup = {};

    cluster.notes.forEach((note) => {
      referenceLookup[note._id] = { node: note, children: [] };
    });

    cluster.notes.forEach((note) => {
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

    // ---< remove non-root nodes from the top level >---
    cluster.notes.forEach((note) => {
      if (note.reference) delete referenceLookup[note._id];
    });

    return {
      node: "root",
      children: Object.values(referenceLookup),
    };
  }

  const nodeTrees = clusters.map((cluster) => buildNodeTree(cluster));

  // ---< place all clusters side by side >---
  const rfNodes = [];
  const rfEdges = [];
  let clusterOffsetX = 0;

  nodeTrees.forEach((tree, clusterIndex) => {
    // ---< estimate how much space this tree needs - boundary=circle >---
    const nodeCount = tree.children.reduce(
      (sum, child) => sum + countNodes(child),
      0,
    );
    const treeRadius =
      Math.max(1, Math.ceil(Math.sqrt(nodeCount))) * deltaNoteDist;

    const centerX = clusterOffsetX + treeRadius;
    const centerY = 0;
    const centerId = `c${clusterIndex}`;

    // ---< center node = Theme of Inquiry label >---

    rfNodes.push({
      id: centerId,
      position: { x: centerX, y: centerY },
      type: "center",
      data: { inquiry: clusters[clusterIndex].cluster },
      height: cardHeight,
    });

    // ---< Recursion: "incomingDeg" = null => no back direction blocked, all 6 directions open >---
    placeNodes(
      tree,
      centerX,
      centerY,
      null,
      deltaNoteDist,
      rfNodes,
      rfEdges,
      centerId,
      handleClickEdit,
      cardHeight,
      deltaNoteDist,
      deltaCenterDist,
    );

    // ---< offset cluster - horizontal line only for now! >---
    clusterOffsetX += treeRadius * 2 + deltaNoteDist * 2;
  });

  // ---< second pass - push out colliding nodes >---
  resolveCollisions(rfNodes, deltaNoteDist);

  setNodes(rfNodes);
  setEdges(rfEdges);
}

const edgeTypes = {
  floating: FloatingEdge,
};

const nodeTypes = {
  note: CardNode,
  center: CenterNode,
};

//---< Hex Grid - Layout Helpers
//---------------------------------------------------------------------------------------

// ---< get coordinets rel. to an anglular direction >---
function hexOffset(degrees, distance) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: Math.sin(rad) * distance,
    y: -Math.cos(rad) * distance,
  };
}

// ---< get shortes angular distance >---
function angularDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ---<get sort to ensure nearest direction to forward first, then fan out left/right from there >---
function sortByProximity(dirs, forward) {
  return [...dirs].sort(
    (a, b) => angularDistance(a, forward) - angularDistance(b, forward),
  );
}

// ---< sort all nodes within a subtree - entry + notes >---
function countNodes(entry) {
  return 1 + entry.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function placeNodes(
  entry,
  parentX,
  parentY,
  incomingDeg,
  stepDist,
  rfNodes,
  rfEdges,
  parentId,
  handleClickEdit,
  cardHeight,
  deltaNoteDist,
  deltaCenterDist,
) {
  const allDirs = [0, 60, 120, 180, 240, 300];

  // ---< lock destination back to teh parent >---
  const backDir = incomingDeg !== null ? (incomingDeg + 180) % 360 : null;
  const availDirs =
    backDir !== null ? allDirs.filter((d) => d !== backDir) : allDirs;

  // ---< Sort available directions: first same then left/right >---
  const forwardDir = incomingDeg ?? 0;
  const sortedDirs = sortByProximity(availDirs, forwardDir);

  entry.children.forEach((child, i) => {
    // ---< Max 5 children per node (6 directions minus back = 5) >---
    if (i >= sortedDirs.length) return;

    const dir = sortedDirs[i];
    const offset = hexOffset(dir, stepDist);
    const childX = parentX + offset.x;
    const childY = parentY + offset.y;
    const nodeId = child.node._id;

    rfNodes.push({
      id: nodeId,
      position: { x: childX, y: childY },
      type: "note",
      height: cardHeight,
      data: {
        note: child.node,
        onClickEdit: handleClickEdit,
        deltaNoteDist,
        deltaCenterDist,
      },
    });

    rfEdges.push({
      id: `${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: "floating",
      markerEnd: { type: MarkerType.Arrow },
    });

    // ---< Recursion: >---
    placeNodes(
      child,
      childX,
      childY,
      dir,
      stepDist,
      rfNodes,
      rfEdges,
      nodeId,
      handleClickEdit,
      cardHeight,
      deltaNoteDist,
      deltaCenterDist,
    );
  });
}

//---< Second Pass - Collision Resolution:
//---------------------------------------------------------------------------------------

function resolveCollisions(rfNodes, minDist, iterations = 50) {
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;

    for (let i = 0; i < rfNodes.length; i++) {
      for (let j = i + 1; j < rfNodes.length; j++) {
        const a = rfNodes[i];
        const b = rfNodes[j];

        const aFixed = a.type === "center";
        const bFixed = b.type === "center";
        if (aFixed && bFixed) continue; // ---< two anchors — move on

        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= minDist) continue; // ---< distance sufficient

        if (dist < 0.001) {
          if (!aFixed) a.position.x -= minDist / 2;
          if (!bFixed) b.position.x += minDist / 2;
          moved = true;
          continue;
        }

        const overlap = minDist - dist;

        // ---< normalize push driection >---
        const nx = dx / dist;
        const ny = dy / dist;

        // ---< decide which node is to be pushed >---
        const pushA = aFixed ? 0 : bFixed ? overlap : overlap / 2;
        const pushB = bFixed ? 0 : aFixed ? overlap : overlap / 2;

        if (!aFixed) {
          a.position.x -= nx * pushA;
          a.position.y -= ny * pushA;
        }
        if (!bFixed) {
          b.position.x += nx * pushB;
          b.position.y += ny * pushB;
        }

        moved = true;
      }
    }

    if (!moved) break; // --< no overlaps remaining
  }
}
