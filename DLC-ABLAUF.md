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

**Kernidee:** Hitless-Gate raus. Die **Torbögen** werden das echte Geheim-Gate und öffnen einen großen neuen Mittelteil über **Blaidd → Waldgebiet → Messmer**.

```
① Gräberebene ──── Boss: Tanzlöwenbiest
        └─ durch die TORBÖGEN gesprungen? → setzt Flag "Blaidd-Invasion"
② Castle Ensis ─── Boss: Rellana   (HITLESS-Mechanik ENTFERNT)
        ├─ Flag gesetzt → BLAIDD-INVASION (siehe unten) → Waldgebiet
        └─ kein Flag   → direkt zu den Ruinen von Rauh   [ANNAHME – bestätigen]
```

### Blaidd-Invasion (nach Rellana, nur mit Tor-Flag)
- **Invasion von Blaidd.** **Keine Heilung** möglich. Etwas **leichter** als der Rellana-Fight.
- Sieg → Blaidd zeigt den **geheimen Weg zum „Beschwörer der Schlangen"**.
  Flavor-Gag im Text: *„…keine Angst, es ist nicht B4ronyx" (lacht)*.

### ③ Waldgebiet (NEU)
- „Hier warten quasi **alle Bären** des Spiels" (Runenbären & Co.).
- **Boss: Bären-NPC mit Krallen** (= evtl. der „Beschwörer der Schlangen"?).
- **Sub-Route „Gruselwald"** (über Katakomben im Waldgebiet):
  1. Katakombe im Waldgebiet betreten → Boss → **tiefere Ebene** (Gegner plötzlich **DLC-Niveau**, deutlich stärker)
  2. → **noch eine Ebene**
  3. → **Gruselwald** → Boss besiegen
  4. → **Shortcut:** man kommt **direkt vor dem Waldgebiet-Boss** (dem Bären-NPC) raus.
- Bären-NPC besiegt → **Festung von Messmer**.

### ④ Festung von Messmer (NEU)
- **Boss: Messmer.**
- Sieg → **Ruinen von Rauh**.

### ⑤ Ruinen von Rauh → ⑥ Enir-Ilim
- Wie gehabt: Romina (Scharlachfäule) → Enir-Ilim → Gemahl Radahn → Haupt-Ende.
- **Fingerruinen/Metyr** (Geheim-Ende) via Rauh-Gold-Pfad — **Status: bleibt? [bestätigen]**

### Neuer Gesamtfluss (Vision)
```
Mohg → Gräberebene(Tore?) → Castle Ensis (Rellana)
   ├─ MIT Tor-Flag:  Blaidd-Invasion → Waldgebiet (Bären + Gruselwald-Katakomben)
   │                 → Bären-NPC → Festung Messmer → Ruinen v. Rauh → Enir-Ilim
   └─ OHNE Tor-Flag: Ruinen v. Rauh → Enir-Ilim
Enir-Ilim (Gemahl Radahn) → Haupt-Ende      |  Rauh-Gold-Pfad → Fingerruinen (Metyr) → Geheim-Ende
```

---

## C) OFFENE FRAGEN / LÜCKEN (zu klären)

1. **Was wird aus Midra / Abgrundwald?** Der Hitless-Weg ist raus → Midra ist aktuell verwaist.
   → Optionen: **(a)** Midra = Gruselwald-Boss (Wahnsinn passt thematisch top), **(b)** anders gaten, **(c)** streichen.
2. **Weg ohne Tore:** Rellana → direkt Rauh? (Annahme oben) — bestätigen.
3. **„Beschwörer der Schlangen" = Bären-NPC** (Fake-Out-Gag) oder zwei verschiedene NPCs?
4. **Belohnungen** für die neuen Bosse (Blaidd, Bären-NPC, Messmer)? Aktuell keine definiert.
5. **Gruselwald-Anreiz:** Wenn er nur zum selben Boss führt → braucht einen Grund (härter = bessere Beute? oder einziger Weg zu einem Extra?).
6. **Balance der zwei Wege:** Tor-Zweig ist RIESIG (Blaidd→Waldgebiet→Messmer→Rauh→Enir), Nicht-Tor-Zweig kurz. Der lange Weg braucht ein dickes Reward (Messmers Große Rune?).

---

## D) IDEEN zum Einarbeiten
- **Midra rettet sich in den Gruselwald** → Wahnsinn-Mechanik + „alles dunkel" bleibt erhalten, kein Content verloren.
- **Belohnungen:** Blaidd → Blaidd-Waffe/Rüstung · Bären-NPC → Krallen-Waffe · **Messmer → Große Rune** (+ Flammen-Buff) als Lohn für den langen Weg.
- **„Keine Heilung"** als optionalen Härtegrad auch bei Bären-NPC/Messmer wiederverwenden.
- **Torbögen sichtbarer machen:** dezenter Hinweis, dass sie etwas bewirken (sonst findet's keiner).
