import { realtime, staticSchema } from "inngest";
import { ANTHROPIC_CHANNEL_NAME } from "@/lib/channel-constants";
export const anthropicChannel = realtime.channel({
  name: ANTHROPIC_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
