# Plan: Replicate Video + YouTube Upload (Code-Accurate, File-by-File)

This plan is written as copy-paste snippets with exact file targets and insertion points.

## 0) Commands to run first

```bash
npm i replicate googleapis
npx prisma migrate dev --name replicate_youtube_nodes
```

After migration, Prisma will regenerate `src/generated/prisma/*`.

## 1) Prisma enums

### File: `prisma/schema.prisma`

Replace enum blocks with this exact content:

```prisma
enum CredentialType{
  OPENAI
  ANTHROPIC
  GEMINI
  REPLICATE
  YOUTUBE
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
  REPLICATE_VIDEO
  YOUTUBE_UPLOAD
}
```

## 2) Environment variables

### File: `.env.local` (or your active env file)

Add:

```bash
YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/integrations/youtube/callback"
REPLICATE_API_TOKEN=""
```

Notes:

- Replicate token can be per-user credential, so `REPLICATE_API_TOKEN` is optional.
- YouTube OAuth env vars are required.

## 3) Credentials UI updates

### File: `src/features/credentials/components/credential.tsx`

In `credentialTypeOptions`, add these two entries:

```ts
{
  value: CredentialType.REPLICATE,
  label: "Replicate",
  logo: "/replicate.svg",
},
{
  value: CredentialType.YOUTUBE,
  label: "YouTube",
  logo: "/youtube.svg",
},
```

### File: `src/features/credentials/components/credentials.tsx`

Replace `credentialLogos` with:

```ts
const credentialLogos: Record<CredentialType, string> = {
  [CredentialType.OPENAI]: "/openai.svg",
  [CredentialType.ANTHROPIC]: "/anthropic.svg",
  [CredentialType.GEMINI]: "/gemini.svg",
  [CredentialType.REPLICATE]: "/replicate.svg",
  [CredentialType.YOUTUBE]: "/youtube.svg",
};
```

## 4) New realtime channels

### File: `src/inngest/channels/replicate-video.ts` (new)

```ts
import { channel, topic } from "@inngest/realtime";

export const REPLICATE_VIDEO_CHANNEL_NAME = "replicate-video-execution";

export const replicateVideoChannel = channel(
  REPLICATE_VIDEO_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
```

### File: `src/inngest/channels/youtube-upload.ts` (new)

```ts
import { channel, topic } from "@inngest/realtime";

export const YOUTUBE_UPLOAD_CHANNEL_NAME = "youtube-upload-execution";

export const youtubeUploadChannel = channel(
  YOUTUBE_UPLOAD_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
```

## 5) Inngest workflow wiring

### File: `src/inngest/functions.ts`

Add imports:

```ts
import { replicateVideoChannel } from "./channels/replicate-video";
import { youtubeUploadChannel } from "./channels/youtube-upload";
```

In `channels: []`, append:

```ts
replicateVideoChannel(),
youtubeUploadChannel(),
```

## 6) Replicate node files

### File: `src/features/executions/components/replicate-video/actions.ts` (new)

```ts
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
```

### File: `src/features/executions/components/replicate-video/dialog.tsx` (new)

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCredentialByTypes } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma";
import Image from "next/image";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Credential is required"),
  model: z.string().min(1, "Model is required"),
  prompt: z.string().min(1, "Prompt is required"),
  negativePrompt: z.string().optional(),
  aspectRatio: z.string().optional(),
  duration: z.string().optional(),
  fps: z.string().optional(),
  seed: z.string().optional(),
});

export type ReplicateVideoFormValues = z.infer<typeof formSchema>;

interface ReplicateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReplicateVideoFormValues) => void;
  defaultValues?: Partial<ReplicateVideoFormValues>;
}

