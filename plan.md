# Plan: Full File-By-File Implementation

This version includes exact code for every new file mentioned.

## 0) Install + migrate

```bash
npm i elevenlabs fluent-ffmpeg ffmpeg-static ffprobe-static
npx prisma migrate dev --name add_voice_lipsync_ffmpeg_nodes
```

## 1) Update Prisma enums

### File: `prisma/schema.prisma`

Replace your enums with this exact content:

```prisma
enum CredentialType{
  OPENAI
  ANTHROPIC
  GEMINI
  REPLICATE
  YOUTUBE
  ELEVENLABS
  LIPSYNC
}

enum NodeType{
  INITIAL
  MANUAL_TRIGGER
  HTTP_REQUEST
  GOOGLE_FORM_TRIGGER
  STRIPE_TRIGGER
  ANTHROPIC
  GEMINI
  OPENAI
  DISCORD
  SLACK
  REPLICATE_VIDEO
  YOUTUBE_UPLOAD
  ELEVENLABS_TTS
  LIPSYNC_VIDEO
  FFMPEG_AUDIO_MIX
}
```

## 2) Environment variables

### File: `.env.local`

```bash
ELEVENLABS_API_KEY=""
LIPSYNC_REPLICATE_MODEL="cjwbw/wav2lip"
```

## 3) New shared helper files (full content)

### File: `src/features/executions/lib/media/ffmpeg.ts`

```ts
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobe.path) {
  ffmpeg.setFfprobePath(ffprobe.path);
}

export { ffmpeg };
```

### File: `src/features/executions/lib/media/download.ts`

```ts
import { promises as fs } from "node:fs";

export async function downloadToFile(url: string, outputPath: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed download: ${response.status} ${response.statusText}`);
  }
  const arr = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(arr));
}
```

### File: `src/features/executions/lib/media/upload.ts`

```ts
// Replace this with S3/Supabase/Cloudinary implementation in production.
export async function uploadFileAndGetPublicUrl(localPath: string) {
  return `file://${localPath}`;
}
```

## 4) New channels (full content)

### File: `src/inngest/channels/elevenlabs-tts.ts`

```ts
import { channel, topic } from "@inngest/realtime";

export const ELEVENLABS_TTS_CHANNEL_NAME = "elevenlabs-tts-execution";

export const elevenlabsTtsChannel = channel(ELEVENLABS_TTS_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
```

### File: `src/inngest/channels/lipsync-video.ts`

```ts
import { channel, topic } from "@inngest/realtime";

export const LIPSYNC_VIDEO_CHANNEL_NAME = "lipsync-video-execution";

export const lipsyncVideoChannel = channel(LIPSYNC_VIDEO_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
```

### File: `src/inngest/channels/ffmpeg-audio-mix.ts`

```ts
import { channel, topic } from "@inngest/realtime";

export const FFMPEG_AUDIO_MIX_CHANNEL_NAME = "ffmpeg-audio-mix-execution";

export const ffmpegAudioMixChannel = channel(FFMPEG_AUDIO_MIX_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
```

## 5) ElevenLabs TTS node files (full content)

### File: `src/features/executions/components/elevenlabs-tts/actions.ts`

```ts
"use server";

import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { elevenlabsTtsChannel } from "@/inngest/channels/elevenlabs-tts";

export type ElevenLabsTtsToken = Realtime.Token<typeof elevenlabsTtsChannel, ["status"]>;

export async function fetchElevenLabsTtsRealtimeToken(): Promise<ElevenLabsTtsToken> {
  return getSubscriptionToken(inngest, {
    channel: elevenlabsTtsChannel(),
    topics: ["status"],
  });
}
```

### File: `src/features/executions/components/elevenlabs-tts/dialog.tsx`

```tsx
"use client";

import z from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCredentialByTypes } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma";

const formSchema = z.object({
  variableName: z.string().min(1),
  credentialId: z.string().min(1),
  text: z.string().min(1),
  voiceId: z.string().min(1),
  modelId: z.string().optional(),
});

export type ElevenLabsTtsFormValues = z.infer<typeof formSchema>;

export function ElevenLabsTtsDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ElevenLabsTtsFormValues) => void;
  defaultValues?: Partial<ElevenLabsTtsFormValues>;
}) {
  const { data: credentials, isLoading } = useCredentialByTypes(CredentialType.ELEVENLABS);

  const form = useForm<ElevenLabsTtsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "Narration",
      credentialId: defaultValues.credentialId || "",
      text: defaultValues.text || "",
      voiceId: defaultValues.voiceId || "",
      modelId: defaultValues.modelId || "eleven_multilingual_v2",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "Narration",
        credentialId: defaultValues.credentialId || "",
        text: defaultValues.text || "",
        voiceId: defaultValues.voiceId || "",
        modelId: defaultValues.modelId || "eleven_multilingual_v2",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>ElevenLabs TTS</DialogTitle>
          <DialogDescription>Generate speech audio from text.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values);
              onOpenChange(false);
            })}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormDescription>{`Use later as {{${field.value || "Narration"}.audioUrl}}`}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ElevenLabs Credential</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !credentials?.length}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select credential" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <Image src="/elevenlabs.svg" alt="elevenlabs" width={16} height={16} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice ID</FormLabel>
                  <FormControl><Input placeholder="21m00Tcm4TlvDq8ikWAM" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model ID</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text</FormLabel>
                  <FormControl><Textarea className="min-h-24 font-mono text-sm" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### File: `src/features/executions/components/elevenlabs-tts/node.tsx`

