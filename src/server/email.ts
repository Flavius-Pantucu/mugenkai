import { env } from "./env";

/** Sends one email through Resend's REST API (no SDK needed for a single POST). */
export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }) {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    console.info(`[email] RESEND_API_KEY unset, not sending "${msg.subject}" to ${msg.to}:\n${msg.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...msg }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
