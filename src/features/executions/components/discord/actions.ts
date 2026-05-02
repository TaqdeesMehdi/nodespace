"use server";

import { type Realtime } from "inngest";
import { discordChannel } from "@/inngest/channels/discord";
import { inngest } from "@/inngest/client";

export type DiscordToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchDiscordRealtimeToken(): Promise<DiscordToken> {
  const token = await inngest.realtime.token({
    channel: discordChannel,
    topics: ["status"],
  });
  return {
    channel: discordChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
