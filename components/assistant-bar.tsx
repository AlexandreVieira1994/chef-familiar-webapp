"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AssistantProposal, AssistantResponse } from "@/lib/ai/types";

type Status = "idle" | "loading" | "confirming" | "error";

const suggestions = [
  "Comprei 1 kg batata e 6 ovos",
  "O que falta comprar?",
  "Marcar leite como comprado"
];

function proposalDetails(proposal: AssistantProposal) {
  if (proposal.kind === "add_inventory_entries") {
    return proposal.items.map((item) => (
      <li key={`${item.ingredient_name}-${item.quantity}-${item.unit}`} className="rounded-md bg-white px-3 py-2">
        <span className="font-medium text-[#17211b]">{item.ingredient_name}</span>{" "}
        <span className="text-[#647268]">
          {item.quantity} {item.unit} · {item.category ?? "Outro"} · {item.storage_location ?? "Despensa"} · validade{" "}
          {item.expiry_date ?? "a confirmar"}
        </span>
      </li>
    ));
  }

  if (proposal.kind === "mark_shopping_item_purchased") {
    return (
      <li className="rounded-md bg-white px-3 py-2">
        Marcar item da lista como comprado
        {proposal.purchased_quantity ? ` (${proposal.purchased_quantity} ${proposal.purchased_unit ?? ""})` : ""}.
      </li>
    );
  }

  return <li className="rounded-md bg-white px-3 py-2">{proposal.summary}</li>;
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
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d7e2d8] bg-white/95 shadow-[0_-18px_45px_rgba(33,48,38,0.12)] backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_390px]">
        <form onSubmit={submit} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-[#17211b]" htmlFor="assistant-input">
              Assistente Chef Familiar
            </label>
            <span className="hidden text-xs text-[#647268] sm:inline">
              Inventário, compras e confirmações rápidas
            </span>
          </div>
          <div className="flex gap-2">
            <textarea
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-14 flex-1 resize-none rounded-lg border px-3 py-2 text-sm text-[#17211b] placeholder:text-[#8a978d]"
              placeholder="Escreve naturalmente: Comprei 1 kg batata, 6 ovos e 500 g brócolos..."
              rows={2}
            />
            <button
              className="h-14 rounded-lg bg-[#2f6b4f] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25563f] disabled:cursor-not-allowed disabled:bg-[#b8c8ba]"
              disabled={status === "loading" || status === "confirming" || !input.trim()}
              type="submit"
            >
              {status === "loading" ? "A pensar" : "Enviar"}
            </button>
          </div>
          <div className="hidden gap-2 overflow-x-auto sm:flex">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="whitespace-nowrap rounded-lg border border-[#dce5dc] bg-white px-3 py-1.5 text-xs font-medium text-[#56645c] transition hover:border-[#9dbfa4] hover:text-[#17211b]"
                onClick={() => setInput(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>

        <div className="min-h-28 rounded-lg border border-[#dce5dc] bg-[#edf5ef] p-3 text-sm">
          {!response && !error && (
            <div className="space-y-1">
              <p className="font-medium text-[#17211b]">Pronto para ajudar.</p>
              <p className="text-xs leading-5 text-[#647268]">
                Pede atualizações de inventário, consulta a lista ativa ou confirma compras sem sair da página.
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              {error}
            </div>
          )}
          {response && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b85c38]">
                  {canConfirm ? "Proposta para confirmar" : "Resposta"}
                </p>
                <p className="mt-1 font-semibold text-[#17211b]">{response.message}</p>
              </div>
              <ul className="space-y-1.5 text-xs text-[#647268]">{proposalDetails(response.proposal)}</ul>
              {canConfirm && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    className="rounded-lg bg-[#2f6b4f] px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:bg-[#b8c8ba]"
                    disabled={status === "confirming"}
                    onClick={() => decide("approve")}
                    type="button"
                  >
                    {status === "confirming" ? "A guardar" : "Confirmar"}
                  </button>
                  <button
                    className="rounded-lg border border-[#cdddcf] bg-white px-3 py-2 text-xs font-semibold text-[#243028]"
                    disabled={status === "confirming"}
                    onClick={correct}
                    type="button"
                  >
                    Corrigir
                  </button>
                  <button
                    className="rounded-lg border border-[#cdddcf] bg-white px-3 py-2 text-xs font-semibold text-[#243028]"
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
