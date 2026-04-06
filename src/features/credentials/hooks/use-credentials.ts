import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useQueryClient,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useCredentialParams } from "./use-credentials-params";
import { CredentialType } from "@/generated/prisma";
export const useSuspenseCredentials = () => {
  const trpc = useTRPC();
  const [params] = useCredentialParams();
  return useSuspenseQuery(trpc.credentials.getMany.queryOptions(params));
};
//create credential
export const useCreateCredential = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" created successfully!`);
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(`Failed to create credential ${error.message}`);
      },
    }),
  );
};
//delete credential
export const useRemoveCredential = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" removed`);
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getOne.queryFilter({ id: data.id }),
        );
      },
    }),
  );
};
//to fetch single credential using suspense
export const useSuspenseCredential = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.credentials.getOne.queryOptions({ id }));
};
// update credential
export const useUpdateCredential = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Credential "${data.name}" saved`);
        queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        queryClient.invalidateQueries(
          trpc.credentials.getOne.queryOptions({ id: data.id }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to update credential ${error.message}`);
      },
    }),
  );
};
//credential by types
export const useCredentialByTypes = (type: CredentialType) => {
  const trpc = useTRPC();
  return useQuery(trpc.credentials.getByType.queryOptions({ type }));
};
