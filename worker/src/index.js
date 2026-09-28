/*
 * "Ask the lab" chat backend — a Cloudflare Worker that forwards visitor
 * questions to Claude so the API key never reaches the browser.
 *
 * Request:  POST { messages: [{ role, content }], projects: [...] }
 * Response: { reply: "..." }  or  { error: "..." }
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;
const MAX_PROJECTS = 50;
const MAX_CONTEXT_CHARS = 40000;

const SYSTEM_PROMPT = `You are the guide for "AI Lab", a personal website of games, apps and experiments built with AI.
Visitors ask you about the projects on the site. Answer in a friendly, concise way: two to four sentences, plain text, no markdown.
Base anything you say about a project on the project information below; if it doesn't cover the question, say you don't know rather than guessing.
You can recommend projects, explain how to play or use them, and chat briefly about building things with AI. For unrelated requests, politely steer back to the lab.`;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// Accept only a short, well-formed user/assistant history that starts and ends with the user
function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const messages = input.slice(-MAX_MESSAGES).map((m) => ({
    role: m && m.role === "assistant" ? "assistant" : "user",
    content: String((m && m.content) || "").slice(0, MAX_MESSAGE_CHARS).trim(),
  }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === messages[i - 1].role || !messages[i].content) return null;
  }
  return messages[0].content ? messages : null;
}

function projectContext(projects) {
  if (!Array.isArray(projects)) return "[]";
  return JSON.stringify(projects.slice(0, MAX_PROJECTS)).slice(0, MAX_CONTEXT_CHARS);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, cors);

    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(origin)) return json({ error: "Not allowed." }, 403, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request." }, 400, cors);
    }

    const messages = cleanMessages(body.messages);
    if (!messages) return json({ error: "Invalid conversation." }, 400, cors);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 1024,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT + "\n\nProject information (JSON):\n" + projectContext(body.projects),
        messages,
      });

      if (response.stop_reason === "refusal") {
        return json({ reply: "Sorry, I can't help with that one. Ask me about the projects instead!" }, 200, cors);
      }

      const reply = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();

      return json({ reply: reply || "Hmm, I don't have an answer for that." }, 200, cors);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        return json({ error: "The lab is busy right now. Try again in a moment." }, 429, cors);
      }
      if (err instanceof Anthropic.APIError) {
        console.error("Anthropic API error", err.status, err.message);
        return json({ error: "Couldn't reach the lab right now." }, 502, cors);
      }
      console.error(err);
      return json({ error: "Something went wrong." }, 500, cors);
    }
  },
};