```tsx
"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { ElevenLabsTtsDialog, ElevenLabsTtsFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchElevenLabsTtsRealtimeToken } from "./actions";
import { ELEVENLABS_TTS_CHANNEL_NAME } from "@/inngest/channels/elevenlabs-tts";

type ElevenLabsNodeData = Partial<ElevenLabsTtsFormValues>;
type ElevenLabsNodeType = Node<ElevenLabsNodeData>;

export const ElevenLabsTtsNode = memo((props: NodeProps<ElevenLabsNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: ELEVENLABS_TTS_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchElevenLabsTtsRealtimeToken,
  });

  const handleSubmit = (values: ElevenLabsTtsFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const description = props.data?.text ? `tts: ${props.data.text.slice(0, 40)}...` : "Not Configured";

  return (
    <>
      <ElevenLabsTtsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/elevenlabs.svg"
        name="ElevenLabs TTS"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});
```

### File: `src/features/executions/components/elevenlabs-tts/executor.ts`

```ts
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import { ElevenLabsClient } from "elevenlabs";
import { elevenlabsTtsChannel } from "@/inngest/channels/elevenlabs-tts";

type ElevenLabsTtsData = {
  variableName?: string;
  credentialId?: string;
  text?: string;
  voiceId?: string;
  modelId?: string;
};

const streamToBuffer = async (stream: ReadableStream<Uint8Array>) => {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
};

export const elevenlabsTtsExecutor: NodeExecutor<ElevenLabsTtsData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(elevenlabsTtsChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName || !data.credentialId || !data.text || !data.voiceId) {
    await publish(elevenlabsTtsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("ElevenLabs node: required fields missing");
  }

  const credential = await step.run("elevenlabs-credential", () =>
    prisma.credential.findUnique({ where: { id: data.credentialId } }),
  );
  if (!credential) {
    await publish(elevenlabsTtsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("ElevenLabs node: credential not found");
  }

  const text = Handlebars.compile(data.text)(context);
  const audioBase64 = await step.run("elevenlabs-generate", async () => {
    const client = new ElevenLabsClient({ apiKey: credential.value });
    const stream = await client.textToSpeech.convert(data.voiceId!, {
      model_id: data.modelId || "eleven_multilingual_v2",
      text,
      output_format: "mp3_44100_128",
    });
    const audioBuffer = await streamToBuffer(stream as ReadableStream<Uint8Array>);
    return audioBuffer.toString("base64");
  });

  const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
  await publish(elevenlabsTtsChannel().status({ nodeId, status: "success" }));
  return {
    ...context,
    [data.variableName]: {
      audioUrl,
      mimeType: "audio/mpeg",
      text,
    },
  };
};
```

