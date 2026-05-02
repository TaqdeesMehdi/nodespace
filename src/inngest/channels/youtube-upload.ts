import { realtime, staticSchema } from "inngest";

export const YOUTUBE_UPLOAD_CHANNEL_NAME = "youtube-upload-execution";

export const youtubeUploadChannel = realtime.channel({
  name: YOUTUBE_UPLOAD_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
