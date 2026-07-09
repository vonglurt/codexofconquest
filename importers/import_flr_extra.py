#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-FLR: Divine Comedy cycles 8–11 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "FLR"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "skill_check", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def delivery(id, title, desc, activateNode, passText, failText,
             checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": "delivery", "book": BOOK, "npc": NPC,
        "title": title, "desc": desc, "activateNode": activateNode,
        "passText": passText, "failText": failText,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title} [delivery]")

def main():
    say("FLR pass 4 extra cycles. Divine Comedy, Dante. Cycles 8 through 11. "
        "Phlegyas's Crossing Log, The Gate's Three Steps, "
        "Matilda's River Registry, Cacciaguida's Prophecy Register.")

    # ── Cycle 8: Phlegyas's Crossing Log ──────────────────────────────────────
    print("\n-- Cycle 8: Phlegyas's Crossing Log --")
    quest("flr_08_act1", "The Marsh Archive, Pisa",
        "Elena's back room off the Piazza dei Cavalieri, mid-morning. She has the folio "
        "spread under a north-facing window. The marsh smell is faint but present. She "
        "watches you look at the column headings. The columns: date-notation (Julian with "
        "underworld corrections), crossing direction (toward the further bank), passenger "
        "count (two), physical classification of each passenger: one cold, normal weight; "
        "one warm, weight increased — approximately one living man's mass. The marginal "
        "word: giusto. Endorsed by a second hand, smaller, more assured.",
        "PSA",
        "You identify the format, explain the weight notation, and name what the marginal "
        "endorsement implies: a third party verified the transit as legitimate. Elena names "
        "her price. You pay. You receive the Crossing Log Folio.",
        "Elena's price doubles when she senses uncertainty. She folds the folio and locks "
        "it away. Two days later you may return; she loses no value waiting.",
        "INT", 12, checkPassFlag="flr_08_act1")

    quest("flr_08_act2", "The Dominican Scriptorium, Rome",
        "Fra Simeone's table is organized by document type: liturgical left, classical "
        "commentary center, contested right. He places the folio immediately in the "
        "contested pile, then looks at you with mild suspicion. The columns use a "
        "calendrical notation he has seen once before: in a document from the Avignon "
        "papal court archive, catalogued under 'instruments of contested provenance.' "
        "That document referred to a classical-commentary scribal tradition — Virgilian. "
        "He can authenticate the primary text but the marginal endorsement is a different "
        "hand entirely, and the ink is differently composed.",
        "ROM",
        "Fra Simeone examines both inks under a lens, writes two separate authentication "
        "notes — one for each hand — and dates them within the same century as Dante's "
        "journey. You receive Fra Simeone's Dual Authentication.",
        "Fra Simeone agrees to authenticate the columns but dismisses the endorsement as "
        "a later gloss. His written opinion covers only the primary text. Without the "
        "endorsement analysis, the archive will not accept the folio at full provenance "
        "grade.",
        "CHA", 13, checkPassFlag="flr_08_act2", activateCond="flr_08_act1")

    quest("flr_08_act3", "The Harbor Road, Palermo",
        "The coastal road, two hours before Palermo's south gate. Citrus groves on the "
        "left, the sea glinting on the right. Two riders on horseback approach. A writ-"
        "holder reads the document aloud in a flat, official voice. The folio has "
        "attracted attention from a family whose ancestor appears in the crossing log's "
        "prior pages — the entries document their ancestor's crossing date as approximately "
        "three weeks before his official death date, which raises questions about the "
        "inheritance the family has held for eighty years. Behind the writ-holder, two "
        "men on large horses. They are not bluffing.",
        "PAR",
        "Both retainers are down. The writ-holder folds his document and turns his horse. "
        "The road is clear. The folio is still in your pack.",
        "You are unhorsed and the folio taken. The retainers leave you the authentication "
        "documents — they want only the folio. Three days later a Genoese factor purchases "
        "the folio at auction; you may attempt to recover it through a Palermitan contact.",
        "STR", 14, checkPassFlag="flr_08_act3", activateCond="flr_08_act2")

    quest("flr_08_act4", "The Humanist Study, Venice",
        "Giacomo's study, overlooking the Grand Canal from the second floor. Three other "
        "crossing registers are laid out for comparison. He is generous with his time and "
        "suspicious of his own generosity. He has seen crossing registers before — he "
        "owns three, all from Styx-adjacent traditions in the Virgilian commentary corpus. "
        "None of them have a marginal endorsement from a second hand. He is prepared to "
        "say the endorsement hand is consistent with a Beatrician tradition. What he needs "
        "is confirmation that the folio's chain of provenance can be established from the "
        "Pisan lot to the present.",
        "VEN",
        "You propose the dissolution inventory solution immediately. Giacomo nods and "
        "begins drafting his opinion while you arrange the Pisan certified copy by "
        "messenger. Three days later you have both. You receive Giacomo's Marginal "
        "Endorsement Analysis.",
        "Giacomo declines to issue his opinion until the chain is complete, and names no "
        "deadline. Without his endorsement, the Weimar archive will accept the folio as "
        "interesting but not as historically certified.",
        "WIS", 12, checkPassFlag="flr_08_act4", activateCond="flr_08_act3")

    delivery("flr_08_act5", "The Archive — Phlegyas's Crossing Log",
        "Weimar Archive, late afternoon. The three documents are laid out left to right: "
        "the folio, Fra Simeone's two authentication notes, Giacomo's analysis. Sweelinck "
        "reads without speaking for four minutes. Then: 'Giusto.' He sets the folio down. "
        "'One word. Someone — Giacomo says a Beatrician glossator — endorsed the crossing "
        "as just. Not permitted. Not documented. Just.' He is quiet for a moment. 'Phlegyas "
        "ran the ferry. He recorded what he saw. And someone else came back and wrote just "
        "in the margin. That person was making a theological claim in a ferryman's "
        "operational record.' He picks up his pen. 'The ferryman counted. The endorser "
        "judged. The archive holds both.'",
        "NUE",
        "Sweelinck enters the folio under The Styx Crossing — Administrative Record of a "
        "Transit Endorsed as Theologically Legitimate. You receive the Archive Receipt: "
        "Styx Crossing.",
        "N/A — delivery act.",
        checkPassFlag="flr_08_act5", activateCond="flr_08_act4")

    # ── Cycle 9: The Gate's Three Steps ───────────────────────────────────────
    print("\n-- Cycle 9: The Gate's Three Steps --")
    quest("flr_09_act1", "The Notary's Study, Florence",
        "Bartolo's study, Oltrarno, morning. The room smells of beeswax and old paper. "
        "He is propped in his chair with a shawl over his lap. The folio sits on the "
        "table beside an inkwell he no longer uses. He is dying. He has been dying for "
        "two weeks, slowly enough to settle his affairs. Among those affairs is this folio "
        "he has kept sealed since 1305, when a pilgrim dictated it to him on the condition "
        "that it not be opened until twenty years after his own death. The pilgrim died "
        "in 1308. It is now 1328. The seal is intact. He hands it to the Fighter with "
        "one request: that it reach an archive where it will be read.",
        "PSA",
        "You accept the folio. Bartolo nods. 'I am a notary. I have kept documents my "
        "entire life. This one I was asked not to read. I kept that undertaking. Now I am "
        "releasing it to someone who will.' He closes his eyes. You receive the Sealed "
        "Gate Entry Folio.",
        "Bartolo requires only that you name an archive. You name it. He nods.",
        "INT", 8, checkPassFlag="flr_09_act1")

    quest("flr_09_act2", "The Episcopal Chancery, Rome",
        "The chancery intake office, mid-morning. Three clerks at three desks; the "
        "archivist at a fourth, larger desk behind a partition. He reads the folio twice "
        "without speaking, then sets it down and looks at the ceiling. The folio's seal, "
        "once broken, reveals an intake document using terminology consistent with a "
        "specific theological tradition: the three steps of the gate correspond to the "
        "three acts of penance (examen, contritio, satisfactio), and the seven marks "
        "correspond to a Dominican penitential schema. The document is either genuine "
        "or a very sophisticated theological exercise.",
        "ROM",
        "The archivist issues a preliminary intake note and flags the Dominican registry "
        "match as the required next step. You receive the Chancery Preliminary Intake "
        "Note.",
        "The archivist refers the folio to the theological commission. You retrieve it "
        "six weeks later with a commission stamp that says 'inconclusive — source "
        "unverifiable.' The archive will accept it at reduced provenance grade.",
        "CHA", 12, checkPassFlag="flr_09_act2", activateCond="flr_09_act1")

    quest("flr_09_act3", "The Strada dell'Alloro, Palermo",
        "Ser Rinaldo's library, a converted merchant's house near the cathedral. The "
        "main floor is dry and well-lit. Fra Luca's convent is visible on the ridge above. "
        "A servant at the provincial house tells you he leaves at the third hour. It is "
        "now the second. The road is stone-paved but very steep. Fra Luca — now elderly "
        "— will confirm in writing that his master discussed the Purgatorial intake "
        "procedure explicitly as an extension of the Dominican schema, but only if he is "
        "satisfied that the document will be kept in an archive where it cannot embarrass "
        "the order.",
        "PAR",
        "You arrive with five minutes to spare. Fra Luca is in the courtyard with his "
        "pack. You speak quickly and well. He listens, asks two questions, and writes his "
        "statement on the spot. You receive Fra Luca's Confirmatory Statement.",
        "You arrive as the convent door closes. Fra Luca has gone. The prior will forward "
        "a message to Calabria, but his response takes six weeks. You continue with a "
        "delayed confirmation letter instead of a signed statement.",
        "STR", 14, checkPassFlag="flr_09_act3", activateCond="flr_09_act2")

    quest("flr_09_act4", "The Humanist Circle, Venice",
        "Caterina's study, facing the canal. Twelve manuscript copies of the Commedia on "
        "one shelf; forty-odd commentaries on the next. She reads the folio standing at "
        "her writing desk and does not sit down for fifteen minutes. She has read every "
        "known manuscript and every known commentary. The folio's description of the gate "
        "procedure matches the poem exactly in three places and diverges in one: the poem "
        "describes the guardian scribing the P marks with a blunted sword; the folio "
        "specifies the sword's material as iron mixed with plumbum caeleste — celestial "
        "lead. This is not in any version of the poem Caterina has seen.",
        "VEN",
        "You recognize Caterina's excitement as genuine and ask the question that unlocks "
        "her full analysis: what does the discrepancy about the sword's material tell her "
        "about the folio's source? Caterina writes a full comparative analysis, including "
        "a section arguing the folio's source had experiential rather than literary "
        "knowledge. You receive Caterina's Comparative Analysis.",
        "Caterina writes a competent comparative note but does not address the sword "
        "discrepancy. The archive will accept the folio without that analysis, but "
        "Sweelinck's note will flag the unexplained detail as an open question.",
        "WIS", 12, checkPassFlag="flr_09_act4", activateCond="flr_09_act3")

    delivery("flr_09_act5", "The Archive — The Gate's Three Steps",
        "Weimar Archive, late afternoon. Four documents in sequence. Sweelinck reads each "
        "one and turns it face-down when finished. When all four are face-down, he sits "
        "still for a moment before writing. 'The sword was iron mixed with plumbum "
        "caeleste.' He sets Caterina's pages down. 'She thinks the source had experiential "
        "knowledge. I think she is right.' He is quiet for a moment. 'The poem describes "
        "the gate. The folio describes the procedure the poem implies but does not state. "
        "Bartolo kept it sealed for twenty-three years because the pilgrim asked him to.' "
        "He picks up his pen. 'First entry. The Gate of Purgatory — Procedural Record of "
        "the 1301 Intake, Source: Experiential. Every intake procedure leaves a record. "
        "This is the record.'",
        "NUE",
        "Sweelinck enters the folio under The Gate of Purgatory — Procedural Record of "
        "the 1301 Intake, Source: Experiential. You receive the Archive Receipt: Gate "
        "Entry.",
        "N/A — delivery act.",
        checkPassFlag="flr_09_act5", activateCond="flr_09_act4")

    # ── Cycle 10: Matilda's River Registry ────────────────────────────────────
    print("\n-- Cycle 10: Matilda's River Registry --")
    quest("flr_10_act1", "The Convent of Santa Croce, Florence",
        "The convent scriptorium, mid-morning. Suora Margherita brings the letter from a "
        "locked cabinet. She sets it on the table and does not open it. She looks at you "
        "with the expression of someone who has made a decision already and is waiting to "
        "see if you will make it easier. The letter arrived in 1302, written by a pilgrim "
        "who had emerged from the Eunoe and, in the moment before the restorative memory "
        "settled, wrote down what he remembered of Matilda's registry entry. Sealed with "
        "a device she has never seen: a double wave, one white, one gold. She will give "
        "it on one condition: that she be given a copy to keep.",
        "PSA",
        "You agree. Suora Margherita makes her copy with practiced speed. She hands you "
        "the original. You receive the River Registry Letter.",
        "She requires your consent before making the copy. A notary does not make copies "
        "without consent. You consent.",
        "INT", 8, checkPassFlag="flr_10_act1")

    quest("flr_10_act2", "The Theological Faculty, Rome",
        "Fra Pietro's cell in the faculty buildings, mid-afternoon. His copy of the "
        "Confessions is open on the lectern at a different passage. He has the letter in "
        "one hand and is reading with a half-smile that suggests he has found something. "
        "The letter describes Matilda's registry entry in terms that align with Augustinian "
        "memory theory: the two-column structure maps onto the Augustinian distinction "
        "between memoria as the mind's storehouse of sin and memoria as the capacity for "
        "beatitude. Fra Pietro can confirm the theoretical alignment in writing. He needs "
        "three hours to check the citation against his copy of Augustine. He is not "
        "reluctant; he is busy.",
        "ROM",
        "Fra Pietro sets down the Confessions, sends his student to cover the disputation, "
        "and spends the afternoon on the citation. By vespers he has a written analysis "
        "with specific text references. You receive Fra Pietro's Memory-Theory Analysis.",
        "Fra Pietro defers to the next morning. You wait overnight in Rome. He produces "
        "his analysis at the first hour: complete but undated. The provenance chain is "
        "intact, the delay noted.",
        "CHA", 13, checkPassFlag="flr_10_act2", activateCond="flr_10_act1")

    quest("flr_10_act3", "The Harbor, Palermo",
        "The bonded warehouse transit shed, afternoon. The factor — a thin man in good "
        "linen — is seated at a table with an abacus. Two guards stand by the archive "
        "cabinet. A Sicilian merchant family has placed a lien on the entire 1302 customs "
        "archive. The customs transit record from 1302 includes an entry describing a "
        "sealed document addressed to Florence, carried by a religious without papers. "
        "The customs clerk noted the seal device: a double wave, white and gold. The "
        "Fighter needs a certified copy of the transit entry. The factor names a fee "
        "that is three times reasonable.",
        "PAR",
        "Both guards are down. The factor leaves without further argument. The warehouse "
        "clerk copies the transit entry under his own notarial seal. You receive the "
        "Customs Transit Entry (1302).",
        "You pay the factor's fee — 20gp — and he provides a certified copy under his "
        "family seal, which the archive will accept at reduced provenance grade.",
        "STR", 12, checkPassFlag="flr_10_act3", activateCond="flr_10_act2")

    quest("flr_10_act4", "The Private Library, Venice",
        "Ser Taddeo's library, ground floor, canal side. He has a magnifying lens on a "
        "stand and three comparison samples laid out before you arrive — he received word "
        "you were coming and prepared. He is examining the letter before you speak. The "
        "letter's vellum is unlike any earthly animal skin. Ser Taddeo has seen three "
        "other documents that share this quality: all share the same slight luminescence "
        "and resistance to ordinary water damage. He will write an analysis confirming "
        "the unusual properties and noting the parallel with the three other documents. "
        "He needs one condition: archival correspondence access for future researchers.",
        "VEN",
        "You state immediately that the Weimar archive provides standard correspondence "
        "access to all researchers. Ser Taddeo nods, finishes his examination, and writes "
        "a full analysis including the three parallel documents. You receive Ser Taddeo's "
        "Vellum Analysis.",
        "You negotiate unnecessarily. Ser Taddeo is mildly annoyed by the implication "
        "that the condition required negotiation, and his analysis does not include the "
        "comparative reference to the three parallel documents.",
        "WIS", 12, checkPassFlag="flr_10_act4", activateCond="flr_10_act3")

    delivery("flr_10_act5", "The Archive — Matilda's River Registry",
        "Weimar Archive, morning. Sweelinck examines the vellum first, before reading "
        "the letter. He touches it once with his fingertip, then removes his hand and "
        "reads. 'The double wave on the seal. White and gold.' He reads the two-column "
        "entry slowly. 'What was erased. What was restored.' He sets the letter down. "
        "'Matilda tends the garden. She keeps the garden's records. This is the only "
        "record I have seen that describes what she records.' He reads Fra Pietro's "
        "analysis, then Ser Taddeo's. 'The author knew the Augustinian tradition. He "
        "organized his transcription using its vocabulary because that was the vocabulary "
        "that fit. He was not performing erudition; he was using the most precise "
        "framework available.' He picks up his pen. 'The garden has records. Someone "
        "should have expected that.'",
        "NUE",
        "Sweelinck enters the letter under The Earthly Paradise — Registry of Lethe and "
        "Eunoe: What Was Erased and What Was Restored, Entry 1301. You receive the "
        "Archive Receipt: Matilda's Registry.",
        "N/A — delivery act.",
        checkPassFlag="flr_10_act5", activateCond="flr_10_act4")

    # ── Cycle 11: Cacciaguida's Prophecy Register (questComplete) ─────────────
    print("\n-- Cycle 11: Cacciaguida's Prophecy Register --")
    quest("flr_11_act1", "The Florentine Notarial Archive, Florence",
        "The archive's intake office, morning. Ser Niccolo has the uncatalogued register "
        "on his desk, still in its original oilskin wrapping. He reads the research "
        "purpose statement while you stand. He reads it twice. The register was found in "
        "a sealed chest among the estate papers of a notarial family that died out in "
        "1380. The estate administrator catalogued it as 'unusual civic record, content "
        "unclear, language consistent with early fourteenth century, cipher on first page "
        "unidentified.' The register documents, year by year, the specific fulfillment of "
        "Cacciaguida's exile prophecy. The last entry, dated September 1321, reads: "
        "mortuus est. The record is complete.",
        "PSA",
        "Ser Niccolo approves the statement, takes the nominal fee, logs the release, and "
        "hands you the register. You receive the Prophecy Fulfillment Register.",
        "Ser Niccolo is thorough. He reads everything twice. He approves on the second "
        "reading.",
        "INT", 8, checkPassFlag="flr_11_act1")

    quest("flr_11_act2", "The Papal Archive Annex, Rome",
        "Fra Domenico's work table, afternoon. His cipher reference — a bound quarto of "
        "about three hundred pages — is open at the Florentine guild section. He "
        "identifies the cipher in approximately eight minutes and looks up with an "
        "expression of mild professional satisfaction. The cipher belongs to a Cavalcanti "
        "notary — not the Guido Cavalcanti branch, but a collateral branch that worked in "
        "the Oltrarno quarter. The Cavalcanti family was allied with the Whites in the "
        "factional struggle that exiled Dante. Fra Domenico will identify the cipher in "
        "writing; he needs the register for one day. He prefers to work without "
        "observation.",
        "ROM",
        "You agree. Fra Domenico nods, sets the register in his secure cabinet, and hands "
        "you a receipt. The next morning he delivers a full written identification with "
        "family genealogical notes. You receive Fra Domenico's Cipher Identification.",
        "You insist on waiting on-site. Fra Domenico works more slowly without solitude, "
        "and his statement, while accurate, notes the working conditions as suboptimal.",
        "CHA", 12, checkPassFlag="flr_11_act2", activateCond="flr_11_act1")

    quest("flr_11_act3", "The Via Alloro, Palermo",
        "Ser Rinaldo's library, a converted merchant's house near the cathedral. The main "
        "floor is dry and well-lit. He points you to the sub-basement stairs, hands you "
        "a lamp, and warns you about the third step from the bottom, which has been loose "
        "since the flood. The Cavalcanti collateral branch had connections to the Sicilian "
        "court during the period of Angevin rule. Among the letters is a reference to a "
        "Cavalcanti notary maintaining 'a private civic record of the exile's progress,' "
        "described as 'the most careful accounting I have seen of what was promised and "
        "what has come to pass.' The letter is in a sub-basement archive accessed by a "
        "stone staircase that flooded in a recent rain.",
        "PAR",
        "You descend carefully, locate the correspondence cabinet, find the letter in the "
        "third folder from the left, and return without incident. The comparison confirms "
        "the match. Ser Rinaldo provides the certified copy. You receive the White Exile "
        "Network Letter.",
        "You slip on the third step. The register is unharmed — you protected it — but "
        "you take a bruising fall. The letter is retrieved; the comparison proceeds.",
        "STR", 14, checkPassFlag="flr_11_act3", activateCond="flr_11_act2")

    quest("flr_11_act4", "The Manuscript Chamber, Venice",
        "Ser Bartolomeo's manuscript chamber, a long room lit by four windows over the "
        "canal. His annotated Paradiso is already open on his comparison table. He reads "
        "the register's first entry and nods once, already absorbed. He has mapped every "
        "specific prediction in Cacciaguida's speech against the documented historical "
        "record of Dante's life. He will compare the register's entries against his "
        "annotation record and confirm, in writing, which specific predictions are "
        "documented. The comparison will take three hours. He will not be interrupted "
        "during the comparison.",
        "VEN",
        "You wait in the designated room for three hours and twelve minutes. Ser Bartolomeo "
        "emerges with a full comparative annotation: twelve of Cacciaguida's fourteen "
        "specific predictions documented in the register, two absent (years Dante spent "
        "in regions beyond the registrant's correspondence network). You receive Ser "
        "Bartolomeo's Comparative Annotation.",
        "You misread his manner as impatience and offer to help. He politely removes you "
        "from the comparison process and conducts it alone, producing a shorter written "
        "summary rather than a full annotation comparison.",
        "WIS", 13, checkPassFlag="flr_11_act4", activateCond="flr_11_act3")

    delivery("flr_11_act5", "The Archive — Cacciaguida's Prophecy Register",
        "Weimar Archive, afternoon. Sweelinck opens the register to the last entry first. "
        "He reads: mortuus est. He closes the register and sits with it in his hands for "
        "a moment before opening it to the first page. He reads the register front to "
        "back. Then Fra Domenico's cipher identification. Then the White exile network "
        "letter. Then Ser Bartolomeo's comparative annotation in full. 'Twelve of "
        "fourteen predictions confirmed in the register. The registrant knew about the "
        "prophecy. He did not record it; he recorded its fulfillment. He watched what was "
        "promised come true, year by year, and he wrote it down. Not because it proved "
        "anything about the afterlife. Because it was accurate. And accuracy, to a notary, "
        "is a form of respect.' He picks up his pen. 'The Love that moves the sun and "
        "the other stars also, apparently, keeps accurate records.'",
        "NUE",
        "Sweelinck enters the register under Cacciaguida's Prophecy — Notarial Record of "
        "Fulfillment, 1302–1321, Registrant: Cavalcanti Collateral Branch. You receive "
        "the Archive Receipt: Prophecy Fulfilled. Quest complete.",
        "N/A — delivery act.",
        checkPassFlag="flr_11_act5", activateCond="flr_11_act4", questComplete=True)

    print("\n=== FLR extra cycles complete ===")
    say("FLR cycles 8 through 11 deployed. 20 acts. Divine Comedy Pass 4 extra cycles "
        "complete. Weimar Archive. Archivus Sweelinck. "
        "Phlegyas's Crossing Log, The Gate's Three Steps, "
        "Matilda's River Registry, Cacciaguida's Prophecy Register. Quest complete.")

    print("\n-- Audit --")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    print(f"  {len(errors)} errors" if errors else "  0 errors")
    for e in errors[:5]:
        print(f"    {e}")

    api("post", "/api/save", json={})
    print("  Saved.")

if __name__ == "__main__":
    main()
