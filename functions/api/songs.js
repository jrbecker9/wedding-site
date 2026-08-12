/**
 * GET /api/songs — how many dance-floor songs the RSVP list has queued.
 * Count only; the titles stay between us and the aux cord.
 */

export async function onRequestGet({ env }) {
  let count = 0;
  try {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM rsvps WHERE song IS NOT NULL AND song != ''"
    ).first();
    count = row ? row.n : 0;
  } catch (e) {
    if (!String(e).includes("no such table")) {
      console.error("songs count failed:", e);
      return Response.json({ ok: false, error: "Query failed." }, { status: 500 });
    }
    // No table yet: zero songs is correct.
  }
  return Response.json({ ok: true, count });
}
