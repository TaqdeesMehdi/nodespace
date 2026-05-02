import { realtime, staticSchema } from "inngest";

export const REPLICATE_VIDEO_CHANNEL_NAME = "replicate-video-execution";

export const replicateVideoChannel = realtime.channel({
  name: REPLICATE_VIDEO_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
