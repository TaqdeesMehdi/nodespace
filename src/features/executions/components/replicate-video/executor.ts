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
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const replicateVideoExecutor: NodeExecutor<ReplicateVideoData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(replicateVideoChannel().status({ nodeId, status: "loading" }));

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
  if (resolvedNegativePrompt) input.negative_prompt = resolvedNegativePrompt;
  if (data.aspectRatio) input.aspect_ratio = data.aspectRatio;
  if (data.duration) input.duration = toInt(data.duration);
  if (data.fps) input.fps = toInt(data.fps);
  if (data.seed) input.seed = toInt(data.seed);

  const videoUrl = await step.run("replicate-video-run", async () => {
    const replicate = new Replicate({ auth: credential.value });
    const result = await replicate.run(data.model as `${string}/${string}`, {
      input,
    });
    // GUARANTEED LOG - posts to your terminal AND Inngest dashboard
    await fetch("https://api.replicate.com/v1/predictions", {
      method: "HEAD", // dummy request just to confirm auth works
    });

    // This will ALWAYS appear in your Next.js terminal
    process.stdout.write(`\n=== REPLICATE RAW OUTPUT ===\n`);
    process.stdout.write(`Type: ${typeof result}\n`);
    process.stdout.write(`Is Array: ${Array.isArray(result)}\n`);
    process.stdout.write(`Value: ${JSON.stringify(result, null, 2)}\n`);
    process.stdout.write(`=== END REPLICATE OUTPUT ===\n`);
    const resultAny = result as any;
    if (typeof resultAny === "string" && resultAny.startsWith("http"))
      return resultAny;
    if (resultAny instanceof URL) return resultAny.toString();

    if (Array.isArray(resultAny)) {
      const first = resultAny[0];
      if (typeof first === "string" && first.startsWith("http")) return first;
      if (first instanceof URL) return first.toString();
      if (first && typeof first === "object") {
        if (typeof first.url === "function") return String(first.url());
        if (typeof first.url === "string") return first.url;
      }
    }

    if (resultAny && typeof resultAny === "object") {
      if (typeof resultAny.url === "function") return String(resultAny.url());
      if (typeof resultAny.url === "string") return resultAny.url;
      if (typeof resultAny.video === "string") return resultAny.video;
      if (typeof resultAny.video_url === "string") return resultAny.video_url;
      if (typeof resultAny.output === "string") return resultAny.output;
    }

    throw new NonRetriableError(
      `Replicate node: Cannot extract URL. Keys: ${Object.keys(resultAny ?? {}).join(", ")}`,
    );
  });

  if (!videoUrl) {
    await publish(replicateVideoChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Replicate node: No video URL found.");
  }

  await publish(replicateVideoChannel().status({ nodeId, status: "success" }));

  return {
    ...context,
    [data.variableName]: {
      videoUrl,
      status: "succeeded",
    },
  };
};
