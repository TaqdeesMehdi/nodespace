"use server";
import { type Realtime } from "inngest";
import { inngest } from "@/inngest/client";
import { youtubeUploadChannel } from "@/inngest/channels/youtube-upload";

export type YoutubeUploadToken = Realtime.Subscribe.Token<string, ["status"]>;

export async function fetchYoutubeUploadRealtimeToken(): Promise<YoutubeUploadToken> {
  const token = await inngest.realtime.token({
    channel: youtubeUploadChannel,
    topics: ["status"],
  });
  return {
    channel: youtubeUploadChannel.name,
    topics: ["status"],
    key: token.key,
    apiBaseUrl: token.apiBaseUrl,
  };
}
