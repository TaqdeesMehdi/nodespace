import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";
type input = inferInput<typeof trpc.workflows.getMany>;
export const prefetchWorkflows = (params: input) => {
  return prefetch(trpc.workflows.getMany.queryOptions(params));
};
