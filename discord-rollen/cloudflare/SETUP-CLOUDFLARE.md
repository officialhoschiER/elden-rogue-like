# Discord-Rollen-Bot auf Cloudflare Workers — Setup (gratis, keine Kreditkarte)

Kostenlose Alternative zur Firebase-Function. Der Worker macht dasselbe
(`/verify`, `/refresh`, Rollen vergeben), braucht aber **kein Blaze-Plan
und keine hinterlegte Karte**.

Was du brauchst: ein (kostenloses) Cloudflare-Konto und einen Firebase-
**Service-Account-Schlüssel** (damit der Worker deine Datenbank lesen darf).
Einmaliges Setup: ~20–30 Min.

---

## Schritt 1 — Cloudflare-Konto + Wrangler (~5 Min)

1. Kostenloses Konto auf https://dash.cloudflare.com/sign-up (keine Karte nötig).
2. Wrangler (das Cloudflare-CLI) ist schon per npm nutzbar. Im Ordner
   `discord-rollen/cloudflare/` anmelden:
   ```
   npx wrangler login
   ```
   Öffnet den Browser → Zugriff erlauben.

## Schritt 2 — Firebase-Service-Account-Schlüssel holen (~3 Min)

Der Worker greift per REST auf deine Firestore-Datenbank zu und braucht dafür
einen Dienstkonto-Schlüssel (rein lesend/schreibend auf deine DB, kein Blaze nötig):

1. Firebase-Konsole → ⚙️ **Projekteinstellungen → Dienstkonten**
2. **Neuen privaten Schlüssel generieren** → es lädt eine **JSON-Datei** herunter.
3. Diese Datei **geheim halten** (nicht committen!). Ihr Inhalt kommt gleich als Secret.

## Schritt 3 — Secrets setzen (~5 Min)

Im Ordner `discord-rollen/cloudflare/` nacheinander:

```
npx wrangler secret put DISCORD_PUBLIC_KEY
```
→ den **Public Key** (Developer Portal → General Information) einfügen.

```
npx wrangler secret put DISCORD_BOT_TOKEN
```
→ den **(neuen) Bot-Token** einfügen.

Für die **mehrzeilige** Service-Account-JSON nicht einfügen (würde abgeschnitten),
sondern die Datei direkt einlesen — ersetze den Pfad durch den echten Speicherort:
```
npx wrangler secret put GCP_SERVICE_ACCOUNT < "C:\Users\levin\Downloads\elden-rogue-XXXX.json"
```
(So landet die komplette Datei sicher als Secret — egal wie viele Zeilen.)

## Schritt 4 — Deployen (~2 Min)

```
npx wrangler deploy
```
Am Ende zeigt dir Wrangler die **URL** deines Workers, z. B.:
`https://elden-rogue-discord.DEIN-SUBDOMAIN.workers.dev`

## Schritt 5 — Slash-Commands registrieren (~3 Min)

Einmalig (hostet nichts, ruft nur die Discord-API):

1. In `../register-commands.js` oben den **(neuen) Bot-Token** einsetzen
   (Application ID + Server-ID stehen schon drin).
2. Ausführen:
   ```
   node ../register-commands.js
   ```
3. Danach den Token **wieder aus der Datei löschen**.

## Schritt 6 — Endpoint bei Discord eintragen (~2 Min)

1. Developer Portal → deine App → **General Information** →
   **Interactions Endpoint URL** → die Worker-URL aus Schritt 4 eintragen → **Save**.
2. Discord schickt sofort einen Test-Ping — wird gespeichert, wenn der Worker
   korrekt läuft. (Fehler? → `npx wrangler tail` zeigt die Live-Logs.)

## Schritt 7 — Testen 🎉

1. Im Spiel mit Google anmelden → Einstellungen → „Discord verknüpfen" → Code erzeugen
2. Auf deinem Server `/verify DEINCODE`
3. Rollen da? Fertig. Sonst live mitschauen mit `npx wrangler tail`.

---

## Kosten

Cloudflare Workers Free: **100.000 Anfragen/Tag** gratis, **keine Karte**.
Ein Discord-Bot liegt weit darunter → **0 €**, ohne Zahlungsdaten.

## Rollen ändern / ergänzen

Rollen-IDs stehen oben in `worker.js` (`ROLLEN_MAPPING` + `ROLLE_VERIFIZIERT`).
Nach Änderungen einfach erneut `npx wrangler deploy`.
