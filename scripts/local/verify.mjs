import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";
import ExcelJS from "exceljs";

const target = new URL(process.env.DATABASE_URL);
assert.equal(
  target.hostname,
  "bukutamu-db",
  "Integration tests require the isolated Docker database.",
);
const db = new pg.Client({ connectionString: target.toString() });
await db.connect();
const base = process.env.VERIFY_BASE_URL ?? "http://gastro-bukutamu:3000";
const suffix = randomBytes(6).toString("hex");
const qaEmails = [
  `qa-${suffix}@example.test`,
  `qa-other-${suffix}@example.test`,
];
const eventCodes = [],
  clientIds = [];
let passed = 0;
function check(label, condition) {
  assert.ok(condition, label);
  passed++;
  console.log("PASS " + label);
}
async function request(method, path, body, cookie) {
  return fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
}
async function login(email, password, expected = 200) {
  const res = await request("POST", "/api/auth/login", { email, password });
  assert.equal(res.status, expected, "login status");
  if (expected !== 200) return null;
  const header = res.headers.get("set-cookie");
  assert.ok(header.includes("HttpOnly") && header.includes("Secure"));
  return header.split(";")[0];
}
async function snapshot() {
  const result = {};
  for (const table of ["users", "events", "clients"]) {
    result[table] = (
      await db.query(
        `SELECT count(*)::int AS n, md5(string_agg(row_to_json(t)::text,'' ORDER BY ${table === "events" ? "code" : "id"})) AS fingerprint FROM ${table} t`,
      )
    ).rows[0];
  }
  return result;
}
const before = await snapshot();
try {
  const admin = (
    await db.query(
      "SELECT email FROM users WHERE role='admin' ORDER BY id LIMIT 1",
    )
  ).rows[0];
  const sales = (
    await db.query(
      "SELECT id,email FROM users WHERE role='sales' ORDER BY id LIMIT 1",
    )
  ).rows[0];
  const adminCookie = await login(admin.email, process.env.ADMIN_PASSWORD);
  check("admin existing login", Boolean(adminCookie));
  check(
    "anonymous event management denied",
    (await request("GET", "/api/admin/events")).status === 401,
  );
  const legacyCookies = {};
  for (const code of ["NFH", "FHI", "BALI"]) {
    const cookie = await login(
      sales.email,
      process.env[code + "_EVENT_PASSWORD"],
    );
    legacyCookies[code] = cookie;
    const res = await request("GET", "/api/clients", undefined, cookie);
    const data = await res.json();
    const expected = (
      await db.query(
        "SELECT count(*)::int AS n FROM clients WHERE user_id=$1 AND event_code=$2",
        [sales.id, code],
      )
    ).rows[0].n;
    check(
      "legacy " + code + " login and records",
      res.status === 200 && data.clients.length === expected,
    );
    const exported = await request(
      "GET",
      "/api/export?scope=mine",
      undefined,
      cookie,
    );
    const file = Buffer.from(await exported.arrayBuffer());
    check(
      "legacy " + code + " XLSX",
      exported.status === 200 && file.subarray(0, 2).toString() === "PK",
    );
  }
  check(
    "sales cannot manage events",
    (
      await request(
        "POST",
        "/api/admin/events",
        { name: "No access" },
        legacyCookies.NFH,
      )
    ).status === 401,
  );
  check(
    "sales cannot see event passwords",
    (await request("GET", "/api/admin/events", undefined, legacyCookies.NFH))
      .status === 401,
  );
  for (const body of [
    null,
    {},
    {
      name: "Valid",
      address: "Valid",
      starts_at: "2027-02-30T09:00",
      timezone: "Asia/Jakarta",
    },
    {
      name: "Valid",
      address: "Valid",
      starts_at: "2027-03-01T09:00",
      timezone: "Invalid",
    },
    {
      name: 42,
      address: "Valid",
      starts_at: "2027-03-01T09:00",
      timezone: "Asia/Jakarta",
    },
  ]) {
    check(
      "invalid event form rejected",
      (await request("POST", "/api/admin/events", body, adminCookie)).status ===
        400,
    );
  }
  const created = [];
  for (let i = 0; i < 2; i++) {
    const res = await request(
      "POST",
      "/api/admin/events",
      {
        name: "QA Local " + suffix,
        address: "Jl. Uji Lokal No. 1",
        starts_at: "2027-03-01T09:30",
        timezone: "Asia/Makassar",
      },
      adminCookie,
    );
    assert.equal(res.status, 201);
    const data = await res.json();
    eventCodes.push(data.event.code);
    created.push(data.event);
  }
  const [first, second] = created;
  check(
    "unique event code and automatic password",
    first.code !== second.code &&
      first.access_password !== second.access_password &&
      first.access_password.length >= 16,
  );
  const stored = (
    await db.query(
      "SELECT e.name,m.address,m.starts_at,m.timezone FROM events e JOIN managed_events m ON e.code=m.event_code WHERE e.code=$1",
      [first.code],
    )
  ).rows[0];
  check(
    "event metadata and WITA time persisted",
    stored.name === first.name &&
      stored.address === "Jl. Uji Lokal No. 1" &&
      stored.starts_at.toISOString() === "2027-03-01T01:30:00.000Z" &&
      stored.timezone === "Asia/Makassar",
  );
  const initial = await request(
    "GET",
    "/api/admin/events",
    undefined,
    adminCookie,
  );
  const initialBody = await initial.json();
  check(
    "event remains after authoritative reload",
    initialBody.events.some(
      (event) =>
        event.code === first.code &&
        event.access_password === first.access_password,
    ),
  );
  check(
    "admin event response is not cacheable",
    initial.headers.get("cache-control").includes("no-store"),
  );
  await login(sales.email, first.access_password, 401);
  check("unlisted existing user denied", true);
  const whitelistPath = "/api/admin/events/" + first.code + "/whitelist";
  check(
    "invalid whitelist batch rejected atomically",
    (
      await request(
        "POST",
        whitelistPath,
        { emails: [qaEmails[0], "invalid"] },
        adminCookie,
      )
    ).status === 400,
  );
  check(
    "invalid batch adds no email",
    (
      await db.query(
        "SELECT count(*)::int AS n FROM event_whitelist WHERE event_code=$1",
        [first.code],
      )
    ).rows[0].n === 0,
  );
  check(
    "admin account cannot be converted to sales",
    (
      await request(
        "POST",
        whitelistPath,
        { emails: [admin.email] },
        adminCookie,
      )
    ).status === 400,
  );
  const countBefore = (await db.query("SELECT count(*)::int AS n FROM users"))
    .rows[0].n;
  const allowed = await request(
    "POST",
    whitelistPath,
    {
      emails: [
        qaEmails[0].toUpperCase(),
        " " + qaEmails[0] + " ",
        qaEmails[1],
        sales.email.toUpperCase(),
      ],
    },
    adminCookie,
  );
  check("whitelist accepts normalized unique emails", allowed.status === 200);
  check(
    "existing account preserved and only new accounts provisioned",
    (await db.query("SELECT count(*)::int AS n FROM users")).rows[0].n ===
      countBefore + 2,
  );
  const concurrent = await Promise.all([
    request("POST", whitelistPath, { emails: [qaEmails[0]] }, adminCookie),
    request("POST", whitelistPath, { emails: [qaEmails[0]] }, adminCookie),
  ]);
  check(
    "duplicate concurrent whitelist additions are idempotent",
    concurrent.every((res) => res.status === 200) &&
      (
        await db.query(
          "SELECT count(*)::int AS n FROM event_whitelist WHERE event_code=$1",
          [first.code],
        )
      ).rows[0].n === 3,
  );
  const cookie = await login(qaEmails[0].toUpperCase(), first.access_password);
  const otherCookie = await login(qaEmails[1], first.access_password);
  check("whitelisted new user can log in", Boolean(cookie));
  await login(qaEmails[0], process.env.NFH_EVENT_PASSWORD, 401);
  check("new event user cannot access legacy events", true);
  const guest = {
    client_name: "QA Guest " + suffix,
    company_name: "QA Local Company",
    product_interest: "Oven",
    email: "",
    phone: "",
    notes: "Local test only",
  };
  const insert = await request("POST", "/api/clients", guest, cookie);
  assert.equal(insert.status, 201);
  const inserted = (await insert.json()).client;
  clientIds.push(inserted.id);
  check(
    "guest create persists against the active event",
    (
      await db.query("SELECT event_code FROM clients WHERE id=$1", [
        inserted.id,
      ])
    ).rows[0].event_code === first.code,
  );
  const edit = await request(
    "PUT",
    "/api/clients/" + inserted.id,
    { ...guest, client_name: "QA Updated " + suffix },
    cookie,
  );
  check(
    "guest edit persists",
    edit.status === 200 &&
      (
        await db.query("SELECT client_name FROM clients WHERE id=$1", [
          inserted.id,
        ])
      ).rows[0].client_name ===
        "QA Updated " + suffix,
  );
  const otherList = await request(
    "GET",
    "/api/clients",
    undefined,
    otherCookie,
  );
  check(
    "users see only their own guests",
    (await otherList.json()).clients.length === 0,
  );
  check(
    "another user cannot edit guest",
    (await request("PUT", "/api/clients/" + inserted.id, guest, otherCookie))
      .status === 404,
  );
  await request(
    "POST",
    "/api/admin/events/" + second.code + "/whitelist",
    { emails: [qaEmails[0]] },
    adminCookie,
  );
  const secondCookie = await login(qaEmails[0], second.access_password);
  check(
    "active event prevents cross-event edit",
    (await request("PUT", "/api/clients/" + inserted.id, guest, secondCookie))
      .status === 404,
  );
  check(
    "active event prevents cross-event delete",
    (
      await request(
        "DELETE",
        "/api/clients/" + inserted.id,
        undefined,
        secondCookie,
      )
    ).status === 404,
  );
  const existingCookie = await login(sales.email, first.access_password);
  const existingInsert = await request(
    "POST",
    "/api/clients",
    guest,
    existingCookie,
  );
  assert.equal(existingInsert.status, 201);
  const existingGuest = (await existingInsert.json()).client;
  clientIds.push(existingGuest.id);
  check(
    "legacy session cannot edit new-event guests",
    (
      await request(
        "PUT",
        "/api/clients/" + existingGuest.id,
        guest,
        legacyCookies.NFH,
      )
    ).status === 404,
  );
  const adminList = await request(
    "GET",
    "/api/admin/clients?event=" + first.code,
    undefined,
    adminCookie,
  );
  const adminData = await adminList.json();
  check(
    "admin custom event filter returns only that event",
    adminList.status === 200 &&
      adminData.total === 2 &&
      adminData.clients.every((c) => c.event_code === first.code),
  );
  const exported = await request(
    "GET",
    "/api/export?scope=all&event=" + first.code,
    undefined,
    adminCookie,
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await exported.arrayBuffer()));
  check(
    "custom event admin XLSX preserves separate user sheets",
    exported.status === 200 && workbook.worksheets.length === 3,
  );
  check(
    "invalid event filter rejected",
    (
      await request(
        "GET",
        "/api/admin/clients?event=DOES_NOT_EXIST",
        undefined,
        adminCookie,
      )
    ).status === 400,
  );
  const revoked = await request(
    "DELETE",
    whitelistPath,
    { emails: [qaEmails[0]] },
    adminCookie,
  );
  check("whitelist removal succeeds", revoked.status === 200);
  check(
    "removed whitelist invalidates existing session",
    (await request("GET", "/api/clients", undefined, cookie)).status === 401,
  );
  check(
    "removed whitelist blocks export",
    (await request("GET", "/api/export?scope=mine", undefined, cookie))
      .status === 401,
  );
  await login(qaEmails[0], first.access_password, 401);
  check("removed whitelist blocks future login", true);
  for (const code of ["NFH", "FHI", "BALI"]) {
    const res = await request(
      "GET",
      "/api/admin/clients?event=" + code,
      undefined,
      adminCookie,
    );
    const data = await res.json();
    const expected = (
      await db.query(
        "SELECT count(*)::int AS n FROM clients WHERE event_code=$1",
        [code],
      )
    ).rows[0].n;
    check(
      "legacy " + code + " admin filter unchanged",
      res.status === 200 && data.total === expected,
    );
  }
  const legacyInsert = await request(
    "POST",
    "/api/clients",
    guest,
    legacyCookies.NFH,
  );
  assert.equal(legacyInsert.status, 201);
  const legacyGuest = (await legacyInsert.json()).client;
  clientIds.push(legacyGuest.id);
  check(
    "legacy guest create with optional email/phone",
    legacyGuest.email === "" && legacyGuest.phone === "",
  );
  check(
    "legacy guest edit",
    (
      await request(
        "PUT",
        "/api/clients/" + legacyGuest.id,
        { ...guest, notes: "Updated" },
        legacyCookies.NFH,
      )
    ).status === 200,
  );
  check(
    "legacy guest delete",
    (
      await request(
        "DELETE",
        "/api/clients/" + legacyGuest.id,
        undefined,
        legacyCookies.NFH,
      )
    ).status === 200,
  );
  const allExport = await request(
    "GET",
    "/api/export?scope=all&event=ALL",
    undefined,
    adminCookie,
  );
  check(
    "combined legacy/custom XLSX still works",
    allExport.status === 200 &&
      Buffer.from(await allExport.arrayBuffer())
        .subarray(0, 2)
        .toString() === "PK",
  );
} finally {
  await db.query("DELETE FROM clients WHERE id=ANY($1::int[])", [clientIds]);
  await db.query("DELETE FROM events WHERE code=ANY($1::text[])", [eventCodes]);
  await db.query("DELETE FROM users WHERE email=ANY($1::text[])", [qaEmails]);
  const after = await snapshot();
  assert.deepEqual(
    after,
    before,
    "Existing user/event/guest rows must be unchanged after test cleanup",
  );
  passed++;
  console.log("PASS original data and credentials unchanged after cleanup");
  console.log(
    JSON.stringify({
      integration_checks_passed: passed,
      local_only: true,
      existing_clients: before.clients.n,
    }),
  );
  await db.end();
}
