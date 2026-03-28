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
interface StripeTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const StripeTriggerDialog = ({
  open,
  onOpenChange,
}: StripeTriggerDialogProps) => {
  const params = useParams();
  const workflowId = params.workflowId as string;
  //construct the webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${baseUrl}/api/webhooks/stripe?workflowId=${workflowId}`;
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
          <DialogTitle>Stripe Trigger Configuration</DialogTitle>
          <DialogDescription>
            Configure this webhook URL in your Stripe Dashboard to trigger this
            workflow on payment events.
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
              <li>Open your Stripe Dashboard</li>
              <li>Go to Developers ⇨ Webhooks</li>
              <li>Click "Add endpoint"</li>
              <li>Paste the webhook URL above</li>
              <li>
                Select events to listen for e.g., payment_intent.succeeded
              </li>
              <li>Save and copy the signing secret</li>
            </ol>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Available Variables</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stipe.amount}}"}
                </code>
                - Payment amount
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stipe.currency}}"}
                </code>
                - Currency code
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stipe.customerId}}"}
                </code>
                - Customer ID
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{json stripe}}"}
                </code>
                - Full event data as JSON
              </li>
              <li>
                <code className="bg-background px-1 py-0.5 rounded">
                  {"{{stripe.eventType}}"}
                </code>
                - Event type e.g., payment_intent.succeeded
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
