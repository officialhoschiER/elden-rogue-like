/* ============================================================
   Elden Rogue – Fortschritt, Achievements & Bestenliste
   ------------------------------------------------------------
   Firebase ist konfiguriert – Login, Online-Bestenliste und
   Cloud-Speicher sind aktiv. Lokaler Fallback greift automatisch,
   falls Firebase nicht erreichbar ist.

   v1.5 – synchron zu game.html / lang.js:
     • 37 Achievements (vorher 22)
     • Schwierigkeit (normal/hard) wird durchgängig getrackt
     • getrennte Bestenlisten für Normal und Hard
     • neue API: hardCompleted(), challengeCompleted(name)
     • startRun(difficulty) wertet die Schwierigkeit jetzt aus
   ============================================================ */
(function () {
  "use strict";

  /* ====== 1) FIREBASE-KONFIG ====== */
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBwgP06wTi9uygJxiJA_w5aP-M5JyMule8",
    authDomain: "elden-rogue.firebaseapp.com",
    projectId: "elden-rogue",
    storageBucket: "elden-rogue.firebasestorage.app",
    messagingSenderId: "156704144299",
    appId: "1:156704144299:web:49ae7f6d3a6afd14b9f0ee",
    measurementId: "G-XLB96HHTPF"
  };

  const ONLINE = !!FIREBASE_CONFIG.apiKey && typeof firebase !== "undefined";
  const PATCH = "1.5"; // aktuelle Spielversion – wird an neue Bestenlisten-Einträge angehängt
  let fbAuth = null, fbDB = null, currentUser = null;
  const userListeners = [];

  if (ONLINE) {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      fbAuth = firebase.auth();
      fbDB = firebase.firestore();
      fbAuth.onAuthStateChanged(function (u) {
        currentUser = u;
        initialSyncDone = false;   // erst wieder pushen, wenn der Cloud-Stand des (neuen) Kontos gemergt wurde
        if (u) cloudSyncOnLogin();
        userListeners.forEach(function (cb) { try { cb(u); } catch (e) {} });
      });
    } catch (e) { console.warn("[ER] Firebase-Init fehlgeschlagen:", e); }
  }

  /* ====== GLOBALE EVENTS (z.B. Doppel-Seelen-Wochenende) ======
     Admin legt in der Firebase-Konsole das Dokument config/event an:
       { aktiv: true, seelenMult: 2, titel: "Doppelte Seelen!", titelEn: "Double Souls!", bis: <Timestamp oder Millis, optional> }
     aktiv auf false setzen (oder Ablaufzeit erreichen) beendet das Event — kein Deployment nötig. */
  let eventInfo = null;
  function eventBisMillis(bis) {
    if (!bis) return null;
    if (typeof bis === "number") return bis;
    if (bis.toMillis) { try { return bis.toMillis(); } catch (e) {} }
    if (bis.seconds) return bis.seconds * 1000;
    return null;
  }
  if (ONLINE && fbDB) {
    try {
      fbDB.collection("config").doc("event").get().then(function (snap) {
        if (!snap.exists) return;
        var d = snap.data();
        var bis = eventBisMillis(d.bis);
        if (d.aktiv && (!bis || bis > Date.now())) {
          eventInfo = { seelenMult: d.seelenMult || 1, titel: d.titel || "", titelEn: d.titelEn || d.titel || "", bis: bis };
          try { window.dispatchEvent(new CustomEvent("er-event", { detail: eventInfo })); } catch (e) {}
        }
      }).catch(function (e) { console.warn("[ER] Event-Config:", e); });
    } catch (e) {}
  }

  /* ====== 2) SPEICHER-HELFER (robust, fällt nie auf die Nase) ====== */
  const STATS_KEY = "eldenRogueStats";
  const RUN_KEY   = "eldenRogueRun";
  const ACH_KEY   = "eldenRogueAchievements";
  const BOARD_KEY = "eldenRogueLocalBoard";
  const NAME_KEY  = "eldenRogueName";

  function lsGet(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  const DEFAULT_STATS = {
    fightsWon: 0, bossesKilled: 0, elitesKilled: 0, minibossesKilled: 0, invadersKilled: 0,
    runsStarted: 0, deaths: 0, dungeonsCleared: 0, talismansFound: 0, weaponsFound: 0,
    armorsFound: 0, blaiddDefeats: 0, blaiddQuestDone: 0, gamesCompleted: 0, furthestStage: 0,
    bestRunBosses: 0, bestScore: 0, flasksDrunk: 0,
    // --- pro Schwierigkeit getrennt ---
    bestScoreNormal: 0, bestScoreHard: 0,
    bestRunBossesNormal: 0, bestRunBossesHard: 0,
    furthestStageNormal: 0, furthestStageHard: 0,
    // --- Hard-/Challenge-Fortschritt ---
    hardModeCompletions: 0, hardNoDeath: false,
    challengesCompleted: {},
    // --- Malenia & Legendär-Run ---
    maleniaKills: 0, maleniaRuns: 0, legendaryRuns: 0,
    // --- Progression / Freischaltungen ---
    normalCompletions: 0, classesNormalDone: {}, normalNoBlaiddClears: 0, normalNoArmorClears: 0,
    ryaInvites: 0, mohgwynVisits: 0, gelmirVisits: 0, fallDeaths: 0,
    // --- Eldendex: entdeckte Katalog-IDs ---
    discovered: {},
    // --- Bestwerte pro Patch: { "1_3": { normal:{score,stage,bosses}, hard:{...} }, "1_4": {...} } ---
    patchBest: {},
    bossKills: {}
  };

  // Objekt-Felder werden kopiert, damit niemals der gemeinsame DEFAULT_STATS mutiert wird
  function getStats() {
    var s = Object.assign({}, DEFAULT_STATS, lsGet(STATS_KEY, {}));
    s.bossKills = Object.assign({}, s.bossKills || {});
    s.challengesCompleted = Object.assign({}, s.challengesCompleted || {});
    s.classesNormalDone = Object.assign({}, s.classesNormalDone || {});
    s.discovered = Object.assign({}, s.discovered || {});
    s.patchBest = JSON.parse(JSON.stringify(s.patchBest || {}));
    return s;
  }
  function saveStats(s) { lsSet(STATS_KEY, s); }
  function getRun() { return lsGet(RUN_KEY, { stage: 0, bosses: 0, fights: 0, difficulty: "normal", hadDeath: false }); }
  function saveRun(r) { lsSet(RUN_KEY, r); }
  function getUnlocked() { return lsGet(ACH_KEY, []); }
  function saveUnlocked(a) { lsSet(ACH_KEY, a); }

  // Die fünf Haupt-Halbgötter (für "Götterdämmerung")
  const HAUPTBOSSE = [
    "Godrick, der Verpflanzte",
    "Sternengeißel Radahn",
    "Morgott, der Omenkönig",
    "Feuerriese",
    "Maliketh, die Schwarze Klinge"
  ];

  /* ====== ELDENDEX-KATALOG (einzige Quelle der Wahrheit) ======
     id-Schema: Waffen "w:Name", Rüstung "a:Name", Talismane "t:typ".
     Gegner & Bosse werden über den exakten gegnerName entdeckt (id = Name). */
  const ELDENDEX = [
    // --- Waffen (mit Schaden & Schadensart) ---
    { id:"w:Keule",                   cat:"weapons", name:"Keule",                   img:"images/weapons/keule.png",                dmg:11, types:["Normal"] },
    { id:"w:Großaxt",                 cat:"weapons", name:"Großaxt",                 img:"images/weapons/grossaxt.png",             dmg:15, types:["Normal"] },
    { id:"w:Uchigatana",              cat:"weapons", name:"Uchigatana",              img:"images/weapons/uchigatana.png",           dmg:14, types:["Normal"] },
    { id:"w:Dolch",                   cat:"weapons", name:"Dolch",                   img:"images/weapons/dolch.png",                dmg:9,  types:["Normal"] },
    { id:"w:Kurzschwert",             cat:"weapons", name:"Kurzschwert",             img:"images/weapons/kurzschwert.png",          dmg:11, types:["Normal"] },
    { id:"w:Breitschwert",            cat:"weapons", name:"Breitschwert",            img:"images/weapons/breitschwert.png",         dmg:13, types:["Normal"] },
    { id:"w:Rapier",                  cat:"weapons", name:"Rapier",                  img:"images/weapons/rapier.png",               dmg:11, types:["Normal"] },
    { id:"w:Claymore",                cat:"weapons", name:"Claymore",                img:"images/weapons/claymore.png",             dmg:23, types:["Normal"] },
    { id:"w:Bluthundreißzahn",        cat:"weapons", name:"Bluthundreißzahn",        img:"images/weapons/bluthundreisszahn.png",    dmg:25, types:["Normal"] },
    { id:"w:Maltöter Großbeil",       cat:"weapons", name:"Maltöter Großbeil",       img:"images/weapons/maltoeter_grossbeil.png",  dmg:27, types:["Normal"] },
    { id:"w:Großsterne",              cat:"weapons", name:"Großsterne",              img:"images/weapons/grosssterne.png",          dmg:35, types:["Normal"] },
    { id:"w:Rostiger Anker",          cat:"weapons", name:"Rostiger Anker",          img:"images/weapons/rostiger_anker.png",       dmg:39, types:["Normal"] },
    { id:"w:Blasphemous Blade",       cat:"weapons", name:"Blasphemous Blade",       img:"images/weapons/blasphemous_blade.png",    dmg:50, types:["Magie","Feuer"] },
    { id:"w:Malenias Blade",          cat:"weapons", name:"Malenias Blade",          img:"images/weapons/malenias_blade.png",       dmg:68, types:["Normal"] },
    { id:"w:Goldene Hellebarde",      cat:"weapons", name:"Goldene Hellebarde",      img:"images/weapons/goldene_hellebarde.png",   dmg:50, types:["Heilig","Normal"] },
    { id:"w:Marikas Hammer",          cat:"weapons", name:"Marikas Hammer",          img:"images/weapons/marikas_hammer.png",       dmg:50, types:["Heilig","Magie"] },
    { id:"w:Mohgwyns heiliger Speer", cat:"weapons", name:"Mohgwyns heiliger Speer", img:"images/weapons/mohgwyns_speer.png",       dmg:50, types:["Feuer","Normal"] },
    { id:"w:Halo Scythe",             cat:"weapons", name:"Halo Scythe",             img:"images/weapons/halo_scythe.png",          dmg:52, types:["Heilig"] },
    // --- Neue Waffen (Icon-Sheet) ---
    { id:"w:Banditenkrummschwert",              cat:"weapons", name:"Banditenkrummschwert",              img:"images/weapons/bandits_curved.png",            dmg:12, types:["Normal"] },
    { id:"w:Estoc",                             cat:"weapons", name:"Estoc",                             img:"images/weapons/estoc_thrusting.png",           dmg:13, types:["Normal"] },
    { id:"w:Kettenglied-Flegel",                cat:"weapons", name:"Kettenglied-Flegel",                img:"images/weapons/chainlink_flail.png",           dmg:14, types:["Normal"] },
    { id:"w:Roter Zopf des Riesen",             cat:"weapons", name:"Roter Zopf des Riesen",             img:"images/weapons/giant's_red.png",               dmg:14, types:["Normal"] },
    { id:"w:Peitsche",                          cat:"weapons", name:"Peitsche",                          img:"images/weapons/whip_weapon.png",               dmg:12, types:["Normal"] },
    { id:"w:Geisterflammenfackel",              cat:"weapons", name:"Geisterflammenfackel",              img:"images/weapons/ghostflame_torch.png",          dmg:13, types:["Magie"] },
    { id:"w:Glaive",                            cat:"weapons", name:"Glaive",                            img:"images/weapons/glaive_halberds.png",           dmg:15, types:["Normal"] },
    { id:"w:Flamberge",                         cat:"weapons", name:"Flamberge",                         img:"images/weapons/flamberge_weapon.png",          dmg:24, types:["Normal"] },
    { id:"w:Hellebarde des Verbannten Ritters", cat:"weapons", name:"Hellebarde des Verbannten Ritters", img:"images/weapons/banished_knights_halberd.png",  dmg:24, types:["Normal"] },
    { id:"w:Drachenhellebarde",                 cat:"weapons", name:"Drachenhellebarde",                 img:"images/weapons/dragon_halberd.png",            dmg:26, types:["Feuer"] },
    { id:"w:Magmaklinge",                       cat:"weapons", name:"Magmaklinge",                       img:"images/weapons/magma_blade.png",               dmg:26, types:["Feuer"] },
    { id:"w:Bluthundklauen",                    cat:"weapons", name:"Bluthundklauen",                    img:"images/weapons/bloodhound_claws.png",          dmg:26, types:["Normal"] },
    { id:"w:Golem-Hellebarde",                  cat:"weapons", name:"Golem-Hellebarde",                  img:"images/weapons/golems_halberd.png",            dmg:28, types:["Normal"] },
    { id:"w:Spitzhacke",                        cat:"weapons", name:"Spitzhacke",                        img:"images/weapons/pickaxe_warhammer.png",         dmg:28, types:["Normal"] },
    { id:"w:Wachhund-Großschwert",              cat:"weapons", name:"Wachhund-Großschwert",              img:"images/weapons/watchdogs_greatsword.png",      dmg:30, types:["Normal"] },
    { id:"w:Drachenschuppenklinge",             cat:"weapons", name:"Drachenschuppenklinge",             img:"images/weapons/dragonscale_blade.png",         dmg:36, types:["Normal"] },
    { id:"w:Eisrand-Beil",                      cat:"weapons", name:"Eisrand-Beil",                      img:"images/weapons/icerind_hatchet.png",           dmg:36, types:["Magie"] },
    { id:"w:Meteoritenerz-Klinge",              cat:"weapons", name:"Meteoritenerz-Klinge",              img:"images/weapons/meteoric_ore_blade.png",        dmg:36, types:["Magie","Normal"] },
    { id:"w:Geflügelte Sense",                  cat:"weapons", name:"Geflügelte Sense",                  img:"images/weapons/winged_scythe.png",             dmg:38, types:["Heilig"] },
    { id:"w:Vykes Kriegsspeer",                 cat:"weapons", name:"Vykes Kriegsspeer",                 img:"images/weapons/vykes_war_spear.png",           dmg:40, types:["Feuer","Normal"] },
    { id:"w:Ghizas Rad",                        cat:"weapons", name:"Ghizas Rad",                        img:"images/weapons/ghiza's_wheel.png",             dmg:40, types:["Normal"] },
    { id:"w:Schlangenjäger",                    cat:"weapons", name:"Schlangenjäger",                    img:"images/weapons/serpent-hunter_greatspear.png", dmg:42, types:["Normal"] },
    { id:"w:Dunkelmondgroßschwert",             cat:"weapons", name:"Dunkelmondgroßschwert",             img:"images/weapons/dunkelmondgrossschwert.png",    dmg:55, types:["Magie","Normal"] },
    // --- Rüstungen ---
    { id:"a:Albinauric Set",        cat:"armor", name:"Albinauric Set",        img:"images/armor/albinauric_set.png" },
    { id:"a:Bloodhound Knight Set", cat:"armor", name:"Bloodhound Knight Set", img:"images/armor/bloodhound_set.png" },
    { id:"a:Cleanrot Set",          cat:"armor", name:"Cleanrot Set",          img:"images/armor/cleanrotf.png" },
    { id:"a:Godrick Soldier Set",   cat:"armor", name:"Godrick Soldier Set",   img:"images/armor/godrick_soldier_set.png" },
    { id:"a:Briar Set",             cat:"armor", name:"Briar Set",             img:"images/armor/briar_set.png" },
    { id:"a:Black Knife Set",       cat:"armor", name:"Black Knife Set",       img:"images/armor/black_knife_set.png" },
    { id:"a:Haligtree Knight Set",  cat:"armor", name:"Haligtree Knight Set",  img:"images/armor/haligtree_knight_set.png" },
    { id:"a:General Radahn Set",    cat:"armor", name:"General Radahn Set",    img:"images/armor/radahn_set.png" },
    { id:"a:Crucible Axe Set",      cat:"armor", name:"Crucible Axe Set",      img:"images/armor/crucible_knight_set.png" },
    // --- Talismane ---
    { id:"t:hp",        cat:"talismans", name:"Crimson Amber Medallion", img:"images/talismans/crimson_amber_medallion.png" },
    { id:"t:heal",      cat:"talismans", name:"Crimson Seed Talisman",   img:"images/talismans/crimson_seed_talisman.png" },
    { id:"t:dmg",       cat:"talismans", name:"Axt Talisman",            img:"images/talismans/axe_talisman.png" },
    { id:"t:dodge",     cat:"talismans", name:"Schildkröten Talisman",   img:"images/talismans/turtle_talisman.png" },
    { id:"t:radagon",   cat:"talismans", name:"Radagon's Scarseal",      img:"images/talismans/radagons_scarseal.png" },
    { id:"t:dungeater", cat:"talismans", name:"Dung Eater Medallion",    img:"images/talismans/dungeater_medallion.png" },
    { id:"t:havel",     cat:"talismans", name:"Havel's Medallion",       img:"images/talismans/havels_medallion.png" },
    { id:"t:katze",     cat:"talismans", name:"Langschwanzkatzen-Talisman", img:"images/talismans/longtail_cat_talisman.png" },
    // --- Gegner (id = exakter gegnerName; reg = Gebiet für die Eldendex-Seiten) ---
    { id:"Elite-Ritter",                          cat:"gegner", reg:"limgrave", name:"Elite-Ritter",                          img:"images/Gegner/soldat.jpg" },
    { id:"Bloodhound Knight",                     cat:"gegner", reg:"limgrave", name:"Bloodhound Knight",                     img:"images/Gegner/LIMGRAVE_WAECHTER.webp" },
    { id:"Nerijus",                               cat:"gegner", reg:"limgrave", name:"Nerijus",                               img:"images/Gegner/LIMGRAVE_INVADER.webp" },
    { id:"Böser Vogel",                           cat:"gegner", reg:"caelid", name:"Böser Vogel",                           img:"images/Gegner/CAELID_ELITE.jpg" },
    { id:"Ekzykes",                               cat:"gegner", reg:"caelid", name:"Ekzykes",                               img:"images/Gegner/CAELID_WAECHTER.webp" },
    { id:"Vyke",                                  cat:"gegner", reg:"caelid", name:"Vyke",                                  img:"images/Gegner/CAELID_INVADER.jpg" },
    { id:"Glintstone-Ritter",                     cat:"gegner", reg:"liurnia", name:"Glintstone-Ritter",                     img:"images/Gegner/miniboss_liurnia.webp" },
    { id:"Roter Wolf von Radagon",                cat:"gegner", reg:"liurnia", name:"Roter Wolf von Radagon",                img:"images/Gegner/red-wolf-of-radagon.jpg" },
    { id:"Edgar der Rächer",                      cat:"gegner", reg:"liurnia", name:"Edgar der Rächer",                      img:"images/Gegner/edgar the revenger.webp" },
    { id:"Nachtreiter (Night's Cavalry)",         cat:"gegner", reg:"liurnia", name:"Nachtreiter (Night's Cavalry)",         img:"images/Gegner/nights-cavalry.jpg" },
    { id:"Eiserne Jungfrauen",                    cat:"gegner", reg:"gelmir", name:"Eiserne Jungfrauen",                    img:"images/Gegner/abductor-virgins.jpg" },
    { id:"Ausgewachsene Sternenbestie",           cat:"gegner", reg:"gelmir", name:"Ausgewachsene Sternenbestie",           img:"images/Gegner/full-grown-fallingstar.jpg" },
    { id:"Inquisitor Ghiza",                      cat:"gegner", reg:"gelmir", name:"Inquisitor Ghiza",                      img:"images/Gegner/ER_Inquisitor_Ghiza.png" },
    { id:"Godskin-Edler",                         cat:"gegner", reg:"gelmir", name:"Godskin-Edler",                         img:"images/Gegner/godskin_noble_elden_ring_wiki_600px.jpg" },
    { id:"Roter Albinauriker",                    cat:"gegner", reg:"mohgwyn", name:"Roter Albinauriker",                    img:"images/Gegner/ER_Red_Albinauric_w_Shamshir.webp" },
    { id:"Monströse Krähe",                       cat:"gegner", reg:"mohgwyn", name:"Monströse Krähe",                       img:"images/Gegner/monstrous-crow-2-hq-elden-ring-wiki-guide.jpg" },
    { id:"Namenlose Weißmaske",                   cat:"gegner", reg:"mohgwyn", name:"Namenlose Weißmaske",                   img:"images/Gegner/nameless-white-mask-in-elden-ring.avif" },
    { id:"Esgar, Priester des Blutes",            cat:"gegner", reg:"mohgwyn", name:"Esgar, Priester des Blutes",            img:"images/Gegner/ER_Esgar,_Priests_of_Blood.webp" },
    { id:"Leyndell Ritter",                       cat:"gegner", reg:"leyndell", name:"Leyndell Ritter",                       img:"images/Gegner/LEYNDELL_ELITE.jpg" },
    { id:"Omen",                                  cat:"gegner", reg:"leyndell", name:"Omen",                                  img:"images/Gegner/LEYNDELL_WAECHTER.jpg" },
    { id:"Eleonora",                              cat:"gegner", reg:"leyndell", name:"Eleonora",                              img:"images/Gegner/LEYNDELL_INVADER.jpg" },
    { id:"Feuermönch",                            cat:"gegner", reg:"mountaintops", name:"Feuermönch",                            img:"images/Gegner/MOUNTAINTOPS_ELITE.jpg" },
    { id:"Troll",                                 cat:"gegner", reg:"mountaintops", name:"Troll",                                 img:"images/Gegner/MOUNTAINTOPS_WAECHTER.jpg" },
    { id:"Okina",                                 cat:"gegner", reg:"mountaintops", name:"Okina",                                 img:"images/Gegner/MOUNTAINTOPS_INVADER.jpg" },
    { id:"Bestienmensch of Farum Azula",          cat:"gegner", reg:"farumazula", name:"Bestienmensch of Farum Azula",          img:"images/Gegner/FARUMAZULA_ELITE.jpg" },
    { id:"Farum Azula Drache",                    cat:"gegner", reg:"farumazula", name:"Farum Azula Drache",                    img:"images/Gegner/FARUMAZULA_WAECHTER.jpg" },
    { id:"Anastasia",                             cat:"gegner", reg:"farumazula", name:"Anastasia",                             img:"images/Gegner/FARUMAZULA_INVADER.jpg" },
    { id:"Page",                                  cat:"gegner", reg:"ashencapital", name:"Page",                                  img:"images/Gegner/ASHENCAPITAL_ELITE.jpg" },
    { id:"Königlicher Revenant",                  cat:"gegner", reg:"ashencapital", name:"Königlicher Revenant",                  img:"images/Gegner/ASHENCAPITAL_WAECHTER.jpg" },
    { id:"Varre",                                 cat:"gegner", reg:"ashencapital", name:"Varre",                                 img:"images/Gegner/ASHENCAPITAL_INVADER.jpg" },
    { id:"Haligtree Knight",                      cat:"gegner", reg:"haligtree", name:"Haligtree Knight",                      img:"images/Gegner/haligtree_knight.webp" },
    { id:"Putrid Avatar",                         cat:"gegner", reg:"haligtree", name:"Putrid Avatar",                         img:"images/Gegner/putrid_avatar.webp" },
    { id:"Millicent",                             cat:"gegner", reg:"haligtree", name:"Millicent",                             img:"images/Gegner/millicent.webp" },
    { id:"Beastman of Farum Azula",               cat:"gegner", reg:"minibosse", name:"Beastman of Farum Azula",               img:"images/Gegner/miniboss_beastman.jpg" },
    { id:"Cleanrot Knight",                       cat:"gegner", reg:"minibosse", name:"Cleanrot Knight",                       img:"images/Gegner/miniboss_cleanrot_knight.png" },
    { id:"Omenkiller & Miranda the Blighted Bloom", cat:"gegner", reg:"minibosse", name:"Omenkiller & Miranda",                img:"images/Gegner/miniboss_omenkiller.jpg" },
    { id:"Erdtree Avatar",                        cat:"gegner", reg:"minibosse", name:"Erdtree Avatar",                        img:"images/Gegner/miniboss_erdtree_avatar.webp" },
    { id:"Stray Mimic Tear",                      cat:"gegner", reg:"minibosse", name:"Stray Mimic Tear",                      img:"images/starter/tarnished_ritter.webp" },
    { id:"Dragonkin Soldier",                     cat:"gegner", reg:"minibosse", name:"Dragonkin Soldier",                     img:"images/Gegner/miniboss_dragonkin_soldier.png" },
    { id:"Putrid Tree Spirit",                    cat:"gegner", reg:"minibosse", name:"Putrid Tree Spirit",                    img:"images/Gegner/putrid_tree_spirit.webp" },
    { id:"Dungeon Skelett",                       cat:"gegner", reg:"minibosse", name:"Dungeon Skelett",                       img:"images/Gegner/skeleton.webp" },
    // --- Bosse (id = exakter gegnerName) — Reihenfolge = Story-/Spielfortschritt ---
    { id:"Godrick, der Verpflanzte",          cat:"bosse", name:"Godrick, der Verpflanzte",          img:"images/bosse/godrick.webp" },
    { id:"Sternengeißel Radahn",              cat:"bosse", name:"Sternengeißel Radahn",              img:"images/bosse/radahn.webp" },
    { id:"Rennala, Königin des Vollmonds",    cat:"bosse", name:"Rennala, Königin des Vollmonds",    img:"images/bosse/rennala.jpg" },
    { id:"Gottverschlingende Schlange",       cat:"bosse", name:"Gottverschlingende Schlange",       img:"images/bosse/rykardp1.jpg" },
    { id:"Rykard, Herr der Blasphemie",       cat:"bosse", name:"Rykard, Herr der Blasphemie",       img:"images/bosse/rykardp2.jpg" },
    { id:"Morgott, der Omenkönig",            cat:"bosse", name:"Morgott, der Omenkönig",            img:"images/bosse/Morgott.webp" },
    { id:"Mohg, das Omen",                    cat:"bosse", name:"Mohg, das Omen",                    img:"images/bosse/f4nks42kdbhd1.jpeg" },
    { id:"Feuerriese",                        cat:"bosse", name:"Feuerriese",                        img:"images/bosse/firegiant.avif" },
    { id:"Maliketh, die Schwarze Klinge",     cat:"bosse", name:"Maliketh, die Schwarze Klinge",     img:"images/bosse/maliketh.jpg" },
    { id:"Gideon Ofnir, der Allwissende",     cat:"bosse", name:"Gideon Ofnir, der Allwissende",     img:"images/bosse/gideon.webp" },
    { id:"Loretta, Knight of the Haligtree",  cat:"bosse", name:"Loretta, Knight of the Haligtree",  img:"images/bosse/loretta-knight-of-haligtree.jpg" },
    { id:"Commander Niall",                   cat:"bosse", name:"Commander Niall",                   img:"images/bosse/commander-niall-elden-ring-wiki.jpg" },
    { id:"Malenia, Blade of Miquella",        cat:"bosse", name:"Malenia, Blade of Miquella",        img:"images/bosse/maleniap1.webp" },
    { id:"Malenia, Goddess of Rot",           cat:"bosse", name:"Malenia, Goddess of Rot",           img:"images/bosse/malenia-2nd-phase-flying.avif" },
    { id:"Mohg, Fürst des Blutes",            cat:"bosse", name:"Mohg, Fürst des Blutes",            img:"images/bosse/Titel-8-fc80008000ffff_1920x1080.avif" },
    { id:"Godfrey, der Erste Eldenlord",      cat:"bosse", name:"Godfrey, der Erste Eldenlord",      img:"images/bosse/godfrey.webp" },
    { id:"Radagon von der Goldenen Ordnung",  cat:"bosse", name:"Radagon von der Goldenen Ordnung",  img:"images/bosse/radagon.jpg" },
    { id:"Eldenbiest",                        cat:"bosse", name:"Eldenbiest",                        img:"images/bosse/eldenbeast.jpg" },
    { id:"Blaidd, der Halbwolf",              cat:"bosse", name:"Blaidd, der Halbwolf",              img:"images/Gegner/blaidd.avif" },
    { id:"Cemetery Shade",                    cat:"bosse", name:"Cemetery Shade",                    img:"images/bosse/catacomb_boss.jpg" },
    { id:"Promised Consort Radahn",           cat:"bosse", name:"Promised Consort Radahn",           img:"images/bosse/pcr.webp" }
  ];
  const ELDENDEX_IDS = ELDENDEX.map(function (e) { return e.id; });

  /* ====== 3) ACHIEVEMENTS (41) ====== */
  const ACHIEVEMENTS = [
    /* --- Kämpfe --- */
    { id: "first_win",  name: "Erster Sieg",            icon: "⚔️", desc: "Gewinne deinen ersten Kampf.",            check: s => s.fightsWon >= 1 },
    { id: "win_100",    name: "Kriegsveteran",          icon: "🗡️", desc: "Gewinne 100 Kämpfe.",                    check: s => s.fightsWon >= 100 },
    { id: "win_500",    name: "Schlachtenmeister",      icon: "🏹", desc: "Gewinne 500 Kämpfe.",                    check: s => s.fightsWon >= 500 },
    { id: "win_1000",   name: "Tausendsassa",           icon: "👑", desc: "Gewinne 1000 Kämpfe.",                   check: s => s.fightsWon >= 1000 },
    { id: "win_2500",   name: "Kriegsgott",             icon: "🔱", desc: "Gewinne 2500 Kämpfe.",                   check: s => s.fightsWon >= 2500 },
    /* --- Bosse --- */
    { id: "boss_1",     name: "Halbgott-Jäger",         icon: "💀", desc: "Besiege deinen ersten Boss.",            check: s => s.bossesKilled >= 1 },
    { id: "boss_10",    name: "Halbgott-Schlächter",    icon: "☠️", desc: "Besiege 10 Bosse.",                      check: s => s.bossesKilled >= 10 },
    { id: "boss_50",    name: "Gott unter Göttern",     icon: "🌟", desc: "Besiege 50 Bosse.",                      check: s => s.bossesKilled >= 50 },
    { id: "godrick",    name: "Sturmschleier gemeistert", icon: "🦴", desc: "Besiege Godrick.",                     check: s => (s.bossKills["Godrick, der Verpflanzte"] || 0) >= 1 },
    { id: "radahn",     name: "Die Sterne fallen",      icon: "🌌", desc: "Besiege Radahn.",                        check: s => (s.bossKills["Sternengeißel Radahn"] || 0) >= 1 },
    { id: "morgott",    name: "Omenkönig gefallen",     icon: "👑", desc: "Besiege Morgott.",                       check: s => (s.bossKills["Morgott, der Omenkönig"] || 0) >= 1 },
    { id: "firegiant",  name: "Schmiede erloschen",     icon: "🔥", desc: "Besiege den Feuerriesen.",               check: s => (s.bossKills["Feuerriese"] || 0) >= 1 },
    { id: "maliketh",   name: "Schwarze Klinge",        icon: "🐕", desc: "Besiege Maliketh.",                      check: s => (s.bossKills["Maliketh, die Schwarze Klinge"] || 0) >= 1 },
    { id: "rennala",    name: "Vollmondkönigin",        icon: "🌕", desc: "Besiege Rennala, Königin des Vollmonds.", check: s => (s.bossKills["Rennala, Königin des Vollmonds"] || 0) >= 1 },
    { id: "rykard",     name: "Gottverschlinger",       icon: "🐍", desc: "Besiege Rykard, Herrn der Blasphemie.",   check: s => (s.bossKills["Rykard, Herr der Blasphemie"] || 0) >= 1 },
    { id: "mohg_omen",  name: "Omen der Tiefe",         icon: "👹", desc: "Besiege Mohg, das Omen, in der Kanalisation.", check: s => (s.bossKills["Mohg, das Omen"] || 0) >= 1 },
    { id: "fall_death", name: "Hätte eine Katze sein sollen", icon: "🕳️", desc: "Stürze in der Kanalisation in den Abgrund.", check: s => (s.fallDeaths || 0) >= 1 },
    { id: "mohg",       name: "Miquellas Erwachen",     icon: "🩸", desc: "Besiege Mohg, Fürst des Blutes, und erwecke Miquella.", check: s => (s.bossKills["Mohg, Fürst des Blutes"] || 0) >= 1 },
    { id: "all_bosses", name: "Götterdämmerung",        icon: "🌒", desc: "Besiege jeden Halbgott mindestens einmal.", check: s => HAUPTBOSSE.every(b => (s.bossKills[b] || 0) >= 1) },
    /* --- Runs / Abschluss --- */
    { id: "elden_lord", name: "Elden Lord",             icon: "👑", desc: "Schließe einen Run ab und werde Elden Lord.", check: s => s.gamesCompleted >= 1 },
    { id: "complete_10",name: "Veteran",                icon: "🎖️", desc: "Schließe 10 Runs ab.",                  check: s => s.gamesCompleted >= 10 },
    { id: "complete_25",name: "Legende",                icon: "🏆", desc: "Schließe 25 Runs ab.",                  check: s => s.gamesCompleted >= 25 },
    /* --- Malenia & Legendär --- */
    { id: "malenia",        name: "Klinge Miquellas",      icon: "🌸", desc: "Besiege Malenia.",                     check: s => (s.maleniaKills || 0) >= 1 },
    { id: "malenia_run",    name: "Pfad des Haligtree",    icon: "🌳", desc: "Schließe einen Run ab, in dem du Malenia besiegt hast.", check: s => (s.maleniaRuns || 0) >= 1 },
    { id: "full_legendary", name: "Legendär ausgestattet", icon: "✨", desc: "Beende einen Run mit legendärer Waffe, Rüstung und mind. einem legendären Talisman.", check: s => (s.legendaryRuns || 0) >= 1 },
    /* --- Tode --- */
    { id: "first_death",name: "Du bist gestorben",      icon: "💀", desc: "Stirb zum ersten Mal.",                  check: s => s.deaths >= 1 },
    { id: "death_50",   name: "Hartnäckig",             icon: "⚰️", desc: "Stirb 50 Mal und gib nicht auf.",        check: s => s.deaths >= 50 },
    { id: "death_100",  name: "Unsterblich",            icon: "👻", desc: "Stirb 100 Mal.",                         check: s => s.deaths >= 100 },
    /* --- Dungeons --- */
    { id: "dungeon_1",  name: "Gruft-Plünderer",        icon: "🏰", desc: "Schließe einen Dungeon ab.",             check: s => s.dungeonsCleared >= 1 },
    { id: "dungeon_10", name: "Katakomben-Kenner",      icon: "🗝️", desc: "Schließe 10 Dungeons ab.",              check: s => s.dungeonsCleared >= 10 },
    /* --- Blaidd --- */
    { id: "blaidd",     name: "Blaidds Gefährte",       icon: "🐺", desc: "Schließe Blaidds Quest ab (4× in einem Run).", check: s => (s.blaiddQuestDone || 0) >= 1 },
    /* --- Sammeln --- */
    { id: "talisman_25",name: "Talisman-Sammler",       icon: "💍", desc: "Finde 25 Talismane.",                    check: s => s.talismansFound >= 25 },
    { id: "weapon_25",  name: "Waffennarr",             icon: "🗡️", desc: "Finde 25 Waffen.",                      check: s => s.weaponsFound >= 25 },
    { id: "armor_10",   name: "Gut gerüstet",           icon: "🛡️", desc: "Finde 10 Rüstungen.",                   check: s => s.armorsFound >= 10 },
    { id: "flask_500",  name: "Estus-süchtig",          icon: "🧪", desc: "Trinke 500 Flakons.",                    check: s => s.flasksDrunk >= 500 },
    /* --- Hard Mode --- */
    { id: "hard_lord",     name: "Wahrer Elden Lord",   icon: "👑", desc: "Schließe einen Hard-Mode-Run ab.",       check: s => (s.hardModeCompletions || 0) >= 1 },
    { id: "hard_5",        name: "Masochist",           icon: "🩸", desc: "Schließe Hard-Mode 5x ab.",              check: s => (s.hardModeCompletions || 0) >= 5 },
    /* --- Challenges --- */
    { id: "challenge_auto",      name: "Zuschauer",        icon: "👁️", desc: "Schließe einen Auto-Battle-Run ab.", check: s => !!(s.challengesCompleted && s.challengesCompleted.autobattle) },
    { id: "challenge_noarmor",   name: "Nacktläufer",      icon: "🏃", desc: "Schließe einen No-Armor-Run ab.",     check: s => !!(s.challengesCompleted && s.challengesCompleted.noarmor) },
    /* --- Freischaltungen (eines pro neuer Passage) --- */
    { id: "unlock_hard",    name: "Eine neue Prüfung",         icon: "🔥", desc: "Schalte den Schweren Modus frei.",             check: s => isUnlockedId("hard_mode") },
    { id: "unlock_malenia", name: "Der verborgene Pfad",       icon: "🌸", desc: "Schalte den Pfad des Haligtree frei.",         check: s => isUnlockedId("malenia") },
    { id: "unlock_tower",   name: "Tor zum Turm",              icon: "🗼", desc: "Schalte den Battle Tower frei.",               check: s => isUnlockedId("battle_tower") },
    { id: "unlock_liurnia", name: "Ein verborgenes Geheimnis", icon: "🌙", desc: "Lüfte eines der Geheimnisse des Zwischenlands.", check: s => isUnlockedId("liurnia") },
    { id: "unlock_gelmir",  name: "Der Weg des Vulkans",       icon: "🌋", desc: "Folge einer geheimnisvollen Einladung.",         check: s => isUnlockedId("gelmir") },
    { id: "unlock_mohgwyn", name: "Ruf des Blutes",            icon: "🩸", desc: "Lüfte ein weiteres Geheimnis des Zwischenlands.", check: s => isUnlockedId("mohgwyn") },
    /* --- Battle Tower --- */
    { id: "tower_climb",  name: "Turmaufstieg",       icon: "🏯", desc: "Betritt den Battle Tower.",                 check: s => (s.towerBestFloor || 0) >= 1 },
    { id: "tower_10",     name: "Aufstrebend",        icon: "🪜", desc: "Erreiche Etage 5 im Battle Tower.",          check: s => (s.towerBestFloor || 0) >= 5 },
    { id: "tower_25",     name: "Turmwächter",        icon: "🗼", desc: "Erreiche Etage 10 im Battle Tower.",         check: s => (s.towerBestFloor || 0) >= 10 },
    { id: "tower_15",     name: "Hoch hinaus",        icon: "⛰️", desc: "Erreiche Etage 15 im Battle Tower.",         check: s => (s.towerBestFloor || 0) >= 15 },
    { id: "tower_master", name: "Meister des Turms",  icon: "👑", desc: "Bezwinge alle 20 Etagen und Promised Consort Radahn.", check: s => !!(s.challengesCompleted && s.challengesCompleted.tower) },
    /* --- Eldendex --- */
    { id: "true_100", name: "Nashy", icon: "📖", desc: "Entdecke jeden Eintrag im Eldendex.", check: s => ELDENDEX.every(function (e) { return dexIstGesehen(e, s); }) }
  ];

  /* ====== 3b) FREISCHALTUNGEN (Binding-of-Isaac-Stil, progressiv) ======
     Zentrale Registry: jede Freischaltung hat eine Bedingung (check) und optional
     einen Fortschritt (progress). Neue Inhalte (z.B. DLC) hier ergänzen. */
  const TOTAL_CLASSES = 3;   // Anzahl spielbarer Klassen (schwertkaempfer / samurai / nackt) — bei neuen Klassen erhöhen
  function classCountNormal(s) { return (s && s.classesNormalDone) ? Object.keys(s.classesNormalDone).length : 0; }
  const UNLOCKS = [
    { id: "hard_mode", icon: "🔥", img: "images/icons/madness_status_effect_elden_ring_wiki_guide_100px.png",
      name: { de: "Schwerer Modus", en: "Hard Mode" },
      desc: { de: "Ein härterer Aufstieg: stärkere Gegner, weniger Ausrüstung, mehr Ruhm.", en: "A harder ascent: tougher enemies, less gear, more glory." },
      hint: { de: "Schließe das Spiel einmal im Normal-Modus ab.", en: "Finish the game once in Normal Mode." },
      check: s => (s.gamesCompleted || 0) >= 1,
      progress: s => ({ cur: Math.min(1, s.gamesCompleted || 0), max: 1 }) },
    { id: "malenia", icon: "🌸", img: "images/icons/scarlet_rot_status_effect_elden_ring_wiki_guide_100px.png",
      name: { de: "Der Pfad des Haligtree", en: "The Haligtree Path" },
      desc: { de: "Die geheimen Medaillons, der Haligtree und der Kampf gegen Malenia, Klinge Miquellas.", en: "The secret medallions, the Haligtree and the fight against Malenia, Blade of Miquella." },
      hint: { de: "Schließe den Normal-Modus ab, ohne Blaidd überhaupt zu begegnen.", en: "Finish Normal Mode without ever encountering Blaidd." },
      check: s => (s.normalNoBlaiddClears || 0) >= 1 || (s.maleniaKills || 0) >= 1,
      progress: s => ({ cur: Math.min(1, s.normalNoBlaiddClears || 0), max: 1 }) },
    { id: "battle_tower", icon: "🗼", img: "images/icons/Godfrey Icon.webp",
      name: { de: "Battle Tower", en: "Battle Tower" },
      desc: { de: "20 Etagen, ein Leben, ein Endboss. Der ultimative Prüfstein.", en: "20 floors, one life, one final boss. The ultimate trial." },
      hint: { de: "Schließe das Spiel mit allen Klassen ab (Normal oder Hard).", en: "Finish the game with every class (Normal or Hard)." },
      check: s => classCountNormal(s) >= TOTAL_CLASSES || (s.towerBestFloor || 0) >= 1,   // Grace: wer den Turm schon betreten hat, behält Zugang
      progress: s => ({ cur: Math.min(TOTAL_CLASSES, classCountNormal(s)), max: TOTAL_CLASSES }) },
    { id: "liurnia", icon: "🌙", img: "images/icons/sleep_status_effect_elden_ring_wiki_guide_100px.png", secret: true,   // geheime Freischaltung — KEIN Hinweis auf die Methode (Rüstung ablegen)
      name: { de: "Liurnia der Seen", en: "Liurnia of the Lakes" },
      desc: { de: "Ein alternativer Pfad nach Limgrave — die versunkenen Seen mit Rennala, Königin des Vollmonds.", en: "An alternative path after Limgrave — the sunken lakes with Rennala, Queen of the Full Moon." },
      hint: { de: "Ein verborgenes Geheimnis wartet darauf, gelüftet zu werden …", en: "A hidden secret waits to be uncovered …" },
      how:  { de: "Lege als Vagabund zu Run-Beginn deine Rüstung ab (aus dem Slot ziehen) und schließe den Run ab.", en: "As Vagabond, drag your armor out of its slot at the start of a run and finish the run." },
      check: s => (s.normalNoArmorClears || 0) >= 1,
      progress: null },
    { id: "gelmir", icon: "🌋", secret: true,   // geheim — Ryas Halskette (nur Samurai, in Liurnia) soll ein Rätsel bleiben
      name: { de: "Der Berg Gelmir", en: "Mount Gelmir" },
      desc: { de: "Ein alternativer Pfad statt Leyndell — der brennende Berg mit Rykard, Herrn der Blasphemie.", en: "An alternative path instead of Leyndell — the burning mount with Rykard, Lord of Blasphemy." },
      hint: { de: "Jemand in den Seen vermisst etwas Kostbares …", en: "Someone in the lakes misses something precious …" },
      how:  { de: "Finde als Samurai in Liurnia Ryas Halskette und bringe sie ihr zurück — sie lädt dich nach Haus Vulkan ein.", en: "As Samurai, find Rya's necklace in Liurnia and return it to her — she invites you to Volcano Manor." },
      check: s => (s.ryaInvites || 0) >= 1 || ((s.bossKills || {})["Rykard, Herr der Blasphemie"] || 0) >= 1,   // Grace: wer Rykard schon besiegt hat, behält den Pfad
      progress: null },
    { id: "mohgwyn", icon: "🩸", secret: true,   // geheim — der Kanalisations-Knoten in Leyndell soll überraschen
      name: { de: "Die Mohgwyn-Dynastie", en: "Mohgwyn Dynasty" },
      desc: { de: "Die Kanalisation der Hauptstadt, Mohg und ein Pfad, der mit Miquellas Erwachen endet.", en: "The capital's sewers, Mohg, and a path that ends with Miquella's awakening." },
      hint: { de: "Ein weiteres Geheimnis schlummert in der Tiefe …", en: "Another secret slumbers in the depths …" },
      how:  { de: "Besiege Rykard, Herrn der Blasphemie, am Berg Gelmir — danach findet der Bettler die Kanalisation in Leyndell.", en: "Defeat Rykard, Lord of Blasphemy, on Mount Gelmir — afterwards the Wretch can find the sewers in Leyndell." },
      check: s => ((s.bossKills || {})["Rykard, Herr der Blasphemie"] || 0) >= 1,
      progress: null }
  ];
  function unlockInfo() {
    var s = getStats();
    return UNLOCKS.map(function (u) {
      var pr = u.progress ? u.progress(s) : null;
      return { id: u.id, icon: u.icon, img: u.img || null, secret: !!u.secret, name: u.name, desc: u.desc, hint: u.hint,
               how: u.how || u.hint,   // Bedingung im Klartext (Fallback: Hinweis, der bei Nicht-Geheimnissen bereits konkret ist)
               unlocked: !!u.check(s), cur: pr ? pr.cur : null, max: pr ? pr.max : null };
    });
  }
  function isUnlockedId(id) {
    var s = getStats();
    for (var i = 0; i < UNLOCKS.length; i++) { if (UNLOCKS[i].id === id) return !!UNLOCKS[i].check(s); }
    return false;
  }

  /* Zentrale "entdeckt"-Logik für den Eldendex (getDex UND das Nashy-Achievement nutzen dieselbe Regel):
     - explizit entdeckt (discovered), ODER
     - Boss/Gegner bereits getötet (bossKills), ODER
     - Waffe/Rüstung im Roundtable freigeschaltet (Truhen + Standard-Equipment zählen sofort). */
  function dexIstGesehen(e, s) {
    if (s.discovered && s.discovered[e.id]) return true;
    if (s.bossKills && s.bossKills[e.id] > 0) return true;
    if (e.cat === "weapons" || e.cat === "armor") {
      try {
        var m = JSON.parse(localStorage.getItem("eldenRogueMeta")) || {};
        var liste = e.cat === "weapons" ? (m.unlockedWeapons || []) : (m.unlockedArmor || []);
        if (liste.indexOf(e.name) >= 0) return true;
      } catch (err) {}
    }
    return false;
  }

  // Übersetzt Name/Beschreibung eines Achievements via i18n (Fallback: hartkodiert)
  function locAch(a) {
    var nm = a.name, ds = a.desc;
    if (window.i18n) {
      var n = window.i18n.t("ach_" + a.id + "_nm"); if (n && n !== "ach_" + a.id + "_nm") nm = n;
      var d = window.i18n.t("ach_" + a.id + "_ds"); if (d && d !== "ach_" + a.id + "_ds") ds = d;
    }
    return { id: a.id, icon: a.icon, name: nm, desc: ds };
  }

  function checkAchievements() {
    var s = getStats();
    var unlocked = getUnlocked();
    var neu = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (unlocked.indexOf(a.id) === -1 && a.check(s)) {
        unlocked.push(a.id); neu.push(a);
      }
    });
    if (neu.length) {
      saveUnlocked(unlocked);
      neu.forEach(function (a) { if (typeof window.onERAchievement === "function") { try { window.onERAchievement(locAch(a)); } catch (e) {} } });
      cloudPush();
    }
    return neu;
  }

  /* ====== 4) STATISTIK-MUTATIONEN (vom Spiel aufgerufen) ====== */
  function bump(key, n) { var s = getStats(); s[key] = (s[key] || 0) + (n || 1); saveStats(s); checkAchievements(); }
  function setMax(key, val) { var s = getStats(); if (val > (s[key] || 0)) { s[key] = val; saveStats(s); checkAchievements(); } }

  function runBump(key, n) { var r = getRun(); r[key] = (r[key] || 0) + (n || 1); saveRun(r); }

  function normDiff(d) { return d === "hard" ? "hard" : "normal"; }
  // Bestenlisten-Kategorien: Basis (normal/hard), Battle Tower und je Challenge eine eigene Liste.
  const LB_KATEGORIEN = ["normal", "hard", "tower", "noarmor", "autobattle"];
  function normCat(c) { return LB_KATEGORIEN.indexOf(c) >= 0 ? c : "normal"; }
  function patchKey(p) { return String(p || PATCH).replace(/\./g, "_"); } // "1.5" -> "1_5"
  function leererPatchSlot() { var o = {}; LB_KATEGORIEN.forEach(function (c) { o[c] = { score: 0, stage: 0, bosses: 0 }; }); return o; }

  /* ====== 5) ÖFFENTLICHE API (window.ER) ====== */
  const ER = {
    ACHIEVEMENTS: ACHIEVEMENTS,
    isOnline: function () { return ONLINE; },

    /* --- Run-Lebenszyklus --- */
    startRun: function (difficulty, category) {
      var diff = normDiff(difficulty);
      var cat = normCat(category || diff);
      saveRun({ stage: 1, bosses: 0, fights: 0, difficulty: diff, category: cat, hadDeath: false });
      bump("runsStarted");
      setMax("furthestStage", 1);
      setMax(diff === "hard" ? "furthestStageHard" : "furthestStageNormal", 1);
    },
    endRun: function () {
      var r = getRun();
      var diff = normDiff(r.difficulty);
      var cat = normCat(r.category || diff);
      var score = (r.stage || 0) * 1000 + (r.bosses || 0) * 200 + (r.fights || 0) * 10;
      // kombiniert (für die Stat-Anzeige) ...
      setMax("bestScore", score);
      setMax("bestRunBosses", r.bosses || 0);
      // ... getrennt nach Schwierigkeit (Stat-Anzeige/Cloud-Kompatibilität) ...
      setMax(diff === "hard" ? "bestScoreHard" : "bestScoreNormal", score);
      setMax(diff === "hard" ? "bestRunBossesHard" : "bestRunBossesNormal", r.bosses || 0);
      // ... und pro Patch + KATEGORIE (Quelle der jeweiligen Bestenliste)
      if (score > 0) {
        var s = getStats();
        var pk = patchKey(PATCH);
        s.patchBest = s.patchBest || {};
        if (!s.patchBest[pk]) s.patchBest[pk] = leererPatchSlot();
        if (!s.patchBest[pk][cat]) s.patchBest[pk][cat] = { score: 0, stage: 0, bosses: 0 };
        var slot = s.patchBest[pk][cat];
        if (score > (slot.score || 0)) { slot.score = score; slot.stage = r.stage || 0; slot.bosses = r.bosses || 0; }
        saveStats(s);
      }
      submitToBoard(score, { stage: r.stage || 0, bosses: r.bosses || 0, fights: r.fights || 0, difficulty: diff, category: cat });
      // Zähler zurücksetzen – Schwierigkeit, Kategorie & hadDeath bleiben bis zum nächsten startRun erhalten
      saveRun({ stage: 0, bosses: 0, fights: 0, difficulty: diff, category: cat, hadDeath: r.hadDeath });
      return score;
    },

    /* --- Einzel-Events --- */
    fightWon:     function () { bump("fightsWon"); runBump("fights"); },
    bossKilled:   function (name) { bump("bossesKilled"); runBump("bosses"); var s = getStats(); s.bossKills[name] = (s.bossKills[name] || 0) + 1; saveStats(s); checkAchievements(); },
    eliteKilled:  function () { bump("elitesKilled"); },
    minibossKilled: function () { bump("minibossesKilled"); },
    invaderKilled:  function () { bump("invadersKilled"); },
    death:        function () { var r = getRun(); r.hadDeath = true; saveRun(r); bump("deaths"); ER.endRun(); },
    dungeonCleared: function () { bump("dungeonsCleared"); },
    talismanFound: function () { bump("talismansFound"); },
    weaponFound:  function () { bump("weaponsFound"); },
    armorFound:   function () { bump("armorsFound"); },
    blaiddDefeat: function () { bump("blaiddDefeats"); },
    blaiddQuestComplete: function () { bump("blaiddQuestDone"); },   // Blaidds Quest tatsächlich in EINEM Run abgeschlossen (4x)
    gameCompleted: function (klasse, diff, noBlaidd, noArmor) {
      bump("gamesCompleted");   // speichert + prüft Achievements
      var s = getStats();
      // Klasse gilt als "durchgespielt" bei JEDER Schwierigkeit (Hard ist strenger als Normal) -> Battle-Tower-Freischaltung
      if (klasse) { s.classesNormalDone = s.classesNormalDone || {}; s.classesNormalDone[klasse] = true; }
      if (diff !== "hard") {    // die übrigen Freischaltungen bleiben Normal-spezifisch
        s.normalCompletions = (s.normalCompletions || 0) + 1;
        if (noBlaidd) s.normalNoBlaiddClears = (s.normalNoBlaiddClears || 0) + 1;                              // Haligtree: ohne Blaidd
        if (noArmor && klasse === "schwertkaempfer") s.normalNoArmorClears = (s.normalNoArmorClears || 0) + 1;  // Liurnia: NUR Vagabund + bewusst abgelegte Rüstung (Samurai/Bettler folgen später)
      }
      saveStats(s);
      checkAchievements();      // Freischaltungen können sich geändert haben
      ER.endRun();
    },
    maleniaKilled:        function () { bump("maleniaKills"); },
    ryaInvite:            function () { bump("ryaInvites"); },      // Ryas Einladung nach Haus Vulkan (Gelmir-Freischaltung)
    mohgwynVisited:       function () { bump("mohgwynVisits"); },   // hebt die Bettler-Beschränkung der Kanalisation auf
    gelmirVisited:        function () { bump("gelmirVisits"); },    // hebt die Samurai-Beschränkung des Gelmir-Pfads auf
    fallDeath:            function () { bump("fallDeaths"); },      // Sturz in den Abgrund (der Tod selbst wird über ER.death gezählt)
    maleniaRunCompleted:  function () { bump("maleniaRuns"); },
    legendaryRunCompleted: function () { bump("legendaryRuns"); },
    flaskDrunk:   function () { bump("flasksDrunk"); },
    reachStage:   function (n) { if (n) { setMax("furthestStage", n); var r = getRun(); var diff = normDiff(r.difficulty); setMax(diff === "hard" ? "furthestStageHard" : "furthestStageNormal", n); if (n > (r.stage || 0)) { r.stage = n; saveRun(r); } } },
    towerReached: function (n) {
      if (!n) return;
      setMax("towerBestFloor", n);
      var r = getRun();
      if (r.category === "tower" && n > (r.stage || 0)) { r.stage = n; saveRun(r); }
    },
    bestTower: function () { return getStats().towerBestFloor || 0; },

    /* --- Freischaltungen (Progression) --- */
    getUnlocks: function () { return unlockInfo(); },
    isUnlocked: function (id) { return isUnlockedId(id); },
    // Welche Klassen wurden schon durchgespielt (für die Battle-Tower-Freischaltung)?
    getClassProgress: function () {
      var s = getStats(); var done = s.classesNormalDone || {};
      var all = ["schwertkaempfer", "samurai", "nackt"];
      return { all: all, total: TOTAL_CLASSES,
        done: all.filter(function (c) { return !!done[c]; }),
        missing: all.filter(function (c) { return !done[c]; }) };
    },

    /* --- Geräte-Sync: lokale Stände (Meta/HoF/Run) in die Cloud spiegeln ---
       syncNow()      -> gebündelt nach ein paar Sekunden (für häufige Ereignisse wie speichereRun)
       syncNow(true)  -> sofort (für wichtige Momente: Run beendet, Hall-of-Fame-Eintrag) */
    syncNow: function (sofort) { scheduleCloudPush(!!sofort); },
    __mergeMeta: mergeMeta,   // für Tests/Debugging

    /* --- Globales Event (config/event in Firestore) --- */
    getEvent: function () { return eventInfo || {}; },

    /* --- Aktions-Codes einlösen (codes/{CODE} in Firestore, vom Admin in der Konsole angelegt) ---
       Dokument-Felder: { aktiv: true, seelen: 1000, bis: <Timestamp/Millis, optional> }
       cb bekommt: {ok:true, seelen:N, code:C} oder {ok:false, grund:"offline"|"schon"|"ungueltig"|"abgelaufen"} */
    redeemCode: function (code, cb) {
      cb = cb || function () {};
      code = String(code || "").trim().toUpperCase();
      if (!code) { cb({ ok: false, grund: "ungueltig" }); return; }
      if (!ONLINE || !fbDB) { cb({ ok: false, grund: "offline" }); return; }
      try {
        var m = JSON.parse(localStorage.getItem("eldenRogueMeta") || "null");
        if (m && Array.isArray(m.redeemedCodes) && m.redeemedCodes.indexOf(code) >= 0) { cb({ ok: false, grund: "schon" }); return; }
      } catch (e) {}
      fbDB.collection("codes").doc(code).get().then(function (snap) {
        if (!snap.exists) { cb({ ok: false, grund: "ungueltig" }); return; }
        var d = snap.data();
        if (!d.aktiv) { cb({ ok: false, grund: "ungueltig" }); return; }
        var bis = eventBisMillis(d.bis);
        if (bis && bis < Date.now()) { cb({ ok: false, grund: "abgelaufen" }); return; }
        cb({ ok: true, seelen: d.seelen || 0, code: code });
      }).catch(function () { cb({ ok: false, grund: "offline" }); });
    },

    /* --- Hard Mode & Challenges --- */
    hardCompleted: function () {
      var s = getStats();
      s.hardModeCompletions = (s.hardModeCompletions || 0) + 1;
      if (!getRun().hadDeath) s.hardNoDeath = true; // dieser Run wurde ohne Tod abgeschlossen
      saveStats(s);
      checkAchievements();
    },
    challengeCompleted: function (name) {
      if (!name) return;
      var s = getStats();
      s.challengesCompleted = s.challengesCompleted || {};
      s.challengesCompleted[name] = true;
      saveStats(s);
      checkAchievements();
    },

    /* --- Eldendex --- */
    ELDENDEX: ELDENDEX,
    discover: function (id) {
      if (!id) return;
      var s = getStats();
      if (s.discovered[id]) return; // schon entdeckt -> idempotent, kein Cloud-Spam
      s.discovered[id] = true;
      saveStats(s);
      checkAchievements();
      cloudPush();
      // Neuer Eldendex-Eintrag? -> UI benachrichtigen (Toast)
      if (typeof window !== "undefined" && typeof window.onERDiscovery === "function") {
        for (var i = 0; i < ELDENDEX.length; i++) {
          if (ELDENDEX[i].id === id) { try { window.onERDiscovery(ELDENDEX[i]); } catch (e) {} break; }
        }
      }
    },
    getDex: function () {
      var s = getStats();
      var cats = {}; var total = 0, found = 0;
      ELDENDEX.forEach(function (e) {
        var seen = dexIstGesehen(e, s);
        if (!cats[e.cat]) cats[e.cat] = { items: [], found: 0, total: 0 };
        cats[e.cat].items.push({ id:e.id, name:e.name, cat:e.cat, img:e.img, dmg:e.dmg, types:e.types, reg:e.reg, seen:seen });
        cats[e.cat].total++; total++;
        if (seen) { cats[e.cat].found++; found++; }
      });
      return { cats: cats, total: total, found: found };
    },

    /* --- Abfragen --- */
    getStats: getStats,
    getAchievements: function () { var u = getUnlocked(); return ACHIEVEMENTS.map(function (a) { var l = locAch(a); l.unlocked = u.indexOf(a.id) !== -1; return l; }); },
    getPlayerName: function () { var custom = lsGet(NAME_KEY, null); if (custom) return custom; return (currentUser && currentUser.displayName) || (window.i18n ? window.i18n.t("lb_th_player") : "Befleckter"); },
    setPlayerName: function (n) { lsSet(NAME_KEY, n); cloudPush(); },

    /* --- Auth --- */
    onUserChange: function (cb) { userListeners.push(cb); try { cb(currentUser); } catch (e) {} },
    currentUser: function () { return currentUser; },
    signInWithGoogle: function () {
      if (!ONLINE) { alert("Online-Login ist noch nicht konfiguriert (Firebase fehlt). Siehe FIREBASE_SETUP.md."); return Promise.reject("offline"); }
      var provider = new firebase.auth.GoogleAuthProvider();
      return fbAuth.signInWithPopup(provider);
    },
    signOut: function () { if (fbAuth) return fbAuth.signOut(); return Promise.resolve(); },

    /* --- Bestenliste (getrennt nach Patch + Kategorie) --- */
    getLeaderboard: function (limit, cb, category, patch) {
      limit = limit || 20;
      var cat = normCat(category);
      var pk = patchKey(patch || PATCH);
      var scoreField = "lb." + pk + "." + cat + "Score";
      if (ONLINE && fbDB) {
        fbDB.collection("users").orderBy(scoreField, "desc").limit(limit).get()
          .then(function (snap) {
            var rows = [];
            snap.forEach(function (d) {
              var x = d.data();
              var box = (x.lb && x.lb[pk]) ? x.lb[pk] : {};
              var sc = box[cat + "Score"] || 0;
              if (sc <= 0) return; // keine leeren Einträge im jeweiligen Board
              rows.push({
                name: x.displayName || "Befleckter",
                score: sc,
                stage: box[cat + "Stage"] || 0,
                bosses: box[cat + "Bosses"] || 0,
                photo: x.photoURL || "",
                patch: pk.replace(/_/g, ".")
              });
            });
            cb(rows, true);
          })
          .catch(function (e) { console.warn("[ER] Bestenliste online fehlgeschlagen, lokal:", e); cb(localBoard(limit, cat, pk), false); });
      } else {
        cb(localBoard(limit, cat, pk), false);
      }
    }
  };

  /* ====== 6) LOKALE BESTENLISTE ====== */
  function eintragKategorie(x) { return x.category || normDiff(x.difficulty); }   // Legacy-Einträge -> Schwierigkeit
  function localBoard(limit, category, patch) {
    var cat = normCat(category);
    var pk = patchKey(patch || PATCH);
    var b = lsGet(BOARD_KEY, []).filter(function (x) {
      // Einträge ohne Patch-Feld stammen aus der Zeit vor v1.4 -> als "1.3" behandeln
      var entryPk = patchKey(x.patch || "1.3");
      return eintragKategorie(x) === cat && entryPk === pk;
    });
    b.sort(function (a, c) { return c.score - a.score; });
    return b.slice(0, limit);
  }
  function submitToBoard(score, meta) {
    if (score <= 0) return;
    var name = ER.getPlayerName();
    var cat = normCat(meta.category || normDiff(meta.difficulty));
    // lokal – ein bester Eintrag pro Name UND Kategorie
    var b = lsGet(BOARD_KEY, []);
    var mine = b.find(function (x) { return x.name === name && x.local && eintragKategorie(x) === cat; });
    if (mine) { if (score > mine.score) { mine.score = score; mine.stage = meta.stage; mine.bosses = meta.bosses; mine.patch = PATCH; } }
    else { b.push({ name: name, score: score, stage: meta.stage, bosses: meta.bosses, difficulty: normDiff(meta.difficulty), category: cat, patch: PATCH, local: true }); }
    lsSet(BOARD_KEY, b);
    // cloud
    cloudPush();
  }

  /* ====== 7) CLOUD-SYNC (Firestore) ====== */
  // Baut aus stats.patchBest die "lb"-Map, nach der die Online-Bestenliste sortiert.
  // Enthält je Kategorie <cat>Score/<cat>Stage/<cat>Bosses (normalScore/hardScore bleiben abwärtskompatibel).
  function baueLbMap(s) {
    var lb = {};
    var pb = s.patchBest || {};
    Object.keys(pb).forEach(function (pk) {
      var slot = pb[pk] || {}; var box = {};
      LB_KATEGORIEN.forEach(function (cat) {
        var c = slot[cat] || { score: 0, stage: 0, bosses: 0 };
        box[cat + "Score"] = c.score || 0; box[cat + "Stage"] = c.stage || 0; box[cat + "Bosses"] = c.bosses || 0;
      });
      lb[pk] = box;
    });
    return lb;
  }

  // Vereint zwei patchBest-Maps: pro Patch + Kategorie gewinnt der höhere Score.
  function mergePatchBest(localPB, cloudPB) {
    localPB = localPB || {}; cloudPB = cloudPB || {};
    var out = {}, keys = {};
    Object.keys(localPB).forEach(function (k) { keys[k] = true; });
    Object.keys(cloudPB).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (pk) {
      var lSlot = localPB[pk] || {}, cSlot = cloudPB[pk] || {};
      out[pk] = {};
      // alle in beiden Slots vorkommenden Kategorien berücksichtigen
      var cats = {}; LB_KATEGORIEN.forEach(function (c) { cats[c] = true; });
      Object.keys(lSlot).forEach(function (c) { cats[c] = true; });
      Object.keys(cSlot).forEach(function (c) { cats[c] = true; });
      Object.keys(cats).forEach(function (cat) {
        var l = lSlot[cat] || { score: 0, stage: 0, bosses: 0 };
        var c = cSlot[cat] || { score: 0, stage: 0, bosses: 0 };
        var win = (l.score || 0) >= (c.score || 0) ? l : c;
        out[pk][cat] = { score: win.score || 0, stage: win.stage || 0, bosses: win.bosses || 0 };
      });
    });
    return out;
  }

  /* ====== GERÄTE-SYNC (Meta/Roundtable, Hall of Fame, aktiver Run) ======
     Alles läuft über das bestehende users/{uid}-Dokument. Die localStorage-Stände werden
     als JSON-Strings gespiegelt (robust gegen Firestore-Typregeln) und beim Login
     verlustfrei gemergt: Zahlen -> Maximum, Listen -> Vereinigung, Run -> neuester Zeitstempel. */
  var initialSyncDone = false;   // verhindert, dass ein frisches Gerät den Cloud-Stand überschreibt, bevor es ihn gelesen hat
  var syncTimer = null;
  var metaBackupPending = null;  // Cloud-Meta-Stand VOR dem Login-Merge -> wird einmalig als metaBackupStr gesichert (manuelle Wiederherstellung in der Konsole)
  function scheduleCloudPush(sofort) {
    if (!ONLINE || !currentUser) return;
    if (sofort) { clearTimeout(syncTimer); syncTimer = null; cloudPush(); return; }
    clearTimeout(syncTimer);
    syncTimer = setTimeout(cloudPush, 4000);   // gebündelt, um Firestore-Schreibvorgänge zu sparen
  }

  // Roundtable-Meta zweier Geräte verlustfrei vereinen (nichts geht verloren; Seelen -> Maximum)
  function mergeMeta(l, c) {
    if (!l) return c; if (!c) return l;
    var m = Object.assign({}, c, l);
    m.seelen = Math.max(l.seelen || 0, c.seelen || 0);
    m.unspent = Math.max(l.unspent || 0, c.unspent || 0);
    function maxMap(a, b) { var out = {}; Object.keys(a || {}).concat(Object.keys(b || {})).forEach(function (k) { out[k] = Math.max((a || {})[k] || 0, (b || {})[k] || 0); }); return out; }
    function union(a, b) { var out = (a || []).slice(); (b || []).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); return out; }
    m.attr = maxMap(l.attr, c.attr);
    m.upgrades = maxMap(l.upgrades, c.upgrades);
    m.chestPity = maxMap(l.chestPity, c.chestPity);
    m.unlockedWeapons = union(l.unlockedWeapons, c.unlockedWeapons);
    m.unlockedArmor = union(l.unlockedArmor, c.unlockedArmor);
    m.unlockedSkins = union(l.unlockedSkins, c.unlockedSkins);
    m.redeemedCodes = union(l.redeemedCodes, c.redeemedCodes);   // eingelöste Aktions-Codes (nie doppelt einlösbar)
    var sumAttr = 0; Object.keys(m.attr).forEach(function (k) { sumAttr += m.attr[k] || 0; });
    m.level = 1 + sumAttr + (m.unspent || 0);   // Level ist deterministisch (wie in ladeMeta)
    m.attrMigrated = !!(l.attrMigrated || c.attrMigrated);
    m.attrVer = Math.max(l.attrVer || 0, c.attrVer || 0);
    m.resetVersion = Math.max(l.resetVersion || 0, c.resetVersion || 0);
    m.activeSkinId = (l.activeSkinId != null) ? l.activeSkinId : c.activeSkinId;
    m.activeSkinFilter = l.activeSkinFilter || c.activeSkinFilter || "";
    return m;
  }

  function cloudPush() {
    if (!ONLINE || !fbDB || !currentUser) return;
    var s = getStats();
    var doc = {
      displayName: ER.getPlayerName(),
      photoURL: currentUser.photoURL || "",
      stats: s,
      achievements: getUnlocked(),
      patch: PATCH,
      bestScore: s.bestScore || 0,
      bestRunBosses: s.bestRunBosses || 0,
      furthestStage: s.furthestStage || 0,
      // Legacy-Felder (Stat-Anzeige / Abwärtskompatibilität)
      bestScoreNormal: s.bestScoreNormal || 0,
      bestScoreHard: s.bestScoreHard || 0,
      bestRunBossesNormal: s.bestRunBossesNormal || 0,
      bestRunBossesHard: s.bestRunBossesHard || 0,
      furthestStageNormal: s.furthestStageNormal || 0,
      furthestStageHard: s.furthestStageHard || 0,
      // Pro-Patch-Bestwerte – Quelle für die patch-getrennte Bestenliste
      lb: baueLbMap(s),
      updatedAt: (firebase.firestore && firebase.firestore.FieldValue ? firebase.firestore.FieldValue.serverTimestamp() : Date.now())
    };
    // Geräte-Sync: lokale Stände als JSON-Strings spiegeln — aber erst NACH dem Login-Merge,
    // damit ein frisches Gerät den Cloud-Stand nicht mit leeren Daten überschreibt.
    if (initialSyncDone) {
      if (metaBackupPending) { doc.metaBackupStr = metaBackupPending; doc.metaBackupTs = Date.now(); metaBackupPending = null; }
      try { var ms = localStorage.getItem("eldenRogueMeta"); if (ms) doc.metaStr = ms; } catch (e) {}
      try { var hs = localStorage.getItem("eldenRogueHallOfFame"); if (hs) doc.hofStr = hs; } catch (e) {}
      try { var us = localStorage.getItem("eldenRogueSeenUnlocks"); if (us) doc.seenStr = us; } catch (e) {}
      try { doc.runStr = localStorage.getItem("eldenRogueSave") || ""; } catch (e) {}   // "" = kein aktiver Run (löscht beendete Runs auch in der Cloud)
    }
    try { fbDB.collection("users").doc(currentUser.uid).set(doc, { merge: true }); } catch (e) { console.warn("[ER] cloudPush:", e); }
  }

  function cloudSyncOnLogin() {
    if (!ONLINE || !fbDB || !currentUser) return;
    fbDB.collection("users").doc(currentUser.uid).get().then(function (snap) {
      var local = getStats();
      var localAch = getUnlocked();
      if (snap.exists) {
        var cloud = snap.data();
        var cs = cloud.stats || {};
        // Merge: Zahlen -> Maximum, Objekte -> vereinen, Booleans -> ODER
        var merged = Object.assign({}, DEFAULT_STATS, local);
        Object.keys(DEFAULT_STATS).forEach(function (k) {
          if (k === "bossKills" || k === "challengesCompleted" || k === "discovered" || k === "classesNormalDone") {
            var localObj = local[k] || {}, cloudObj = cs[k] || {};
            var mergedObj = Object.assign({}, cloudObj, localObj);
            Object.keys(cloudObj).forEach(function (kk) {
              if (typeof cloudObj[kk] === "number") mergedObj[kk] = Math.max(cloudObj[kk] || 0, localObj[kk] || 0);
              else if (!(kk in localObj)) mergedObj[kk] = cloudObj[kk];
            });
            merged[k] = mergedObj;
          } else if (k === "patchBest") {
            merged.patchBest = mergePatchBest(local.patchBest || {}, cs.patchBest || {});
          } else if (k === "hardNoDeath") {
            merged[k] = !!(local[k] || cs[k]);
          } else {
            merged[k] = Math.max(local[k] || 0, cs[k] || 0);
          }
        });
        // Einmalige Migration: alte (Pre-1.4-)Cloud-Bestwerte als Patch "1_3" übernehmen,
        // falls noch kein 1_3-Eintrag existiert. So bleiben alte Online-Läufe unter v1.3 sichtbar.
        if (!merged.patchBest["1_3"]) {
          var legacyN = cloud.bestScoreNormal || 0, legacyH = cloud.bestScoreHard || 0;
          // Ganz alte 1.3-Dokumente hatten nur einen kombinierten bestScore (ohne Schwierigkeit) -> als Normal werten.
          if (legacyN === 0 && legacyH === 0 && (cloud.bestScore || 0) > 0) legacyN = cloud.bestScore || 0;
          if (legacyN > 0 || legacyH > 0) {
            merged.patchBest["1_3"] = {
              normal: { score: legacyN, stage: cloud.furthestStageNormal || cloud.furthestStage || 0, bosses: cloud.bestRunBossesNormal || cloud.bestRunBosses || 0 },
              hard:   { score: legacyH, stage: cloud.furthestStageHard   || 0, bosses: cloud.bestRunBossesHard   || 0 }
            };
          }
        }
        saveStats(merged);
        var ach = localAch.slice();
        (cloud.achievements || []).forEach(function (id) { if (ach.indexOf(id) === -1) ach.push(id); });
        saveUnlocked(ach);

        // --- Geräte-Sync: Roundtable-Meta verlustfrei mergen (Seelen/Attribute/Truhen-Unlocks) ---
        try {
          var lMeta = JSON.parse(localStorage.getItem("eldenRogueMeta") || "null");
          var cMeta = cloud.metaStr ? JSON.parse(cloud.metaStr) : null;
          if (cloud.metaStr) metaBackupPending = cloud.metaStr;   // alten Cloud-Stand als Backup sichern (metaBackupStr)
          var mMeta = mergeMeta(lMeta, cMeta);
          if (mMeta) localStorage.setItem("eldenRogueMeta", JSON.stringify(mMeta));
        } catch (e) { console.warn("[ER] Meta-Sync:", e); }

        // --- Hall of Fame vereinen (Duplikate über Zeitstempel+Score erkennen, neueste zuerst, max 50) ---
        try {
          var lHof = JSON.parse(localStorage.getItem("eldenRogueHallOfFame") || "[]");
          var cHof = cloud.hofStr ? JSON.parse(cloud.hofStr) : [];
          if (Array.isArray(cHof) && cHof.length) {
            var kennung = function (e2) { return (e2.ts || 0) + "|" + (e2.score || 0) + "|" + (e2.klasse || ""); };
            var bekannt = {}; lHof.forEach(function (e2) { bekannt[kennung(e2)] = true; });
            cHof.forEach(function (e2) { if (!bekannt[kennung(e2)]) lHof.push(e2); });
            lHof.sort(function (a2, b2) { return (b2.ts || 0) - (a2.ts || 0); });
            localStorage.setItem("eldenRogueHallOfFame", JSON.stringify(lHof.slice(0, 50)));
          }
        } catch (e) { console.warn("[ER] HoF-Sync:", e); }

        // --- "Neu freigeschaltet"-Merker vereinen (verhindert Reveal-Spam auf dem Zweitgerät) ---
        try {
          var lSeen = JSON.parse(localStorage.getItem("eldenRogueSeenUnlocks") || "null");
          var cSeen = cloud.seenStr ? JSON.parse(cloud.seenStr) : null;
          if (Array.isArray(cSeen)) {
            var seen = Array.isArray(lSeen) ? lSeen.slice() : [];
            cSeen.forEach(function (id) { if (seen.indexOf(id) < 0) seen.push(id); });
            localStorage.setItem("eldenRogueSeenUnlocks", JSON.stringify(seen));
          }
        } catch (e) {}

        // --- Aktiver Run: neuester Zeitstempel gewinnt (Cloud-Run übernehmen, wenn er frischer ist) ---
        try {
          var lRun = JSON.parse(localStorage.getItem("eldenRogueSave") || "null");
          var cRun = cloud.runStr ? JSON.parse(cloud.runStr) : null;
          if (cRun && cRun.gewaehlteKlasse && (!lRun || (cRun.ts || 0) > (lRun.ts || 0))) {
            localStorage.setItem("eldenRogueSave", JSON.stringify(cRun));
          }
        } catch (e) { console.warn("[ER] Run-Sync:", e); }
      }
      // Namen aus Google übernehmen, falls vorhanden
      if (currentUser.displayName && !lsGet(NAME_KEY, null)) lsSet(NAME_KEY, currentUser.displayName);
      initialSyncDone = true;   // ab jetzt dürfen Pushes die lokalen Stände spiegeln
      checkAchievements();
      cloudPush();
      // UI informieren (Menü: Seelen-Badge, Continue-Button, Freischaltungen aktualisieren)
      try { window.dispatchEvent(new CustomEvent("er-cloud-sync")); } catch (e) {}
    }).catch(function (e) { console.warn("[ER] Login-Sync:", e); });
  }

  window.ER = ER;
})();
