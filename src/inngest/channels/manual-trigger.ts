import { realtime, staticSchema } from "inngest";

import { MANUAL_TRIGGER_CHANNEL_NAME } from "@/lib/channel-constants";
export const manualTriggerChannel = realtime.channel({
  name: MANUAL_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
