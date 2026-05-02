"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { geminiChannel } from "@/inngest/channels/gemini";

export type GeminiToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchGeminiRealtimeToken(): Promise<GeminiToken> {
  const token = await inngest.realtime.token({
    channel: geminiChannel,
    topics: ["status"],
  });
  return {
    channel: geminiChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
