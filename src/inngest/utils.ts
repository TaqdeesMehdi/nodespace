import toposort from "toposort";
import { NonRetriableError } from "inngest";

import { NodeModel, ConnectionModel } from "@/generated/prisma";
export const topologicalSort = (
  nodes: NodeModel[],
  connections: ConnectionModel[],
): NodeModel[] => {
  //if no connection found for nodes then return nodes as-is (they all are independent)
  if (connections.length === 0) {
    return nodes;
  }
  //create edges array for topo-sort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  //add nodes with no connections as self-edges to ensure that they are included
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  //perform topological sort
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = toposort(edges);
    //remove duplicates from self-edges
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new NonRetriableError("Workflow contains a repitative cycle");
    }
    throw error;
  }
  //map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};
