/* ============================================================
   Registriert die Slash-Commands /verify und /refresh auf DEINEM
   Discord-Server. Einmalig ausführen (und nach Command-Änderungen):

     1) Die drei Konstanten unten ausfüllen
     2) node register-commands.js

   Guild-Commands sind sofort verfügbar (globale bräuchten ~1 Std).
   ============================================================ */

const APP_ID = "1524143492815781898";   // Discord Developer Portal > General Information
const GUILD_ID = "861966344786673664";  // Rechtsklick auf deinen Server > "ID kopieren"
// Token kommt aus der Terminal-Variable DISCORD_BOT_TOKEN (nichts in die Datei schreiben!):
//   PowerShell:  $env:DISCORD_BOT_TOKEN="dein-token"; node register-commands.js
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "HIER_BOT_TOKEN";

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
  },
  {
    name: "stats",
    description: "Zeige deine Elden-Rogue-Statistik"
  },
  {
    name: "leaderboard",
    description: "Zeige die Top-Spieler von Elden Rogue"
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
