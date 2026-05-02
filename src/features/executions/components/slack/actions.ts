"use server";

import { type Realtime } from "inngest";
import { slackChannel } from "@/inngest/channels/slack";
import { inngest } from "@/inngest/client";

export type SlackToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchSlackRealtimeToken(): Promise<SlackToken> {
  const token = await inngest.realtime.token({
    channel: slackChannel,
    topics: ["status"],
  });
  return {
    channel: slackChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
