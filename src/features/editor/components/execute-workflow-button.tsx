import { Button } from "@/components/ui/button";
import { useExecuteWorkflow } from "@/features/workflows/hooks/use-workflows";
import { FlaskConicalIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { isSavingWorkflowAtom } from "../store/atoms";
export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const isSavingWorkflow = useAtomValue(isSavingWorkflowAtom);
  const executeWorkflow = useExecuteWorkflow();
  const handleExecute = () => {
    executeWorkflow.mutate({ id: workflowId });
  };
  return (
    <Button
      size="lg"
      onClick={handleExecute}
      disabled={executeWorkflow.isPending || isSavingWorkflow}
    >
      <FlaskConicalIcon className="size-4" />
      Execute Workflow
    </Button>
  );
};
