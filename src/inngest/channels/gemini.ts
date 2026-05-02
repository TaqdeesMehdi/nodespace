import { realtime, staticSchema } from "inngest";
import { GEMINI_CHANNEL_NAME } from "@/lib/channel-constants";

export const geminiChannel = realtime.channel({
  name: GEMINI_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
