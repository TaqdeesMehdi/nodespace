"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { generateGoogleFormScript } from "./utils";
interface GoogleFormTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const GoogleFormTriggerDialog = ({
  open,
  onOpenChange,
}: GoogleFormTriggerDialogProps) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  //construct the webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/google-form?workflowId=${workflowId}`;
  const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook URL copied to clipboard");
    } catch {
      toast.error("Failed to copy the URL");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scroll">
        <DialogHeader>
          <DialogTitle>Google Form Trigger Configuration</DialogTitle>
          <DialogDescription>
            Use this webhook URL in your Google Form&apos;s Apps Script to
            trigger this workflow when a form is submitted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook Url</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                id="webhook-url"
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipBoard}
              >
                <CopyIcon className="size-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg b-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Setup instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open your Google Form</li>
              <li>Click the three dots menu ⇨ Apps Script</li>
              <li>Copy and paste the script below</li>
              <li>Replace WEBHOOK_URL with your webhook URL above</li>
              <li>Save and Click "Triggers" ⇨ Add Trigger</li>
              <li>Choose: From form ⇨ On submit ⇨ save</li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <h4 className="font-medium text-sm">Google Apps Script:</h4>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const script = generateGoogleFormScript(webhookUrl);
                try {
                  await navigator.clipboard.writeText(script);
                  toast.success("Script copied to Clipboard!");
                } catch {
                  toast.error("Failed to copy script");
                }
              }}
            >
              <CopyIcon className="mr-2 size-4" />
              Copy Google Apps Script
            </Button>
            <p className="text-xs text-muted-foreground">
              This script includes your webhook URL and handles form submit
            </p>
          </div>
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.respondentEmail}}"}
                </code>
                - Respondent&apos;s email
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{googleForm.responses['Question Email']}}"}
                </code>
                - Specific answer
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{json googleForm.responses}}"}
                </code>
                - All responses as JSON
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
