/* ============================================================
   Registriert die Slash-Commands /verify und /refresh auf DEINEM
   Discord-Server. Einmalig ausführen (und nach Command-Änderungen):

     1) Die drei Konstanten unten ausfüllen
     2) node register-commands.js

   Guild-Commands sind sofort verfügbar (globale bräuchten ~1 Std).
   ============================================================ */

const APP_ID = "HIER_APPLICATION_ID";   // Discord Developer Portal > General Information
const GUILD_ID = "HIER_SERVER_ID";      // Rechtsklick auf deinen Server > "ID kopieren"
const BOT_TOKEN = "HIER_BOT_TOKEN";     // Developer Portal > Bot > Token (GEHEIM halten!)

const commands = [
  {
    name: "verify",
    description: "Elden-Rogue-Konto verknüpfen (Code aus den Spiel-Einstellungen)",
    options: [
      { name: "code", description: "Der 6-stellige Code aus dem Spiel", type: 3, required: true }
    ]
  },
  {
    name: "refresh",
    description: "Elden-Rogue-Rollen neu prüfen (nach neuen Erfolgen)"
  }
];

fetch("https://discord.com/api/v10/applications/" + APP_ID + "/guilds/" + GUILD_ID + "/commands", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: "Bot " + BOT_TOKEN },
  body: JSON.stringify(commands)
}).then(async (r) => {
  console.log(r.ok ? "✅ Commands registriert!" : "❌ Fehler " + r.status);
  console.log(await r.text());
});
