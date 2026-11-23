// ローカル検証専用の疑似バックエンド
// （Supabase Auth / Storage と Resend のうち、このアプリが使う部分だけを模倣する）
//
// `.env` は本番の Supabase と Resend を指しているため、`npm run dev` のまま
// 予約やメモの保存を試すと本番のお客様データを書き換え、実際にメールが送られる。
// 保存を伴う動作確認は、必ずこの疑似バックエンドにつないだ開発サーバーで行うこと。
// 使い方は docs/DATA-STORAGE.md の「ローカルでの動作確認」を参照。
//
// データはメモリ上のみ（再起動で初期状態に戻る）。本番には一切つながらない。
import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 54399);

// Supabase のユーザーIDは UUID 形式（admin.getUserById が UUID 以外を拒否する）
const ADMIN_ID = "00000000-0000-4000-8000-0000000000a1";
const CUST_A = "00000000-0000-4000-8000-0000000000c1";
const CUST_B = "00000000-0000-4000-8000-0000000000c2";
// 本人が書き換えられる側（user_metadata）にだけ管理者の印を付けた一般ユーザー。管理画面に入れてはいけない
const SELF_PROMOTED = "00000000-0000-4000-8000-0000000000c3";

const pw = () => "mock-" + randomBytes(9).toString("hex");
const creds = {
  admin: { email: "mock-admin@example.test", password: pw() },
  customerA: { email: "test-customer@example.test", password: pw() },
  customerB: { email: "other-customer@example.test", password: pw() },
  selfPromoted: { email: "self-promoted@example.test", password: pw() },
};

const baseUser = (id, email, fullName, createdAt, appMeta = {}) => ({
  id, aud: "authenticated", role: "authenticated", email,
  email_confirmed_at: createdAt, phone: "",
  app_metadata: { provider: "email", providers: ["email"], ...appMeta },
  user_metadata: { full_name: fullName },
  identities: [], created_at: createdAt, updated_at: createdAt,
});
const users = {
  [ADMIN_ID]: baseUser(ADMIN_ID, creds.admin.email, "テスト管理者", "2026-01-01T00:00:00.000Z", { role: "ADMIN" }),
  [CUST_A]: baseUser(CUST_A, creds.customerA.email, "検証 花子", "2026-04-26T00:00:00.000Z"),
  [CUST_B]: baseUser(CUST_B, creds.customerB.email, "別人 太郎", "2026-03-01T00:00:00.000Z"),
  [SELF_PROMOTED]: baseUser(SELF_PROMOTED, creds.selfPromoted.email, "自称 管理者", "2026-06-01T00:00:00.000Z"),
};
users[SELF_PROMOTED].user_metadata.role = "ADMIN";
const passwords = { [creds.admin.email]: [creds.admin.password, ADMIN_ID], [creds.customerA.email]: [creds.customerA.password, CUST_A], [creds.customerB.email]: [creds.customerB.password, CUST_B], [creds.selfPromoted.email]: [creds.selfPromoted.password, SELF_PROMOTED] };

