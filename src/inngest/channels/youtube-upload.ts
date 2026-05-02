import { realtime, staticSchema } from "inngest";

import { YOUTUBE_UPLOAD_CHANNEL_NAME } from "@/lib/channel-constants";
export const youtubeUploadChannel = realtime.channel({
  name: YOUTUBE_UPLOAD_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
