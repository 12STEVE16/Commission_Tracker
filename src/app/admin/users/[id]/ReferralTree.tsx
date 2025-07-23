// src/app/admin/users/[id]/ReferralTree.tsx
"use client";

import React, { useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
} from "react-flow-renderer";
import dagre from "dagre";

interface TreeNode {
  id: string;
  email: string;
  referred_by: string | null;
  level: number;
}

// Dimensions for layout
const nodeWidth = 180;
const nodeHeight = 40;
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export default function ReferralTree({ partnerId }: { partnerId: string }) {
  // Now explicitly type nodes as Node<{ label: string }>[]
  const [nodes, setNodes] = useState<Node<{ label: string }>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    async function fetchTree() {
      const res = await fetch(`/api/admin/${partnerId}/referral-tree`);
      const data: TreeNode[] = await res.json();

      // Build nodes with data.label
      const newNodes: Node<{ label: string }>[] = data.map((n) => ({
        id: n.id,
        data: { label: `${n.email} (L${n.level})` },
        position: { x: 0, y: 0 },
      }));

      // Build edges
      const newEdges: Edge[] = data
        .filter((n) => n.referred_by)
        .map((n) => ({
          id: `e-${n.referred_by}-${n.id}`,
          source: n.referred_by!,
          target: n.id,
          animated: true,
        }));

      // Lay out with Dagre
      dagreGraph.setGraph({ rankdir: "TB" });
      newNodes.forEach((n) =>
        dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight })
      );
      newEdges.forEach((e) => dagreGraph.setEdge(e.source, e.target));

      dagre.layout(dagreGraph);

      const layoutedNodes = newNodes.map((n) => {
        const { x, y } = dagreGraph.node(n.id);
        return {
          ...n,
          position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
        };
      });

      setNodes(layoutedNodes);
      setEdges(newEdges);
    }

    fetchTree();
  }, [partnerId]);

  return (
    <div className="h-80 bg-white rounded shadow overflow-hidden">
      {nodes.length > 0 ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <MiniMap
            style={{
              width: 100,
              height: 100,
              padding: 4,
            }}
          />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      ) : (
        <div className="p-4 text-gray-500">No referral tree data.</div>
      )}
    </div>
  );
}
