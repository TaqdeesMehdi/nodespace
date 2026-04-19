"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";
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

type YoutubeUploadFormInput = z.input<typeof formSchema>;
export type YoutubeUploadFormValues = z.output<typeof formSchema>;

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

  const form = useForm<
    YoutubeUploadFormInput,
    unknown,
    YoutubeUploadFormValues
  >({
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
                  {!isLoadingCredentials && !credentials?.length && (
                    <div className="flex items-center gap-2 rounded-md border border-yellow-500 bg-yellow-50 p-3 text-sm text-yellow-800">
                      <Image
                        src="/youtube.svg"
                        alt="YouTube"
                        width={16}
                        height={16}
                      />
                      <span>
                        No YouTube account connected.{" "}
                        href="/api/integrations/youtube/connect"
                        className="font-semibold underline
                        hover:text-yellow-900" target="_blank" rel="noopener
                        noreferrer" Click here to connect
                      </span>{" "}
                      <span>then reopen this dialog.</span>
                    </div>
                  )}

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