// ---------------- シードデータ ----------------
const T0 = "2026-02-01T00:00:00.000Z";
const plan = (id, name, category, price, duration, maxAttendees, order) => ({
  id, name, category, description: null, price, duration, maxAttendees, isPublished: true, displayOrder: order, createdAt: T0, updatedAt: T0,
});
const pIndoor = plan("plan-next24-50", "GOLF NEXT24 50分", "REGULAR", 17000, 50, 1, 0);
const pRound = plan("plan-round", "ラウンドレッスン", "ROUND", 25000, 240, 3, 1);
// jst: "YYYY-MM-DDTHH:mm" を日本時間として UTC の ISO へ
const jst = (s) => new Date(`${s}:00+09:00`).toISOString();
const sch = (id, p, start, minutes, location, extra = {}) => ({
  id, lessonPlanId: p.id, lessonPlan: p, startAt: jst(start),
  endAt: new Date(new Date(jst(start)).getTime() + minutes * 60000).toISOString(),
  location, maxAttendees: p.maxAttendees, isAvailable: true, note: null, teeOffTime: null,
  allowAnyLocation: false, createdAt: T0, updatedAt: T0, ...extra,
});
const seedSchedules = [
  sch("sch-past", pIndoor, "2026-11-10T10:00", 50, "golf next24 中川（横浜）"),
  sch("sch-near", pIndoor, "2026-11-27T15:00", 50, "golf next24 中川（横浜）"),
  sch("sch-free-1", pIndoor, "2026-12-10T10:00", 50, "golf next24 中川（横浜）"),
  sch("sch-free-2", pIndoor, "2026-12-11T13:00", 50, "the golf house 京橋八丁堀（東京）"),
  sch("sch-booked", pIndoor, "2026-12-12T10:00", 50, "golf next24 中川（横浜）"),
  sch("sch-round", pRound, "2026-12-15T08:30", 240, "東名厚木カントリークラブ", { teeOffTime: "8:30", note: "プレー費別途" }),
  sch("sch-flex", pIndoor, "2026-12-16T10:00", 50, "場所リクエスト可", { allowAnyLocation: true }),
];
const snap = (s) => ({ planName: s.lessonPlan.name, planCategory: s.lessonPlan.category, planPrice: s.lessonPlan.price, planDuration: s.lessonPlan.duration, startAt: s.startAt, endAt: s.endAt, location: s.location, teeOffTime: s.teeOffTime });
const byId = (id) => seedSchedules.find((s) => s.id === id);
const rsv = (id, userId, scheduleId, status, at) => ({
  id, userId, userName: users[userId].user_metadata.full_name, userEmail: users[userId].email, scheduleId, status,
  concern: "ドライバーのスライスを直したいです", agreedCancelPolicy: true, agreedPhotoPost: false, optionSwingVideo: false,
  roundBookingType: null, roundParticipantCount: null, indoorLocationType: null, requestedLocation: null, requestedDuration: null,
  usesTicketPack: null, existingPlanId: null, requestedCourse: null, emergencyPhone: "090-0000-0000",
  totalPrice: byId(scheduleId).lessonPlan.price, scheduleSnapshot: snap(byId(scheduleId)),
  cancelledAt: null, cancelReason: null, createdAt: at, updatedAt: at,
});
const seedReservations = [
  rsv("rsv-1001", CUST_B, "sch-past", "CONFIRMED", "2026-11-01T03:00:00.000Z"),
  rsv("rsv-1002", CUST_A, "sch-near", "CONFIRMED", "2026-11-05T03:00:00.000Z"),
  rsv("rsv-1003", CUST_A, "sch-booked", "PENDING", "2026-11-20T03:00:00.000Z"),
];
const note = (id, userId, content, isPrivate, at) => ({ id, userId, lessonRecordId: null, content, isPrivate, createdAt: at, updatedAt: at });
const seedNotes = [
  note("inote-1001", CUST_A, "2026.5.1 チケット1回目\n\nドライバー\n○軽い棒で9時3時の素振り\n○流れないで放り投げるイメージ", false, "2026-05-02T07:34:00.000Z"),
  note("inote-2001", CUST_B, "別のお客様のメモ（この検証で変更されてはいけない）", false, "2026-06-10T03:00:00.000Z"),
  note("inote-1002", CUST_A, "【下書き】次回はアプローチ中心で進める。", true, "2026-10-09T08:46:00.000Z"),
];
const seedDrills = [
  { id: "drill-1001", userId: CUST_A, lessonRecordId: null, title: "9時3時の素振り", description: "毎日20回", videoUrl: null, status: "ASSIGNED", dueDate: null, createdAt: "2026-05-02T07:40:00.000Z", updatedAt: "2026-05-02T07:40:00.000Z" },
];

const objects = new Map(); // name -> { body, id, createdAt, updatedAt }
const put = (name, body) => {
  const now = new Date().toISOString();
  const prev = objects.get(name);
  objects.set(name, { body, id: prev?.id ?? randomUUID(), createdAt: prev?.createdAt ?? now, updatedAt: now });
};
const seedAll = () => {
  objects.clear();
  put("schedules.json", JSON.stringify(seedSchedules, null, 2));
  put("reservations.json", JSON.stringify(seedReservations, null, 2));
  put("instructor-notes.json", JSON.stringify(seedNotes, null, 2));
  put("drills.json", JSON.stringify(seedDrills, null, 2));
  // plans.json / profile.json / lesson-plans.json / notes.json / scores.json は「まだ無い」状態から始める
};
seedAll();