export const ReplicateVideoDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: ReplicateVideoDialogProps) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialByTypes(CredentialType.REPLICATE);

  const form = useForm<ReplicateVideoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      model: defaultValues.model || "kwaivgi/kling-v1.6-standard",
      prompt: defaultValues.prompt || "",
      negativePrompt: defaultValues.negativePrompt || "",
      aspectRatio: defaultValues.aspectRatio || "16:9",
      duration: defaultValues.duration || "5",
      fps: defaultValues.fps || "24",
      seed: defaultValues.seed || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        model: defaultValues.model || "kwaivgi/kling-v1.6-standard",
        prompt: defaultValues.prompt || "",
        negativePrompt: defaultValues.negativePrompt || "",
        aspectRatio: defaultValues.aspectRatio || "16:9",
        duration: defaultValues.duration || "5",
        fps: defaultValues.fps || "24",
        seed: defaultValues.seed || "",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "VideoGen";

  const handleSubmit = (values: ReplicateVideoFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>Replicate Video Configuration</DialogTitle>
          <DialogDescription>
            Generate a video from a prompt and store output in workflow context.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="VideoGen" {...field} />
                  </FormControl>
                  <FormDescription>
                    Downstream references: {`{{${watchVariableName}.videoUrl}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Replicate Credential</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingCredentials || !credentials?.length}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a credential" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/replicate.svg"
                              alt="Replicate"
                              width={16}
                              height={16}
                            />
                            {credential.name}
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="kwaivgi/kling-v1.6-standard"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Replicate model slug (optionally with version suffix).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cinematic shot of a neon city at night, {{OpenAI_Script.text}}"
                      className="min-h-24 font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports template variables like {"{{OpenAI_Script.text}}"}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="negativePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Negative Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aspectRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aspect Ratio</FormLabel>
                    <FormControl>
                      <Input placeholder="16:9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration Seconds</FormLabel>
                    <FormControl>
                      <Input placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FPS</FormLabel>
                    <FormControl>
                      <Input placeholder="24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

### File: `src/features/executions/components/replicate-video/node.tsx` (new)

```tsx
"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { ReplicateVideoDialog, ReplicateVideoFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchReplicateVideoRealtimeToken } from "./actions";
import { REPLICATE_VIDEO_CHANNEL_NAME } from "@/inngest/channels/replicate-video";

type ReplicateVideoNodeData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  duration?: string;
  fps?: string;
  seed?: string;
};

type ReplicateVideoNodeType = Node<ReplicateVideoNodeData>;

export const ReplicateVideoNode = memo(
  (props: NodeProps<ReplicateVideoNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: REPLICATE_VIDEO_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchReplicateVideoRealtimeToken,
    });

    const handleSubmit = (values: ReplicateVideoFormValues) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === props.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...values,
              },
            };
          }
          return node;
        }),
      );
    };

    const nodeData = props.data;
    const description = nodeData?.prompt
      ? `replicate: ${nodeData.prompt.slice(0, 50)}...`
      : "Not Configured";

    return (
      <>
        <ReplicateVideoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />

        <BaseExecutionNode
          {...props}
          id={props.id}
          icon="/replicate.svg"
          name="Replicate Video"
          status={nodeStatus}
          description={description}
          onSettings={() => setDialogOpen(true)}
          onDoubleClick={() => setDialogOpen(true)}
        />
      </>
    );
  },
);

ReplicateVideoNode.displayName = "ReplicateVideoNode";
```

### File: `src/features/executions/components/replicate-video/executor.ts` (new)

```ts
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import Replicate from "replicate";
import prisma from "@/lib/db";
import { replicateVideoChannel } from "@/inngest/channels/replicate-video";

Handlebars.registerHelper("json", (context) =>
  JSON.stringify(context, null, 2),
);

type ReplicateVideoData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  prompt?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  duration?: string;
  fps?: string;
  seed?: string;
};

const toInt = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const readOutputUrl = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof URL) {
    return value.toString();
  }
  if (Array.isArray(value) && value.length > 0) {
    return readOutputUrl(value[0]);
  }
  if (value && typeof value === "object") {
    const fn = (value as { url?: unknown }).url;
    if (typeof fn === "function") {
      return (fn as () => string)();
    }
    if (typeof fn === "string") {
      return fn;
    }
  }
  return null;
};

