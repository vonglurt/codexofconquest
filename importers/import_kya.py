#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-KYA: Shah-Nameh (Ferdowsi / Atkinson) — 7 cycles, 35 acts
   New nodes: YAZ (Yazd Fire Temple Quarter), KBL (Kabul Mountain Fortress District)
   Uses existing: TBZ (Tabriz), TRB (Trebizond), NIS (Nishapur), SAM (Samarkand),
                  CON (Constantinople), WM (Weimar), RGS (Regensburg), DBV (Ragusa)
   Note: TBZ in game = Tabriz (not Trebizond); TRB in game = Trebizond
   Note: Source uses TAB for Tabriz → using TBZ (already exists as Tabriz)
   Note: Source uses TBZ for Trebizond → using TRB (already exists as Trebizond)
   Note: Source uses CPL for Constantinople Scholar's Quarter → using CON (exists)
   Note: Source uses RGS for Ragusa waystation in Cycle 6 → using DBV (exists)
   Note: SIS (Sistan) needed for Cycle 8 → deferred to next import pass
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
    say("§IMPORT K Y A. Shah-Nameh. Seven cycles. Thirty-five acts. Tabriz. Trebizond. Yazd. Kabul. Nishapur. Constantinople. Weimar.")
    print("=== §IMPORT-KYA: Shah-Nameh (Ferdowsi / Atkinson) — 7 cycles, 35 acts ===\n")

    # ─── Nodes ───────────────────────────────────────────────────────────────
    print("-- Nodes --")
    create_node("YAZ", "camelot", "Yazd — Fire Temple Quarter",
        act=1, r=228, c=430,
        desc="Yazd Fire Temple Quarter, 1367: the Azar Yazdan fire temple in a low stone building "
             "set back from the main street; a Zoroastrian minority community under increasing "
             "pressure from Muzaffarid Muslim court administration; a flame tended continuously "
             "since, by community tradition, the night Húsheng struck flint; the smell of "
             "sandalwood incense and old stone and the specific wariness of a place that has "
             "been keeping something alive longer than any surrounding institution has been "
             "watching.")
    create_node("KBL", "mountains", "Kabul — Mountain Fortress District",
        act=1, r=222, c=465,
        desc="Kabul Mountain Fortress District, 1367: a city at the Hindu Kush foothills under "
             "contested nominal authority between Chagatai remnants and Tughlaq pressure from "
             "the east; court histories and private libraries surviving in private hands because "
             "no authority has been stable enough to confiscate them; the smell of high-altitude "
             "pine smoke and old ink and the specific wariness of a city that has changed hands "
             "too many times to trust any master.")

    # ─── NPCs ─────────────────────────────────────────────────────────────────
    print("\n-- NPCs --")
    ensure_npc("bartolomeo_kya", "Bartolomeo the Genoese",
        "Genoese trader in Trebizond harbor district, 1367; purchased five folios from "
        "the dispersed Great Mongol Shah-Nameh from a Tabriz merchant fleeing Jalayirid "
        "tax pressure; does not know what they are; has been watched by two Jalayirid "
        "merchants since acquiring them; commissioned the Fighter to carry the Kavah Pages "
        "to Constantinople and then to Weimar before the Jalayirid merchants close in",
        "TRB")
    ensure_npc("hassan_kya", "Hassan ibn Mansur",
        "Legal scholar in Nishapur, keeper of the Combat Custom Folio for eleven years; "
        "a Pahlavi legal commentary containing two contradictory margin annotations about "
        "whether Rustem's two-falls custom predates Firdusi; does not believe the question "
        "can be settled but believes it is the right kind of question; commissioned the "
        "Fighter to carry the folio to an archive that will hold the question without "
        "resolving it",
        "NIS")
    ensure_npc("bahram_kya", "Bahram Yazdi",
        "Head fire-keeper at the Azar Yazdan temple, Yazd, seventy years old; just made "
        "the 88th entry in the Fire Chain Scroll in his own hand; a waqf property dispute "
        "has been escalating for two years and court agents will find the scroll if it "
        "remains in the temple; commissioned the Fighter to carry the seven-foot parchment "
        "listing every keeper of the sacred flame from Húsheng's first night to Tabriz "
        "and then to Weimar",
        "YAZ")
    ensure_npc("yaqub_kya", "Yaqub ibn Ibrahim",
        "Madrasa scholar in Nishapur, keeper of the First Lesson Parchment; three folios "
        "of Pahlavi demonic script with a Pahlavi transliteration, possibly the oldest "
        "writing lesson in the world or the most accurate 9th-century imagining of what "
        "authentic would look like; wrote the honest framing note at the bottom himself; "
        "nearly donated the parchment to an Ottoman scholarly network before the Fighter "
        "commissioned its transfer to Weimar",
        "NIS")
    ensure_npc("malikshah_kya", "Malikshah al-Sultani",
        "Court historian in Kabul, seventy-five years old, holder of the Zábulistán "
        "Chronicle for forty years; four folios of a 10th-century court history naming "
        "Jemshíd's queen Sháhdokht and recording her account of the king's final years "
        "before his capture; political situation in eastern Persia deteriorating with "
        "Timurid advance; commissioned the Fighter to carry the chronicle to Tabriz and "
        "then to Weimar before a conqueror can claim it as a trophy",
        "KBL")
    ensure_npc("khalid_kya", "Khalid ibn Ahmad al-Zargar",
        "Dying guild master of the Anjuman-i Zargar, Tabriz goldsmith's brotherhood; "
        "keeper of seventeen folios recording every Sassanian king's addition to the "
        "Derafsh Kaviani banner from the 6th to 10th century; six dynasties used the "
        "same phrase acknowledging Kavah's craftsman-origin each time; the incoming guild "
        "master will file it without reading it; commissioned the Fighter to carry the "
        "Guild Ledger to Weimar before he dies",
        "TBZ")
    ensure_npc("ardeshir_kya", "Ardeshir",
        "Junior fire-keeper and inventory officer at the Azar Yazdan temple, Yazd, twenty "
        "years in post; has known about the sealed ivory case since his first audit and has "
        "never opened it; the waqf dispute from the temple's property case threatens to "
        "make it exhibit evidence in a hearing; commissioned the Fighter to carry the "
        "palm-sized ivory case — inventory claiming one Símúrgh feather, Alberz mountain "
        "provenance — to Constantinople for scholarly assessment and then to Weimar "
        "sealed and unopened",
        "YAZ")

    # ─── Cycle 1: The Derafsh Kaviani Fragment ───────────────────────────────
    say("Cycle one. The Derafsh Kaviani Fragment. Trebizond to Constantinople to Weimar. Five acts.")
    print("\n-- Cycle 1: The Derafsh Kaviani Fragment (TBZ→CON→WM) --")

    quest(
        id="kya_c1a1", npc="bartolomeo_kya",
        title="The Trader Doesn't Know What He Has",
        desc=(
            "Trebizond harbor district, 1367. Genoese trader Bartolomeo has five folios "
            "from the dispersed Great Mongol Shah-Nameh — the section depicting Feridún's "
            "defeat of the serpent-king Zohák and the raising of the blacksmith's leather "
            "apron as the emblem of Persian kingship. He paid the cost of a good horse. "
            "Two Jalayirid merchants have been asking about the folios since he acquired them. "
            "They are watching the warehouse. He needs a scholarly buyer who will take them "
            "cleanly before the Jalayirid agents press their claim."
        ),
        activateNode="TRB",
        checkStat="CHA", checkDC=12,
        passText=(
            "Bartolomeo reads the Fighter's understanding and stops talking. He hands over "
            "the five folios — lapis lazuli and gold on heavy parchment, wrapped in waxed "
            "leather — and warns that if the Jalayirid merchants learn they left Trebizond, "
            "there will be riders on the road west."
        ),
        failText=(
            "He hesitates, citing the Jalayirid offer price. A second argument about the "
            "document's political sensitivity — a craftsman's apron as the symbol of "
            "legitimate rule — convinces him. The folios are handed over under scrutiny."
        ),
        checkPassFlag="kyaC1A1Done",
    )

    quest(
        id="kya_c1a2", npc="bartolomeo_kya",
        title="The Merchant's Agent on the Road",
        desc=(
            "Black Sea coastal road. One of the Jalayirid merchants has sent a fast rider "
            "after the Fighter with two armed companions. The rider overtakes them on the "
            "coastal road and demands the pages be shown — claiming they are property of "
            "the Sultan. He is not violent but has two armed companions backing the claim. "
            "The question is whether this is a state seizure or a private commercial dispute."
        ),
        activateNode="TRB",
        checkStat="WIS", checkDC=12,
        quest_type="hybrid",
        monster="jalayirid_agent", monsterHP=22, monsterAC=13,
        passText=(
            "The Fighter recognizes a private commercial dispute, not a state seizure. "
            "When challenged on the legal authority, the men back down — the Sultan's "
            "name was invoked without documentation. They withdraw."
        ),
        failText=(
            "The men do not accept the argument. Two armed companions move to enforce. "
            "They yield when the cost of the road fight becomes clear."
        ),
        checkPassFlag="kyaC1A2Done",
        activateCond="kyaC1A1Done",
    )

    quest(
        id="kya_c1a3", npc="bartolomeo_kya",
        title="The Scholar's Verification",
        desc=(
            "Constantinople, Byzantine scholar quarter. Nikephoros Gregoras's student — "
            "a young paleographer — examines the five pages. He recognizes the Great Mongol "
            "Shah-Nameh's distinctive style immediately and is astounded. He explains what "
            "the images mean: the blacksmith's apron as the emblem of just rule, raised "
            "against a serpent-king. A Genoese merchant guild representative is watching "
            "his house. Word has spread that the pages are in Constantinople. "
            "The guild wants a finder's fee before the pages leave the city."
        ),
        activateNode="CON",
        checkStat="CHA", checkDC=12,
        passText=(
            "The Fighter leaves the scholar's house without the guild representative "
            "seeing the pages change hands. The representative waits another hour "
            "before concluding the transaction was commercial correspondence."
        ),
        failText=(
            "The guild representative spots the leather wrapping. He demands a finder's "
            "fee of forty silver pieces or a formal delay. The fee is paid and the pages "
            "leave Constantinople with a guild receipt attached."
        ),
        checkPassFlag="kyaC1A3Done",
        activateCond="kyaC1A2Done",
    )

    quest(
        id="kya_c1a4", npc="bartolomeo_kya",
        title="The Pilgrim Road North",
        desc=(
            "Balkan mountain road. A local lord has imposed a checkpoint — plague-related "
            "road closures in 1367 have given him grounds for document inspection. "
            "Religious manuscripts are exempt from his toll; commercial goods are taxed. "
            "The five folios from the Shah-Nameh could be classified either way: "
            "Persian religious epic or commercial manuscript trade goods."
        ),
        activateNode="CON",
        checkStat="INT", checkDC=12,
        passText=(
            "The Shah-Nameh has Zoroastrian religious content and the images depict "
            "a divine calling — the voice from Heaven instructing Feridún to chain "
            "rather than kill. The lord accepts the religious classification. "
            "Passage without tax."
        ),
        failText=(
            "He classifies them as commercial goods. Toll: thirty gold pieces. "
            "Paid under protest, the receipt noting the religious content disputed."
        ),
        checkPassFlag="kyaC1A4Done",
        activateCond="kyaC1A3Done",
    )

    quest(
        id="kya_c1a5", npc="bartolomeo_kya",
        title="Arrival and the Archivist's Question",
        desc=(
            "Weimar Archive. Archivus Sweelinck receives the five folios. He examines "
            "the lapis lazuli and gold work, the depictions: Kavah tearing the blood-register "
            "before Zohák's court; the apron raised on the javelin-point; crowds rallying "
            "to the banner; Feridún binding the serpent-king in the mountain cave. "
            "He asks: this banner — raised by a blacksmith against a serpent-king — "
            "what do you think it means?"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "The man who tears the register of blood and raises the craftsman's apron "
            "has given us the only archive of legitimacy that cannot be corrupted, "
            "because it comes from labor, not lineage. Sweelinck nods and writes: "
            "Ilkhanid Manuscript Records — Shah-Nameh, Kavah Episode. "
            "'Two things: the images, and the fact that they were political the moment "
            "they were painted.'"
        ),
        failText=(
            "Sweelinck receives the folios without the framing. He files them under "
            "Persian manuscript trade, Ilkhanid period. The political charge is noted "
            "as a secondary observation."
        ),
        checkPassFlag="kyaC1A5Done",
        activateCond="kyaC1A4Done",
    )

    # ─── Cycle 2: The Two-Falls Custom ───────────────────────────────────────
    say("Cycle two. The Two-Falls Custom. Nishapur to Tabriz to Weimar. Five acts.")
    print("\n-- Cycle 2: The Two-Falls Custom (NIS→TAB→WM) --")

    quest(
        id="kya_c2a1", npc="hassan_kya",
        title="The Man Who Kept the Question",
        desc=(
            "Nishapur, the legal scholar Hassan ibn Mansur's study. He has kept a Pahlavi "
            "legal commentary on single combat for eleven years — fourteen folios with two "
            "contradictory annotations on the same page. The older annotation confirms the "
            "two-falls custom predates Firdusi; the newer annotation denies it can be "
            "verified and calls the first annotation false. The text itself does not say "
            "when the custom originated. He wants to know if the Fighter understands "
            "what is being carried."
        ),
        activateNode="NIS",
        checkStat="WIS", checkDC=12,
        passText=(
            "He seals the leather cording himself and presses a small wax circle over "
            "the knot. 'If the custom was real, Rustem remembered it. If it was not, "
            "he created it. Either way, a son stood over his father and let him speak. "
            "Take it where it will be held without being resolved.'"
        ),
        failText=(
            "He ties the folio in silence, uncertain whether the right person has come. "
            "He writes nothing on the cover. The two-annotation page sits at the front "
            "of the folio, both inks visible."
        ),
        checkPassFlag="kyaC2A1Done",
    )

    quest(
        id="kya_c2a2", npc="hassan_kya",
        title="The Customs Official's Notation",
        desc=(
            "A Jalayirid customs inspector at a caravanserai checkpoint on the road west "
            "from Nishapur. He is thorough and not hostile — he taxes commercial manuscripts "
            "at three percent of value. Scholarly documents travel free. He wants to open "
            "the folio to verify its nature. The Combat Custom Folio contains a legal "
            "commentary on Persian single combat customs."
        ),
        activateNode="NIS",
        checkStat="CHA", checkDC=12,
        passText=(
            "He writes a notation on the outer leather binding: 'Personal scholarly effects "
            "— no commercial value. Released without tax.' He hands it back. "
            "The folio now carries a third hand's notation on its exterior."
        ),
        failText=(
            "He taxes it at thirty silver pieces. If payment delays, he holds it three "
            "days pending verification — long enough for Tabriz rivals to learn it is coming."
        ),
        checkPassFlag="kyaC2A2Done",
        activateCond="kyaC2A1Done",
    )

    quest(
        id="kya_c2a3", npc="hassan_kya",
        title="The Scholar Who Wants to Rule",
        desc=(
            "Tabriz, Jalayirid scholar quarter. Mahmud al-Kashani has been waiting for "
            "this folio since he heard it was in Nishapur. He opens it to the disputed page "
            "and adds a note in red ink beneath the older annotation: 'The custom is here — "
            "line 47. See Arsacid ref. M.K. 1367.' He turns to hand the folio back, "
            "satisfied. His colleague Yusuf raises his voice: 'You are annotating the "
            "question as though you have answered it. You have not.' They begin arguing. "
            "The folio is still in al-Kashani's hand."
        ),
        activateNode="TBZ",
        checkStat="DEX", checkDC=13,
        passText=(
            "The folio is recovered before the dispute becomes physical. Al-Kashani's "
            "red-ink notation is already written and cannot be removed. The folio "
            "leaves Tabriz with four annotations in three hands, none in agreement, "
            "and the text still not settling the question."
        ),
        failText=(
            "Yusuf snatches the folio first. In the struggle the spine leather tears "
            "slightly. The folio is recovered from Yusuf, intact but marked."
        ),
        checkPassFlag="kyaC2A3Done",
        activateCond="kyaC2A2Done",
    )

    quest(
        id="kya_c2a4", npc="hassan_kya",
        title="The Road to Weimar",
        desc=(
            "Jalayirid-Byzantine borderland. Three men stop the Fighter on the road. "
            "They are hired — working for a Persian courtier who would prefer the folio "
            "destroyed. He is not interested in the scholarly question. He is interested "
            "in the Shah-Nameh's reputation: if Rustem invented the law, the poem's "
            "greatest hero committed a procedural fraud against a dying son, and that "
            "answer is worse than no answer. One of the men carries a letter authorizing "
            "payment for 'the return of a certain folio to its rightful owners.'"
        ),
        activateNode="TBZ",
        checkStat="STR", checkDC=12,
        quest_type="combat",
        monster="persian_agent", monsterHP=22, monsterAC=13,
        passText=(
            "Three opponents down or fled. The folio is intact in the pack. "
            "Searching one man reveals the destruction-order letter — unsigned, "
            "but specific enough about the folio's contents to confirm it was sent "
            "by someone who had read the commentary."
        ),
        failText=(
            "The men get the pack briefly before the Fighter recovers it. "
            "The folio is intact. The destruction-order letter still found on one man."
        ),
        checkPassFlag="kyaC2A4Done",
        activateCond="kyaC2A3Done",
    )

    quest(
        id="kya_c2a5", npc="hassan_kya",
        title="The Archive Receives the Question",
        desc=(
            "Weimar Archive. Archivus Sweelinck opens the folio. He reads both original "
            "annotations, the customs clearance, and al-Kashani's red-ink ruling. He reads "
            "the folio's text carefully for several minutes. Then he reads it again. "
            "The text describes the two-falls custom but does not date it. The Arsacid "
            "reference the older note cites does not appear in any concordance he has."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=11,
        passText=(
            "Sweelinck cannot rule. 'Hassan ibn Mansur was right to send it here.' "
            "He carries it to a new shelf and writes in the master ledger: "
            "Documents Bearing Legal Questions of Uncertain Provenance — Customs That "
            "Cannot Be Dated Before Their First Attestation. 'Whether Rustem remembered "
            "the law or made it, a son threw his father to the ground and waited to hear "
            "what the man under his foot would say. That is correctly preserved.'"
        ),
        failText=(
            "Filed under Persian legal manuscripts, single combat, provenance uncertain. "
            "The contradictory annotations noted but without the methodological framing."
        ),
        checkPassFlag="kyaC2A5Done",
        activateCond="kyaC2A4Done",
    )

    # ─── Cycle 3: The Fire Chain ──────────────────────────────────────────────
    say("Cycle three. The Fire Chain. Yazd to Tabriz to Weimar. Five acts.")
    print("\n-- Cycle 3: The Fire Chain (YAZ→TAB→WM) --")

    quest(
        id="kya_c3a1", npc="bahram_kya",
        title="The Last Entry",
        desc=(
            "Yazd, Azar Yazdan fire temple. Bahram Yazdi, head fire-keeper, is seventy. "
            "He made the 88th entry in the Fire Chain Scroll this morning — his own name, "
            "in his own hand — and tied the leather cord. A seven-foot parchment listing "
            "every keeper of the flame from Húsheng's first night to 1367: names, dates, "
            "one-line transmission note. A waqf property dispute has been escalating for "
            "two years; if court agents find the scroll, it becomes evidence in a property "
            "case. 'The fire in that room cannot tell you it is Húsheng's fire. But these "
            "names are from the first night. Take it where it will not be used as a "
            "deed of ownership.'"
        ),
        activateNode="YAZ",
        checkStat="INT", checkDC=12,
        passText=(
            "Bahram tells the Fighter the Tabriz contact's name: Ahmad al-Farghani, "
            "a Muslim historian at the Jalayirid scholar quarter. 'He is a Muslim, "
            "but he is a historian first. He will know what he is holding.'"
        ),
        failText=(
            "He ties the scroll without commentary and tucks a contact-slip inside "
            "the outer leather wrapping. The Tabriz contact's name is on the slip."
        ),
        checkPassFlag="kyaC3A1Done",
    )

    quest(
        id="kya_c3a2", npc="bahram_kya",
        title="The Road Classification",
        desc=(
            "A Muzaffarid customs inspector at a permanent checkpoint three hours out "
            "of Yazd. He examines the scroll's outer leather, reads the Zoroastrian "
            "three-color cord — red, white, black — and asks what is inside. 'Religious "
            "documents of non-Muslim cults require a clerical review permit before "
            "transport. I will need to hold this three days for review.' The Fire Chain "
            "Scroll lists names and dates: the function of a genealogy, not a liturgy."
        ),
        activateNode="YAZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "He writes 'historical genealogy, non-commercial, no permit required' on "
            "a notation slip and ties it to the outer cord. The Fire Chain Scroll "
            "acquires a travel notation and leaves the checkpoint."
        ),
        failText=(
            "Three-day hold. During the delay, a waqf official's courier leaves Yazd "
            "for the scroll's location."
        ),
        checkPassFlag="kyaC3A2Done",
        activateCond="kyaC3A1Done",
    )

    quest(
        id="kya_c3a3", npc="bahram_kya",
        title="The Historian's Recognition",
        desc=(
            "Tabriz, Jalayirid Persian scholar quarter. Ahmad al-Farghani unrolls the "
            "scroll partway and reads the first few entries: Kaiúmers, Húsheng. He looks "
            "up. 'No forger would have written it this way. A forger would have invented "
            "more impressive witnesses.' Problem: a Zoroastrian exile named Rustam the "
            "jeweler has heard through the Yazd community that the scroll is in Tabriz. "
            "He arrives at al-Farghani's door wanting a copy for a legal case. "
            "The waqf official's courier is two days behind."
        ),
        activateNode="TBZ",
        checkStat="WIS", checkDC=12,
        passText=(
            "The scroll must leave today. Al-Farghani adds his authentication note "
            "inside the outer leather cover and releases it immediately. "
            "A copy could serve Rustam's legal purpose but the original must go now."
        ),
        failText=(
            "A three-day delay is agreed for Rustam's copy. The waqf courier arrives "
            "on day two and the situation becomes urgent before the scroll departs."
        ),
        checkPassFlag="kyaC3A3Done",
        activateCond="kyaC3A2Done",
    )

    quest(
        id="kya_c3a4", npc="bahram_kya",
        title="The Process Server",
        desc=(
            "Road north from Tabriz, four hours from the Jalayirid-Byzantine boundary. "
            "A well-dressed rider overtakes the Fighter. He carries a sealed document "
            "case and the Muzaffarid court's travel seal. He is a legal process server "
            "from Yazd with a writ claiming the scroll as temple property under court "
            "custody. He is correct about the law. He is also correct that his authority "
            "does not extend past the boundary, which is four hours ahead on this road."
        ),
        activateNode="TBZ",
        checkStat="STR", checkDC=12,
        passText=(
            "The Fighter maintains pace through the rest of the day. At the boundary "
            "marker the process server turns back without having formally served the writ. "
            "The Fire Chain Scroll crosses into Byzantine territory without legal attachment."
        ),
        failText=(
            "The writ is served. The writ is unenforceable in Byzantine territory and "
            "Sweelinck will note it in the chain-of-custody record. The scroll continues."
        ),
        checkPassFlag="kyaC3A4Done",
        activateCond="kyaC3A3Done",
    )

    quest(
        id="kya_c3a5", npc="bahram_kya",
        title="The Archive of Names",
        desc=(
            "Weimar Archive. Archivus Sweelinck unrolls the scroll on the longest table "
            "in the archive room. Seven feet of Persian calligraphy. He reads the names "
            "from the beginning, taking his time. The room is quiet."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "Sweelinck finishes the scroll and is quiet for a while. 'The fire in Yazd "
            "may be from any source. But these names are from the first night, because "
            "this is the kind of record only a community present at that night would begin "
            "with those names in that order.' He rolls it carefully and writes: "
            "Zoroastrian Sacred Transmission Records — Fire Custody Chain, Siddeh Origin. "
            "Final entry: Bahram ibn Yazdi, 1367. 'The record is more durable than the "
            "flame. That was always understood. That was why they kept it.'"
        ),
        failText=(
            "Filed under Zoroastrian religious records, transmission chain. "
            "The 88 entries noted, provenance accepted."
        ),
        checkPassFlag="kyaC3A5Done",
        activateCond="kyaC3A4Done",
    )

    # ─── Cycle 4: The Demon's First Lesson ────────────────────────────────────
    say("Cycle four. The Demon's First Lesson. Nishapur to Constantinople to Weimar. Five acts.")
    print("\n-- Cycle 4: The Demon's First Lesson (NIS→CON→WM) --")

    quest(
        id="kya_c4a1", npc="yaqub_kya",
        title="The Scholar Who Was About to Donate It",
        desc=(
            "Nishapur madrasa library. Yaqub ibn Ibrahim is packing books — dispersing "
            "twenty items to an Ottoman scholarly network, not as a sale but as a "
            "diplomatic gift. The First Lesson Parchment is in the donation queue. "
            "Three folios of Pahlavi: left column in proto-Pahlavi demonic script, "
            "right column in readable Pahlavi transliteration. A bottom note in Arabic, "
            "his own hand: 'If authentic, this is the oldest writing lesson in the world. "
            "If not, it demonstrates how a 9th-century scholar imagined what authentic "
            "would look like. Both descriptions are precisely correct.'"
        ),
        activateNode="NIS",
        checkStat="CHA", checkDC=13,
        passText=(
            "He removes the parchment from the donation queue and hands it over in its "
            "oilskin sleeve. 'Tell whoever receives it that the bottom note was written "
            "by me. I wanted the framing preserved with the parchment.'"
        ),
        failText=(
            "He is unconvinced by general principle. A second argument naming the Weimar "
            "archive specifically succeeds. On failure of both: four-day window before "
            "the Ottoman caravan departs."
        ),
        checkPassFlag="kyaC4A1Done",
    )

    quest(
        id="kya_c4a2", npc="yaqub_kya",
        title="The Network's Representative",
        desc=(
            "Road west from Nishapur. A Turkish scholar-merchant is traveling the same "
            "road, connected to the Ottoman donation network. He recognized the madrasa "
            "seal on Yaqub's travel documentation and deduced that a notable item was "
            "redirected. He is polite and states his concern accurately: 'The parchment "
            "was in the queue. Redirecting it requires written authorization from "
            "the madrasa board.'"
        ),
        activateNode="NIS",
        checkStat="CHA", checkDC=12,
        passText=(
            "The parchment is a personal commentary by Yaqub — personal materials "
            "are his to dispose of at will and are not subject to board review. "
            "The representative accepts this framing and continues on his road."
        ),
        failText=(
            "He sends a notice of redirection to Nishapur. A request-to-return rider "
            "overtakes the Fighter two days later. It is a request, not a writ."
        ),
        checkPassFlag="kyaC4A2Done",
        activateCond="kyaC4A1Done",
    )

    quest(
        id="kya_c4a3", npc="yaqub_kya",
        title="The Question the Paleographer Cannot Answer",
        desc=(
            "Constantinople, Nikephoros Katakalon's paleography study. The best Pahlavi "
            "paleographer in Constantinople examines the two-column parchment for two hours, "
            "then another hour, then reads his own notes. 'The demonic script column is "
            "consistent with early Pahlavi syllabary ancestors. It is also consistent with "
            "what a very skilled 9th-century scholar would produce if he had studied those "
            "ancestors and extrapolated backwards. I cannot distinguish between these two "
            "descriptions. Both are precisely accurate.' He puts his notes down. "
            "'What is the right question to ask about this?'"
        ),
        activateNode="CON",
        checkStat="INT", checkDC=12,
        passText=(
            "The right question is not whether it is authentic but what would change if "
            "we knew the answer. Katakalon is quiet for a moment. He writes on the back "
            "of the parchment: 'The question is more valuable than either answer. The "
            "lesson was preserved regardless of who was the teacher. N. Katakalon, "
            "Constantinople, 1367.'"
        ),
        failText=(
            "He writes only: 'Authenticity undetermined. N. Katakalon, Constantinople.' "
            "Less useful framing but still truthful."
        ),
        checkPassFlag="kyaC4A3Done",
        activateCond="kyaC4A2Done",
    )

    quest(
        id="kya_c4a4", npc="yaqub_kya",
        title="The Network's Second Try",
        desc=(
            "Balkan road. Two scholars traveling north — connected to the Ottoman network's "
            "Constantinople chapter. They carry a copy of the prior-intention letter from "
            "Nishapur stating that the madrasa board's original intention was to include "
            "the parchment in the Ottoman donation. A prior intention is not a legal "
            "transfer: Yaqub was authorized to remove the parchment from the queue "
            "and did so."
        ),
        activateNode="CON",
        checkStat="CHA", checkDC=12,
        passText=(
            "They accept the legal argument — Yaqub's completed action superseded the "
            "intended action, and his authorization was not subject to board review for "
            "personal materials. They note the disagreement but do not pursue it."
        ),
        failText=(
            "They take the dispute to a Dominican legal review house on the road. "
            "Two-day delay. The Dominican reviewer sides with the Fighter on the "
            "authorization question."
        ),
        checkPassFlag="kyaC4A4Done",
        activateCond="kyaC4A3Done",
    )

    quest(
        id="kya_c4a5", npc="yaqub_kya",
        title="The Archive Receives the Teaching",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads both columns of the parchment. "
            "He reads Katakalon's notation on the back. He reads the Arabic bottom note "
            "that Yaqub identified as his own. He puts the parchment flat on the table "
            "and looks at it from arm's length."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "Sweelinck looks up. 'The demons were captured. They could not fight. "
            "They taught Tahúmers writing because teaching him something was the only "
            "thing they had left to offer. Whether the script in this column is genuine "
            "or is a 9th-century reconstruction — the lesson is real either way. "
            "You do not teach incorrectly when your life depends on the student "
            "understanding.' He writes: Teaching Documents Under Duress — Writing "
            "Instruction Given as Ransom. First entry. 'Yaqub ibn Ibrahim wrote that "
            "bottom note. It is the most precisely honest thing anyone has written "
            "about this parchment.'"
        ),
        failText=(
            "Filed under Pahlavi manuscript records, demonic script tradition. "
            "Yaqub's note acknowledged as curatorial framing."
        ),
        checkPassFlag="kyaC4A5Done",
        activateCond="kyaC4A4Done",
    )

    # ─── Cycle 5: The Princess of Zábulistán ──────────────────────────────────
    say("Cycle five. The Princess of Zabustan. Kabul to Tabriz to Weimar. Five acts.")
    print("\n-- Cycle 5: The Princess of Zábulistán (KBL→TAB→WM) --")

    quest(
        id="kya_c5a1", npc="malikshah_kya",
        title="The Name in the Court History",
        desc=(
            "Kabul, Malikshah al-Sultani's private library. He has held the Zábulistán "
            "Chronicle for forty years — four folios of a 10th-century court history giving "
            "Jemshíd's queen the name the Shah-Nameh omits. The text: 'He stopped asking "
            "for counsel and began demanding confirmation.' She chose poison when the capital "
            "fell; the chronicle names the day and who was present. Timurid advance forces "
            "are moving through Khorasan. He does not trust any local institution. "
            "He wants the chronicle somewhere that does not depend on one family's survival."
        ),
        activateNode="KBL",
        checkStat="CHA", checkDC=12,
        passText=(
            "The Weimar archive holds the supplement beside the epic without preferring "
            "either. He nods. 'A supplement beside the text. That is the correct "
            "relationship.' He wraps the four folios in the carved-board binding himself."
        ),
        failText=(
            "He wants more detail on the archive's classification practices before "
            "releasing the document. Investigation DC 11 to describe the category system "
            "in credible detail."
        ),
        checkPassFlag="kyaC5A1Done",
    )

    quest(
        id="kya_c5a2", npc="malikshah_kya",
        title="The Compromised Translator",
        desc=(
            "Mountain pass caravanserai, three days out of Kabul. The hired translator "
            "is examining the chronicle's carved boards too carefully — studying the "
            "binding's decoration, not reading the text. Someone at a table arrived "
            "after the Fighter but took a position within earshot."
        ),
        activateNode="KBL",
        checkStat="WIS", checkDC=12,
        passText=(
            "The contact at the caravanserai table is recognized as the translator's "
            "handler. The chronicle is moved to a position on the Fighter's person for "
            "the rest of the road; the translator is released at the next junction."
        ),
        failText=(
            "The switch is made that night — a blank folio substituted for the chronicle. "
            "One additional day plus Athletics DC 11 to recover the real chronicle "
            "from the translator's contact."
        ),
        checkPassFlag="kyaC5A2Done",
        activateCond="kyaC5A1Done",
    )

    quest(
        id="kya_c5a3", npc="malikshah_kya",
        title="The Shah-Nameh Purist",
        desc=(
            "Tabriz, Ahmad al-Farghani's study. He reads the chronicle's account of "
            "Jemshíd's final years twice. 'She says: he stopped asking for counsel and "
            "began demanding confirmation. Ferdowsi says: God withdrew his blessing. "
            "These are the same thing, but from different distances. She was in the room.' "
            "Problem: a Khorasani copyist working in Tabriz has heard the chronicle arrived "
            "and is requesting access through the scholarly network. He harmonizes "
            "discrepancies between texts as a professional practice."
        ),
        activateNode="TBZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "The copyist's access request is declined before he can add harmonizing notes. "
            "The chronicle's value is precisely that it does not harmonize — a gloss "
            "that explains away the discrepancy removes the evidence. Al-Farghani "
            "supports the refusal. The chronicle leaves Tabriz unglossed."
        ),
        failText=(
            "The copyist adds a marginal note beginning 'The queen's account and the "
            "Shah-Nameh account are reconcilable as follows—'. Sweelinck will note "
            "in the intake record that the addition is secondary and unauthorized."
        ),
        checkPassFlag="kyaC5A3Done",
        activateCond="kyaC5A2Done",
    )

    quest(
        id="kya_c5a4", npc="malikshah_kya",
        title="The Collector's Formal Offer",
        desc=(
            "Road from Tabriz north. A professional manuscript dealer traveling the same "
            "direction makes a formal offer. His client is a collector of Sassanian-era "
            "court histories and has authorized a purchase price that is genuinely fair — "
            "not an insult, not a trap. The dealer has a Venetian commercial letter of "
            "authentication. He is not a thug. He is simply excellent at his job."
        ),
        activateNode="TBZ",
        checkStat="CHA", checkDC=13,
        passText=(
            "The document has been designated for a specific archive; a delivery "
            "commission cannot be superseded by commercial designation after the "
            "commission has been accepted. He accepts the decline with professional "
            "courtesy and notes the exchange in his ledger."
        ),
        failText=(
            "He follows at a discreet distance for two days, waiting for reconsideration. "
            "He makes one more offer at the final junction before Weimar's territory. "
            "The offer is declined again."
        ),
        checkPassFlag="kyaC5A4Done",
        activateCond="kyaC5A3Done",
    )

    quest(
        id="kya_c5a5", npc="malikshah_kya",
        title="The Name That Was Always There",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the four folios slowly. When he "
            "reaches Sháhdokht's account of Jemshíd's deterioration, he sets the folio "
            "down and reads it again. 'She says: he stopped asking for counsel and began "
            "demanding confirmation. This is a precise account of how a king loses the "
            "gift of just rule. Ferdowsi describes the result. She describes the process.' "
            "He looks at the carved wooden boards. 'She was in the room.'"
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "Sweelinck writes in the master ledger: Shah-Nameh Supplementary Records — "
            "Unnamed Women, Volume I. Name: Sháhdokht, consort of Jemshíd, Zábulistán. "
            "Source: Zábulistán court chronicle, 10th century, Kabul copy, 12th century. "
            "'The Shah-Nameh does not give her name. This document does. The supplement "
            "does not correct the epic. It stands beside it. That is the correct "
            "relationship.'"
        ),
        failText=(
            "Filed under Shah-Nameh supplement records, Zábulistán origin, queen account. "
            "The name Sháhdokht noted as primary finding."
        ),
        checkPassFlag="kyaC5A5Done",
        activateCond="kyaC5A4Done",
    )

    # ─── Cycle 6: The Record of Successive Honors ─────────────────────────────
    say("Cycle six. The Record of Successive Honors. Tabriz to Ragusa to Weimar. Five acts.")
    print("\n-- Cycle 6: The Record of Successive Honors (TAB→DBV→WM) --")

    quest(
        id="kya_c6a1", npc="khalid_kya",
        title="The Dying Guild Master",
        desc=(
            "Tabriz, Anjuman-i Zargar guild house. Khalid ibn Ahmad al-Zargar, guild master, "
            "is dying steadily and he knows it. He places the Guild Ledger on the worktable "
            "— seventeen folios recording each Sassanian king's addition to the Derafsh "
            "Kaviani, 6th to 10th century, in a professional craft hand. Six dynasties. "
            "Each king's entry opens with the same phrase: 'added in acknowledgment of "
            "the banner's origin.' 'Every king who added to Kavah's apron acknowledged "
            "in the entry that it was Kavah's apron. That phrase is in there six times, "
            "from six different kings who could not have copied each other directly.'"
        ),
        activateNode="TBZ",
        checkStat="INT", checkDC=12,
        passText=(
            "Six dynasties used the same phrase about a craftsman's tool without any "
            "single canonical source requiring them to: independent corroboration that "
            "the banner's origin-meaning was understood and maintained across a thousand "
            "years. Khalid adds his personal attestation to the back cover: "
            "'Final custody: Khalid ibn Ahmad al-Zargar, 1367. Destination: "
            "Archivus Sweelinck, Weimar.'"
        ),
        failText=(
            "He hands the ledger without explanation. The significance of the repeated "
            "phrase is learned from reading it on the road."
        ),
        checkPassFlag="kyaC6A1Done",
    )

    quest(
        id="kya_c6a2", npc="khalid_kya",
        title="The Ottoman Collector on the Road",
        desc=(
            "Caravanserai on the road west from Tabriz. A Turkish merchant prince "
            "traveling west collects Sassanian historical materials and has heard through "
            "the Tabriz trade network that the Anjuman-i Zargar released its primary "
            "historical document. He introduces himself correctly and makes an offer "
            "that is neither insulting nor coercive."
        ),
        activateNode="TBZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "The item has been designated for a specific institution; naming the "
            "institution would invite a competing offer to the institution. "
            "He accepts the refusal gracefully and presents a formal receipt of "
            "first-refusal if the designation falls through."
        ),
        failText=(
            "He becomes curious about the destination and presses for three hours, "
            "making the case for his collection's importance. He does not pursue "
            "beyond conversation."
        ),
        checkPassFlag="kyaC6A2Done",
        activateCond="kyaC6A1Done",
    )

    quest(
        id="kya_c6a3", npc="khalid_kya",
        title="The Florence Consignment",
        desc=(
            "Ragusa waystation inn. The Ragusa inns serve as the last Mediterranean "
            "waystation before the northern road. A Genoese manuscript dealer at the "
            "main inn has a consignment going to Florence — twelve items, a courier "
            "leaving in two days. He spots the guild leather binding and asks: "
            "'That's a professional binding. How old is it?' He has not identified "
            "the ledger yet, but he is excellent at his job."
        ),
        activateNode="DBV",
        checkStat="WIS", checkDC=12,
        passText=(
            "The dealer has not yet identified the ledger's origin — he is guessing "
            "from the leather quality. A redirect to general-commerce framing ends "
            "his interest before the meal is finished. He does not add the ledger "
            "to the Florence consignment."
        ),
        failText=(
            "He sends a description of the binding to a Florence correspondent for "
            "identification. A Florence collector will be waiting at a later junction "
            "on the northern road."
        ),
        checkPassFlag="kyaC6A3Done",
        activateCond="kyaC6A2Done",
    )

    quest(
        id="kya_c6a4", npc="khalid_kya",
        title="The False Chain-of-Custody",
        desc=(
            "Northern road through Hungary. A well-dressed agent presents a letter "
            "claiming the ledger is property of a Tabriz family — the Rashidi household, "
            "descendants of a Persian court official — seeking return through commercial "
            "channels. The letter names the family. The Anjuman-i Zargar's own ledger "
            "entries document custody since 651 AD. The family name appears nowhere "
            "in the ledger's chain of custody."
        ),
        activateNode="DBV",
        checkStat="INT", checkDC=12,
        passText=(
            "The agent cannot produce a guild document supporting the claim. "
            "The discrepancy is pointed out — the chain-of-custody begins 651 AD "
            "and the Rashidi name appears at no point in seven centuries of entries. "
            "He withdraws."
        ),
        failText=(
            "He produces a secondary document — a 13th-century notation of uncertain "
            "authenticity. The dispute goes to a local roadside magistrate. "
            "Persuasion DC 12 at the magistrate's table; the Fighter prevails."
        ),
        checkPassFlag="kyaC6A4Done",
        activateCond="kyaC6A3Done",
    )

    quest(
        id="kya_c6a5", npc="khalid_kya",
        title="What the Kings Were Paying For",
        desc=(
            "Weimar Archive. Archivus Sweelinck reads the ledger entry by entry. "
            "He spends a long time on the formulaic phrase. He reads it in six different "
            "hands, from six different centuries."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "Sweelinck closes the ledger gently. 'Added in acknowledgment of the banner's "
            "origin. Six times. From six dynasties. Not one was required to use this phrase "
            "by any canonical text. Each king wrote it separately. Each king knew what "
            "they were venerating.' He writes: Derafsh Kaviani Material Records — Guild "
            "Ledger of Successive Royal Additions. Final custody: Anjuman-i Zargar, "
            "Tabriz, established 651 AD. 'They were paying an ongoing debt to a blacksmith. "
            "The guild kept this record because guilds understand that debts of this kind "
            "compound with honor rather than diminishing with interest.'"
        ),
        failText=(
            "Filed under Persian guild records, Sassanian period, royal decorative arts. "
            "The repeated phrase noted as formulaic opening."
        ),
        checkPassFlag="kyaC6A5Done",
        activateCond="kyaC6A4Done",
    )

    # ─── Cycle 7: The Símúrgh's Second Feather ─────────────────────────────────
    say("Cycle seven. The Simorgh's Second Feather. Yazd to Constantinople to Weimar. Five acts. Quest complete.")
    print("\n-- Cycle 7: The Símúrgh's Second Feather (YAZ→CON→WM) — questComplete --")

    quest(
        id="kya_c7a1", npc="ardeshir_kya",
        title="The Second Entry in the Temple Inventory",
        desc=(
            "Yazd, Azar Yazdan fire temple inventory room. Ardeshir, junior fire-keeper "
            "and inventory officer, has known about the sealed ivory case since his first "
            "audit twenty years ago and has never opened it. The inventory text is painted "
            "on the outside in small red script: 'one feather, origin: Alberz mountain, "
            "provenance: Zál son of Sám, given to the second keeper by the first keeper's "
            "son.' Not opened since the 11th century. 'Opening it would answer the question "
            "and end it. Whatever is inside, we would assign the wrong meaning. Take it "
            "to someone who can hold the question without answering it.'"
        ),
        activateNode="YAZ",
        checkStat="INT", checkDC=11,
        passText=(
            "The Símúrgh feather in the Shah-Nameh tradition and the value of an "
            "intact chain of custody — regardless of whether the feather is supernatural "
            "— are understood. Ardeshir seals the bronze pin with fresh wax and writes "
            "a transfer note: 'Chain of custody: Yazd fire temple, 11th century to 1367. "
            "Transferred to bearer for permanent archive custody.'"
        ),
        failText=(
            "He hands the case without the transfer note. The case is received but "
            "without formal chain-of-custody documentation."
        ),
        checkPassFlag="kyaC7A1Done",
    )

    quest(
        id="kya_c7a2", npc="ardeshir_kya",
        title="The Physician's Curiosity",
        desc=(
            "Isfahan road junction, heading west. A Greek physician from Constantinople "
            "is on the same road heading south for medical work in Isfahan. He has heard "
            "about the case through the Yazd community — he is part of a natural history "
            "circle in Constantinople and genuinely believes scientific examination serves "
            "scholarship better than continued ignorance. He makes a polite request "
            "to examine what might be a rare bird specimen."
        ),
        activateNode="YAZ",
        checkStat="CHA", checkDC=12,
        passText=(
            "The case's value to the archive is precisely its sealed, unexamined state; "
            "scientific examination would resolve one question by eliminating another. "
            "He is gracious and asks only whether the Fighter will allow him to report "
            "the case's existence to the Constantinople scholarly circle. Agreed."
        ),
        failText=(
            "He is mildly offended and reports to the Constantinople circle with a note "
            "that the carrier was hostile to natural history. Katakalon receives "
            "this impression before the Fighter's arrival."
        ),
        checkPassFlag="kyaC7A2Done",
        activateCond="kyaC7A1Done",
    )

    quest(
        id="kya_c7a3", npc="ardeshir_kya",
        title="The Question of Whether to Open It",
        desc=(
            "Constantinople, Nikephoros Katakalon's study. He has assembled three "
            "colleagues from the natural history circle. Two want to open the case. "
            "Katakalon does not — he has prepared a position: the scholarly value of "
            "an unopened case lies precisely in the question it contains; examining "
            "the contents resolves the inventory claim but destroys the archival interest. "
            "His two colleagues disagree, not unreasonably."
        ),
        activateNode="CON",
        checkStat="CHA", checkDC=13,
        passText=(
            "The archive that receives a sealed case with a credible inventory record "
            "holds two things — the inventory claim and the unexamined reality; both "
            "are preserved; opening the case reduces the archive's holdings by one. "
            "Katakalon wins the debate. He adds a notation: 'Received sealed, 1367, "
            "inventory verified without opening. The sealed state is the primary "
            "archival condition. N. Katakalon, Constantinople.'"
        ),
        failText=(
            "One colleague opens the case before the Fighter can prevent it. Inside: "
            "a single iridescent feather, three inches, unusual coloring. Not definitively "
            "supernatural. The case is resealed with a notation: 'Opened in Constantinople: "
            "one feather, iridescent. Origin undetermined.' Sweelinck receives an "
            "opened case."
        ),
        checkPassFlag="kyaC7A3Done",
        activateCond="kyaC7A2Done",
    )

    quest(
        id="kya_c7a4", npc="ardeshir_kya",
        title="The Collector Who Heard About the Feather",
        desc=(
            "Northern road junction. Word has traveled faster than the Fighter. "
            "A Venetian natural history collector has a representative at the junction "
            "with a substantial offer. The offer is polite. Behind the representative "
            "at a discreet distance are four hired riders who will help if polite fails. "
            "The secondary track south turns before reaching the junction — "
            "adding half a day but avoiding the interception point."
        ),
        activateNode="CON",
        checkStat="STR", checkDC=11,
        quest_type="hybrid",
        monster="hired_rider", monsterHP=16, monsterAC=11,
        passText=(
            "The secondary track works. The hired riders wait at the wrong junction "
            "until dark. The ivory case arrives north of the junction intact."
        ),
        failText=(
            "The hired riders reach the Fighter before the secondary track. "
            "Four opponents, AC 11, HP 16. The ivory case is in the pack and "
            "is not damaged."
        ),
        checkPassFlag="kyaC7A4Done",
        activateCond="kyaC7A3Done",
    )

    quest(
        id="kya_c7a5", npc="ardeshir_kya",
        title="The Archive That Will Not Open It Either",
        desc=(
            "Weimar Archive. Archivus Sweelinck receives the sealed case — or the "
            "opened-and-resealed case, if the Constantinople debate was lost. He reads "
            "the inventory text on the exterior, the transfer note inside the pin-hole, "
            "and Katakalon's notation. He does not open it."
        ),
        activateNode="WM",
        checkStat="INT", checkDC=10,
        passText=(
            "Sweelinck: 'The inventory says: one feather, origin Alberz mountain, "
            "provenance Zál son of Sám. Whether the content matches the claim can only "
            "be determined by opening the case and losing the question. I am not prepared "
            "to lose the question.' He sets it in a sealed section and writes: "
            "Precautionary Objects — Shah-Nameh, Zál and Símúrgh connection. "
            "Condition: sealed. Contents: not verified. The sealed state is the primary "
            "archival condition. 'If the Símúrgh gave Zál more than one feather, this "
            "was the second. The precaution that was never used is still a precaution. "
            "That is its own kind of fact.'"
        ),
        failText=(
            "Filed under Shah-Nameh mythological objects, Símúrgh connection, "
            "provenance Yazd fire temple. Sealed condition noted."
        ),
        checkPassFlag="kyaC7A5Done",
        activateCond="kyaC7A4Done",
        questComplete=True,
    )

    print("\n=== KYA import complete — 7 cycles, 35 acts ===")
    say("Shah-Nameh import complete. Seven cycles. Thirty-five acts. Quest complete on cycle seven.")

if __name__ == "__main__":
    main()
