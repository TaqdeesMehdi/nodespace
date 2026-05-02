"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { anthropicChannel } from "@/inngest/channels/anthropic";

export type AnthropicToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchAnthropicRealtimeToken(): Promise<AnthropicToken> {
  const token = await inngest.realtime.token({
    channel: anthropicChannel,
    topics: ["status"],
  });
  return {
    channel: anthropicChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
