# Discord-Rollen für Elden Rogue — Setup-Anleitung

So bekommen deine Spieler **automatisch Discord-Rollen** für ihre Erfolge
(z. B. „Eldenbiest-Bezwinger"). Es läuft komplett über eine Firebase Cloud
Function — **kein eigener Bot-Server nötig**, Free Tier reicht.

**So fühlt es sich für den Spieler an:**
1. Im Spiel: Einstellungen → „Discord verknüpfen" → Code erzeugen (z. B. `K7M2PX`)
2. Auf deinem Discord: `/verify K7M2PX` eintippen
3. Der Bot antwortet (nur für ihn sichtbar) und vergibt sofort die verdienten Rollen
4. Später nach neuen Erfolgen: `/refresh`

Einmaliges Setup für dich: ca. 30–45 Minuten. Schritt für Schritt:

---

## Schritt 1 — Discord-App & Bot anlegen (~10 Min)

1. https://discord.com/developers/applications → **New Application** → Name z. B. „Elden Rogue"
2. Notiere dir auf **General Information** die **Application ID** und den **Public Key**
3. Links **Bot** → **Reset Token** → Token kopieren und sicher aufbewahren (GEHEIM!)
4. Bot auf deinen Server einladen: Links **OAuth2 → URL Generator** →
   Scopes: `bot` + `applications.commands` → Bot Permissions: **Manage Roles** →
   generierte URL öffnen und deinen Server auswählen

## Schritt 2 — Rollen im Discord anlegen (~5 Min)

1. Discord → Servereinstellungen → Rollen → Rollen anlegen, z. B.:
   „👑 Elden Lord", „🔥 Wahrer Elden Lord", „🌸 Klinge Miquellas",
   „🩸 Miquellas Erwecker", „🗼 Meister des Turms", „💯 100%-Club"
2. **Wichtig:** Die Rolle des Bots (heißt wie deine App) muss in der Rollen-Liste
   ÜBER den Rollen stehen, die er vergeben soll (einfach hochziehen).
3. Entwicklermodus aktivieren (Einstellungen → Erweitert), dann pro Rolle:
   Rechtsklick → **ID kopieren**
4. In `functions/index.js` das `ROLLEN_MAPPING` ausfüllen (die kopierten IDs
   anstelle von `HIER_ROLLEN_ID` einsetzen). Nicht gebrauchte Zeilen einfach
   stehen lassen — sie werden übersprungen.

## Schritt 3 — Slash-Commands registrieren (~5 Min)

1. In `register-commands.js` die drei Konstanten oben ausfüllen
   (Application ID, Server-ID per Rechtsklick auf den Server, Bot-Token)
2. Im Ordner `discord-rollen/` ausführen: `node register-commands.js`
3. Danach das Bot-Token **wieder aus der Datei löschen** (Datei ist zwar in
   .gitignore nicht enthalten — Code ja, Secrets nie committen!)

## Schritt 4 — Cloud Function deployen (~15 Min)

Voraussetzung: Node.js 20+ und die Firebase CLI (`npm install -g firebase-tools`).

```
cd discord-rollen
firebase login
firebase use elden-rogue          # deine Projekt-ID aus der Firebase-Konsole
cd functions && npm install && cd ..

# Secrets hinterlegen (fragt interaktiv nach dem Wert):
firebase functions:secrets:set DISCORD_BOT_TOKEN
firebase functions:secrets:set DISCORD_PUBLIC_KEY

firebase deploy --only functions
```

Am Ende zeigt dir die CLI die **Function-URL**, etwa:
`https://discordinteractions-xxxxx-ew.a.run.app`

> Hinweis: Beim ersten Deploy fragt Firebase evtl., ob du auf den
> Blaze-Plan (Pay-as-you-go) wechseln willst — für Cloud Functions nötig,
> aber bei dieser Nutzung bleibst du praktisch immer bei 0 €.

## Schritt 5 — Endpoint bei Discord eintragen (~2 Min)

1. Developer Portal → deine App → **General Information** →
   **Interactions Endpoint URL** → die Function-URL aus Schritt 4 eintragen → Save
2. Discord schickt sofort einen Test-Ping — wenn die Function korrekt deployed
   ist, wird gespeichert. (Fehler? → `firebase functions:log` ansehen.)

## Schritt 6 — Testen 🎉

1. Im Spiel mit Google anmelden → Einstellungen → „Discord verknüpfen" → Code erzeugen
2. Auf deinem Server `/verify DEINCODE`
3. Rollen da? Fertig. Sonst: `firebase functions:log`

---

## Wie es technisch funktioniert (fürs Verständnis)

- Das Spiel schreibt beim Klick auf „Code erzeugen" ein Feld `discordLinkCode`
  in das Firestore-Dokument des Spielers (`users/{uid}`) — gültig 15 Minuten.
- `/verify` sucht dieses Feld, merkt sich die `discordUserId` im selben Dokument
  und löscht den Code (einmal verwendbar).
- Die Rollen werden aus dem `achievements`-Array des Dokuments abgeleitet
  (das synchronisiert dein Spiel ohnehin schon in die Cloud) und per
  Discord-REST-API vergeben. `/refresh` macht dasselbe erneut.
- Die Function nutzt das Admin SDK — deine Firestore-Sicherheitsregeln
  bleiben unangetastet.

## Später ausbaubar (wenn du magst)

- **Hall-of-Fame-Webhook:** Firestore-Trigger, der bei jedem Run-Abschluss
  automatisch in einen Discord-Kanal postet („🏆 Kevin hat das Eldenbiest
  bezwungen!") — sag Bescheid, das sind ~20 Zeilen in derselben Function.
- **Automatischer /refresh:** Firestore-Trigger auf `users/{uid}`, der bei
  neuen Achievements die Rollen ohne Zutun des Spielers aktualisiert.
- Mehr Rollen: einfach neue Zeilen ins `ROLLEN_MAPPING` (jede Achievement-ID
  aus eldenrogue-online.js funktioniert).
