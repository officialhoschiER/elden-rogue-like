# 🗺️ DLC „Land des Schattens" — Ablauf-Sheet

> Lebendes Konzeptdokument. **A) Ist-Stand (im Code)** · **B) Neue Vision (Hoschi)** · **C) Offene Fragen**.
> Stand: dev-Branch.

---

## A) IST-STAND (aktuell im Code gebaut)

```
[Mohg 2. Sieg] → "Verwelkte Hand" ─┬─ Run vollenden (normales Ende)
                                    └─ Hand berühren ↓
① Gräberebene ──── Boss: Tanzlöwenbiest
② Castle Ensis ─── Boss: Rellana
        ├─ HITLESS → Wahl: Abgrundwald | Rauh
        └─ getroffen → Rauh
③A Abgrundwald ─── Boss: Midra (Wahnsinn-Mechanik)  → Enir-Ilim
③B Ruinen v. Rauh ─ Boss: Romina (Scharlachfäule)
        ├─ Gold-Pfad exakt → Wahl: Fingerruinen(geheim) | Enir-Ilim
        └─ sonst → Enir-Ilim
④ Enir-Ilim ────── Boss: Gemahl Radahn → 🏆 Haupt-Ende
★ Fingerruinen ─── Boss: Metyr → 🏆 Geheim-Ende (Einbahn-Gitter, 3 Finger)
```
- **Torbögen (Gräberebene):** 3× durchspringen → Wolfsgeheul → setzt nur ein **Flag** für einen geplanten Secret Boss. **Aktuell keine echte Funktion dahinter.**
- Region-Stufen: Gravesite 9 · Ensis 10 · Abgrundwald/Rauh 11 · Enir-Ilim 12.

---

## B) NEUE VISION (Hoschis Redesign)

