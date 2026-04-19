"use server";
import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { replicateVideoChannel } from "@/inngest/channels/replicate-video";

export type ReplicateVideoToken = Realtime.Token<
  typeof replicateVideoChannel,
  ["status"]
>;

export async function fetchReplicateVideoRealtimeToken(): Promise<ReplicateVideoToken> {
  return getSubscriptionToken(inngest, {
    channel: replicateVideoChannel(),
    topics: ["status"],
  });
}