const state = {
  revoked: false,          // true: すべてのログインを無効扱い（セッション切れの再現）
  storageReadFail: false,  // データ本体の読み込みを 500 にする
  storageWriteFail: false, // データ本体の保存を 500 にする
  readFailCount: 0,        // 次の N 回だけ読み込みを 500 にする（再試行の確認用）
  slowMs: 0,               // ストレージ応答の遅延
  emails: [],
  log: [],
};
const refreshTokens = new Map(); // refresh_token -> userId
const isData = (name) => !name.startsWith("locks/") && !name.startsWith("backups/");

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function makeSession(user) {
  const now = Math.floor(Date.now() / 1000);
  const access_token = [
    b64u({ alg: "HS256", typ: "JWT" }),
    b64u({ sub: user.id, aud: "authenticated", role: "authenticated", email: user.email, iat: now, exp: now + 3600, session_id: "mock-session-" + user.id.slice(-2), app_metadata: user.app_metadata, user_metadata: user.user_metadata }),
    "mock-signature",
  ].join(".");
  const refresh_token = "mock-refresh-" + randomBytes(6).toString("hex");
  refreshTokens.set(refresh_token, user.id);
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token, user };
}
function userFromBearer(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? "");
  if (!m || state.revoked) return null;
  try {
    const payload = JSON.parse(Buffer.from(m[1].split(".")[1], "base64url").toString("utf8"));
    return users[payload.sub] ?? null;
  } catch { return null; }
}

