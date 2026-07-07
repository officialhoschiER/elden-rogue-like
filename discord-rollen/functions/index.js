/* ============================================================
   ELDEN ROGUE — Discord-Rollen-Bot (Firebase Cloud Function)

   Läuft als "Interactions Endpoint" für Discord-Slash-Commands —
   es braucht KEINEN dauerhaft laufenden Bot-Server.

   /verify CODE  -> verknüpft den Discord-Nutzer mit seinem
                    Elden-Rogue-Cloud-Profil (Code aus den
                    Spiel-Einstellungen) und vergibt Rollen.
   /refresh      -> prüft die Rollen erneut (z. B. nach neuen Erfolgen).

   Setup: siehe ../SETUP-ANLEITUNG.md
   ============================================================ */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { verifyKey, InteractionType, InteractionResponseType } = require("discord-interactions");

admin.initializeApp();

/* ------------------------------------------------------------
   ROLLEN-ZUORDNUNG: Achievement-ID -> Discord-Rollen-ID
   Rollen-IDs kopieren: Discord > Servereinstellungen > Rollen >
   Rechtsklick auf die Rolle > "ID kopieren" (Entwicklermodus an).
   Zeilen mit "HIER_ROLLEN_ID" werden einfach übersprungen —
   du kannst also klein anfangen und später Rollen ergänzen.
   ------------------------------------------------------------ */
const ROLLEN_MAPPING = {
  elden_lord:   "HIER_ROLLEN_ID",   // Eldenbestie besiegt (Run abgeschlossen = Elden Lord)
  dlc_consort:  "HIER_ROLLEN_ID",   // Verheißener Gemahl Radahn im DLC besiegt — NICHT der Turm-"Baby PCR"!
  // Hinweis: Die "Patch-Benachrichtigung"-Rolle läuft NICHT über diesen Bot,
  // sondern als selbst-vergebene Rolle (Reaction-Role / Discord-Onboarding) — siehe Anleitung.
};
const ROLLE_100_PROZENT = "HIER_ROLLEN_ID";   // (optional, aus) 100%-Club — leer lassen = wird übersprungen

const CODE_GUELTIG_MS = 15 * 60 * 1000;   // Codes aus dem Spiel gelten 15 Minuten

const BOT_TOKEN = defineSecret("DISCORD_BOT_TOKEN");
const PUBLIC_KEY = defineSecret("DISCORD_PUBLIC_KEY");

exports.discordInteractions = onRequest(
  { secrets: [BOT_TOKEN, PUBLIC_KEY], region: "europe-west1" },
  async (req, res) => {
    // 1) Signatur prüfen (Pflicht — sonst akzeptiert Discord den Endpoint nicht)
    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");
    const gueltig = signature && timestamp &&
      (await verifyKey(req.rawBody, signature, timestamp, PUBLIC_KEY.value()));
    if (!gueltig) { res.status(401).send("Ungültige Signatur"); return; }

    const i = req.body;

    // 2) Discord-Ping (Endpoint-Verifizierung)
    if (i.type === InteractionType.PING) { res.json({ type: InteractionResponseType.PONG }); return; }

    // 3) Slash-Commands
    if (i.type === InteractionType.APPLICATION_COMMAND) {
      const name = i.data.name;
      const discordUserId = i.member && i.member.user ? i.member.user.id : (i.user && i.user.id);
      const guildId = i.guild_id;
      try {
        if (name === "verify") {
          const roh = ((i.data.options || [])[0] || {}).value || "";
          const code = String(roh).toUpperCase().replace(/[^A-Z0-9]/g, "");
          res.json(ephemer(await verarbeiteVerify(code, discordUserId, guildId)));
          return;
        }
        if (name === "refresh") {
          res.json(ephemer(await verarbeiteRefresh(discordUserId, guildId)));
          return;
        }
      } catch (e) {
        console.error("[discord-rollen]", e);
        res.json(ephemer("⚠️ Da ist etwas schiefgegangen. Versuch es gleich noch einmal."));
        return;
      }
    }

    res.status(400).send("Unbekannter Interaktionstyp");
  }
);

/* Antwort, die nur der Nutzer selbst sieht (ephemeral) */
function ephemer(text) {
  return { type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: { content: text, flags: 64 } };
}

async function verarbeiteVerify(code, discordUserId, guildId) {
  if (!code) return "Bitte gib einen Code an: `/verify CODE` — den Code erzeugst du im Spiel unter **Einstellungen → Discord verknüpfen**.";

  const snap = await admin.firestore().collection("users")
    .where("discordLinkCode", "==", code).limit(1).get();
  if (snap.empty) return "❌ Code nicht gefunden. Erzeuge im Spiel (Einstellungen → Discord verknüpfen) einen neuen.";

  const doc = snap.docs[0];
  const d = doc.data();
  if (!d.discordLinkTs || Date.now() - d.discordLinkTs > CODE_GUELTIG_MS) {
    return "⌛ Der Code ist abgelaufen — erzeuge im Spiel einen neuen und versuch es direkt danach.";
  }

  // Verknüpfung speichern, Code verbrauchen
  await doc.ref.set({
    discordUserId: discordUserId,
    discordLinkCode: admin.firestore.FieldValue.delete(),
    discordLinkTs: admin.firestore.FieldValue.delete()
  }, { merge: true });

  const rollen = await vergebeRollen(d, discordUserId, guildId);
  const name = d.displayName || "Befleckter";
  return rollen.length
    ? "✅ Verknüpft mit **" + name + "**! Deine Rollen: " + rollen.map((r) => "<@&" + r + ">").join(", ")
    : "✅ Verknüpft mit **" + name + "**! Noch keine Rollen verdient — die Halbgötter warten auf dich.";
}

async function verarbeiteRefresh(discordUserId, guildId) {
  const snap = await admin.firestore().collection("users")
    .where("discordUserId", "==", discordUserId).limit(1).get();
  if (snap.empty) return "❌ Kein verknüpftes Konto gefunden. Erzeuge im Spiel einen Code und nutze zuerst `/verify`.";

  const rollen = await vergebeRollen(snap.docs[0].data(), discordUserId, guildId);
  return rollen.length
    ? "✅ Rollen geprüft: " + rollen.map((r) => "<@&" + r + ">").join(", ")
    : "Alles aktuell — noch keine (neuen) Rollen verdient.";
}

/* Vergibt alle verdienten Rollen (PUT ist idempotent — doppelt vergeben schadet nicht) */
async function vergebeRollen(userDoc, discordUserId, guildId) {
  const achievements = userDoc.achievements || [];
  const verdient = [];

  for (const [achId, rolleId] of Object.entries(ROLLEN_MAPPING)) {
    if (rolleId.startsWith("HIER")) continue;             // noch nicht konfiguriert
    if (achievements.includes(achId)) verdient.push(rolleId);
  }
  if (!ROLLE_100_PROZENT.startsWith("HIER") && (userDoc.allAchDate || 0) > 0) {
    verdient.push(ROLLE_100_PROZENT);
  }

  const vergeben = [];
  for (const rolleId of verdient) {
    const r = await fetch(
      "https://discord.com/api/v10/guilds/" + guildId + "/members/" + discordUserId + "/roles/" + rolleId,
      { method: "PUT", headers: { Authorization: "Bot " + BOT_TOKEN.value() } }
    );
    if (r.ok || r.status === 204) vergeben.push(rolleId);
    else console.warn("[discord-rollen] Rolle fehlgeschlagen:", rolleId, r.status, await r.text());
  }
  return vergeben;
}