## 6) LipSync node files (full content)

### File: `src/features/executions/components/lipsync-video/actions.ts`

```ts
"use server";

import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { lipsyncVideoChannel } from "@/inngest/channels/lipsync-video";

export type LipSyncToken = Realtime.Token<typeof lipsyncVideoChannel, ["status"]>;

export async function fetchLipSyncRealtimeToken(): Promise<LipSyncToken> {
  return getSubscriptionToken(inngest, {
    channel: lipsyncVideoChannel(),
    topics: ["status"],
  });
}
```

### File: `src/features/executions/components/lipsync-video/dialog.tsx`

```tsx
"use client";

import z from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  variableName: z.string().min(1),
  credentialId: z.string().min(1),
  videoUrl: z.string().min(1),
  audioUrl: z.string().min(1),
  model: z.string().optional(),
});

export type LipSyncFormValues = z.infer<typeof formSchema>;

export function LipSyncDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LipSyncFormValues) => void;
  defaultValues?: Partial<LipSyncFormValues>;
}) {
  const form = useForm<LipSyncFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "LipSyncOut",
      credentialId: defaultValues.credentialId || "",
      videoUrl: defaultValues.videoUrl || "{{VideoGen.videoUrl}}",
      audioUrl: defaultValues.audioUrl || "{{Narration.audioUrl}}",
      model: defaultValues.model || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "LipSyncOut",
        credentialId: defaultValues.credentialId || "",
        videoUrl: defaultValues.videoUrl || "{{VideoGen.videoUrl}}",
        audioUrl: defaultValues.audioUrl || "{{Narration.audioUrl}}",
        model: defaultValues.model || "",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lip Sync</DialogTitle>
          <DialogDescription>Sync speech audio with character lips.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values);
              onOpenChange(false);
            })}
            className="space-y-4"
          >
            <FormField control={form.control} name="variableName" render={({ field }) => (
              <FormItem><FormLabel>Variable Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="credentialId" render={({ field }) => (
              <FormItem><FormLabel>LipSync Credential</FormLabel><FormControl><Input placeholder="select/create LIPSYNC credential id" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="videoUrl" render={({ field }) => (
              <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Example: {"{{VideoGen.videoUrl}}"}</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="audioUrl" render={({ field }) => (
              <FormItem><FormLabel>Speech Audio URL</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Example: {"{{Narration.audioUrl}}"}</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="model" render={({ field }) => (
              <FormItem><FormLabel>Model Override (Optional)</FormLabel><FormControl><Input placeholder="owner/model:version" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### File: `src/features/executions/components/lipsync-video/node.tsx`

```tsx
"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { LipSyncDialog, LipSyncFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchLipSyncRealtimeToken } from "./actions";
import { LIPSYNC_VIDEO_CHANNEL_NAME } from "@/inngest/channels/lipsync-video";

type LipSyncNodeData = Partial<LipSyncFormValues>;
type LipSyncNodeType = Node<LipSyncNodeData>;

export const LipSyncVideoNode = memo((props: NodeProps<LipSyncNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: LIPSYNC_VIDEO_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchLipSyncRealtimeToken,
  });

  const handleSubmit = (values: LipSyncFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  const description = props.data?.videoUrl ? "Lip sync configured" : "Not Configured";

  return (
    <>
      <LipSyncDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/lipsync.svg"
        name="Lip Sync Video"
        status={nodeStatus}
        description={description}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});
```

### File: `src/features/executions/components/lipsync-video/executor.ts`

```ts
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import Replicate from "replicate";
import { lipsyncVideoChannel } from "@/inngest/channels/lipsync-video";

type LipSyncData = {
  variableName?: string;
  credentialId?: string;
  videoUrl?: string;
  audioUrl?: string;
  model?: string;
};

