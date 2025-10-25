import { requireAuth } from "@/lib/auth-utils";
import { LogoutButton } from "@/components/logout-button";
import { caller } from "@/trpc/server";

const Home = async () => {
  await requireAuth();
  const data = await caller.getUsers();

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      {JSON.stringify(data)}
      <LogoutButton />
    </div>
  );
};
export default Home;
