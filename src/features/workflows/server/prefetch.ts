import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";
type input = inferInput<typeof trpc.workflows.getMany>;
//=======================prefetch all workflows
export const prefetchWorkflows = (params: input) => {
  return prefetch(trpc.workflows.getMany.queryOptions(params));
};
//=======================prefetch a single workflow
export const prefetchWorkflow = (id: string) => {
  return prefetch(trpc.workflows.getOne.queryOptions({ id }));
};
