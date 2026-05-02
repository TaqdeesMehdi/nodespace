import { realtime, staticSchema } from "inngest";

export const OPENAI_CHANNEL_NAME = "openai-execution";

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
