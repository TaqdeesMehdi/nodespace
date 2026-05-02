import { realtime, staticSchema } from "inngest";

import { HTTP_REQUEST_CHANNEL_NAME } from "@/lib/channel-constants";
export const httpRequestChannel = realtime.channel({
  name: HTTP_REQUEST_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
