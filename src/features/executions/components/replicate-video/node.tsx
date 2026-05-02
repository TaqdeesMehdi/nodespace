"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { ReplicateVideoDialog, ReplicateVideoFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchReplicateVideoRealtimeToken } from "./actions";
import { REPLICATE_VIDEO_CHANNEL_NAME } from "@/lib/channel-constants";

type ReplicateVideoNodeData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  duration?: string;
  fps?: string;
  seed?: string;
};

type ReplicateVideoNodeType = Node<ReplicateVideoNodeData>;

export const ReplicateVideoNode = memo(
  (props: NodeProps<ReplicateVideoNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: REPLICATE_VIDEO_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchReplicateVideoRealtimeToken,
    });

    const handleSubmit = (values: ReplicateVideoFormValues) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === props.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...values,
              },
            };
          }
          return node;
        }),
      );
    };

    const nodeData = props.data;
    const description = nodeData?.prompt
      ? `replicate: ${nodeData.prompt.slice(0, 50)}...`
      : "Not Configured";

    return (
      <>
        <ReplicateVideoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />

        <BaseExecutionNode
          {...props}
          id={props.id}
          icon="/replicate.svg"
          name="Replicate Video"
          status={nodeStatus}
          description={description}
          onSettings={() => setDialogOpen(true)}
          onDoubleClick={() => setDialogOpen(true)}
        />
      </>
    );
  },
);
