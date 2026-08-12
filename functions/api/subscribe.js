/**
 * POST /api/subscribe — add an email address to the updates list, stored in D1.
 *
 * Body (JSON): { email, website? }
 * `website` is a honeypot: humans never see the field, bots fill it in.
 * We answer bots with a cheerful fake success and store nothing.
 *
 * Signups are idempotent: a repeat address is silently ignored (INSERT OR
 * IGNORE against a UNIQUE index), so the guest always sees success and we
 * never store a duplicate.
 */

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE
)`;

// Simple, forgiving check — something@something.tld with no whitespace.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function bad(error, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Expected a JSON body.");
  }

  // Honeypot: pretend everything is fine, save nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) return bad("Please add an email so we can keep you posted.");
  if (email.length > 254) return bad("That email is a little too long.");
  if (!EMAIL_RE.test(email)) return bad("That doesn't look like an email. Mind checking it?");

  const insert = () =>
    env.DB.prepare(
      "INSERT OR IGNORE INTO subscribers (created_at, email) VALUES (?, ?)"
    )
      .bind(new Date().toISOString(), email)
      .run();

  try {
    try {
      await insert();
    } catch (e) {
      // First subscriber ever: create the table, then retry once.
      if (String(e).includes("no such table")) {
        await env.DB.exec(CREATE_SQL.replace(/\n\s*/g, " "));
        await insert();
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error("subscribe insert failed:", e);
    return bad("Something went sideways on our end. Please try again.", 500);
  }

  return Response.json({ ok: true });
}
