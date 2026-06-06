"use client";

import { useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { AssistantProposal, AssistantResponse } from "@/lib/ai/types";

type Status = "idle" | "loading" | "confirming" | "error";

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionAlternativeList = { 0?: SpeechRecognitionResultItem };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionAlternativeList> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const suggestions = [
  "Plano 7 dias, cozinhar domingo e quarta",
  "Comprei 1 kg batata e 6 ovos",
  "O que falta comprar?",
  "Marcar leite como comprado"
];

function getSpeechRecognitionConstructor() {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

function proposalDetails(proposal: AssistantProposal): ReactNode {
  if (proposal.kind === "add_inventory_entries") {
    return proposal.items.map((item) => (
      <li key={`${item.ingredient_name}-${item.quantity}-${item.unit}`} className="rounded-lg bg-white px-3 py-2">
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
      <li className="rounded-lg bg-white px-3 py-2">
        Marcar item da lista como comprado
        {proposal.purchased_quantity ? ` (${proposal.purchased_quantity} ${proposal.purchased_unit ?? ""})` : ""}.
      </li>
    );
  }

  if (proposal.kind === "create_meal_plan") {
    return proposal.entries.map((entry) => (
      <li key={`${entry.planned_date}-${entry.meal_slot}-${entry.recipe_id}`} className="rounded-lg bg-white px-3 py-2">
        <span className="font-medium text-[#17211b]">{entry.planned_date}</span>{" "}
        <span className="text-[#647268]">
          {entry.meal_slot} · {entry.recipe_code} · {entry.recipe_name}. {entry.notes}
        </span>
      </li>
    ));
  }

  return null;
}

export function AssistantBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const canConfirm = useMemo(
    () => Boolean(response?.requiresConfirmation && response.logId),
    [response]
  );
  const details = response ? proposalDetails(response.proposal) : null;

  async function askAssistant(message: string) {
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    await askAssistant(message);
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

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function startListening() {
    setIsOpen(true);
    setVoiceMessage("");

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setVoiceMessage("Voz indisponível neste browser.");
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-PT";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setInput(transcript);
      void askAssistant(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setVoiceMessage("Não consegui ouvir. Tenta escrever ou voltar a premir.");
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function clearPressTimer() {
    if (!pressTimerRef.current) return;
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  }

  function handlePointerDown() {
    longPressRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressRef.current = true;
      startListening();
    }, 550);
  }

  function handlePointerUp() {
    clearPressTimer();
  }

  function handleAssistantButtonClick() {
    if (longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    setIsOpen((current) => !current);
  }

  return (
    <>
      {isOpen && (
        <aside className="fixed bottom-24 right-4 z-40 flex max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-[#d7e2d8] bg-white/95 p-4 shadow-[0_22px_70px_rgba(33,48,38,0.18)] backdrop-blur">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#17211b]">Assistente Chef Familiar</p>
              <p className="text-xs text-[#647268]">{isListening ? "A ouvir..." : "Inventário e compras"}</p>
            </div>
            <button
              aria-label="Fechar assistente"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce5dc] text-lg leading-none text-[#647268] transition hover:border-[#9dbfa4] hover:text-[#17211b]"
              onClick={() => {
                stopListening();
                setIsOpen(false);
              }}
              type="button"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit} className="shrink-0 space-y-3">
            <div className="flex gap-2">
              <textarea
                id="assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-20 flex-1 resize-none rounded-xl border border-[#dce5dc] px-3 py-2 text-sm text-[#17211b] placeholder:text-[#8a978d]"
                placeholder="Escreve naturalmente..."
                rows={3}
              />
              <button
                aria-label="Enviar mensagem ao assistente"
                className="h-20 rounded-xl bg-[#2f6b4f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25563f] disabled:cursor-not-allowed disabled:bg-[#b8c8ba]"
                disabled={status === "loading" || status === "confirming" || !input.trim()}
                type="submit"
              >
                {status === "loading" ? "..." : "Enviar"}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="whitespace-nowrap rounded-full border border-[#dce5dc] bg-white px-3 py-1.5 text-xs font-medium text-[#56645c] transition hover:border-[#9dbfa4] hover:text-[#17211b]"
                  onClick={() => setInput(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#dce5dc] bg-[#edf5ef] p-3 text-sm">
            {!response && !error && !voiceMessage && (
              <p className="text-xs leading-5 text-[#647268]">
                Pede atualizações de inventário ou confirma compras sem sair da página.
              </p>
            )}
            {voiceMessage && <p className="text-xs leading-5 text-[#647268]">{voiceMessage}</p>}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                {error}
              </div>
            )}
            {response && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#b85c38]">
                    {canConfirm ? "Proposta para confirmar" : "Resposta"}
                  </p>
                  <p className="mt-1 break-words font-semibold text-[#17211b]">{response.message}</p>
                </div>
                {details && <ul className="space-y-1.5 break-words text-xs text-[#647268]">{details}</ul>}
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
                {!canConfirm && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      className="rounded-lg border border-[#cdddcf] bg-white px-3 py-2 text-xs font-semibold text-[#243028]"
                      onClick={correct}
                      type="button"
                    >
                      Nova pergunta
                    </button>
                    <button
                      className="rounded-lg border border-[#cdddcf] bg-white px-3 py-2 text-xs font-semibold text-[#243028]"
                      onClick={() => setIsOpen(false)}
                      type="button"
                    >
                      Fechar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      <button
        aria-expanded={isOpen}
        aria-label="Abrir assistente. Manter premido para ditar."
        className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-[0_16px_40px_rgba(33,48,38,0.28)] transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#9dbfa4]/40 ${
          isListening ? "bg-[#b85c38]" : "bg-[#2f6b4f]"
        }`}
        onClick={handleAssistantButtonClick}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerUp}
        onPointerUp={handlePointerUp}
        title="Assistente"
        type="button"
      >
        {isListening ? "•" : "✦"}
      </button>
    </>
  );
}
