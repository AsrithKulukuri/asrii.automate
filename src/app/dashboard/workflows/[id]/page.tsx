import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditWorkflowPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: params.id,
      workspaceId: user.workspaceId,
    },
  });

  if (!workflow) {
    notFound();
  }

  let triggerConfig = { type: "COMMENT_RECEIVED", postId: null };
  let conditionConfig = {
    matchType: "CONTAINS_ANY" as const,
    keywords: ["price"],
    excludedKeywords: ["spam"],
    caseSensitive: false,
    postId: null,
  };
  let actionConfig = {
    type: "PRIVATE_REPLY",
    template: "Hey {{username}}! Thanks for your comment.",
  };

  try {
    triggerConfig = JSON.parse(workflow.triggerConfig);
  } catch {
    // fallback
  }

  try {
    conditionConfig = JSON.parse(workflow.conditionConfig);
  } catch {
    // fallback
  }

  try {
    actionConfig = JSON.parse(workflow.actionConfig);
  } catch {
    // fallback
  }

  return (
    <WorkflowEditor
      initialData={{
        id: workflow.id,
        name: workflow.name,
        description: workflow.description || undefined,
        isActive: workflow.isActive,
        triggerConfig,
        conditionConfig,
        actionConfig,
      }}
    />
  );
}
