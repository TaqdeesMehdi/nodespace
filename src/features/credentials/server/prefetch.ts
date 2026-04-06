import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";
type input = inferInput<typeof trpc.credentials.getMany>;
//=======================prefetch all credentials
export const prefetchCredentials = (params: input) => {
  return prefetch(trpc.credentials.getMany.queryOptions(params));
};
//=======================prefetch a single credential
export const prefetchCredential = (id: string) => {
  return prefetch(trpc.credentials.getOne.queryOptions({ id }));
};
