"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { httpRequestChannel } from "@/inngest/channels/http-request";

export type HttpRequestToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchHttpRequestRealtimeToken(): Promise<HttpRequestToken> {
  const token = await inngest.realtime.token({
    channel: httpRequestChannel,
    topics: ["status"],
  });
  return {
    channel: httpRequestChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
