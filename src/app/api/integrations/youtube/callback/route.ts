import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { CredentialType } from "@/generated/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

type YoutubeTokenPayload = {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiryDate?: number | null;
  channelId?: string | null;
  channelTitle?: string | null;
};

const safeParse = (value?: string | null): YoutubeTokenPayload | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as YoutubeTokenPayload;
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Missing YouTube OAuth env vars" },
      { status: 500 },
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const me = await youtube.channels.list({
    part: ["id", "snippet"],
    mine: true,
  });

  const channel = me.data.items?.[0];
  const channelId = channel?.id ?? null;
  const channelTitle = channel?.snippet?.title ?? "YouTube Channel";

  const existing = await prisma.credential.findFirst({
    where: {
      userId: session.user.id,
      type: CredentialType.YOUTUBE,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const existingPayload = safeParse(existing?.value);
  const refreshToken =
    tokens.refresh_token ?? existingPayload?.refreshToken ?? null;
  if (!refreshToken) {
    return NextResponse.json(
      {
        error:
          "No refresh token returned by Google. Revoke app access and connect again with consent.",
      },
      { status: 400 },
    );
  }

  const payload: YoutubeTokenPayload = {
    accessToken: tokens.access_token ?? existingPayload?.accessToken ?? null,
    refreshToken,
    expiryDate: tokens.expiry_date ?? existingPayload?.expiryDate ?? null,
    channelId: channelId ?? existingPayload?.channelId ?? null,
    channelTitle: channelTitle ?? existingPayload?.channelTitle ?? null,
  };

  if (existing) {
    await prisma.credential.update({
      where: { id: existing.id },
      data: {
        name: `YouTube: ${channelTitle}`,
        value: JSON.stringify(payload),
      },
    });
  } else {
    await prisma.credential.create({
      data: {
        name: `YouTube: ${channelTitle}`,
        type: CredentialType.YOUTUBE,
        value: JSON.stringify(payload),
        userId: session.user.id,
      },
    });
  }

  const redirectUrl = new URL("/credentials", request.url);
  redirectUrl.searchParams.set("connected", "youtube");
  return NextResponse.redirect(redirectUrl);
}