**Kernidee:** Die **3 Tore** entscheiden das Mittelgebiet. Beide münden in **Messmers Festung** (mit „Gebiet-kippt"-Gimmick). Danach 2 Wege: **Garten → Metyr** (geheim) oder **Ruinen → Enir-Ilim** (Haupt). Metyr ist mehrfach gated.

```
① Gräberebene (3 Tore) ── Boss: Tanzlöwenbiest
② Castle Ensis ────────── Boss: Rellana
      ├─ 3 Tore gemacht → ③A Waldgebiet  (Blaidd; versteckter Fingercreeper → FINGER MIMIC)
      └─ sonst          → ③B Gruselwald
④ Festung von Messmer
      • Aufstieg (normal) → oben KEIN Boss, sondern ein SCHALTER
      • Schalter KIPPT das Gebiet → Abstieg mit neuem Layout → unten: Boss MESSMER
      • auf dem Abstieg: Knoten STATUE → beten → Geräusch → schaltet den GARTEN frei
   danach 2 Wege:
      ├─ Ruinen v. Rauh (Romina) → Enir-Ilim → Gemahl Radahn ────────── 🏆 Haupt-Ende
      └─ Garten (nur wenn an Statue gebetet)
             └─ am Ende: FINGER MIMIC vorhanden?
                   ├─ ja  → Gebiet der Finger (Wurm-Gegner) → Metyr ── 🏆 Geheim-Ende
                   └─ nein → "hier ist nichts" → Enir-Ilim (→ Radahn)
```
*Beide Wege sind damit gleich lang: Ruinen+Enir ↔ Garten+Gebiet der Finger.*

> 🖐 **Metyr braucht 3 Schlösser:** (1) **3 Tore** → Waldgebiet → **Fingercreeper** → **Finger Mimic**, (2) an der **Statue** in Messmers Abstieg **beten** → Garten frei, (3) im **Garten** die Finger benutzen. Fehlt eins → man landet in Enir-Ilim.

### Die Etappen
- **① Gräberebene** — durch die **3 Tore** springen entscheidet das Mittelgebiet.
- **② Castle Ensis (Rellana)** — danach die Verzweigung. *(Hitless-Mechanik entfällt.)*
- **③A Waldgebiet** *(3 Tore)* — Blaidd hilft rein. **Alle Knoten-ICONS sind Bäume** (optische Tarnung) — die **Beschreibungen bleiben ehrlich** und sagen, was dahinter steckt (wer liest, findet's). Einer ist heimlich der **Fingercreeper** → dropt die **Finger Mimic** (Pflicht für Metyr). Region-Boss am Ende: *offen (Bären-NPC?)* → Messmer.
- **③B Gruselwald** *(keine Tore)* — Katakomben-Horror → Messmer.
- **④ Festung von Messmer (NEU — Gebiet kippt):**
  - Erst normaler **Aufstieg** — aber oben **kein Boss**, sondern ein **Schalter**.
  - Schalter **kippt die ganze Festung**: ab jetzt geht's von oben **hinab**, Wege + Aufteilung ändern sich komplett *(Abstieg-Layout, mein Vorschlag: **3-4-2-4-3 → Boss**)*.
  - Auf dem Abstieg: neuer Knoten **Statue** → davor **beten** → **Geräusch** → schaltet (nach Messmer) den **Garten** frei.
  - Unten: **Boss Messmer**.
- **Nach Messmer — 2 Wege:**
  - **Ruinen** → Rauh (Romina) → **Enir-Ilim** → **Gemahl Radahn** → Haupt-Ende.
  - **Garten** *(nur wenn an Statue gebetet — Gebiet rechts oben im DLC, „alles normal")* → am Ende **Finger Mimic benutzen** → **Gebiet der Finger** → **Metyr** (Geheim-Ende). **Ohne** Finger Mimic: „hier ist nichts" → man kommt auch nach **Enir-Ilim**.
- **⑥ Gebiet der Finger (NEU):** **jeder** Gegner ist der **Wurm-Gegner**. Neue Mechanik: **30% Chance, einen Spell zu casten, der dich 1 Runde bewegungsunfähig macht** — per normaler Ausweich-Chance dodgebar (wie im echten Spiel). Am Ende: **Metyr**.
- **Ziel erreicht:** beide Wege gleich lang — **Ruinen + Enir** ↔ **Garten + Gebiet der Finger**.

### Was sich ggü. der alten Fassung ändert
- Blaidd = **Türöffner ins Waldgebiet**. Waldgebiet & Gruselwald = die zwei Mittel-Alternativen.
- **Messmer-Festung kippt** per Schalter (Aufstieg → Abstieg), Boss unten, **Statue** schaltet den Garten frei.
- **Metyr** jetzt über den **Garten** (rechts oben) statt eines Gold-Pfad-Geheimnisses; mehrfach gated (Tore + Fingercreeper + Statue + Finger).
- Alter **Abgrundwald** entfällt.

---

## C) ENTSCHIEDEN ✅
- **Waldgebiet-Boss:** 🌻 **Sonnenblume** *(`bosse/sonnenblume.png`)*
- **Gruselwald:** **KEINE normalen Gegner.** Erbt die komplette **Abgrundwald-Mechanik**: getarnte/schwarze Icons, man muss den **exakten sicheren Pfad** kennen; Fehltritt → **Aging Untouchable** (unbesiegbar, losreißen) → **+25% Wahnsinn**, bei **100%** ist der Run vorbei. Boss: **Midra** *(`bosse/midra.png`)*. Hintergrund: erbt **`abyssalwoods.jpg`**.
- **Garten-Boss:** **Gaius** *(Bild vorhanden: `bosse/Gauis.png`)*
- **Messmer:** härtester Boss vor den Endbossen, **Feuer-Thema** *(`bosse/messmer.webp`)*
- **Finger Mimic:** echtes **Rucksack-Item** *(`icons/finger_mimic.webp`)*, Drop vom **Fingercreeper** (Waldgebiet). Rucksack voll → Auswahl, was weggeworfen wird.
  ⚠️ **Es ist eine MIMIC — eine Falle:** wer sie **benutzt**, bekommt **10% Schaden** *(auf sich selbst)* und sie ist **weg** ⇒ **kein Metyr mehr**.
  Ihr einziger echter Zweck: **im Garten einsetzen**, um das **Gebiet der Finger** (→ Metyr) zu öffnen.
- **Alter Abgrundwald:** entfällt (`ABYSS_*`-Bilder werden **nicht** mehr gebraucht).
- **Boss-Parität gelöst:** Ruinen (Romina) + Enir (Radahn) ↔ Garten (**Gaius**) + Gebiet der Finger (**Metyr**) = je 2 Bosse ✅

## D) NOCH OFFEN
- **Design: nichts mehr** — alles entschieden. ✅
- **Bilder** (Endung egal, Name muss stimmen): `icons/torbogen.*` · `bosse/romina.*` · `background/waldgebiet.*` · `background/messmer.*` · `background/rauh.*` · `background/enir.*` · je 3 Gegner für `ENSIS_*`, `RAUH_*`, `ENIR_*`.
  *(Gruselwald braucht nichts — keine Gegner, erbt `abyssalwoods.jpg`.)*

## E) BAU-REIHENFOLGE — **fertig ✅**
1. ✅ **Skelett:** Gebiete registriert + Flow verdrahtet (Tore → Wald/Gruselwald → Messmer → Garten/Ruinen → Finger/Metyr), Hitless + alter Abgrundwald raus.
2. ✅ **Messmer:** Aufstieg → oben Schalter (Typ 23, kein Boss) → Festung kippt (Drehanimation + Sound) → Abstieg **3-4-2-4-3** + **Statue** (Typ 22, beten → Garten frei) → Messmer unten.
3. ✅ **Waldgebiet:** alle Nicht-Boss-Icons = `baum.png`, Beschreibungen ehrlich, **genau ein** geheimer **Fingercreeper** (Typ 21) → **Finger Mimic**.
4. ✅ **Gebiet der Finger:** nur **Fingerwürmer** (~22% der Kacheln, sichtbar & umgehbar) + **30%-Bannspell** statt Angriff, dodgebar mit der normalen Rollchance → Metyr.
5. ✅ **Gruselwald:** erbt die komplette Abgrund-Mechanik über den internen Key `AbyssalWoods` (sicherer Pfad + Untouchable + Wahnsinn) → Midra.

### Getestet
Aufstieg 2-3-4-3-4-3-2-1 → Schalter → Abstieg 3-4-2-4-3-1 → Boss (alle Wege verbunden, keine Sackgassen) · Waldgebiet 40 Karten = immer exakt 1 Fingercreeper · Mimic: Drop, Wegwerf-Auswahl bei vollem Rucksack, Benutzen = −10% HP + weg · Bann: kostet die Aktion, Trank bleibt, dodgebar · Rellana/Messmer/Gaius-Verzweigungen alle korrekt.

### Balance-Notiz
Der Fingerwurm liegt bewusst **unter** Elite-Niveau (Basis 45 HP / 7,5 dmg). Mit dem Bann-Spell wäre er sonst fast so gefährlich wie Metyr selbst (3800/195) — Metyr ist nicht schwierigkeitsskaliert, das Fußvolk schon.

*(Belohnungen, Feintuning, Flavor — „später".)*
