"use server";
import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { httpRequestChannel } from "@/inngest/channels/http-request";

export type HttpRequestToken = Realtime.Token<
  typeof httpRequestChannel,
  ["status"]
>;

export async function fetchHttpRequestRealtimeToken(): Promise<HttpRequestToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: httpRequestChannel(),
    topics: ["status"],
  });
  return token;
}
