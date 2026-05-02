"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { replicateVideoChannel } from "@/inngest/channels/replicate-video";

export type ReplicateVideoToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchReplicateVideoRealtimeToken(): Promise<ReplicateVideoToken> {
  const token = await inngest.realtime.token({
    channel: replicateVideoChannel,
    topics: ["status"],
  });
  return {
    channel: replicateVideoChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
