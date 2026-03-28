"use server";
import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { anthropicChannel } from "@/inngest/channels/anthropic";

export type AnthropicToken = Realtime.Token<
  typeof anthropicChannel,
  ["status"]
>;

export async function fetchAnthropicRealtimeToken(): Promise<AnthropicToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: anthropicChannel(),
    topics: ["status"],
  });
  return token;
}
