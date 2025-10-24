"use client";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const trpc = useTRPC();
  const { data: users } = useQuery(trpc.getUsers.queryOptions());
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      <Button>Click the node</Button>
      <h1>{JSON.stringify(users)}</h1>
    </div>
  );
};
export default Home;
