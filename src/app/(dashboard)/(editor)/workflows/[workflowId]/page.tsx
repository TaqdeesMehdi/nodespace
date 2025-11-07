interface PageProps {
  params: Promise<{
    workflowId: string;
  }>;
}
const Page = async ({ params }: PageProps) => {
  const { workflowId } = await params;
  return <p>Workflow Id:{workflowId}</p>;
};
export default Page;
