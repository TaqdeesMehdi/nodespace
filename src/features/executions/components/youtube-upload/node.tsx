"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { YoutubeUploadDialog, YoutubeUploadFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchYoutubeUploadRealtimeToken } from "./actions";
import { YOUTUBE_UPLOAD_CHANNEL_NAME } from "@/lib/channel-constants";

type YoutubeUploadNodeData = {
  variableName?: string;
  credentialId?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
  privacyStatus?: "private" | "unlisted" | "public";
  tagsCsv?: string;
  categoryId?: string;
  madeForKids?: "true" | "false";
};

type YoutubeUploadNodeType = Node<YoutubeUploadNodeData>;

export const YoutubeUploadNode = memo(
  (props: NodeProps<YoutubeUploadNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: YOUTUBE_UPLOAD_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchYoutubeUploadRealtimeToken,
    });

    const handleSubmit = (values: YoutubeUploadFormValues) => {
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
    const description = nodeData?.title
      ? `youtube: ${nodeData.title.slice(0, 50)}...`
      : "Not Configured";

    return (
      <>
        <YoutubeUploadDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />

        <BaseExecutionNode
          {...props}
          id={props.id}
          icon="/youtube.svg"
          name="YouTube Upload"
          status={nodeStatus}
          description={description}
          onSettings={() => setDialogOpen(true)}
          onDoubleClick={() => setDialogOpen(true)}
        />
      </>
    );
  },
);