const getUrl = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return getUrl(value[0]);
  if (value && typeof value === "object") {
    const maybe = value as Record<string, unknown>;
    if (typeof maybe.url === "string") return maybe.url;
  }
  return null;
};

export const lipsyncVideoExecutor: NodeExecutor<LipSyncData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(lipsyncVideoChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName || !data.credentialId || !data.videoUrl || !data.audioUrl) {
    await publish(lipsyncVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("LipSync node: required fields missing");
  }

  const credential = await step.run("lipsync-credential", () =>
    prisma.credential.findUnique({ where: { id: data.credentialId } }),
  );
  if (!credential) throw new NonRetriableError("LipSync node: credential not found");

  const face = Handlebars.compile(data.videoUrl)(context);
  const audio = Handlebars.compile(data.audioUrl)(context);
  const model = data.model || process.env.LIPSYNC_REPLICATE_MODEL;
  if (!model) throw new NonRetriableError("LipSync node: missing model");

  const result = await step.run("lipsync-run", async () => {
    const replicate = new Replicate({ auth: credential.value });
    return replicate.run(model as any, { input: { face, audio } });
  });

  const syncedVideoUrl = getUrl(result);
  if (!syncedVideoUrl) {
    await publish(lipsyncVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("LipSync node: could not extract output URL");
  }

  await publish(lipsyncVideoChannel().status({ nodeId, status: "success" }));
  return {
    ...context,
    [data.variableName]: { videoUrl: syncedVideoUrl, raw: result },
  };
};
```

## 7) FFmpeg mix node files (full content)

### File: `src/features/executions/components/ffmpeg-audio-mix/actions.ts`

```ts
"use server";

import { type Realtime, getSubscriptionToken } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { ffmpegAudioMixChannel } from "@/inngest/channels/ffmpeg-audio-mix";

export type FfmpegAudioMixToken = Realtime.Token<typeof ffmpegAudioMixChannel, ["status"]>;

export async function fetchFfmpegAudioMixRealtimeToken(): Promise<FfmpegAudioMixToken> {
  return getSubscriptionToken(inngest, {
    channel: ffmpegAudioMixChannel(),
    topics: ["status"],
  });
}
```

### File: `src/features/executions/components/ffmpeg-audio-mix/dialog.tsx`

```tsx
"use client";

import z from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  variableName: z.string().min(1),
  videoUrl: z.string().min(1),
  voiceAudioUrl: z.string().min(1),
  bgmAudioUrl: z.string().min(1),
  bgmVolume: z.string().optional(),
});

export type FfmpegAudioMixFormValues = z.infer<typeof formSchema>;

