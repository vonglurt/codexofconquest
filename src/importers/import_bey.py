#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-BEY: Mandeville's Travels (attr. Sir John Mandeville, c.1357) — 7 cycles, 35 acts
   New nodes: LGE (Liège Monastery), ADN (Ardennes Junction — ARD taken by Ardudwy),
              RGS (Regensburg Dominican Archive), MGZ (Mainz Chapter Archive),
              STR (Strasbourg Dominican Library), AUG (Augsburg Benedictine Scriptorium)
   Uses existing: FAM, RHD, DBV, VEN, CAF, CON, WM, KOL
   Note: Source used 'ARD' for Ardennes → using ADN (ARD = Ardudwy/Wales, conflict)
   Note: Source used 'RGS' for Ragusa waystation in Cycle 2 → using DBV (exists)
"""

import requests, subprocess

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def create_node(code, name, label, act, r, c, desc):
    check = requests.get(BASE + f"/api/node/{code}")
    if check.status_code == 200:
        print(f"  NODE (exists): {code} — {label}")
        return check.json()
    result = api("post", "/api/node", json={
        "code": code, "name": name, "label": label,
        "act": act, "r": r, "c": c, "desc": desc,
    })
    print(f"  NODE: {code} — {label}")
    return result

def ensure_npc(key, name, occupation, node):
    check = requests.get(BASE + f"/api/npc/{key}")
    if check.status_code == 200:
        print(f"  NPC (exists): {key} — {name}")
        return
    api("post", "/api/npc", json={"key": key, "name": name, "occupation": occupation, "node": node})
    print(f"  NPC: {key} — {name} @ {node}")

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          npc=None, checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None, quest_type=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    if quest_type:
        q_type = quest_type
    elif monster and not checkStat:
        q_type = "combat"
    else:
        q_type = "skill_check"
    payload = {
        "id": id, "type": q_type, "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if npc:            payload["npc"]           = npc
    if checkPassFlag:  payload["checkPassFlag"]  = checkPassFlag
    if activateCond:   payload["activateCond"]   = activateCond
    if questComplete:  payload["questComplete"]  = True
    if monster:        payload["monster"]        = monster
    if monsterHP:      payload["monsterHP"]      = monsterHP
    if monsterAC:      payload["monsterAC"]      = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT B E Y. Mandeville's Travels. Seven cycles. Thirty-five acts. Liège. Famagusta. Venice. Regensburg. Mainz. Strasbourg. Augsburg. Weimar.")
    print("=== §IMPORT-BEY: Mandeville's Travels — 7 cycles, 35 acts ===\n")

    # ─── Nodes ───────────────────────────────────────────────────────────────
    print("-- Nodes --")
    create_node("LGE", "camelot", "Liège — Monastery of Saint-Laurent",
        act=1, r=110, c=140,
        desc="A Benedictine monastery in Liège, 1367: a library that received a box of papers "
             "from a traveled English knight in 1362; a librarian who has compared an early draft "
             "to the standard Mandeville text for five years; a Dominican representative arriving "
             "in three days; the place where the honest book slept while the famous one spread.")
    create_node("ADN", "midlands", "Ardennes — Road Junction",
        act=1, r=113, c=148,
        desc="The road junction in the Ardennes highlands where the Cologne road splits "
             "from the Rhine road: hedgerows on both sides, a wide verge, a place where "
             "two mounted riders can wait for a specific traveler; the Dominican's forward "
             "intercept point.")
    create_node("RGS", "scholars_qtr", "Regensburg — Dominican Archive District",
        act=1, r=115, c=170,
        desc="The Dominican house library in Regensburg, 1367: the intake office for scholarly "
             "materials traveling the central German roads; Brother Konrad's desk near the window; "
             "a city on the Danube where the road from Augsburg meets the road from Mainz; "
             "the archive that precedes Weimar on the eastern route.")
    create_node("MGZ", "scholars_qtr", "Mainz — Cathedral Chapter Archive",
        act=1, r=119, c=158,
        desc="The Cathedral Chapter's document vault under the chapter house, Mainz, 1367: "
             "stone walls, cedar chests, crusade-era correspondence from Arabic and Greek sources; "
             "the smell of old wax; Herr Dietrich Schreiber's desk near the false panel "
             "he discovered twenty years ago.")
    create_node("STR", "camelot", "Strasbourg — Dominican Library",
        act=1, r=122, c=155,
        desc="The Dominican library in Strasbourg, 1367: rebuilt after the 1349 plague; "
             "shelves of Rhineland chronicles at the Rhine bend; the smell of fresh bookbinding "
             "and river damp; Brother Heinrich's desk in the center where the light is best; "
             "the Dominican scriptorium producing copies for the German book trade.")
    create_node("AUG", "camelot", "Augsburg — Benedictine Abbey Scriptorium",
        act=1, r=125, c=168,
        desc="The Benedictine abbey scriptorium at Augsburg, 1367: south German city "
             "on the Via Claudia Augusta; Bavarian chronicle copies produced here; "
             "the abbot's library with four locked cabinets for unusual acquisitions; "
             "the smell of vellum and charcoal ink; Brother Christoph's desk in the "
             "scriptorium center.")

    # ─── NPCs ─────────────────────────────────────────────────────────────────
    print("\n-- NPCs --")
    ensure_npc("gilles_bey", "Brother Gilles",
        "Benedictine librarian at Saint-Laurent, Liège; has compared the Liège Manuscript "
        "to the standard Mandeville text for five years and knows where the honest book ends "
        "and the invented supplement begins; commissioned the Fighter to carry the draft "
        "to Weimar before the Dominican representative arrives in three days",
        "LGE")
    ensure_npc("benedetto_bey", "Benedetto Cena",
        "Venetian factor in Famagusta, forty-three years old; purchased a cedar box from "
        "an Armenian dealer named Sahag containing three sheets of Mamluk chancery paper "
        "bearing the great seal of Sultan al-Nasir Muhammad — a full diplomatic commission "
        "to 'Ibn al-Mandafiyl, al-Faras al-Inglizi'; commissioned the Fighter to carry "
        "it to Weimar before Mamluk agents or Hospitaller officials can assess it",
        "FAM")
    ensure_npc("luca_bey", "Brother Luca",
        "Franciscan librarian at a monastery near Pordenone; found a copy of Odoric of "
        "Pordenone's Relatio with 73 marginal annotations in a second hand — each citing "
        "the Mandeville chapter where Odoric's passage was borrowed; 4 citations reference "
        "a Mandeville recension that has since been revised; the annotator's systematic "
        "comparative project reveals the method behind Mandeville's compilation",
        "VEN")
    ensure_npc("dietrich_bey", "Herr Dietrich Schreiber",
        "Cathedral chapter librarian in Mainz, seventy years old; found the Prester John Letter "
        "behind a false shelf panel during chapter house repairs twenty years ago and has been "
        "deciding what to do with it ever since; 'The letter is real. Whether the man who "
        "wrote it is real is a different question.'",
        "MGZ")
    ensure_npc("rapallo_bey", "Notaio Francesco da Rapallo",
        "Genoese colony notary in Caffa, twelve years in post; found a marginal note in a "
        "1332 trade ledger — explaining that cotton wool is grown on plants, not cut from "
        "lamb-shaped vegetables — while auditing wool prices; Orkhon Tegshi's sworn deposition "
        "on folio 23 predates Mandeville's endorsement of the Vegetable Lamb by 22 years; "
        "'It's a footnote to an inventory, but it's the first time anyone wrote it down "
        "in a way that isn't disputable.'",
        "CAF")
    ensure_npc("heinrich_bey", "Brother Heinrich",
        "Dominican librarian in Strasbourg, forties; has been reading the original Boldensele "
        "manuscript and Mandeville's Travels in parallel since 1360, recognizing every borrowed "
        "passage; found a margin note in Boldensele's own hand at the Jerusalem chapter — "
        "'I heard from a Saracen custodian who said: it is the property of this temple that "
        "all who enter are faithful while they are within' — not preserved in any copy",
        "STR")
    ensure_npc("christoph_bey", "Brother Christoph",
        "Benedictine scriptorium master in Augsburg; found an extra chapter while preparing "
        "a new copy of Mandeville — a conversation with Jewish scholar Shimon ben Elazar "
        "about rabbinical geographic mapping of the Eastern routes; not in any of three "
        "comparison copies; linguistic analysis confirms deliberate removal from all other "
        "manuscripts",
        "AUG")

    # ─── Cycle 1: The Sober Draft ─────────────────────────────────────────────
    say("Cycle one. The Sober Draft. Liège to Weimar. Five acts.")
    print("\n-- Cycle 1: The Sober Draft (LGE→ADN→WM) --")

    quest(
        id="bey_c1a1", npc="gilles_bey",
        title="The Liège Manuscript",
        desc=(
            "A Benedictine monastery in Liège holds what appears to be an earlier version "
            "of Mandeville's Travels — one that stops at the Malabar coast, at the edge "
            "of reliable knowledge, without the dog-headed men, headless people, or Prester John. "
            "A Dominican representative arrives in three days to assess whether stopping is "
            "evidence of honest compilation or deliberate suppression. "
            "Brother Gilles needs someone who understands the difference."
        ),
        activateNode="LGE",
        checkStat="WIS", checkDC=12,
        passText=(
            "He reads the Fighter's understanding and relaxes. He wraps the manuscript "
            "with practiced hands. 'Tell the Archivus it stops at the Malabar coast "
            "because that's where the sources stopped. That's what honest looks like.'"
        ),
        failText=(
            "He hesitates and writes a covering letter. The Dominican representative "
            "arrives at the gate at dusk; the manuscript and letter leave together "
            "at the last moment."
        ),
        checkPassFlag="beyC1A1Done",
    )

    quest(
        id="bey_c1a2", npc="gilles_bey",
        title="The Rhine Road Bookseller",
        desc=(
            "A Rhine road bookseller named Jakob wants to commission a copy before the "
            "manuscript reaches Weimar. His argument: publication equals preservation. "
            "He is wrong that a copy of an unauthenticated text is the same as the "
            "authenticated original at a verifiable location. He will listen."
        ),
        activateNode="LGE",
        checkStat="CHA", checkDC=12,
        passText=(
            "He accepts the authentication-before-copying argument and gives the Fighter "
            "a Rhine road map with the better waystation inns marked. "
            "'Send me the transcription authorization when it's through intake.'"
        ),
        failText=(
            "He says he will be in Weimar in six months and expects to see "
            "the transcription authorization waiting."
        ),
        checkPassFlag="beyC1A2Done",
        activateCond="beyC1A1Done",
    )

    quest(
        id="bey_c1a3", npc="gilles_bey",
        title="The Dominican Intercept",
        desc=(
            "The Ardennes road junction. Two Dominican escort riders are waiting with orders "
            "to return the manuscript to Saint-Laurent for chapter assessment. "
            "They have canonical authority over materials in a monastery under their supervision — "
            "but the manuscript is already in private transit. They believe their authority "
            "is clear. It isn't quite. Move into the hedgerow verge to negate "
            "their mounted advantage."
        ),
        activateNode="ADN",
        checkStat="WIS", checkDC=10,
        quest_type="hybrid",
        monster="dominican_rider", monsterHP=20, monsterAC=13,
        passText=(
            "Both down or stood down. The oilcloth sealed clean. "
            "The Ardennes drops toward the Rhine valley."
        ),
        failText=(
            "The pack took a knock. The oilcloth held. Manuscript intact. "
            "The riders yielded at the hedgerow and did not pursue."
        ),
        checkPassFlag="beyC1A3Done",
        activateCond="beyC1A2Done",
    )

    quest(
        id="bey_c1a4", npc="gilles_bey",
        title="The Abbot's Hospitality Clause",
        desc=(
            "A Rhineland abbey abbot invokes a canonical hospitality obligation: "
            "a traveler carrying a contested religious document owes the local church "
            "a disclosure. He is using it as a procedural delay for the Dominican "
            "representative to catch up. He is not the Dominican's ally — "
            "he is exercising his own institutional authority, which has a different "
            "basis and can be argued differently."
        ),
        activateNode="ADN",
        checkStat="CHA", checkDC=13,
        passText=(
            "He recognizes the procedural counter-argument and releases without a hold. "
            "'God speed,' he says. He does not send word to the Dominican."
        ),
        failText=(
            "He holds the pack for one night. The Dominican does not arrive. "
            "He releases in the morning with a written note of the hold and release."
        ),
        checkPassFlag="beyC1A4Done",
        activateCond="beyC1A3Done",
    )

    quest(
        id="bey_c1a5", npc="gilles_bey",
        title="The Archive — Draft or Primary Text",
        desc=(
            "Weimar Archive. Archivus Sweelinck compares the Liège Manuscript to the "
            "standard Mandeville text. He reads the Malabar coast conclusion — the note "
            "that refuses to fill the gap with invention. He asks: is this a draft toward "
            "the embellished version, or is this the completed work the author intended "
            "before someone added two hundred pages of wonders?"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=12,
        passText=(
            "The Malabar note is a conclusion, not a placeholder — it stops where "
            "the knowledge stops. Sweelinck writes: 'Primary text, not draft. "
            "Standard text constitutes a separate, later work.' "
            "Two books, then. The reliable one and the famous one."
        ),
        failText=(
            "Filed as 'Draft — Mandeville's Travels, earlier version.' "
            "Accurate but undersells the distinction."
        ),
        checkPassFlag="beyC1A5Done",
        activateCond="beyC1A4Done",
    )

    # ─── Cycle 2: The Sultan's Commission ─────────────────────────────────────
    say("Cycle two. The Sultan's Commission. Famagusta to Rhodes to Ragusa to Weimar. Five acts.")
    print("\n-- Cycle 2: The Sultan's Commission (FAM→RHD→DBV→WM) --")

    quest(
        id="bey_c2a1", npc="benedetto_bey",
        title="The Cedar Box",
        desc=(
            "Famagusta harbor district, October 1367. Venetian factor Benedetto Cena "
            "purchased a cedar box from an Armenian dealer. Inside: three sheets of Mamluk "
            "chancery paper bearing the great seal of Sultan al-Nasir Muhammad ibn Qalawun — "
            "a full diplomatic commission granting 'Ibn al-Mandafiyl, al-Faras al-Inglizi' "
            "comprehensive access to all the Sultan's domains. Authentic. Forty years old. "
            "Everyone in Famagusta with authority has an interest in the outcome. "
            "A man named Ibrim has been asking questions through intermediaries."
        ),
        activateNode="FAM",
        checkStat="WIS", checkDC=12,
        passText=(
            "Benedetto reads the Fighter's understanding and stops talking. "
            "He hands over the cedar box wrapped in Venetian oilcloth. "
            "'Don't describe it to anyone. If asked, it is Venetian commercial correspondence.'"
        ),
        failText=(
            "Benedetto adds unnecessary instructions about the route to Rhodes. "
            "The delay is small. Ibrim's intermediary is in the harbor district "
            "by the time the Fighter leaves."
        ),
        checkPassFlag="beyC2A1Done",
    )

    quest(
        id="bey_c2a2", npc="benedetto_bey",
        title="Fra Lorenzo at the Harbor Gate",
        desc=(
            "Famagusta harbor gate, morning. Fra Lorenzo is a Hospitaller knight "
            "assigned to document assessment since the 1365 Alexandrian crisis. "
            "He is procedural, not hostile. He wants to know what is in the cedar box, "
            "whether it has been assessed, and what the destination is. "
            "He is not working with Ibrim. He is working for his commandery, "
            "which has its own interest in anything that complicates crusade recruitment."
        ),
        activateNode="FAM",
        checkStat="CHA", checkDC=13,
        passText=(
            "A neutral archive destination is the correct assessment authority "
            "for a disputed document — not a harbor gate. Fra Lorenzo recognizes "
            "the procedural argument. He stamps the customs record. "
            "'Weimar archive, you said. They take everything, then.'"
        ),
        failText=(
            "He exercises the assessment hold. Two hours fabricating documentation "
            "with Benedetto's commercial seal. Ibrim's intermediary reaches the factor "
            "house during the delay. Fra Lorenzo accepts the documentation."
        ),
        checkPassFlag="beyC2A2Done",
        activateCond="beyC2A1Done",
    )

    quest(
        id="bey_c2a3", npc="benedetto_bey",
        title="Grand Prior Fra Gervais",
        desc=(
            "Rhodian commandery intake chamber. Grand Prior Fra Gervais de Montfort "
            "wants Brother Ansgar — who reads Arabic after three years as a Mamluk captive — "
            "to examine the box. He offers Hospitaller escort, presented as protection. "
            "Authentication at Rhodes is classification at Rhodes, which is seizure "
            "at Rhodes. The commandery is in crusade deliberations; a document proving "
            "a Christian voluntarily served the Mamluk army would be used against "
            "crusade recruitment."
        ),
        activateNode="RHD",
        checkStat="WIS", checkDC=13,
        passText=(
            "Name the confiscation structure directly: if Fra Gervais wants to ensure "
            "safe passage, he can write a letter of escort without any prior examination. "
            "He considers. He writes the letter, addressed to the Archivus, "
            "describing the box without examining it. "
            "'Then I have given you what I can give without knowing what you have.'"
        ),
        failText=(
            "Ansgar examines the exterior seal. Fra Gervais requests a formal hold. "
            "A full day and one letter to the legal officer before the argument prevails. "
            "The hold is released. Ansgar says nothing further."
        ),
        checkPassFlag="beyC2A3Done",
        activateCond="beyC2A2Done",
    )

    quest(
        id="bey_c2a4", npc="benedetto_bey",
        title="Ibrim at the Waystation",
        desc=(
            "A waystation north of Ragusa, evening. Ibrim traveled by fast ship. "
            "He is a Mamluk diplomatic agent and completely honest. He sits across "
            "the fire and makes his case: the document belongs by right of origin "
            "to the Mamluk state; its use in current proceedings would misrepresent "
            "the Sultan's original intent. He is right about all of this. "
            "He is wrong only about the archive's purpose."
        ),
        activateNode="DBV",
        checkStat="CHA", checkDC=12,
        passText=(
            "The Weimar archive classification constrains misuse: a document filed "
            "as historical evidence cannot be used as diplomatic proof in current proceedings. "
            "Ibrim knows it is true. 'I have made my offer and it has been declined. "
            "I wish you good weather on the road.' He leaves without incident."
        ),
        failText=(
            "Ibrim offers a certified copy of the Mamluk chancery's own commission record — "
            "a better offer than he intended. The Fighter declines. "
            "Ibrim accepts the distinction with professional respect. He departs."
        ),
        checkPassFlag="beyC2A4Done",
        activateCond="beyC2A3Done",
    )

    quest(
        id="bey_c2a5", npc="benedetto_bey",
        title="The Archive — The Sultan's Letters",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads Arabic slowly, with white cotton gloves. "
            "He reads the honorific title sequence. He reads the commission text. "
            "He finds the name: 'Ibn al-Mandafiyl, al-Faras al-Inglizi.' "
            "He cross-references Chapter XI of Mandeville's Travels. He asks: "
            "which Sultan's seal?"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=12,
        passText=(
            "The honorific sequence 'al-Malik al-Nasir, Sayf al-Dunya wa'l-Din' is specific "
            "to al-Nasir Muhammad's third reign (1310-1341), documented in a Byzantine "
            "diplomatic record in the archive's reference section. "
            "Sweelinck writes: Primary diplomatic document — Mamluk chancery origin — evidential. "
            "'Good. That means it is accurate.'"
        ),
        failText=(
            "Classified as 'Mamluk chancery document, probably authentic, Sultan uncertain, "
            "c. 1330-1345.' Adequate but leaves the conclusion open to dispute."
        ),
        checkPassFlag="beyC2A5Done",
        activateCond="beyC2A4Done",
    )

    # ─── Cycle 3: The Odoric Annotations ──────────────────────────────────────
    say("Cycle three. The Odoric Annotations. Venice to Regensburg to Weimar. Five acts.")
    print("\n-- Cycle 3: The Odoric Annotations (VEN→RGS→WM) --")

    quest(
        id="bey_c3a1", npc="luca_bey",
        title="The Annotated Source",
        desc=(
            "Friuli, a Franciscan monastery near Pordenone. A copy of Friar Odoric's "
            "Relatio has 73 marginal annotations in a second hand — each citing the "
            "specific Mandeville chapter where Odoric's passage was borrowed. "
            "Someone spent weeks with both texts measuring every transfer. "
            "Four citations reference a Mandeville version no longer in circulation. "
            "The annotator had access to a text that has since been revised."
        ),
        activateNode="VEN",
        checkStat="INT", checkDC=11,
        passText=(
            "73 notes. 67 with Mandeville chapter citations. 4 referencing an earlier edition. "
            "Brother Luca looks at the count. "
            "'I knew it was thorough. I didn't know it was that thorough.'"
        ),
        failText=(
            "Systematic and comprehensive; the full pattern only partially quantified. "
            "The 4 early-edition references noted as anomalous."
        ),
        checkPassFlag="beyC3A1Done",
    )

    quest(
        id="bey_c3a2", npc="luca_bey",
        title="Ser Giacomo Fabriano",
        desc=(
            "Venice, near San Polo. Manuscript dealer Ser Giacomo Fabriano wants to publish "
            "a parallel-column comparison edition — Odoric, Mandeville, and the annotations "
            "side by side. Venice can print three hundred copies; Germany can't. "
            "He is right about printing; he is wrong that the copy has the same "
            "evidentiary value as the original at a verifiable location."
        ),
        activateNode="VEN",
        checkStat="CHA", checkDC=12,
        passText=(
            "The archive citation on the title page gives the edition permanent scholarly standing; "
            "the original at Weimar becomes the foundation text. "
            "Fabriano considers. 'The citation would go on the title page. That works.' "
            "He writes himself a note. 'I'll apply for copying access through proper channels.'"
        ),
        failText=(
            "He argues briefly about printing as preservation, then lets the Fighter go."
        ),
        checkPassFlag="beyC3A2Done",
        activateCond="beyC3A1Done",
    )

    quest(
        id="bey_c3a3", npc="luca_bey",
        title="Brother Konrad's Refutation",
        desc=(
            "Regensburg, Dominican house library. Brother Konrad has been working on "
            "a Mandeville refutation and wants the annotations as evidence for deliberate "
            "deception — borrowing without attribution proves fraud. He has the legal "
            "argument partly right and the historical practice completely wrong."
        ),
        activateNode="RGS",
        checkStat="INT", checkDC=12,
        passText=(
            "Compilation without attribution was standard 14th-century practice — "
            "cite Vincent of Beauvais, Albert of Cologne, the Mappae Mundi makers. "
            "The annotations prove method, not fraud. "
            "Brother Konrad: 'The Beauvais comparison is sound. I was going to call it fraud. "
            "It's not fraud. It's practice.' He steps back."
        ),
        failText=(
            "48-hour scholarly access granted. He reads and revises his framing anyway. "
            "It releases."
        ),
        checkPassFlag="beyC3A3Done",
        activateCond="beyC3A2Done",
    )

    quest(
        id="bey_c3a4", npc="luca_bey",
        title="Fabriano's Agents",
        desc=(
            "A crossroads tavern west of Regensburg. Two men block the room's exit — "
            "following since Venice. One has a book-clasp tool; the other carries "
            "a letter in his coat. Fabriano decided the original was worth more "
            "than a printing arrangement."
        ),
        activateNode="RGS",
        checkStat="STR", checkDC=12,
        quest_type="combat",
        monster="book_agent", monsterHP=18, monsterAC=12,
        passText=(
            "Both down or fled. The employment letter identifies Fabriano. "
            "It goes into the provenance file."
        ),
        failText=(
            "They get the satchel. Recover in the stable when one more is down. "
            "The employment letter still identifies Fabriano."
        ),
        checkPassFlag="beyC3A4Done",
        activateCond="beyC3A3Done",
    )

    quest(
        id="bey_c3a5", npc="luca_bey",
        title="The Archive — Compilation Source Records",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads through the annotations. "
            "'The annotator is not criticizing Mandeville. He is documenting a tradition. "
            "He may have been Mandeville's source. Or his editor. Or both.' "
            "He looks at the four citations referencing the earlier edition."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "The 4 early-edition citations mean the annotator worked from a Mandeville text "
            "that predates all current versions — the Odoric volume is also a witness "
            "to a now-lost variant. Sweelinck writes: 'Compilation Source Records — "
            "Comparative Annotations. The method is the document. The 4 early-edition "
            "citations are a separate finding: evidence of a Mandeville recension "
            "that has since been revised. File accordingly.'"
        ),
        failText=(
            "Filed under Odoric source records with Mandeville notation; "
            "early-edition citations noted but not developed."
        ),
        checkPassFlag="beyC3A5Done",
        activateCond="beyC3A4Done",
    )

    # ─── Cycle 4: The Prester John Letter ─────────────────────────────────────
    say("Cycle four. The Prester John Letter. Mainz to Regensburg to Weimar. Five acts.")
    print("\n-- Cycle 4: The Prester John Letter (MGZ→RGS→WM) --")

    quest(
        id="bey_c4a1", npc="dietrich_bey",
        title="The False Panel",
        desc=(
            "Mainz, Cathedral Chapter Archive. Herr Dietrich Schreiber found a letter "
            "behind a false shelf panel during chapter house repairs twenty years ago. "
            "Fine vellum, formal diplomatic Latin, wax seal. Purportedly from Prester John "
            "to a European emperor. 'The letter is real,' Dietrich says. "
            "'I know what real looks like. Whether the man who wrote it is real "
            "is a different question.'"
        ),
        activateNode="MGZ",
        checkStat="INT", checkDC=12,
        passText=(
            "The diplomatic structure — intitulatio, arenga, dispositio, corroboratio — "
            "all match the papal chancellery style of the 1160s-1180s. "
            "Dietrich: 'I knew what era it was. I wanted to know if you knew.'"
        ),
        failText=(
            "Consistent with the claimed period; dating confirmed but diplomatic "
            "analysis incomplete. Enough to proceed."
        ),
        checkPassFlag="beyC4A1Done",
    )

    quest(
        id="bey_c4a2", npc="dietrich_bey",
        title="The Archbishop's Household Officers",
        desc=(
            "Two men from the Archbishop's household wait at the chapter house gate. "
            "A claim about Prester John's territories — a Christian king covering "
            "lands east of Persia — bears on current papal policy toward the Mongols, "
            "the Ethiopians, and Ottoman expansion. The Archbishop wants the letter "
            "retained as a political instrument. If persuasion fails, they enforce."
        ),
        activateNode="MGZ",
        checkStat="CHA", checkDC=13,
        quest_type="hybrid",
        monster="household_guard", monsterHP=20, monsterAC=13,
        passText=(
            "Weimar's intake will explicitly note the disputed claims and decline "
            "to adjudicate — a neutral archive removes the letter from political "
            "instrumentalization more effectively than retention in a chapter archive. "
            "'I will report that the destination explicitly disclaims adjudication "
            "of the letter's claims.' He steps aside."
        ),
        failText=(
            "He insists on retention. Two household guards enforce. "
            "They stop when the legal argument is clearly made."
        ),
        checkPassFlag="beyC4A2Done",
        activateCond="beyC4A1Done",
    )

    quest(
        id="bey_c4a3", npc="dietrich_bey",
        title="Fra Bernardo's Challenge",
        desc=(
            "Regensburg intake office. Fra Bernardo di Brescia has been waiting two days. "
            "His counter-claim: the letter is a forgery produced at the papal court in "
            "the 1160s to pressure Emperor Manuel Comnenus; the scholarly consensus "
            "since the 1240s holds it is fraudulent; a forged letter should be destroyed "
            "as a harmful deception. He is right about the consensus "
            "and wrong about what follows from it."
        ),
        activateNode="RGS",
        checkStat="INT", checkDC=12,
        passText=(
            "A letter about a nonexistent king is a different category of document — "
            "it is the original of itself; the archive receives it as a genuine "
            "12th-century political document whose author and intended effect "
            "are matters of ongoing debate. "
            "Fra Bernardo: 'You are distinguishing between the letter being false "
            "about Prester John and the letter being false as a historical document.' "
            "He nods. 'Those are different things.' He steps back."
        ),
        failText=(
            "He files an authenticity challenge notation; senior review required; "
            "Sweelinck clears it in two hours."
        ),
        checkPassFlag="beyC4A3Done",
        activateCond="beyC4A2Done",
    )

    quest(
        id="bey_c4a4", npc="dietrich_bey",
        title="The Fur Trader on the Forest Road",
        desc=(
            "A Lithuanian fur trader named Mikolas walks alongside for a mile west "
            "of Regensburg, persistent and non-threatening. He has heard of Prester John "
            "from Vilnius merchants and wants to know what the letter says. "
            "He will not stop asking."
        ),
        activateNode="RGS",
        checkStat="CHA", checkDC=11,
        passText=(
            "Describe what the letter actually says — 72 kings, rivers of jewels, "
            "no snakes, no poor — as a 12th-century political document, "
            "without confirming or denying Prester John's existence. "
            "'That is not a real place.' A pause. 'But that is a real letter.' "
            "He peels off at the next road junction, satisfied."
        ),
        failText=(
            "Two hours of questions at a wayside inn. He asks good questions. "
            "He concludes the same thing eventually."
        ),
        checkPassFlag="beyC4A4Done",
        activateCond="beyC4A3Done",
    )

    quest(
        id="bey_c4a5", npc="dietrich_bey",
        title="The Archive — Uncertain Attribution and Contested Referent",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the letter twice. Sets it down. "
            "'Who wrote it?' And: 'Prester John?' He has his pen ready "
            "but no category written. The document is real. "
            "Its subject's existence is not adjudicated here."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "The letter is primary evidence for 12th-century political imagination — "
            "whoever wrote it recorded what a significant actor believed would be "
            "credible to a Byzantine emperor; that is evidence about the 1160s, "
            "not about Prester John. "
            "Sweelinck writes: 'Epistolary Records — Documents of Uncertain Attribution "
            "and Contested Referent. Its claims are not adjudicated here.' "
            "He looks at the seal. 'File it next to the Mandeville chapter. "
            "They were in correspondence about the same man.'"
        ),
        failText=(
            "Filed under Prester John correspondence, disputed authenticity. "
            "Accurate but without the methodological framing."
        ),
        checkPassFlag="beyC4A5Done",
        activateCond="beyC4A4Done",
    )

    # ─── Cycle 5: The Cotton-Lamb Record ──────────────────────────────────────
    say("Cycle five. The Cotton-Lamb Record. Caffa to Constantinople to Weimar. Five acts.")
    print("\n-- Cycle 5: The Cotton-Lamb Record (CAF→CON→WM) --")

    quest(
        id="bey_c5a1", npc="rapallo_bey",
        title="Orkhon Tegshi's Deposition",
        desc=(
            "Caffa, Genoese colony record house. Notaio Francesco da Rapallo found "
            "a marginal note in a 1332 trade ledger while auditing wool prices: "
            "cotton wool is produced by a shrub, not cut from lamb-shaped vegetables; "
            "Tatar merchant Orkhon Tegshi confirms this; see folio 23. "
            "The Vegetable Lamb of Tartary — endorsed by Mandeville in 1357 — "
            "was disproved by a trade invoice. "
            "'It's a footnote to an inventory. But it's the first time anyone wrote "
            "it down in a way that isn't disputable.'"
        ),
        activateNode="CAF",
        checkStat="INT", checkDC=12,
        passText=(
            "Folio 23: Orkhon Tegshi's sworn deposition, dated 1335. "
            "Cotton is a standard crop, harvested by hand. No lamb has ever grown "
            "from a melon. Orkhon was debunking the wonder at its source twenty-two "
            "years before Mandeville repeated it as fact."
        ),
        failText=(
            "The deposition is found; the dating is partially legible. "
            "The temporal precedence is likely but not confirmed."
        ),
        checkPassFlag="beyC5A1Done",
    )

    quest(
        id="bey_c5a2", npc="rapallo_bey",
        title="The Notary-General's Procedure",
        desc=(
            "Caffa harbor loading area. Notary-general Ser Benedetto Savona has decided "
            "the ledger is colony property requiring a formal release order from Genoa — "
            "six months by sea. He is procedurally correct and not hostile. "
            "He has logged the request. If persuasion fails, he calls guards."
        ),
        activateNode="CAF",
        checkStat="CHA", checkDC=12,
        quest_type="hybrid",
        monster="colony_guard", monsterHP=14, monsterAC=11,
        passText=(
            "The colony's operating charter has a 25-year threshold for historical archive "
            "material. The ledger is 30 years old — covered by scholarly transfer protocols, "
            "not colony-property restrictions. "
            "'The 25-year threshold applies.' He writes the transfer notation."
        ),
        failText=(
            "He insists on Genoa release procedure. Two colony guards enforce. "
            "They stop when the legal argument is clearly made."
        ),
        checkPassFlag="beyC5A2Done",
        activateCond="beyC5A1Done",
    )

    quest(
        id="bey_c5a3", npc="rapallo_bey",
        title="The Constantinople Detention Notice",
        desc=(
            "Constantinople, Genoese quarter records house. Ser Martino di Carmona "
            "has received a notice from Caffa for 'a bound ledger, commercial accounts, "
            "Caffa, 1332-37.' The Fighter's documentation describes 'a historical archive "
            "transfer, pre-25-year material, scholarly access protocol.' "
            "These are different categories."
        ),
        activateNode="CON",
        checkStat="CHA", checkDC=12,
        passText=(
            "The Caffa notice covers commercial accounts; the transfer documentation "
            "covers historical archive material; the categories don't match. "
            "Ser Martino: 'I'll notify Caffa that the requested material "
            "was not present here.' He logs the non-match."
        ),
        failText=(
            "He holds the ledger for Caffa verification. Ten days. "
            "Caffa confirms the transfer. Ledger released."
        ),
        checkPassFlag="beyC5A3Done",
        activateCond="beyC5A2Done",
    )

    quest(
        id="bey_c5a4", npc="rapallo_bey",
        title="The Abbot's Road Toll",
        desc=(
            "The Drava river road is flooded. The only passable route goes through "
            "a mountain monastery whose abbot charges a crossing fee in the form "
            "of something interesting from the East. He has been here since 1341 "
            "and finds intellectual isolation more tiring than he admits."
        ),
        activateNode="CON",
        checkStat="INT", checkDC=11,
        passText=(
            "Describe the cotton-lamb debunking: what the Vegetable Lamb is supposed "
            "to look like, what Orkhon said about cotton plants, the 22-year gap "
            "between the deposition and Mandeville's wonder. "
            "The abbot laughs. 'God's most effective arguments are made by people "
            "who didn't know they were making them.' He leads the way along the mule track."
        ),
        failText=(
            "Two engaging hours about dog-headed men and diamond valleys. "
            "The track clears."
        ),
        checkPassFlag="beyC5A4Done",
        activateCond="beyC5A3Done",
    )

    quest(
        id="bey_c5a5", npc="rapallo_bey",
        title="The Archive — Inadvertent Natural Philosophy",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the margin note. Reads it again. "
            "'He was auditing wool prices. Not thinking about wonders. "
            "Thinking about whether he had paid the right amount for cotton. "
            "And then he wrote the correct sentence.'"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "The note's authority is its indifference: an accountant checking an invoice "
            "had no reason to argue about wonders and every reason to record correct "
            "trade information; this predates all known natural-historical treatments "
            "of the Vegetable Lamb. "
            "Sweelinck writes: 'Commercial Records — Inadvertent Natural Philosophy. "
            "He was an accountant who needed to record why the wool-price calculation "
            "differed. The debunking is a byproduct of doing his job. "
            "That makes it the most reliable record in this building on this question.'"
        ),
        failText=(
            "Filed under trade records; margin note noted as historically relevant."
        ),
        checkPassFlag="beyC5A5Done",
        activateCond="beyC5A4Done",
    )

    # ─── Cycle 6: Boldensele's Original ───────────────────────────────────────
    say("Cycle six. Boldensele's Original. Strasbourg to Weimar. Five acts.")
    print("\n-- Cycle 6: Boldensele's Original (STR→WM) --")

    quest(
        id="bey_c6a1", npc="heinrich_bey",
        title="The Temple Margin Note",
        desc=(
            "Strasbourg, Dominican library. Brother Heinrich has been reading the original "
            "Boldensele manuscript and Mandeville in parallel since 1360, recognizing "
            "every borrowed passage. But no copy preserves the margin note at the "
            "Jerusalem chapter — in Boldensele's own hand: 'I heard from a Saracen "
            "custodian who said: it is the property of this temple that all who enter "
            "are faithful while they are within.' Not in any copy. Not one."
        ),
        activateNode="STR",
        checkStat="INT", checkDC=11,
        passText=(
            "The margin note is in a smaller, faster hand than the main text — "
            "written during the visit, not added in composition. "
            "This sentence never left Jerusalem on any other parchment."
        ),
        failText=(
            "Original to the manuscript; visit-time timing probable but not confirmed."
        ),
        checkPassFlag="beyC6A1Done",
    )

    quest(
        id="bey_c6a2", npc="heinrich_bey",
        title="Meister Waldmann's Basel Buyer",
        desc=(
            "Scriptorium owner Meister Hans Waldmann has a Basel buyer who wants "
            "Boldensele with original marginalia. He wants to produce a copy "
            "of the original with the margins intact."
        ),
        activateNode="STR",
        checkStat="CHA", checkDC=12,
        passText=(
            "Offer first rights to the certified margin transcription once the original "
            "is accessioned at Weimar; the Basel buyer wants content, not the object; "
            "a Weimar-certified transcription is that content. "
            "'First rights to the margin transcription. Send the certification "
            "to my Basel contact.' He writes himself a note."
        ),
        failText=(
            "He argues briefly and concedes without pursuit."
        ),
        checkPassFlag="beyC6A2Done",
        activateCond="beyC6A1Done",
    )

    quest(
        id="bey_c6a3", npc="heinrich_bey",
        title="Herr Bernhard Kempf at the Ford",
        desc=(
            "Toll-lord Herr Bernhard Kempf at a Rhine tributary ford east of Strasbourg. "
            "He has a Frankfurt buyer who collects French travel manuscripts and asks "
            "what's in the satchel. His follow-up question about the Regensburg route, "
            "if answered carelessly, identifies an ambush ahead."
        ),
        activateNode="STR",
        checkStat="WIS", checkDC=11,
        passText=(
            "Bernhard's Frankfurt buyer is the same network as Waldmann's Basel buyer. "
            "Offer the archive intake address for copying access requests — "
            "Bernhard is satisfied with the information. "
            "'I'll tell him the archive has it. He'll apply.' "
            "He doesn't seem disappointed — he has his information."
        ),
        failText=(
            "His follow-up question identifies an ambush on the Regensburg route. "
            "Take the alternate road. Add half a day."
        ),
        checkPassFlag="beyC6A3Done",
        activateCond="beyC6A2Done",
    )

    quest(
        id="bey_c6a4", npc="heinrich_bey",
        title="The Collector's Representative",
        desc=(
            "A roadside inn south of Regensburg. Ser Gualterio di Fano's representative "
            "has a fair-market-value letter open on the table and two companions outside. "
            "They are book-trade men, not professionals. The manuscript goes to the archive."
        ),
        activateNode="STR",
        checkStat="STR", checkDC=12,
        quest_type="combat",
        monster="book_trade_agent", monsterHP=16, monsterAC=12,
        passText=(
            "The representative closes the letter. 'The archive is the right place. "
            "I'll tell Ser Gualterio he can apply for access.' He leaves first."
        ),
        failText=(
            "They pursue briefly and give up outside."
        ),
        checkPassFlag="beyC6A4Done",
        activateCond="beyC6A3Done",
    )

    quest(
        id="bey_c6a5", npc="heinrich_bey",
        title="The Archive — Pre-Derivative Originals",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the margin note three times. "
            "'He heard this from a Saracen custodian. The Temple makes everyone faithful "
            "who enters. No copy has this. Not one.' "
            "Boldensele was primary travel evidence before Mandeville used him. "
            "After Mandeville, he was only the source used. "
            "The archive can restore his priority."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=12,
        passText=(
            "Receiving the original restores the author to the tradition that obscured him — "
            "not recovering something lost, but assigning priority. "
            "The margin note is its own primary source. "
            "Sweelinck writes: 'Manuscript Source Records — Pre-Derivative Originals. "
            "The original restores the author to the tradition that obscured him.'"
        ),
        failText=(
            "Filed under Boldensele's Travels, original, with Mandeville derivative notation. "
            "Margins preserved."
        ),
        checkPassFlag="beyC6A5Done",
        activateCond="beyC6A4Done",
    )

    # ─── Cycle 7: The Missing Chapter ─────────────────────────────────────────
    say("Cycle seven. The Missing Chapter. Augsburg to Regensburg to Weimar. Five acts. Quest complete.")
    print("\n-- Cycle 7: The Missing Chapter (AUG→RGS→WM) — questComplete --")

    quest(
        id="bey_c7a1", npc="christoph_bey",
        title="Shimon ben Elazar's Conversation",
        desc=(
            "Augsburg, Benedictine abbey scriptorium. Brother Christoph found an extra "
            "chapter while preparing a new Mandeville copy — appearing between the "
            "Jerusalem and Egypt sections, not in any of his three comparison copies. "
            "The chapter: a conversation with Jewish scholar Shimon ben Elazar, "
            "who explains that the four rivers of Genesis have been mapped by the "
            "rabbinical tradition — each corresponding to an overland route east. "
            "Mandeville concludes: 'the wise men of the Jews have mapped the ways "
            "I describe in this book, and have done so for longer than there have "
            "been Christian travelers to report them.'"
        ),
        activateNode="AUG",
        checkStat="INT", checkDC=12,
        passText=(
            "The chapter uses Hebrew loanwords in transliteration and an Augustinian "
            "'Paradise' form the rest of the text avoids — composed with a different "
            "source, drafted separately. "
            "Brother Christoph: 'Someone removed it. Someone deliberate.'"
        ),
        failText=(
            "Original to this manuscript; compositional details incomplete. "
            "The chapter is clearly authentic to this copy."
        ),
        checkPassFlag="beyC7A1Done",
    )

    quest(
        id="bey_c7a2", npc="christoph_bey",
        title="Prior Father Ulrich's Review",
        desc=(
            "Augsburg, abbey gate, Prior's receiving office. Father Ulrich has been "
            "told about the extra chapter. His concern: a Christian traveler acknowledging "
            "that Jewish scholars mapped Paradise longer than Christians have traveled there "
            "is theologically delicate. He requests review before the manuscript travels. "
            "He does not order suppression. The review he wants is precisely what "
            "the Weimar archive provides."
        ),
        activateNode="AUG",
        checkStat="CHA", checkDC=13,
        passText=(
            "The Weimar intake process is the review he is requesting: Sweelinck will "
            "document the chapter's content and theological implications; "
            "retaining the manuscript leaves the chapter unexamined and unaddressed. "
            "Father Ulrich writes a release letter. "
            "'If there is a theological problem, the archive's record will be the evidence.'"
        ),
        failText=(
            "He calls the abbot; a senior theologian reviews for four days; "
            "the chapter is unusual but not heretical; the manuscript releases "
            "with the theologian's notation."
        ),
        checkPassFlag="beyC7A2Done",
        activateCond="beyC7A1Done",
    )

    quest(
        id="bey_c7a3", npc="christoph_bey",
        title="Frater Johannes Eckhard",
        desc=(
            "Regensburg. Dominican inquisitor Frater Johannes Eckhard received a report "
            "from Augsburg. His concern is specific: a travel narrative acknowledging "
            "Jewish geographic priority over the Eastern routes is potentially subversive "
            "to active conversion missions in the East. He wants to examine the chapter "
            "before it leaves the diocese."
        ),
        activateNode="RGS",
        checkStat="CHA", checkDC=13,
        passText=(
            "A traveler's memoir is not a theological instrument; the archive files it "
            "as a record of a conversation, not a doctrinal position; "
            "he can submit a formal observation to the intake file. "
            "'I will submit a formal observation to the archive.' He steps back. "
            "'The record will reflect my concern.' He sounds satisfied."
        ),
        failText=(
            "He exercises inquisitorial authority for a 24-hour examination; "
            "his three-paragraph note is precise and interesting; "
            "the manuscript releases with his note in the intake file."
        ),
        checkPassFlag="beyC7A3Done",
        activateCond="beyC7A2Done",
    )

    quest(
        id="bey_c7a4", npc="christoph_bey",
        title="The Copyist on the Milestone",
        desc=(
            "Road north of Regensburg, evening. An eighty-year-old Benedictine copyist "
            "sits on a milestone waiting. He copied the extra chapter thirty years ago "
            "from an earlier copy — he has notes: the abbey, the librarian who showed it "
            "to him, the date. 'I didn't invent it. I copied it faithfully.' "
            "He wants his provenance documentation to accompany the manuscript."
        ),
        activateNode="RGS",
        checkStat="WIS", checkDC=11,
        passText=(
            "He wants protection for his record, not a confrontation. "
            "Include his notes in the intake file as chain-of-custody documentation. "
            "'Thank you.' He stands. He walks back toward his monastery. "
            "His notes are now part of the chain of custody."
        ),
        failText=(
            "One more question about whether the inquisitor was going to cause trouble. "
            "Answered honestly. The notes are given."
        ),
        checkPassFlag="beyC7A4Done",
        activateCond="beyC7A3Done",
    )

    quest(
        id="bey_c7a5", npc="christoph_bey",
        title="The Archive — The Pattern of Absence",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the chapter. Reads Mandeville's "
            "conclusion. Sets it down. 'Someone removed this from every other copy,' "
            "he says — not as accusation, as a measurable fact. "
            "'That is itself a fact. I will record it.' "
            "On the desk: the prior's release letter, the inquisitor's observation, "
            "the copyist's provenance notes, the manuscript."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=12,
        passText=(
            "The pattern of absence is itself a primary document: the archive receives "
            "both the chapter and the fact of its systematic removal from all other copies; "
            "no adjudication of why. "
            "Sweelinck writes: 'Textual Records — Variant Chapters Absent from Canonical "
            "Manuscripts. The archive records both the chapter and the pattern of its absence. "
            "The reason for the removal is not adjudicated here; "
            "the record of the removal is itself a primary document.' "
            "He stacks all four intake documents. 'The absence is the fact.'"
        ),
        failText=(
            "Filed under Mandeville Latin variants; chapter content noted; "
            "absence pattern mentioned."
        ),
        checkPassFlag="beyC7A5Done",
        activateCond="beyC7A4Done",
        questComplete=True,
    )

    print("\n=== BEY import complete — 7 cycles, 35 acts ===")
    say("Mandeville's Travels import complete. Seven cycles. Thirty-five acts. Quest complete on cycle seven.")

if __name__ == "__main__":
    main()
