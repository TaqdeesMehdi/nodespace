import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";

const Home = async () => {
  const users = await prisma.user.findMany();
  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      <Button>Click the node</Button>
      <h1>{JSON.stringify(users)}</h1>
    </div>
  );
};
export default Home;
