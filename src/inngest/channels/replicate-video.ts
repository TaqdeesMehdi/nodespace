import { realtime, staticSchema } from "inngest";
import { REPLICATE_VIDEO_CHANNEL_NAME } from "@/lib/channel-constants";

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
