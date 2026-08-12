/**
 * GET /api/subscribers — private export of the email updates list.
 *
 * Auth: ?key=<RSVP_EXPORT_KEY>  or  Authorization: Bearer <RSVP_EXPORT_KEY>
 * Format: ?format=csv (spreadsheet download) or JSON by default.
 *
 * Reuses the same RSVP_EXPORT_KEY secret as the RSVP export (one key to
 * manage). It's set as an environment variable in the Cloudflare Pages
 * dashboard (and in .dev.vars for local dev). If it isn't configured, the
 * endpoint stays closed.
 */

function csvField(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);

  const expected = env.RSVP_EXPORT_KEY;
  if (!expected) {
    return Response.json({ ok: false, error: "Export key not configured." }, { status: 503 });
  }
  const auth = request.headers.get("Authorization") || "";
  const given = url.searchParams.get("key") || (auth.startsWith("Bearer ") ? auth.slice(7) : "");
  if (given !== expected) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let rows;
  try {
    const result = await env.DB.prepare(
      "SELECT id, created_at, email FROM subscribers ORDER BY created_at"
    ).all();
    rows = result.results || [];
  } catch (e) {
    if (String(e).includes("no such table")) {
      rows = []; // nobody has subscribed yet
    } else {
      console.error("subscribers export failed:", e);
      return Response.json({ ok: false, error: "Query failed." }, { status: 500 });
    }
  }

  if (url.searchParams.get("format") === "csv") {
    const header = "id,created_at,email";
    const lines = rows.map((r) =>
      [r.id, r.created_at, r.email].map(csvField).join(",")
    );
    return new Response([header, ...lines].join("\r\n") + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscribers.csv"',
      },
    });
  }

  return Response.json({ ok: true, count: rows.length, subscribers: rows });
}
