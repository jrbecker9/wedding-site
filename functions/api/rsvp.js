/**
 * POST /api/rsvp — store an early-interest RSVP in D1.
 *
 * Body (JSON): { name, attending: 'yes'|'no', party: 1..10, song?, website? }
 * `website` is a honeypot: humans never see the field, bots fill it in.
 * We answer bots with a cheerful fake success and store nothing.
 */

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS rsvps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  attending  TEXT    NOT NULL,
  party      INTEGER NOT NULL,
  song       TEXT
)`;

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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const attending = body.attending === "no" ? "no" : body.attending === "yes" ? "yes" : null;
  const party = Number.parseInt(body.party, 10);
  const song = typeof body.song === "string" ? body.song.trim().slice(0, 200) : "";

  if (!name) return bad("Please add your name so we know who's coming.");
  if (name.length > 120) return bad("That's a very long name. 120 characters max.");
  if (attending === null) return bad("Please pick an attendance option.");
  if (!Number.isInteger(party) || party < 1 || party > 10) {
    return bad("Party size should be between 1 and 10.");
  }

  const insert = () =>
    env.DB.prepare(
      "INSERT INTO rsvps (created_at, name, attending, party, song) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(new Date().toISOString(), name, attending, party, song)
      .run();

  try {
    try {
      await insert();
    } catch (e) {
      // First RSVP ever: create the table, then retry once.
      if (String(e).includes("no such table")) {
        await env.DB.exec(CREATE_SQL.replace(/\n\s*/g, " "));
        await insert();
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error("rsvp insert failed:", e);
    return bad("Something went sideways on our end. Please try again.", 500);
  }

  return Response.json({ ok: true });
}
