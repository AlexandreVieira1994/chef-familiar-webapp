import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { executeAssistantProposal, rejectAssistantProposal } from "@/lib/ai/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const logId = typeof body?.logId === "string" ? body.logId : "";
    const decision = typeof body?.decision === "string" ? body.decision : "";

    if (!logId) {
      return NextResponse.json({ error: "Proposta inválida." }, { status: 400 });
    }

    if (decision === "reject") {
      const result = await rejectAssistantProposal(logId);
      return NextResponse.json(result);
    }

    if (decision !== "approve") {
      return NextResponse.json({ error: "Decisão inválida." }, { status: 400 });
    }

    const result = await executeAssistantProposal(logId);
    revalidatePath("/inventory", "page");
    revalidatePath("/shopping", "page");
    revalidatePath("/planner", "page");
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao confirmar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
