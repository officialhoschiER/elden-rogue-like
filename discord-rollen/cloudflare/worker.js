/* ============================================================
   ELDEN ROGUE — Discord-Rollen-Bot (Cloudflare Worker)

   Kostenlose, kartenfreie Alternative zur Firebase-Function.
   Gleiche Slash-Commands (/verify, /refresh), aber:
     • Signaturprüfung via Web-Crypto (Ed25519)
     • Firestore-Zugriff via REST-API + Service-Account-Token
     • Rollen via Discord-REST-API

   Setup: siehe SETUP-CLOUDFLARE.md
   Secrets (via `wrangler secret put NAME`):
     DISCORD_PUBLIC_KEY   – Developer Portal > General Information
     DISCORD_BOT_TOKEN    – Developer Portal > Bot (GEHEIM)
     GCP_SERVICE_ACCOUNT  – kompletter JSON-Inhalt des Firebase-
                            Service-Account-Schlüssels (GEHEIM)
   ============================================================ */

const PROJECT_ID = "elden-rogue";

/* Achievement-ID -> Discord-Rollen-ID */
const ROLLEN_MAPPING = {
  elden_lord:  "1524146710199402596", // Eldenbestie besiegt (Run abgeschlossen)
  dlc_consort: "1524146852524720208", // DLC-PCR (Radahn, Gemahl Miquellas) besiegt
};
/* Rolle, die JEDER Verknüpfte bekommt (Patch-Pings). "" = aus. */
const ROLLE_VERIFIZIERT = "1515004004504043563";

const CODE_GUELTIG_MS = 15 * 60 * 1000;

/* ---------- Discord Interaction-Konstanten ---------- */
const T_PING = 1, T_COMMAND = 2;
const R_PONG = 1, R_MESSAGE = 4;
const FLAG_EPHEMERAL = 64;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("Elden Rogue Discord Bot", { status: 200 });

    const rawBody = await request.text();

    // 1) Signatur prüfen (Pflicht — sonst akzeptiert Discord den Endpoint nicht)
    const ok = await verifySignature(request, rawBody, env.DISCORD_PUBLIC_KEY);
    if (!ok) return new Response("Ungültige Signatur", { status: 401 });

    const i = JSON.parse(rawBody);

    // 2) Discord-Ping (Endpoint-Verifizierung)
    if (i.type === T_PING) return json({ type: R_PONG });

    // 3) Slash-Commands
    if (i.type === T_COMMAND) {
      const name = i.data && i.data.name;
      const discordUserId = i.member && i.member.user ? i.member.user.id : (i.user && i.user.id);
      const guildId = i.guild_id;
      try {
        if (name === "verify") {
          const roh = ((i.data.options || [])[0] || {}).value || "";
          const code = String(roh).toUpperCase().replace(/[^A-Z0-9]/g, "");
          return json(msg(await verarbeiteVerify(code, discordUserId, guildId, env)));
        }
        if (name === "refresh") {
          return json(msg(await verarbeiteRefresh(discordUserId, guildId, env)));
        }
      } catch (e) {
        console.error("[discord-rollen]", e && e.stack ? e.stack : e);
        return json(msg("⚠️ Da ist etwas schiefgegangen. Versuch es gleich noch einmal."));
      }
    }
    return new Response("Unbekannter Interaktionstyp", { status: 400 });
  }
};

/* Antwort nur für den Nutzer selbst (ephemeral) */
function msg(text) { return { type: R_MESSAGE, data: { content: text, flags: FLAG_EPHEMERAL } }; }
function json(obj) { return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } }); }

/* ============================================================
   Slash-Command-Logik
   ============================================================ */
async function verarbeiteVerify(code, discordUserId, guildId, env) {
  if (!code) return "Bitte gib einen Code an: `/verify CODE` — den Code erzeugst du im Spiel unter **Einstellungen → Discord verknüpfen**.";

  const token = await getAccessToken(env);
  const treffer = await firestoreQuery("discordLinkCode", code, token);
  if (!treffer) return "❌ Code nicht gefunden. Erzeuge im Spiel (Einstellungen → Discord verknüpfen) einen neuen.";

  const d = feldWerte(treffer.fields);
  if (!d.discordLinkTs || Date.now() - d.discordLinkTs > CODE_GUELTIG_MS) {
    return "⌛ Der Code ist abgelaufen — erzeuge im Spiel einen neuen und versuch es direkt danach.";
  }

  // Verknüpfung speichern + Code verbrauchen (discordUserId setzen, LinkCode/Ts löschen)
  await firestorePatch(
    treffer.name,
    { discordUserId: { stringValue: discordUserId } },
    ["discordUserId", "discordLinkCode", "discordLinkTs"],
    token
  );

  const rollen = await vergebeRollen(d, discordUserId, guildId, env);
  const name = d.displayName || "Befleckter";
  return rollen.length
    ? "✅ Verknüpft mit **" + name + "**! Deine Rollen: " + rollen.map((r) => "<@&" + r + ">").join(", ")
    : "✅ Verknüpft mit **" + name + "**! Noch keine Rollen verdient — die Halbgötter warten auf dich.";
}

