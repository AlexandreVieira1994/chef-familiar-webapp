import { NextResponse } from "next/server";
import { createAssistantProposal } from "@/lib/ai/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message : "";
    const history = Array.isArray(body?.history) ? body.history : [];
    const response = await createAssistantProposal(message, history);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado no assistente.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
