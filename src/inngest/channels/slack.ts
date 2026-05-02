import { realtime, staticSchema } from "inngest";

import { SLACK_CHANNEL_NAME } from "@/lib/channel-constants";
export const slackChannel = realtime.channel({
  name: SLACK_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