async function verarbeiteRefresh(discordUserId, guildId, env) {
  const token = await getAccessToken(env);
  const treffer = await firestoreQuery("discordUserId", discordUserId, token);
  if (!treffer) return "❌ Kein verknüpftes Konto gefunden. Erzeuge im Spiel einen Code und nutze zuerst `/verify`.";

  const rollen = await vergebeRollen(feldWerte(treffer.fields), discordUserId, guildId, env);
  return rollen.length
    ? "✅ Rollen geprüft: " + rollen.map((r) => "<@&" + r + ">").join(", ")
    : "Alles aktuell — noch keine (neuen) Rollen verdient.";
}

/* Vergibt alle verdienten Rollen (PUT ist idempotent) */
async function vergebeRollen(d, discordUserId, guildId, env) {
  const achievements = d.achievements || [];
  const verdient = [];

  if (ROLLE_VERIFIZIERT && !ROLLE_VERIFIZIERT.startsWith("HIER")) verdient.push(ROLLE_VERIFIZIERT);
  for (const [achId, rolleId] of Object.entries(ROLLEN_MAPPING)) {
    if (rolleId.startsWith("HIER")) continue;
    if (achievements.includes(achId)) verdient.push(rolleId);
  }

  const vergeben = [];
  for (const rolleId of verdient) {
    const r = await fetch(
      "https://discord.com/api/v10/guilds/" + guildId + "/members/" + discordUserId + "/roles/" + rolleId,
      { method: "PUT", headers: { Authorization: "Bot " + env.DISCORD_BOT_TOKEN } }
    );
    if (r.ok || r.status === 204) vergeben.push(rolleId);
    else console.warn("[discord-rollen] Rolle fehlgeschlagen:", rolleId, r.status, await r.text());
  }
  return vergeben;
}

/* ============================================================
   Firestore REST
   ============================================================ */
const FS_BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents";

/* Erstes Dokument aus "users", bei dem feld == wert. Gibt {name, fields} oder null. */
async function firestoreQuery(feld, wert, token) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: "users" }],
      where: { fieldFilter: { field: { fieldPath: feld }, op: "EQUAL", value: { stringValue: wert } } },
      limit: 1
    }
  };
  const r = await fetch(FS_BASE + ":runQuery", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("Firestore runQuery " + r.status + ": " + (await r.text()));
  const arr = await r.json();
  const hit = (arr || []).find((e) => e && e.document);
  return hit ? hit.document : null;
}

/* Setzt/löscht Felder. name = voller Dokumentpfad; feldMask = zu setzende+zu löschende Feldnamen.
   Felder in der Maske, die NICHT in "fields" stehen, werden von Firestore gelöscht. */
async function firestorePatch(name, fields, feldMask, token) {
  const url = "https://firestore.googleapis.com/v1/" + name +
    "?" + feldMask.map((f) => "updateMask.fieldPaths=" + encodeURIComponent(f)).join("&");
  const r = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ fields })
  });
  if (!r.ok) throw new Error("Firestore patch " + r.status + ": " + (await r.text()));
  return r.json();
}

/* Wandelt Firestore-Feld-Objekte in einfache JS-Werte (nur was wir brauchen). */
function feldWerte(fields) {
  fields = fields || {};
  const out = {};
  out.displayName = fields.displayName ? fields.displayName.stringValue : "";
  out.discordLinkTs = fields.discordLinkTs ? Number(fields.discordLinkTs.integerValue || fields.discordLinkTs.doubleValue || 0) : 0;
  out.allAchDate = fields.allAchDate ? Number(fields.allAchDate.integerValue || 0) : 0;
  out.achievements = [];
  if (fields.achievements && fields.achievements.arrayValue && fields.achievements.arrayValue.values) {
    out.achievements = fields.achievements.arrayValue.values.map((v) => v.stringValue).filter(Boolean);
  }
  return out;
}

/* ============================================================
   Google OAuth: Service-Account-JWT -> Access-Token (Scope datastore)
   ============================================================ */
async function getAccessToken(env) {
  const sa = JSON.parse(env.GCP_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsigned = b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(claim));
  const key = await importPrivateKey(sa.private_key);
  const sigBuf = await crypto.subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + "." + b64urlBytes(new Uint8Array(sigBuf));

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt
  });
  if (!r.ok) throw new Error("OAuth-Token " + r.status + ": " + (await r.text()));
  const j = await r.json();
  return j.access_token;
}

async function importPrivateKey(pem) {
  const clean = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const der = base64ToBytes(clean);
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/* ============================================================
   Signaturprüfung (Ed25519) + Hilfsfunktionen
   ============================================================ */
async function verifySignature(request, rawBody, publicKeyHex) {
  const sig = request.headers.get("X-Signature-Ed25519");
  const ts = request.headers.get("X-Signature-Timestamp");
  if (!sig || !ts || !publicKeyHex) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(publicKeyHex), { name: "Ed25519" }, false, ["verify"]);
    const data = new TextEncoder().encode(ts + rawBody);
    return await crypto.subtle.verify({ name: "Ed25519" }, key, hexToBytes(sig), data);
  } catch (e) {
    console.error("[verify]", e);
    return false;
  }
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlBytes(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64url(str) {
  return b64urlBytes(new TextEncoder().encode(str));
}