export const replicateVideoExecutor: NodeExecutor<ReplicateVideoData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    replicateVideoChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: Variable Name is missing!");
  }

  if (!data.credentialId) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: Credential is required!");
  }

  if (!data.model) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: Model is required!");
  }

  if (!data.prompt) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: Prompt is required!");
  }

  const credential = await step.run("replicate-get-credential", () => {
    return prisma.credential.findUnique({
      where: { id: data.credentialId },
    });
  });

  if (!credential) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: Credential not found");
  }

  const resolvedPrompt = Handlebars.compile(data.prompt)(context);
  const resolvedNegativePrompt = data.negativePrompt
    ? Handlebars.compile(data.negativePrompt)(context)
    : undefined;

  const input: Record<string, unknown> = {
    prompt: resolvedPrompt,
  };

  if (resolvedNegativePrompt) {
    input.negative_prompt = resolvedNegativePrompt;
  }
  if (data.aspectRatio) {
    input.aspect_ratio = data.aspectRatio;
  }
  if (data.duration) {
    input.duration = toInt(data.duration);
  }
  if (data.fps) {
    input.fps = toInt(data.fps);
  }
  if (data.seed) {
    input.seed = toInt(data.seed);
  }

  try {
    const output = await step.run("replicate-video-run", async () => {
      const replicate = new Replicate({ auth: credential.value });
      return replicate.run(data.model as any, { input } as any);
    });

    const videoUrl = readOutputUrl(output);
    if (!videoUrl) {
      throw new NonRetriableError(
        "Replicate node: Model completed but no video URL was returned.",
      );
    }

    await publish(
      replicateVideoChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      [data.variableName]: {
        videoUrl,
        status: "succeeded",
        raw: output,
      },
    };
  } catch (error) {
    await publish(
      replicateVideoChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
```

## 7) YouTube node files

### File: `src/features/executions/components/youtube-upload/actions.ts` (new)

```ts
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
```

### File: `src/features/executions/components/youtube-upload/dialog.tsx` (new)

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useCredentialByTypes } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma";
import Image from "next/image";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Credential is required"),
  videoUrl: z.string().min(1, "Video URL is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  privacyStatus: z.enum(["private", "unlisted", "public"]).default("private"),
  tagsCsv: z.string().optional(),
  categoryId: z.string().optional(),
  madeForKids: z.enum(["false", "true"]).default("false"),
});

export type YoutubeUploadFormValues = z.infer<typeof formSchema>;

interface YoutubeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: YoutubeUploadFormValues) => void;
  defaultValues?: Partial<YoutubeUploadFormValues>;
}

export const YoutubeUploadDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: YoutubeUploadDialogProps) => {
  const { data: credentials, isLoading: isLoadingCredentials } =
    useCredentialByTypes(CredentialType.YOUTUBE);

  const form = useForm<YoutubeUploadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      videoUrl: defaultValues.videoUrl || "",
      title: defaultValues.title || "",
      description: defaultValues.description || "",
      privacyStatus: defaultValues.privacyStatus || "private",
      tagsCsv: defaultValues.tagsCsv || "",
      categoryId: defaultValues.categoryId || "22",
      madeForKids: defaultValues.madeForKids || "false",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        videoUrl: defaultValues.videoUrl || "",
        title: defaultValues.title || "",
        description: defaultValues.description || "",
        privacyStatus: defaultValues.privacyStatus || "private",
        tagsCsv: defaultValues.tagsCsv || "",
        categoryId: defaultValues.categoryId || "22",
        madeForKids: defaultValues.madeForKids || "false",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "YouTubeResult";

  const handleSubmit = (values: YoutubeUploadFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>YouTube Upload Configuration</DialogTitle>
          <DialogDescription>
            Upload a video URL to your connected YouTube channel.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="YouTubeResult" {...field} />
                  </FormControl>
                  <FormDescription>
                    Downstream references: {`{{${watchVariableName}.url}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Credential</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingCredentials || !credentials?.length}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a credential" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {credentials?.map((credential) => (
                        <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src="/youtube.svg"
                              alt="YouTube"
                              width={16}
                              height={16}
                            />
                            {credential.name}
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
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl>
                    <Input placeholder="{{VideoGen.videoUrl}}" {...field} />
                  </FormControl>
                  <FormDescription>
                    Usually mapped from Replicate output:{" "}
                    {"{{VideoGen.videoUrl}}"}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="AI Short - {{OpenAI_Script.text}}"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24 font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="privacyStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">private</SelectItem>
                        <SelectItem value="unlisted">unlisted</SelectItem>
                        <SelectItem value="public">public</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="madeForKids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Made For Kids</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">false</SelectItem>
                        <SelectItem value="true">true</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tagsCsv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags CSV (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="ai,video,shorts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category ID</FormLabel>
                    <FormControl>
                      <Input placeholder="22" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

### File: `src/features/executions/components/youtube-upload/node.tsx` (new)

```tsx
"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { YoutubeUploadDialog, YoutubeUploadFormValues } from "./dialog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { fetchYoutubeUploadRealtimeToken } from "./actions";
import { YOUTUBE_UPLOAD_CHANNEL_NAME } from "@/inngest/channels/youtube-upload";

type YoutubeUploadNodeData = {
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

type YoutubeUploadNodeType = Node<YoutubeUploadNodeData>;

export const YoutubeUploadNode = memo(
  (props: NodeProps<YoutubeUploadNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: YOUTUBE_UPLOAD_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchYoutubeUploadRealtimeToken,
    });

    const handleSubmit = (values: YoutubeUploadFormValues) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === props.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...values,
              },
            };
          }
          return node;
        }),
      );
    };

    const nodeData = props.data;
    const description = nodeData?.title
      ? `youtube: ${nodeData.title.slice(0, 50)}...`
      : "Not Configured";

    return (
      <>
        <YoutubeUploadDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />

        <BaseExecutionNode
          {...props}
          id={props.id}
          icon="/youtube.svg"
          name="YouTube Upload"
          status={nodeStatus}
          description={description}
          onSettings={() => setDialogOpen(true)}
          onDoubleClick={() => setDialogOpen(true)}
        />
      </>
    );
  },
);

YoutubeUploadNode.displayName = "YoutubeUploadNode";
```

### File: `src/features/executions/components/youtube-upload/executor.ts` (new)

```ts
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import { youtubeUploadChannel } from "@/inngest/channels/youtube-upload";
import { google } from "googleapis";
import { Readable } from "node:stream";

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

  const download = await step.run("youtube-download-video", async () => {
    return fetch(resolvedVideoUrl);
  });

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
    const mediaBody = Readable.fromWeb(
      download.body as unknown as globalThis.ReadableStream<Uint8Array>,
    );

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
```

## 8) Register both new nodes in existing wiring files

### File: `src/config/node-components.ts`

Add imports:

```ts
import { ReplicateVideoNode } from "@/features/executions/components/replicate-video/node";
import { YoutubeUploadNode } from "@/features/executions/components/youtube-upload/node";
```

In `nodeComponents`, add:

```ts
[NodeType.REPLICATE_VIDEO]: ReplicateVideoNode,
[NodeType.YOUTUBE_UPLOAD]: YoutubeUploadNode,
```

### File: `src/components/node-selector.tsx`

Inside `executionNodes`, append:

```ts
{
  type: NodeType.REPLICATE_VIDEO,
  label: "Replicate Video",
  description: "Generate AI video from a prompt",
  icon: "/replicate.svg",
},
{
  type: NodeType.YOUTUBE_UPLOAD,
  label: "YouTube Upload",
  description: "Upload a generated video to YouTube",
  icon: "/youtube.svg",
},
```

### File: `src/features/executions/lib/executor-registry.ts`

Add imports:

```ts
import { replicateVideoExecutor } from "../components/replicate-video/executor";
import { youtubeUploadExecutor } from "../components/youtube-upload/executor";
```

In `executorRegistry`, add:

```ts
[NodeType.REPLICATE_VIDEO]: replicateVideoExecutor,
[NodeType.YOUTUBE_UPLOAD]: youtubeUploadExecutor,
```

## 9) YouTube OAuth routes (credential bootstrap)

### File: `src/app/api/integrations/youtube/connect/route.ts` (new)

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
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

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });

  return NextResponse.redirect(url);
}
```

### File: `src/app/api/integrations/youtube/callback/route.ts` (new)

```ts
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
```

## 10) SVG assets

### File: `public/replicate.svg` (new)

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="6" fill="#111111"/>
  <path d="M7 17V7H12.2C14.9 7 16.5 8.4 16.5 10.8C16.5 12.7 15.5 13.9 13.8 14.3L16.7 17H14.3L11.8 14.6H9.2V17H7ZM9.2 12.8H12.1C13.5 12.8 14.2 12.1 14.2 10.9C14.2 9.7 13.5 9 12.1 9H9.2V12.8Z" fill="white"/>
</svg>
```

