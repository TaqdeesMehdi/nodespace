import { channel, topic } from "@inngest/realtime";

export const REPLICATE_VIDEO_CHANNEL_NAME = "replicate-video-execution";

export const replicateVideoChannel = channel(
  REPLICATE_VIDEO_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
