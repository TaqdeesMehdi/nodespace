"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { stripeTriggerChannel } from "@/inngest/channels/stripe-trigger";

export type StripeTriggerToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchStripeTriggerRealtimeToken(): Promise<StripeTriggerToken> {
  const token = await inngest.realtime.token({
    channel: stripeTriggerChannel,
    topics: ["status"],
  });
  return {
    channel: stripeTriggerChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
