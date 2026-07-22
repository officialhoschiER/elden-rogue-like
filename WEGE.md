# 🗺️ Elden Rogue — Alle Wege & Verzweigungen

> Vollständige Routen-Referenz: jeder Pfad, jede Abzweigung, jede Bedingung.
> Stand: v1.6.1. `→` = führt zu, `⇒` = Bedingung.

---

## 1) BASEGAME

```
① Limgrave ─ Boss: Godrick
      │  (Weggabel nach Godrick)
      ├─ Caelid ───────── Boss: Sternengeißel Radahn
      └─ Liurnia ──────── Boss: Rennala   ⇒ nur wenn „Liurnia" freigeschaltet

② Weggabel Ost  ⇒ nur wenn „Gelmir" freigeschaltet (sonst direkt Leyndell)
      ├─ Leyndell ─────── Boss: Morgott
      └─ Berg Gelmir ──── Boss: Rykard (2 Phasen)
   beide führen weiter zu ↓

③ Gipfel der Riesen ─ Boss: Feuerriese
④ Farum Azula ─────── Boss: Maliketh
⑤ Aschene Hauptstadt ─ Boss: Gideon
      │  (Geheimpfad-Wahl nach Gideon)
      ├─ Haligtree ───── ⇒ beide Medaillon-Hälften  → Loretta/Niall → Malenia
      ├─ Mohgwyn-Dyn. ── ⇒ Reinblutrittermedaille   → Mohg, Fürst des Blutes
      └─ direkt weiter → Eldenthron
⑥ Eldenthron ─ Godfrey → Radagon → Eldenbiest ─── 🏆 REGULÄRES ENDE
```

### Seitenweg: Der Untergrund (Kanalisation)
- Erscheint als **1 Knoten in Leyndell**, sobald **Rykard mindestens einmal besiegt** wurde.
- Der Kanalisations-Knoten ist zuerst **nur für den Bettler** betretbar (bis man einmal drin war).
- Drinnen: Endboss **Esgar, Priester des Blutes** + ein Abgrund-Knoten (Jump-Passage) mit **Mohg, das Omen**.
- Mohg das Omen besiegen ⇒ **Reinblutrittermedaille** (öffnet nach Gideon die Mohgwyn-Dynastie).

### Die 3 Enden des Basegame
| Ende | Weg |
|---|---|
| 🏆 **Regulär** | Eldenthron → Eldenbiest |
| 🩸 **Mohgwyn** | Mohg, Fürst des Blutes besiegen („Miquella erwacht") |
| 🖐 **Schattenland** | siehe DLC (nur über den 2. Mohgwyn-Sieg) |

---

## 2) DLC — „Land des Schattens"

**Zugang:** Mohgwyn-Dynastie betreten → **Mohg zum ZWEITEN Mal besiegen** → die *Verwelkte Hand* berühren. *(Es gibt kein Zurück.)*

```
① Gräberebene ─ Boss: Tanzlöwenbiest
      • 3 Tore auf der Karte — durchspringen entscheidet den Mittelweg
② Castle Ensis ─ Boss: Rellana
      │  (Verzweigung)
      ├─ 3 Tore gesprungen → ③A Waldgebiet ─ Boss: Sonnenblume
      │        • alle Knoten sehen gleich aus (Bäume) — Beschreibung lesen!
      │        • EIN versteckter Fingercreeper → dropt die FINGER MIMIC
      └─ sonst              → ③B Gruselwald ─ Boss: Midra
               • Wahnsinn-Pfad: nur der richtige Weg ist sicher (siehe unten)

④ Festung von Messmer
      • Aufstieg (normal) → oben ein SCHALTER (kein Boss)
      • Schalter ziehen → Festung KIPPT → Abstieg mit neuem Layout
      • auf dem Abstieg: STATUE-Knoten → beten ⇒ schaltet den Garten frei
      • unten: Boss MESSMER
      │  (Verzweigung nach Messmer)
      ├─ Ruinen von Rauh ─ Boss: Romina (Scharlachfäule: −10% HP/Knoten)
      │        → Enir-Ilim ─ Boss: Gemahl Radahn (2 Phasen) ─ 🏆 HAUPT-ENDE
      └─ Garten ─ Boss: Gaius   ⇒ nur wenn an der Statue gebetet
               │  am Ende:
               ├─ Finger Mimic dabei → Gebiet der Finger → Metyr ─ 🖐 GEHEIM-ENDE
               └─ ohne Finger Mimic  → „hier ist nichts" → Enir-Ilim
```

> 🖐 **Metyr braucht 3 Schlösser:** (1) 3 Tore → Waldgebiet → Fingercreeper → **Finger Mimic**, (2) an der **Statue** beten (Garten frei), (3) die Finger Mimic **im Garten** dabeihaben. Fehlt eins → man landet in Enir-Ilim.
>
> ⚠️ **Finger Mimic ist eine Falle:** wer sie *benutzt* (Rucksack), nimmt 10% Schaden und sie ist weg ⇒ kein Metyr. Nur im Garten wird sie richtig eingesetzt.

### Gebiet der Finger (Metyr)
Normales Gebiet, aber **jeder Gegner ist ein Fingerwurm** (30% Chance auf einen Bann-Spell → 2 Runden bewegungsunfähig, dodgebar). **3 Finger-Reihen** — auf jeder blast du einen Finger; nach 3 wartet Metyr.

---

## 3) FREISCHALTUNGEN — wie man sie öffnet

| Freischaltung | Bedingung |
|---|---|
| **Hard Mode** | Das Spiel einmal durchspielen (Normal) |
| **Pfad des Haligtree** (Malenia) | Einen Run abschließen, **ohne Blaidd** überhaupt zu begegnen |
| **Battle Tower** | Mit **allen 3 Klassen** durchspielen |
| **Liurnia** *(geheim)* | Als **Vagabund** die Rüstung ablegen und den Run abschließen |
| **Berg Gelmir** *(geheim)* | Als **Samurai** in Liurnia **Ryas Halskette** finden & zurückbringen |
| **Mohgwyn-Dynastie** *(geheim)* | **Mohg, das Omen** in der Kanalisation besiegen (Rykard-Kill lässt die Sewers erscheinen; Bettler geht rein) |

---

## 4) Der Gruselwald-Pfad (Wahnsinn) — aktueller Stand

- **Fester sicherer Pfad** pro Etage: die Knoten-Indizes `[0,1,1,1,2,2,1,0]` (Start → Boss). Der Pfad ist **zusammenhängend/begehbar**.
- **Fehltritt** (nicht-sicherer Knoten) → der **Aging Untouchable** ergreift dich: kein Schaden, aber **+25% Wahnsinn** je Griff. Bei **100%** ist der Run vorbei.
- **⚠️ Offen:** Der im Intro versprochene „nur der richtige glimmt sacht"-Hinweis ist **aktuell nicht implementiert** (keine Optik für den sicheren Knoten) → im Moment ist es reines Raten. → *Design-Entscheidung offen: fester vs. zufälliger Pfad, und wie sichtbar der Hinweis sein soll.*
