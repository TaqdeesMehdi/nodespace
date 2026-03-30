import { HomePageComponents } from "@/features/home/components/home-page-component";
import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();
  return <HomePageComponents />;
};
export default Page;
