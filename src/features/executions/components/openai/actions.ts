"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { openAiChannel } from "@/inngest/channels/openai";

export type OpenAiToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchOpenAiRealtimeToken(): Promise<OpenAiToken> {
  const token = await inngest.realtime.token({
    channel: openAiChannel,
    topics: ["status"],
  });
  return {
    channel: openAiChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
