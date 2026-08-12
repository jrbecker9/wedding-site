/**
 * The boop counter. Every tap on a dog's photo is one boop, shared by
 * every visitor to the site.
 *
 * GET  /api/boop            → { ok: true, counts: { ella: N, lily: N } }
 * POST /api/boop {dog}      → { ok: true, count: N }   (dog: 'ella' | 'lily')
 */

const DOGS = ["ella", "lily"];

const CREATE_SQL =
  "CREATE TABLE IF NOT EXISTS boops (dog TEXT PRIMARY KEY, count INTEGER NOT NULL)";

function bad(error, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function onRequestGet({ env }) {
  const counts = { ella: 0, lily: 0 };
  try {
    const result = await env.DB.prepare("SELECT dog, count FROM boops").all();
    for (const row of result.results || []) {
      if (DOGS.includes(row.dog)) counts[row.dog] = row.count;
    }
  } catch (e) {
    if (!String(e).includes("no such table")) {
      console.error("boop counts failed:", e);
      return bad("Couldn't fetch the boops.", 500);
    }
    // No table yet: nobody has booped. Zeros are correct.
  }
  return Response.json({ ok: true, counts });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Expected a JSON body.");
  }

  const dog = typeof body.dog === "string" ? body.dog.toLowerCase() : "";
  if (!DOGS.includes(dog)) return bad("That is not one of our dogs.");

  const boop = () =>
    env.DB.prepare(
      "INSERT INTO boops (dog, count) VALUES (?, 1) " +
        "ON CONFLICT(dog) DO UPDATE SET count = count + 1 " +
        "RETURNING count"
    )
      .bind(dog)
      .first();

  try {
    let row;
    try {
      row = await boop();
    } catch (e) {
      // First boop ever: create the table, then retry once.
      if (String(e).includes("no such table")) {
        await env.DB.exec(CREATE_SQL);
        row = await boop();
      } else {
        throw e;
      }
    }
    return Response.json({ ok: true, count: row ? row.count : 1 });
  } catch (e) {
    console.error("boop failed:", e);
    return bad("The boop didn't land. Try again?", 500);
  }
}
