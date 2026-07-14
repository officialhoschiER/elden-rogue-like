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
                   ├─ ja  → Metyr ─────────────────────────────────── 🏆 Geheim-Ende
                   └─ nein → "hier ist nichts" → Enir-Ilim (→ Radahn)
```

> 🖐 **Metyr braucht 3 Schlösser:** (1) **3 Tore** → Waldgebiet → **Fingercreeper** → **Finger Mimic**, (2) an der **Statue** in Messmers Abstieg **beten** → Garten frei, (3) im **Garten** die Finger benutzen. Fehlt eins → man landet in Enir-Ilim.

### Die Etappen
- **① Gräberebene** — durch die **3 Tore** springen entscheidet das Mittelgebiet.
- **② Castle Ensis (Rellana)** — danach die Verzweigung. *(Hitless-Mechanik entfällt.)*
- **③A Waldgebiet** *(3 Tore)* — Blaidd hilft rein. **Alle Knoten sehen gleich aus (Bäume — gleiche Vorschau UND Beschreibung).** Einer ist heimlich der **Fingercreeper** → dropt die **Finger Mimic** (Pflicht für Metyr). Region-Boss am Ende: *offen (Bären-NPC?)* → Messmer.
- **③B Gruselwald** *(keine Tore)* — Katakomben-Horror → Messmer.
- **④ Festung von Messmer (NEU — Gebiet kippt):**
  - Erst normaler **Aufstieg** — aber oben **kein Boss**, sondern ein **Schalter**.
  - Schalter **kippt die ganze Festung**: ab jetzt geht's von oben **hinab**, Wege + Aufteilung ändern sich komplett *(Abstieg-Layout, mein Vorschlag: **3-4-2-4-3 → Boss**)*.
  - Auf dem Abstieg: neuer Knoten **Statue** → davor **beten** → **Geräusch** → schaltet (nach Messmer) den **Garten** frei.
  - Unten: **Boss Messmer**.
- **Nach Messmer — 2 Wege:**
  - **Ruinen** → Rauh (Romina) → **Enir-Ilim** → **Gemahl Radahn** → Haupt-Ende.
  - **Garten** *(nur wenn an Statue gebetet — Gebiet rechts oben im DLC, „alles normal")* → am Ende **Finger Mimic benutzen** → **Metyr** (Geheim-Ende). **Ohne** Finger Mimic: „hier ist nichts" → man kommt auch nach **Enir-Ilim**.
- **Ziel:** beide Endbosse **gleich lang** — der Garten-Weg soll so lang sein wie Ruinen→Enir.

### Was sich ggü. der alten Fassung ändert
- Blaidd = **Türöffner ins Waldgebiet**. Waldgebiet & Gruselwald = die zwei Mittel-Alternativen.
- **Messmer-Festung kippt** per Schalter (Aufstieg → Abstieg), Boss unten, **Statue** schaltet den Garten frei.
- **Metyr** jetzt über den **Garten** (rechts oben) statt eines Gold-Pfad-Geheimnisses; mehrfach gated (Tore + Fingercreeper + Statue + Finger).
- Alter **Abgrundwald** entfällt.

---

## C) OFFENE PUNKTE (klein halten)

1. **Länge Metyr-Weg:** Garten allein vs. Ruinen+Enir (2 Gebiete). Damit's gleich lang ist → Garten ein **volles** Gebiet, evtl. **Garten → (Finger) → Fingerruinen-Puzzle → Metyr** (parallel zu Ruinen→Enir→Radahn)? — deine Entscheidung.
2. **Bosse:** Gruselwald = **Midra**? · Waldgebiet-Region-Boss = **Bären-NPC**? *(Fingercreeper = geheimer Node, nicht der Region-Boss.)*
3. **Garten ohne Finger Mimic** endet in Enir-Ilim = gleiches Ergebnis wie Ruinen — okay, oder kriegt der Garten ein kleines eigenes Reward?
4. **Messmer/Statue-Belohnung** & wie auffällig die Statue/das Geräusch sein soll — später.

*(Belohnungen, Feintuning, Flavor — alles „später".)*
