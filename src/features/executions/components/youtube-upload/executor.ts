import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import { youtubeUploadChannel } from "@/inngest/channels/youtube-upload";
import { google } from "googleapis";
import { Readable } from "node:stream";
import ky from "ky";
Handlebars.registerHelper("json", (context) =>
  JSON.stringify(context, null, 2),
);

type YoutubeUploadData = {
  variableName?: string;
  credentialId?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
  privacyStatus?: "private" | "unlisted" | "public";
  tagsCsv?: string;
  categoryId?: string;
  madeForKids?: "true" | "false";
};

type YoutubeCredentialValue = {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiryDate?: number | null;
  channelId?: string | null;
  channelTitle?: string | null;
};

const parseCredentialPayload = (value: string): YoutubeCredentialValue => {
  try {
    return JSON.parse(value) as YoutubeCredentialValue;
  } catch {
    throw new NonRetriableError(
      "YouTube node: Credential payload is invalid. Reconnect YouTube account.",
    );
  }
};

export const youtubeUploadExecutor: NodeExecutor<YoutubeUploadData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    youtubeUploadChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("YouTube node: Variable Name is missing!");
  }
  if (!data.credentialId) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("YouTube node: Credential is required!");
  }
  if (!data.videoUrl) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("YouTube node: Video URL is required!");
  }
  if (!data.title) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("YouTube node: Title is required!");
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "YouTube node: Missing OAuth env vars (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_OAUTH_REDIRECT_URI)",
    );
  }

  const resolvedVideoUrl = Handlebars.compile(data.videoUrl, {
    noEscape: true,
  })(context);
  const resolvedTitle = Handlebars.compile(data.title)(context);
  const resolvedDescription = data.description
    ? Handlebars.compile(data.description)(context)
    : "";
  const resolvedTagsCsv = data.tagsCsv
    ? Handlebars.compile(data.tagsCsv)(context)
    : "";

  const tags = resolvedTagsCsv
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const credential = await step.run("youtube-get-credential", () => {
    return prisma.credential.findUnique({
      where: { id: data.credentialId },
    });
  });

  if (!credential) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("YouTube node: Credential not found");
  }

  const tokens = parseCredentialPayload(credential.value);
  if (!tokens.refreshToken) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "YouTube node: Missing refresh token. Reconnect YouTube account.",
    );
  }

  const download = await ky(resolvedVideoUrl, { throwHttpErrors: false });

  if (!download.ok || !download.body) {
    await publish(youtubeUploadChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      `YouTube node: Cannot fetch video from URL (${download.status})`,
    );
  }

  const mimeType = download.headers.get("content-type") || "video/mp4";

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
    oauth2Client.setCredentials({
      refresh_token: tokens.refreshToken || undefined,
      access_token: tokens.accessToken || undefined,
      expiry_date: tokens.expiryDate || undefined,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const mediaBody = Readable.fromWeb(download.body as any);

    const upload = await step.run("youtube-upload-video", async () => {
      return youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: resolvedTitle,
            description: resolvedDescription || undefined,
            tags: tags.length ? tags : undefined,
            categoryId: data.categoryId || "22",
          },
          status: {
            privacyStatus: (data.privacyStatus || "private") as
              | "private"
              | "public"
              | "unlisted",
            selfDeclaredMadeForKids: data.madeForKids === "true",
          },
        },
        media: {
          mimeType,
          body: mediaBody,
        },
      });
    });

    const videoId = upload.data.id;
    if (!videoId) {
      throw new NonRetriableError(
        "YouTube node: Upload finished but no video id",
      );
    }

    await publish(
      youtubeUploadChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      [data.variableName]: {
        videoId,
        url: `https://youtu.be/${videoId}`,
        privacyStatus: data.privacyStatus || "private",
        raw: upload.data,
      },
    };
  } catch (error) {
    await publish(
      youtubeUploadChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
