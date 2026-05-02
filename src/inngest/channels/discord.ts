import { realtime, staticSchema } from "inngest";

import {DISCORD_CHANNEL_NAME} from '@/lib/channel-constants'

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
