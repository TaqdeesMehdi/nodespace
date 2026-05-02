import { realtime, staticSchema } from "inngest";

export const GEMINI_CHANNEL_NAME = "gemini-execution";

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
