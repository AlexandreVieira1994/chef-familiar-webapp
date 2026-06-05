"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AssistantProposal, AssistantResponse } from "@/lib/ai/types";

type Status = "idle" | "loading" | "confirming" | "error";

function proposalDetails(proposal: AssistantProposal) {
  if (proposal.kind === "add_inventory_entries") {
    return proposal.items.map((item) => (
      <li key={`${item.ingredient_name}-${item.quantity}-${item.unit}`}>
        <span className="font-medium">{item.ingredient_name}</span>{" "}
        <span className="text-neutral-600">
          {item.quantity} {item.unit} · {item.category ?? "Outro"} · {item.storage_location ?? "Despensa"} · validade {item.expiry_date ?? "a confirmar"}
        </span>
      </li>
    ));
  }

  if (proposal.kind === "mark_shopping_item_purchased") {
    return (
      <li>
        Marcar item da lista como comprado
        {proposal.purchased_quantity ? ` (${proposal.purchased_quantity} ${proposal.purchased_unit ?? ""})` : ""}.
      </li>
    );
  }

  return <li>{proposal.summary}</li>;
}

export function AssistantBar() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState("");

  const canConfirm = useMemo(
    () => Boolean(response?.requiresConfirmation && response.logId),
    [response]
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;

    setStatus("loading");
    setError("");
    setResponse(null);

    try {
      const result = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data?.error ?? "Não foi possível falar com o assistente.");
      }

      setResponse(data as AssistantResponse);
      setStatus("idle");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
      setStatus("error");
    }
  }

  async function decide(decision: "approve" | "reject") {
    if (!response?.logId) return;

    setStatus("confirming");
    setError("");

    try {
      const result = await fetch("/api/assistant/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: response.logId, decision })
      });
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data?.error ?? "Não foi possível confirmar a proposta.");
      }

      setResponse({
        message: data.message ?? (decision === "approve" ? "Feito." : "Proposta cancelada."),
        requiresConfirmation: false,
        logId: null,
        proposal: { kind: "answer", summary: data.message ?? "Concluído." }
      });
      if (decision === "approve") setInput("");
      setStatus("idle");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
      setStatus("error");
    }
  }

  function correct() {
    setResponse(null);
    setStatus("idle");
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-3 md:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="flex gap-2">
          <label className="sr-only" htmlFor="assistant-input">Assistente Chef Familiar</label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="min-h-12 flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-neutral-900"
            placeholder="Diz naturalmente: Comprei 1 kg batata, 6 ovos e 500 g brócolos..."
            rows={2}
          />
          <button
            className="h-12 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={status === "loading" || status === "confirming" || !input.trim()}
            type="submit"
          >
            {status === "loading" ? "A pensar" : "Enviar"}
          </button>
        </form>

        <div className="min-h-12 rounded-lg border bg-neutral-50 p-3 text-sm">
          {!response && !error && (
            <p className="text-neutral-500">Assistente pronto para inventário e compras.</p>
          )}
          {error && <p className="text-red-700">{error}</p>}
          {response && (
            <div className="space-y-2">
              <p className="font-medium">{response.message}</p>
              <ul className="space-y-1 text-xs text-neutral-700">{proposalDetails(response.proposal)}</ul>
              {canConfirm && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:bg-neutral-300"
                    disabled={status === "confirming"}
                    onClick={() => decide("approve")}
                    type="button"
                  >
                    Confirmar
                  </button>
                  <button
                    className="rounded-lg border px-3 py-2 text-xs font-medium"
                    disabled={status === "confirming"}
                    onClick={correct}
                    type="button"
                  >
                    Corrigir
                  </button>
                  <button
                    className="rounded-lg border px-3 py-2 text-xs font-medium"
                    disabled={status === "confirming"}
                    onClick={() => decide("reject")}
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
