import OpenAI from "openai";

let client: OpenAI | null | undefined;

export function getOpenAIClient() {
  if (client !== undefined) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  client = apiKey ? new OpenAI({ apiKey }) : null;

  return client;
}

export function getAssistantModel() {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}
