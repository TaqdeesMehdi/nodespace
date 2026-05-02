import type { Realtime } from "inngest/realtime";
import { subscribe } from "inngest/realtime";
import { useEffect, useState } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

interface UseNodeStatusOptions {
  nodeId: string;
  channel: string;
  topic: string;
  refreshToken: () => Promise<Realtime.Subscribe.Token>;
}

export function useNodeStatus({
  nodeId,
  channel,
  topic,
  refreshToken,
}: UseNodeStatusOptions) {
  const [status, setStatus] = useState<NodeStatus>("initial");

  useEffect(() => {
    let isActive = true;
    let subscription: Realtime.Subscribe.CallbackSubscription | null = null;

    const startSubscription = async () => {
      try {
        const token = await refreshToken();
        if (!isActive) {
          return;
        }

        subscription = await subscribe({
          ...token,
          onMessage: (message) => {
            if (!isActive || message.kind !== "data") {
              return;
            }
            if (message.channel !== channel || message.topic !== topic) {
              return;
            }
            if (message.data.nodeId !== nodeId) {
              return;
            }
            setStatus(message.data.status as NodeStatus);
          },
        });
      } catch {
        if (isActive) {
          setStatus("initial");
        }
      }
    };

    startSubscription();

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, [channel, nodeId, refreshToken, topic]);

  return status;
}
