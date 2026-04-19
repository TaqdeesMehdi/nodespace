import { channel, topic } from "@inngest/realtime";

export const YOUTUBE_UPLOAD_CHANNEL_NAME = "youtube-upload-execution";

export const youtubeUploadChannel = channel(
  YOUTUBE_UPLOAD_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
