import { realtime, staticSchema } from "inngest";
import { STRIPE_TRIGGER_CHANNEL_NAME } from "@/lib/channel-constants";
export const stripeTriggerChannel = realtime.channel({
  name: STRIPE_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