### File: `public/youtube.svg` (new)

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="6" fill="#FF0000"/>
  <path d="M16.8 8.7C16.6 8.1 16.2 7.7 15.6 7.5C14.5 7.2 12 7.2 12 7.2C12 7.2 9.5 7.2 8.4 7.5C7.8 7.7 7.4 8.1 7.2 8.7C6.9 9.8 6.9 12 6.9 12C6.9 12 6.9 14.2 7.2 15.3C7.4 15.9 7.8 16.3 8.4 16.5C9.5 16.8 12 16.8 12 16.8C12 16.8 14.5 16.8 15.6 16.5C16.2 16.3 16.6 15.9 16.8 15.3C17.1 14.2 17.1 12 17.1 12C17.1 12 17.1 9.8 16.8 8.7Z" fill="white"/>
  <path d="M10.9 14.3L14.4 12L10.9 9.7V14.3Z" fill="#FF0000"/>
</svg>
```

## 11) Final wiring checks

### File: `src/inngest/functions.ts`

Verify channel imports and channel array include both new channels.

### File: `src/features/executions/lib/executor-registry.ts`

Verify both node types map to the new executors.

### File: `src/config/node-components.ts`

Verify both node types map to node UI components.

### File: `src/components/node-selector.tsx`

Verify both node options show in execution node list.

## 12) Example workflow data contract

Replicate node output:

```json
{
  "VideoGen": {
    "videoUrl": "https://replicate.delivery/.../video.mp4",
    "status": "succeeded",
    "raw": {}
  }
}
```

YouTube node input in UI:

- `videoUrl`: `{{VideoGen.videoUrl}}`
- `title`: `AI Short - {{OpenAI_Script.text}}`
- `variableName`: `YouTubeResult`

YouTube node output:

```json
{
  "YouTubeResult": {
    "videoId": "abc123",
    "url": "https://youtu.be/abc123",
    "privacyStatus": "private",
    "raw": {}
  }
}
```

## 13) Manual verification checklist

1. Create a `REPLICATE` credential with a valid token.
2. Open `/api/integrations/youtube/connect` while logged in and complete consent.
3. Confirm a `YOUTUBE` credential appears in Credentials list.
4. In editor, add `Replicate Video` and `YouTube Upload` nodes.
5. Configure Replicate prompt using upstream context (example `{{OpenAI_Script.text}}`).
6. Configure YouTube node video URL as `{{VideoGen.videoUrl}}`.
7. Execute workflow and verify status transitions (`loading` -> `success`).
8. Confirm uploaded video URL appears in final context output.