export function FfmpegAudioMixDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FfmpegAudioMixFormValues) => void;
  defaultValues?: Partial<FfmpegAudioMixFormValues>;
}) {
  const form = useForm<FfmpegAudioMixFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "FinalVideo",
      videoUrl: defaultValues.videoUrl || "{{LipSyncOut.videoUrl}}",
      voiceAudioUrl: defaultValues.voiceAudioUrl || "{{Narration.audioUrl}}",
      bgmAudioUrl: defaultValues.bgmAudioUrl || "",
      bgmVolume: defaultValues.bgmVolume || "0.22",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "FinalVideo",
        videoUrl: defaultValues.videoUrl || "{{LipSyncOut.videoUrl}}",
        voiceAudioUrl: defaultValues.voiceAudioUrl || "{{Narration.audioUrl}}",
        bgmAudioUrl: defaultValues.bgmAudioUrl || "",
        bgmVolume: defaultValues.bgmVolume || "0.22",
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>FFmpeg Audio Mix</DialogTitle>
          <DialogDescription>Mix speech + background music on the final video.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values);
              onOpenChange(false);
            })}
            className="space-y-4"
          >
            <FormField control={form.control} name="variableName" render={({ field }) => (
              <FormItem><FormLabel>Variable Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="videoUrl" render={({ field }) => (
              <FormItem><FormLabel>Video URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="voiceAudioUrl" render={({ field }) => (
              <FormItem><FormLabel>Voice Audio URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bgmAudioUrl" render={({ field }) => (
              <FormItem><FormLabel>BGM Audio URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bgmVolume" render={({ field }) => (
              <FormItem><FormLabel>BGM Volume</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Recommended range: 0.12 - 0.30</FormDescription><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="submit">Save</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### File: `src/features/executions/components/ffmpeg-audio-mix/node.tsx`

```tsx
"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { FfmpegAudioMixDialog, FfmpegAudioMixFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchFfmpegAudioMixRealtimeToken } from "./actions";
import { FFMPEG_AUDIO_MIX_CHANNEL_NAME } from "@/inngest/channels/ffmpeg-audio-mix";

type FfmpegMixNodeData = Partial<FfmpegAudioMixFormValues>;
type FfmpegMixNodeType = Node<FfmpegMixNodeData>;

export const FfmpegAudioMixNode = memo((props: NodeProps<FfmpegMixNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: FFMPEG_AUDIO_MIX_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchFfmpegAudioMixRealtimeToken,
  });

  const handleSubmit = (values: FfmpegAudioMixFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id ? { ...node, data: { ...node.data, ...values } } : node,
      ),
    );
  };

  return (
    <>
      <FfmpegAudioMixDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/ffmpeg.svg"
        name="FFmpeg Audio Mix"
        status={nodeStatus}
        description={props.data?.videoUrl ? "Audio mix configured" : "Not Configured"}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});
```

### File: `src/features/executions/components/ffmpeg-audio-mix/executor.ts`

```ts
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { ffmpeg } from "@/features/executions/lib/media/ffmpeg";
import { downloadToFile } from "@/features/executions/lib/media/download";
import { uploadFileAndGetPublicUrl } from "@/features/executions/lib/media/upload";
import { ffmpegAudioMixChannel } from "@/inngest/channels/ffmpeg-audio-mix";

type FfmpegMixData = {
  variableName?: string;
  videoUrl?: string;
  voiceAudioUrl?: string;
  bgmAudioUrl?: string;
  bgmVolume?: string;
};

export const ffmpegAudioMixExecutor: NodeExecutor<FfmpegMixData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  await publish(ffmpegAudioMixChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName || !data.videoUrl || !data.voiceAudioUrl || !data.bgmAudioUrl) {
    await publish(ffmpegAudioMixChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("FFmpeg node: required fields missing");
  }

  const videoUrl = Handlebars.compile(data.videoUrl)(context);
  const voiceUrl = Handlebars.compile(data.voiceAudioUrl)(context);
  const bgmUrl = Handlebars.compile(data.bgmAudioUrl)(context);
  const bgmVolume = Number(data.bgmVolume || "0.22");

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmix-"));
  const inVideo = path.join(dir, "video.mp4");
  const inVoice = path.join(dir, "voice.mp3");
  const inBgm = path.join(dir, "bgm.mp3");
  const outVideo = path.join(dir, "final.mp4");

  await downloadToFile(videoUrl, inVideo);
  await downloadToFile(voiceUrl, inVoice);
  await downloadToFile(bgmUrl, inBgm);

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inVideo)
      .input(inVoice)
      .input(inBgm)
      .complexFilter([
        `[2:a]volume=${bgmVolume},aloop=loop=-1:size=2e+09,asetpts=N/SR/TB[bgm]`,
        `[bgm][1:a]sidechaincompress=threshold=0.06:ratio=12:attack=20:release=300[bgmduck]`,
        `[1:a][bgmduck]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
      ])
      .outputOptions(["-map 0:v:0", "-map [aout]", "-c:v copy", "-c:a aac", "-shortest"])
      .save(outVideo)
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  const finalVideoUrl = await uploadFileAndGetPublicUrl(outVideo);
  await publish(ffmpegAudioMixChannel().status({ nodeId, status: "success" }));
  return {
    ...context,
    [data.variableName]: {
      videoUrl: finalVideoUrl,
      bgmVolume,
    },
  };
};
```

## 8) Existing files to edit (exact snippets)

### File: `src/features/executions/lib/executor-registry.ts`

Add imports:

```ts
import { elevenlabsTtsExecutor } from "../components/elevenlabs-tts/executor";
import { lipsyncVideoExecutor } from "../components/lipsync-video/executor";
import { ffmpegAudioMixExecutor } from "../components/ffmpeg-audio-mix/executor";
```

Add mappings:

```ts
[NodeType.ELEVENLABS_TTS]: elevenlabsTtsExecutor,
[NodeType.LIPSYNC_VIDEO]: lipsyncVideoExecutor,
[NodeType.FFMPEG_AUDIO_MIX]: ffmpegAudioMixExecutor,
```

### File: `src/config/node-components.ts`

Add imports:

```ts
import { ElevenLabsTtsNode } from "@/features/executions/components/elevenlabs-tts/node";
import { LipSyncVideoNode } from "@/features/executions/components/lipsync-video/node";
import { FfmpegAudioMixNode } from "@/features/executions/components/ffmpeg-audio-mix/node";
```

Add mappings:

```ts
[NodeType.ELEVENLABS_TTS]: ElevenLabsTtsNode,
[NodeType.LIPSYNC_VIDEO]: LipSyncVideoNode,
[NodeType.FFMPEG_AUDIO_MIX]: FfmpegAudioMixNode,
```

### File: `src/inngest/functions.ts`

Add imports:

```ts
import { elevenlabsTtsChannel } from "./channels/elevenlabs-tts";
import { lipsyncVideoChannel } from "./channels/lipsync-video";
import { ffmpegAudioMixChannel } from "./channels/ffmpeg-audio-mix";
```

Add to `channels: []`:

```ts
elevenlabsTtsChannel(),
lipsyncVideoChannel(),
ffmpegAudioMixChannel(),
```

### File: `src/components/node-selector.tsx`

Add into `executionNodes`:

```ts
{
  type: NodeType.ELEVENLABS_TTS,
  label: "ElevenLabs TTS",
  description: "Generate speech from text",
  icon: "/elevenlabs.svg",
},
{
  type: NodeType.LIPSYNC_VIDEO,
  label: "Lip Sync Video",
  description: "Sync generated voice with lips",
  icon: "/lipsync.svg",
},
{
  type: NodeType.FFMPEG_AUDIO_MIX,
  label: "FFmpeg Audio Mix",
  description: "Add BGM and mix with narration",
  icon: "/ffmpeg.svg",
},
```

### File: `src/features/credentials/components/credential.tsx`

Add to `credentialTypeOptions`:

```ts
{
  value: CredentialType.ELEVENLABS,
  label: "ElevenLabs",
  logo: "/elevenlabs.svg",
},
{
  value: CredentialType.LIPSYNC,
  label: "LipSync",
  logo: "/lipsync.svg",
},
```

### File: `src/features/credentials/components/credentials.tsx`

Add to `credentialLogos`:

```ts
[CredentialType.ELEVENLABS]: "/elevenlabs.svg",
[CredentialType.LIPSYNC]: "/lipsync.svg",
```

## 9) Workflow variable wiring

Use exactly these mappings in your node forms:

- ElevenLabs `text`: `{{OpenAI.text}}` (or your script node variable)
- LipSync `videoUrl`: `{{VideoGen.videoUrl}}`
- LipSync `audioUrl`: `{{Narration.audioUrl}}`
- FFmpeg `videoUrl`: `{{LipSyncOut.videoUrl}}`
- FFmpeg `voiceAudioUrl`: `{{Narration.audioUrl}}`
- FFmpeg `bgmAudioUrl`: your static/previous node URL

## 10) Final output contract

```json
{
  "VideoGen": { "videoUrl": "https://.../video.mp4" },
  "Narration": { "audioUrl": "https://.../voice.mp3" },
  "LipSyncOut": { "videoUrl": "https://.../lipsync.mp4" },
  "FinalVideo": { "videoUrl": "https://.../final.mp4" }
}
```
