"use server";
import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { youtubeUploadChannel } from "@/inngest/channels/youtube-upload";

export type YoutubeUploadToken = Realtime.Token<
  typeof youtubeUploadChannel,
  ["status"]
>;

export async function fetchYoutubeUploadRealtimeToken(): Promise<YoutubeUploadToken> {
  return getSubscriptionToken(inngest, {
    channel: youtubeUploadChannel(),
    topics: ["status"],
  });
}
