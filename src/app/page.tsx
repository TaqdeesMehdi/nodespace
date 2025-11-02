"use client";
import { LogoutButton } from "@/components/logout-button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Home = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.getWorkflows.queryOptions());
  const create = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.getWorkflows.queryOptions());
      },
    })
  );
  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: () => {
        toast.success("AI job queued");
      },
    })
  );
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center flex-col gap-y-6">
      <div>{JSON.stringify(data, null, 2)}</div>
      <LogoutButton />
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        Test Ai
      </Button>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create workflow
      </Button>
    </div>
  );
};
export default Home;
