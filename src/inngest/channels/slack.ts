import { realtime, staticSchema } from "inngest";

export const SLACK_CHANNEL_NAME = "slack-execution";

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
