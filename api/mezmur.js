// Vercel serverless function handling writes to the mezmur table.
// Public reads go straight from the browser to Supabase's REST API using
// the anon key (safe, read-only via RLS). Writes come through here so the
// admin password check and the privileged service-role key stay server-side.

module.exports = async (req, res) => {
  const password = req.headers["x-admin-password"];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const baseHeaders = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "POST") {
      const { title, topics, speed, language, lyrics, media_url } = req.body || {};
      if (!title || !Array.isArray(topics) || topics.length === 0 || !speed || !language || !lyrics) {
        res.status(400).json({ error: "Missing required fields (topics must be a non-empty array)" });
        return;
      }
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur`, {
        method: "POST",
        headers: { ...baseHeaders, Prefer: "return=representation" },
        body: JSON.stringify({ title, topics, speed, language, lyrics, media_url: media_url || null }),
      });
      const data = await resp.json();
      res.status(resp.ok ? 201 : resp.status).json(data);
      return;
    }

    if (req.method === "PUT") {
      const { id, ...fields } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { ...baseHeaders, Prefer: "return=representation" },
        body: JSON.stringify(fields),
      });
      const data = await resp.json();
      res.status(resp.ok ? 200 : resp.status).json(data);
      return;
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) {
        res.status(400).json({ error: "Missing id" });
        return;
      }
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/mezmur?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: baseHeaders,
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        res.status(resp.status).json(data);
        return;
      }
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
