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

**Kernidee (bewusst simpel gehalten — Details kommen später):** Die **3 Tore** auf der Gräberebene entscheiden über das Mittelgebiet. Beide Mittelgebiete münden **immer** in **Messmers Festung**; danach freie Wahl zwischen **Metyr** und **Enir-Ilim**.

```
① Gräberebene (mit Toren) ── Boss: Tanzlöwenbiest
② Castle Ensis ───────────── Boss: Rellana
      ├─ 3 Tore gemacht → ③A Waldgebiet  (mit Blaidds Hilfe)
      └─ sonst          → ③B Gruselwald
④ Festung von Messmer ─────── Boss: Messmer        ← BEIDE Wege münden IMMER hier
      ├─ Weg "Finger" → Fingerruinen ─ Boss: Metyr ────────────────── 🏆 Ende
      └─ Weg "Ruinen" → Ruinen v. Rauh (Romina) → Enir-Ilim (Gemahl Radahn) → 🏆 Ende
```

### Die Etappen
- **① Gräberebene** — durch die **3 Tore** springen entscheidet, welches Mittelgebiet kommt (Waldgebiet vs. Gruselwald).
- **② Castle Ensis (Rellana)** — danach die Verzweigung. *(Hitless-Mechanik entfällt.)*
- **③A Waldgebiet** *(3 Tore gemacht)* — **Blaidd** hilft dir hinein. → weiter zu Messmer.
- **③B Gruselwald** *(Tore nicht gemacht)* — Katakomben-Horror. → weiter zu Messmer.
- **④ Festung von Messmer** — **immer**, Boss = **Messmer**. Danach die 2 Endwege:
  - **Weg „Finger"** → Fingerruinen → Boss **Metyr** → **Ende**.
  - **Weg „Ruinen"** → Ruinen von Rauh (Romina) → **Enir-Ilim** → Boss **Gemahl Radahn** → **Ende**.

### Was sich ggü. der alten Fassung ändert
- Blaidd ist jetzt einfach der **Türöffner ins Waldgebiet** (keine separate Invasion-Kette mehr).
- **Waldgebiet & Gruselwald** sind die zwei Mittel-Alternativen (nicht mehr verschachtelt).
- **Messmer immer danach.**
- **Fingerruinen/Metyr** ist jetzt ein **direkter Wahl-Weg** nach Messmer (kein Rauh-Gold-Pfad-Geheimnis mehr).
- Der alte **Abgrundwald** entfällt.

---

## C) OFFENE PUNKTE (klein halten)

1. **Bosse von Waldgebiet & Gruselwald?** Vorschlag: **Gruselwald = Midra** (Wahnsinn-Mechanik passt & rettet den Content), **Waldgebiet = Bären-NPC**.
2. **Messmer-Belohnung?** (Große Rune?) — später.
3. **Tanzlöwe/Rellana** bleiben als Bosse von Gräberebene/Ensis? (Annahme: ja.)

*(Belohnungen, Feintuning, Flavor — alles „später", wie besprochen.)*
