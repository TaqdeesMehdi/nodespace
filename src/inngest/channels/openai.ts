import { realtime, staticSchema } from "inngest";
import { OPENAI_CHANNEL_NAME } from "@/lib/channel-constants";

export const openAiChannel = realtime.channel({
  name: OPENAI_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
