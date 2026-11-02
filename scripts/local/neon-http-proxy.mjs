// Local Docker adapter for the Neon HTTP protocol; never forwards to external databases.
import http from "node:http";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== "bukutamu-db")
  throw new Error("Proxy hanya boleh memakai database Docker lokal.");
const pool = new pg.Pool({ connectionString: url.toString() });
const server = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    try {
      await pool.query("SELECT 1");
      res.writeHead(200).end("ok");
    } catch {
      res.writeHead(503).end("not ready");
    }
    return;
  }
  if (req.method !== "POST" || req.url !== "/sql") {
    res.writeHead(404).end();
    return;
  }
  let client;
  let batch = false;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 5_000_000) throw new Error("Request too large");
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks));
    client = await pool.connect();
    batch = Array.isArray(body.queries);
    if (batch) await client.query("BEGIN");
    const results = [];
    for (const query of batch ? body.queries : [body]) {
      const result = await client.query({
        text: query.query,
        values: query.params,
        rowMode: "array",
        types: { getTypeParser: () => (value) => value },
      });
      results.push({
        rows: result.rows,
        fields: result.fields,
        rowCount: result.rowCount,
        command: result.command,
        rowAsArray: true,
      });
    }
    if (batch) await client.query("COMMIT");
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(batch ? { results } : results[0]));
  } catch (error) {
    if (batch && client) await client.query("ROLLBACK").catch(() => {});
    res
      .writeHead(400, { "Content-Type": "application/json" })
      .end(
        JSON.stringify({
          message: "Local database query failed.",
          code: error.code,
        }),
      );
  } finally {
    client?.release();
  }
});
server.listen(8080, "0.0.0.0", () =>
  console.log("Local database HTTP adapter ready."),
);
