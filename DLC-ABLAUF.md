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
- **Waldgebiet-Boss:** 🌻 **Sonnenblume**
- **Gruselwald-Boss:** **Midra** (+ Wahnsinn-Mechanik — rettet den Abgrundwald-Content)
- **Messmer:** härtester Boss vor den Endbossen, **Feuer-Thema**
- **Finger Mimic:** echtes **Rucksack-Item**. Rucksack voll → Auswahl, was weggeworfen wird.
  **Benutzen gibt +10% Schaden.**
- **Alter Abgrundwald:** entfällt (Gegner-Bilder `ABYSS_*` werden **nicht** mehr gebraucht).

## D) NOCH OFFEN
1. **Garten-Boss?** — Boss-Parität: Ruinen (**Romina**) + Enir (**Radahn**) = 2 Bosse, aber Garten (**?**) + Gebiet der Finger (**Metyr**) = nur 1. Kriegt der Garten einen eigenen Boss?
2. **Finger-Mimic-Trade-off:** Wenn man sie für **+10% Schaden benutzt** — ist sie dann **weg** (⇒ kein Metyr mehr)? Das wäre eine geile Gier-Falle, muss aber gewollt sein.

*(Belohnungen, Feintuning, Flavor — „später".)*
