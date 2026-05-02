"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { googleFormTriggerChannel } from "@/inngest/channels/google-form-trigger";

export type GoogleFormTriggerToken = Realtime.Subscribe.Token<
  string,
  ["status"]
>;

export async function fetchGoogleFormTriggerRealtimeToken(): Promise<GoogleFormTriggerToken> {
  const token = await inngest.realtime.token({
    channel: googleFormTriggerChannel,
    topics: ["status"],
  });
  return {
    channel: googleFormTriggerChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
