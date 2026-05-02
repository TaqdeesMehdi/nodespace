import { realtime, staticSchema } from "inngest";
import {GOOGLE_FORM_TRIGGER_CHANNEL_NAME} from '@/lib/channel-constants'

export const googleFormTriggerChannel = realtime.channel({
  name: GOOGLE_FORM_TRIGGER_CHANNEL_NAME,
  topics: {
    status: {
      schema: staticSchema<{
        nodeId: string;
        status: "loading" | "success" | "error";
      }>(),
    },
  },
});
