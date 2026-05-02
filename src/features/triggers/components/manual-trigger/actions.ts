"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { manualTriggerChannel } from "@/inngest/channels/manual-trigger";

export type ManualTriggerToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchManualTriggerRealtimeToken(): Promise<ManualTriggerToken> {
  const token = await inngest.realtime.token({
    channel: manualTriggerChannel,
    topics: ["status"],
  });
  return {
    channel: manualTriggerChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
