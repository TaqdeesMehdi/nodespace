import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";
import { type NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");
    if (!workflowId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required workflow parameters:workflowId",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const formData = {
      raw: body,
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
    };

    //trigger the inngest background job
    await sendWorkflowExecution({
      workflowId,
      initialData: {
        googleForm: formData,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Workflow triggered successfully",
    });
  } catch (error) {
    console.error("Google form webhook error", error);
    return NextResponse.json(
      { success: false, error: "Failed to process google form submission" },
      { status: 500 },
    );
  }
}