function send(res, status, body) {
  const data = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS", "access-control-expose-headers": "*",
  });
  res.end(data);
}
const readBody = (req) => new Promise((resolve) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => resolve(Buffer.concat(c).toString("utf8"))); });
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = url.pathname;
  const body = req.method === "GET" || req.method === "OPTIONS" ? "" : await readBody(req);
  if (!p.startsWith("/__mock")) {
    state.log.push({ t: new Date().toISOString(), method: req.method, path: p + url.search, upsert: req.headers["x-upsert"] });
    if (state.log.length > 600) state.log.shift();
  }
  if (req.method === "OPTIONS") return send(res, 204);

  // ---- 検証用の操作・確認エンドポイント ----
  if (p === "/__mock/state") {
    const file = url.searchParams.get("file");
    if (file) return send(res, 200, objects.has(file) ? objects.get(file).body : "null");
    return send(res, 200, {
      flags: { revoked: state.revoked, storageReadFail: state.storageReadFail, storageWriteFail: state.storageWriteFail, readFailCount: state.readFailCount, slowMs: state.slowMs },
      files: [...objects.entries()].map(([name, o]) => ({ name, bytes: o.body.length })),
      counts: Object.fromEntries([...objects.entries()].filter(([n]) => isData(n)).map(([n, o]) => { const j = parse(o.body); return [n, Array.isArray(j) ? j.length : "object"]; })),
      emails: state.emails.map((e) => ({ t: e.t, to: e.to, subject: e.subject })),
      log: url.searchParams.has("log") ? state.log.slice(-Number(url.searchParams.get("log"))) : [],
    });
  }
  if (p === "/__mock/email") {
    const e = state.emails[Number(url.searchParams.get("i") ?? state.emails.length - 1)];
    return send(res, 200, e ?? null);
  }
  if (p === "/__mock/mode" && req.method === "POST") {
    const b = parse(body) ?? {};
    for (const k of ["revoked", "storageReadFail", "storageWriteFail"]) if (typeof b[k] === "boolean") state[k] = b[k];
    for (const k of ["readFailCount", "slowMs"]) if (typeof b[k] === "number") state[k] = b[k];
    return send(res, 200, { revoked: state.revoked, storageReadFail: state.storageReadFail, storageWriteFail: state.storageWriteFail, readFailCount: state.readFailCount, slowMs: state.slowMs });
  }
  if (p === "/__mock/clear" && req.method === "POST") { state.log.length = 0; state.emails.length = 0; return send(res, 200, { ok: true }); }
  if (p === "/__mock/reset" && req.method === "POST") { seedAll(); state.log.length = 0; state.emails.length = 0; Object.assign(state, { revoked: false, storageReadFail: false, storageWriteFail: false, readFailCount: 0, slowMs: 0 }); return send(res, 200, { ok: true }); }
  // データを直接書き換える（「別の端末で操作された」状況の再現用）
  if (p === "/__mock/patch" && req.method === "POST") {
    const b = parse(body) ?? {};
    const list = parse(objects.get(b.file)?.body ?? "null");
    if (!Array.isArray(list)) return send(res, 400, { error: "no such list" });
    const next = b.removeId ? list.filter((r) => r.id !== b.removeId) : list.map((r) => (r.id === b.id ? { ...r, ...b.set } : r));
    put(b.file, JSON.stringify(next, null, 2));
    return send(res, 200, { ok: true, count: next.length });
  }

  // ---- Auth (GoTrue) ----
  if (p === "/auth/v1/token" && req.method === "POST") {
    const grant = url.searchParams.get("grant_type");
    const b = parse(body) ?? {};
    if (grant === "password") {
      const hit = passwords[b.email];
      if (hit && hit[0] === b.password) return send(res, 200, makeSession(users[hit[1]]));
      return send(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
    }
    if (grant === "refresh_token") {
      const uid = refreshTokens.get(b.refresh_token);
      if (!uid || state.revoked) return send(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
      return send(res, 200, makeSession(users[uid]));
    }
    return send(res, 400, { code: 400, error_code: "validation_failed", msg: "unsupported grant" });
  }
  if (p === "/auth/v1/user" && req.method === "GET") {
    const u = userFromBearer(req);
    return u ? send(res, 200, u) : send(res, 403, { code: 403, error_code: "bad_jwt", msg: "invalid JWT: mock session revoked" });
  }
  if (p === "/auth/v1/logout") return send(res, 204);
  if (p === "/auth/v1/admin/users" && req.method === "GET") return send(res, 200, { users: Object.values(users), aud: "authenticated" });
  const adminUser = p.match(/^\/auth\/v1\/admin\/users\/([^/]+)$/);
  if (adminUser && req.method === "GET") {
    const u = users[decodeURIComponent(adminUser[1])];
    return u ? send(res, 200, u) : send(res, 404, { code: 404, error_code: "user_not_found", msg: "User not found" });
  }

  // ---- Storage ----
  if (p.startsWith("/storage/v1/") && state.slowMs > 0) await sleep(state.slowMs);
  if (p === "/storage/v1/object/list/app-data" && req.method === "POST") {
    const b = parse(body) ?? {};
    const prefix = b.prefix ? `${String(b.prefix).replace(/\/$/, "")}/` : "";
    const files = []; const folders = new Set();
    for (const [name, o] of objects) {
      if (!name.startsWith(prefix)) continue;
      const rest = name.slice(prefix.length);
      if (rest.includes("/")) folders.add(rest.split("/")[0]);
      else files.push({ name: rest, id: o.id, updated_at: o.updatedAt, created_at: o.createdAt, last_accessed_at: o.updatedAt, metadata: { size: Buffer.byteLength(o.body), mimetype: "application/json" } });
    }
    const dir = b.sortBy?.order === "desc" ? -1 : 1;
    const col = b.sortBy?.column === "created_at" ? "created_at" : "name";
    files.sort((x, y) => (x[col] < y[col] ? -dir : x[col] > y[col] ? dir : 0));
    const out = [...[...folders].map((name) => ({ name, id: null, updated_at: null, created_at: null, last_accessed_at: null, metadata: null })), ...files];
    return send(res, 200, out.slice(b.offset ?? 0, (b.offset ?? 0) + (b.limit ?? 100)));
  }
  if (p === "/storage/v1/object/app-data" && req.method === "DELETE") {
    const b = parse(body) ?? {};
    const removed = [];
    for (const name of b.prefixes ?? []) if (objects.delete(name)) removed.push({ name, bucket_id: "app-data" });
    return send(res, 200, removed);
  }
  const obj = p.match(/^\/storage\/v1\/object\/(?:authenticated\/|public\/)?app-data\/(.+)$/);
  if (obj) {
    const name = decodeURIComponent(obj[1]);
    if (req.method === "GET") {
      if (isData(name) && (state.storageReadFail || state.readFailCount > 0)) {
        if (state.readFailCount > 0) state.readFailCount--;
        return send(res, 500, { statusCode: "500", error: "Internal", message: "mock storage failure" });
      }
      return objects.has(name)
        ? send(res, 200, objects.get(name).body)
        : send(res, 400, { statusCode: "404", error: "not_found", message: "Object not found", code: "NoSuchKey" });
    }
    if (req.method === "POST" || req.method === "PUT") {
      if (isData(name) && state.storageWriteFail) return send(res, 500, { statusCode: "500", error: "Internal", message: "mock storage failure" });
      if (objects.has(name) && req.headers["x-upsert"] !== "true") return send(res, 400, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
      put(name, body);
      return send(res, 200, { Id: objects.get(name).id, Key: `app-data/${name}` });
    }
  }

  // ---- Resend ----
  if (p === "/resend/emails" && req.method === "POST") {
    const b = parse(body) ?? {};
    state.emails.push({ t: new Date().toISOString(), to: b.to, from: b.from, subject: b.subject, html: b.html });
    return send(res, 200, { id: `mock-email-${state.emails.length}` });
  }

  send(res, 404, { code: 404, msg: `mock: no handler for ${req.method} ${p}` });
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock backend listening on http://127.0.0.1:${PORT}`);
  console.log("ログイン情報（起動のたびに変わる・この疑似環境でのみ有効）:");
  for (const [role, c] of Object.entries(creds)) console.log(`  ${role}: ${c.email} / ${c.password}`);
});
