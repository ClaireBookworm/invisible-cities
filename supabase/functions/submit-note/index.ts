// Supabase Edge Function: submit-note
// -----------------------------------------------------------------------------
// One public endpoint for posting a reader note. It moderates the text
// (server-side word filter + free OpenAI Moderation if OPENAI_API_KEY is set),
// then inserts the row using the SERVICE ROLE key — which never leaves the
// server. The browser only ever talks to this function, so the moderation
// cannot be bypassed by hitting the database directly with the public key.
//
// Secrets used (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
// automatically; you only need to set OPENAI_API_KEY, and only if you want the
// LLM check):
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Deploy:
//   supabase functions deploy submit-note --no-verify-jwt
// (or paste this into the dashboard's Edge Functions editor and Deploy)
// -----------------------------------------------------------------------------

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_NOTE_LEN = 600;
const BLOCKLIST = [
  "fuck", "shit", "bitch", "cunt", "asshole", "dick", "nigger", "nigga",
  "faggot", "retard", "whore", "slut", "rape", "kike", "spic", "chink",
];

function wordFilter(text: string): string | null {
  const t = (text || "").trim();
  if (t.length < 2) return "Please write a little more.";
  if (t.length > MAX_NOTE_LEN) return `Please keep notes under ${MAX_NOTE_LEN} characters.`;
  const words = " " + t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " ";
  for (const w of BLOCKLIST) { if (words.includes(" " + w + " ")) return "That note tripped the language filter."; }
  return null;
}

// Free OpenAI Moderation check. Returns a reason string if flagged, else null.
// If no key is configured, moderation is skipped (word filter still applies).
async function llmFlag(text: string): Promise<string | null> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    const data = await r.json();
    return data?.results?.[0]?.flagged === true ? "This note was flagged by moderation." : null;
  } catch (_e) {
    // Fail open: if OpenAI is unreachable, don't block the reader.
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ allowed: false, reason: "Method not allowed." }, 405);

  let payload: any;
  try { payload = await req.json(); } catch (_e) { return json({ allowed: false, reason: "Bad request." }, 400); }

  const city_id = String(payload?.city_id || "").trim();
  const anchor = String(payload?.anchor || "").trim();
  const note = String(payload?.note || "").trim();
  const author = String(payload?.author || "reader").slice(0, 40) || "reader";
  const tags = Array.isArray(payload?.tags)
    ? payload.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 6)
    : [];

  if (!city_id || !anchor || !note) return json({ allowed: false, reason: "Missing note content." }, 400);

  const wf = wordFilter(note);
  if (wf) return json({ allowed: false, reason: wf });
  const llm = await llmFlag(note);
  if (llm) return json({ allowed: false, reason: llm });

  // Insert with the service role (bypasses RLS). These are injected automatically.
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/rest/v1/notes`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ city_id, anchor, note, tags, author, status: "approved" }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("insert failed", res.status, detail);
    return json({ allowed: false, reason: "Could not save the note." }, 500);
  }
  const rows = await res.json();
  return json({ allowed: true, note: Array.isArray(rows) ? rows[0] : rows });
});
