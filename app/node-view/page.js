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

import { CenterNode } from "./_components/CenterNode";
import { CenterNodeUnnamed } from "./_components/CenterNodeUnnamed";
import { CenterNodeDirectQuestion } from "./_components/CenterNodeDirectQuestion";
import { CenterNodeDiscrepancy } from "./_components/CenterNodeDiscrepancy";
import { CenterNodeInquiryOpen } from "./_components/CenterNodeInquiryOpen";

import { CardNode } from "./_components/CardNode";
import { CardNodeDirectQuestion } from "./_components/CardNodeDirectQuestion";
import { CardNodeInquiryOpen } from "./_components/CardNodeInquiryOpen";
import { CardNodeDiscrepancy } from "./_components/CardNodeDiscrepancy";
import { CardNodeUnrefed } from "./_components/CardNodeUnrefed";

import { useRouter } from "next/navigation";

import useGesture from "@/hooks/useGesture";

import FloatingEdge from "./_components/FloatingEdge";
import FloatingConnectionLine from "./_components/FloatingConnectionLine";

import { useGlobalContext } from "../global-provider";
import { useEffect } from "react";
import logger from "@/lib/logger";

import { useRef } from "react";
import { notesApiBulk } from "@/lib/api";

export default function NodeView() {
  const { notes, setNotes } = useGlobalContext();
  const router = useRouter();

  const mounted = useRef(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleClickEdit = useCallback(
    (id) => {
      router.push(`/note-editor?editid=${id}`);
    },
    [router],
  );

  const handleReferenceNodes = useCallback(async () => {
    const aiResponse = { rawData: "", parsedData: "" };

    //---< get list of existing theme of inquiries >---
    const existingInquiries = notes.reduce((acc, note) => {
      if (!acc.includes(note.inquiry)) {
        acc.push(note.inquiry);
      }
      return acc;
    }, []);

    //---< assemble data for ai ref request >---
    const aiRequestData = notes.map((note) => {
      const aiData = {
        isReferenced: note.isReferenced,
        _id: note._id,
        title: note.title,
        text: note.isReferenced ? "" : note.text,
        shortDescr: note.shortDescr,
        tags: note.tags,
        inquiry: note.inquiry,
        referenceId: note.referenceId,
        referenceTitle: note.referenceTitle,
        //referenceReasoning: note.referenceReasoning
        discrepancyRefs: note.discrepancyRefs,
        directQuestion: note.directQuestion,
        inquiryOpen: note.inquiryOpen,
        //inquiryOpenReasoning: note.referenceReasoning
      };
      return aiData;
    });

    //---< ai contextual process request - "POST" >---
    try {
      const url = `/api/gemini`;
      const method = "POST";
      const task = `Analyze the provided notes and return them as a structured JSON array. Apply the relationship, inquiry, and tree-mapping logic defined in the output schema to ensure each note is correctly categorized and referenced
      If no text is given, but tags and shortDescr, then use tags, shortDescr and other info like discrepancyRefs, directQuestion etc. to get context of the note for other note-referencing`;

      logger.ai({ message: "New Request has been made" });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, aiRequestData, existingInquiries }),
      });

      if (!res.ok) {
        if (res.status == 429) {
          logger.ai({
            status: "429",
            message: "Too many requests!",
          });
          return;
        } else
          throw new Error(
            `${res.status} - contextual processing request failed!`,
          );
      }

      aiResponse.rawData = await res.json();
      if (!aiResponse.rawData.result) {
        logger.ai({
          message: "Gemini returned an empty string - Output Token used up?",
        });
        return;
      }
      aiResponse.parsedData = JSON.parse(aiResponse.rawData.result);
    } catch (error) {
      console.error("failed to connect with ai service", error);
    }

    logger.ai({
      message: "The following data has been computed by gimini ai >",
      data: aiResponse.parsedData,
    });

    //---< abort if ai request has failed >---
    if (
      !Array.isArray(aiResponse.parsedData) ||
      aiResponse.parsedData.length === 0
    )
      return;

    const updatedNotes = aiResponse.parsedData.map((aiNote) => ({
      _id: aiNote._id,
      title: aiNote.title,
      text: aiNote.text,
      shortDescr: aiNote.shortDescr,
      tags: aiNote.tags,
      inquiry: aiNote.inquiry,
      referenceId: aiNote.referenceId,
      referenceTitle: aiNote.referenceTitle,
      referenceReasoning: aiNote.referenceReasoning,
      discrepancyRefs: aiNote.discrepancyRefs,
      directQuestion: aiNote.directQuestion,
      inquiryOpen: aiNote.inquiryOpen,
      inquiryOpenReasoning: aiNote.inquiryOpenReasoning,
      isReferenced: aiNote.isReferenced,
    }));

    setNotes(updatedNotes);
  }, []);

  useEffect(() => {
    if (notes.length == 0) return;

    initializeNodes(notes, setNodes, setEdges, handleClickEdit);

    if (!mounted) {
      mounted.current = true;
      return;
    }
    notesApiBulk(notes);
  }, [notes]);

  useGesture(50, (direction) => {
    if (direction === "right") router.push("/note-editor");
  });

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <>
      <div className="floating-edges h-full w-full p-4">
        <div className="flex h-full w-full flex-col items-center justify-center border border-[#262636] bg-[#111111]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            minZoom={0.1}
            fitView
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            connectionLineComponent={FloatingConnectionLine}
          ></ReactFlow>
        </div>
      </div>
      <div
        onClick={handleReferenceNodes}
        className="absolute bottom-10 left-10 h-14 w-14 rounded-full border border-zinc-400 bg-cyan-800 text-center text-sm leading-14 font-bold text-zinc-300"
      >
        REF
      </div>
      <h4 className="absolute right-7 bottom-6 text-zinc-400">悠軌Note</h4>
    </>
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

  // ---< search cluster for notes that have specifc types of nodes >---
  const enrichedClusters = clusters.map((cluster) => ({
    ...cluster,
    hasDiscrepancy: cluster.notes?.some(
      (note) => note.discrepancyRefs?.length > 0,
    ),
    hasDirectQuestion: cluster.notes?.some((note) => note.directQuestion),
    hasInquiryOpen: cluster.notes?.some((note) => note.inquiryOpen),
  }));

  // ---< build the tree structure for every cluster >---
  function buildNodeTree(cluster) {
    const referenceLookup = {};

    cluster.notes.forEach((note) => {
      referenceLookup[note._id] = { node: note, children: [] };
    });

    cluster.notes.forEach((note) => {
      if (note.referenceId && note.referenceId !== "center") {
        if (!referenceLookup[note.referenceId]) {
          console.warn(
            "missing parent for note",
            note._id,
            "reference:",
            note.referenceId,
          );
          return;
        }
        referenceLookup[note.referenceId].children.push(
          referenceLookup[note._id],
        );
      }
    });

    // ---< remove non-root nodes from the top level >---
    cluster.notes.forEach((note) => {
      if (note.referenceId && note.referenceId !== "center")
        delete referenceLookup[note._id];
    });

    return {
      node: "root",
      children: Object.values(referenceLookup),
    };
  }

  const nodeTrees = enrichedClusters.map((cluster) => buildNodeTree(cluster));

  // ---< place all clusters side by side >---
  const rfNodes = [];
  const rfEdges = [];
  //let clusterOffsetX = 0;

  // ---< calculate cluzster radii >---
  const radii = nodeTrees.map((tree) => {
    const nodeCount = tree.children.reduce(
      (sum, child) => sum + countNodes(child),
      0,
    );
    return Math.max(1, Math.ceil(Math.sqrt(nodeCount))) * deltaNoteDist;
  });

  const clusterPositions = packClusters(radii, 150);

  nodeTrees.forEach((tree, clusterIndex) => {
    const centerX = clusterPositions[clusterIndex].x;
    const centerY = clusterPositions[clusterIndex].y;

    const centerId = `c${clusterIndex}`;

    // ---< determine center node type >---
    let nodeType = null;
    if (
      enrichedClusters[clusterIndex].cluster &&
      enrichedClusters[clusterIndex].hasDiscrepancy
    )
      nodeType = "centerDiscrepancy";
    else if (
      enrichedClusters[clusterIndex].cluster &&
      enrichedClusters[clusterIndex].hasDirectQuestion
    )
      nodeType = "centerDirectQuestion";
    else if (
      enrichedClusters[clusterIndex].cluster &&
      enrichedClusters[clusterIndex].hasInquiryOpen
    )
      nodeType = "centerInquiryOpen";
    else if (!enrichedClusters[clusterIndex].cluster)
      nodeType = "centerUnnamed";
    else nodeType = "center";

    // ---< center node = Theme of Inquiry label >---
    rfNodes.push({
      id: centerId,
      position: { x: centerX, y: centerY },
      type: nodeType,
      data: { inquiry: enrichedClusters[clusterIndex].cluster },
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
    /*
    // ---< offset cluster - horizontal line only for now! >---
    clusterOffsetX += treeRadius * 2 + deltaNoteDist * 2;
*/
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
  unrefed: CardNodeUnrefed,
  discrepancy: CardNodeDiscrepancy,
  directQuestion: CardNodeDirectQuestion,
  inquiryOpen: CardNodeInquiryOpen,
  note: CardNode,
  center: CenterNode,
  centerDirectQuestion: CenterNodeDirectQuestion,
  centerDiscrepancy: CenterNodeDiscrepancy,
  centerInquiryOpen: CenterNodeInquiryOpen,
  centerUnnamed: CenterNodeUnnamed,
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

  // ---< Sort available directions >---
  const spreadOrder = [0, 120, 240, 300, 60, 180];

  const sortedDirs =
    incomingDeg === null
      ? spreadOrder.filter((d) => availDirs.includes(d))
      : sortByProximity(availDirs, incomingDeg);

  entry.children.forEach((child, i) => {
    // ---< Max 5 children per node (6 directions minus back = 5) >---
    if (i >= sortedDirs.length) return;

    const dir = sortedDirs[i];
    const offset = hexOffset(dir, stepDist);
    const childX = parentX + offset.x;
    const childY = parentY + offset.y;
    const nodeId = child.node._id;

    let nodeType = null;

    if (child.node.discrepancyRefs?.length > 0) nodeType = "discrepancy";
    else if (child.node.directQuestion) nodeType = "directQuestion";
    else if (child.node.inquiryOpen) nodeType = "inquiryOpen";
    else if (child.node.referenceId) nodeType = "note";
    else nodeType = "unrefed";

    rfNodes.push({
      id: nodeId,
      position: { x: childX, y: childY },
      type: nodeType,
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

    if (!moved) break; // ---< no overlaps remaining
  }
}

function packClusters(radii, gap = 100) {
  if (radii.length === 0) return [];
  const positions = [];

  // ---< First circle at origin >---
  positions.push({ x: 0, y: 0 });
  if (radii.length === 1) return positions;

  // ---< Second circle to the right >---
  positions.push({ x: radii[0] + radii[1] + gap, y: 0 });
  if (radii.length === 2) return positions;

  // ---< Each subsequent circle: try tangent to every pair of placed circles,
  // ---< pick the candidate closest to the centroid of placed circles
  for (let k = 2; k < radii.length; k++) {
    const r = radii[k];
    let bestPos = null;
    let bestDist = Infinity;

    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const candidates = tangentCircles(
          positions[i],
          radii[i],
          positions[j],
          radii[j],
          r,
          gap,
        );
        for (const c of candidates) {
          // ---< Check no overlap with existing circles >---
          const overlaps = positions.some((p, idx) => {
            const dx = c.x - p.x,
              dy = c.y - p.y;
            return Math.sqrt(dx * dx + dy * dy) < radii[idx] + r - 0.1;
          });
          if (overlaps) continue;

          // ---< Pick closest to centroid >---
          const cx = positions.reduce((s, p) => s + p.x, 0) / k;
          const cy = positions.reduce((s, p) => s + p.y, 0) / k;
          const dist = Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2);
          if (dist < bestDist) {
            bestDist = dist;
            bestPos = c;
          }
        }
      }
    }

    // ---< Fallback: just place it to the right if no tangent found >---
    positions.push(
      bestPos ?? { x: positions[k - 1].x + radii[k - 1] + r, y: 0 },
    );
  }

  return positions;
}

// ---< Returns up to 2 positions where circle r is tangent to circles A and B >---
function tangentCircles(a, ra, b, rb, r, gap = 100) {
  const d1 = ra + r + gap;
  const d2 = rb + r + gap;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > d1 + d2 || d < Math.abs(d1 - d2)) return []; // ---< no solution

  const cosA = (d1 * d1 + d * d - d2 * d2) / (2 * d1 * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const angle = Math.atan2(dy, dx);

  return [
    {
      x: a.x + d1 * Math.cos(angle + Math.acos(cosA)),
      y: a.y + d1 * Math.sin(angle + Math.acos(cosA)),
    },
    {
      x: a.x + d1 * Math.cos(angle - Math.acos(cosA)),
      y: a.y + d1 * Math.sin(angle - Math.acos(cosA)),
    },
  ];
}
