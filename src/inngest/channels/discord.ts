import { realtime, staticSchema } from "inngest";

export const DISCORD_CHANNEL_NAME = "discord-execution";

export const discordChannel = realtime.channel({
  name: DISCORD_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
