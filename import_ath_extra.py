#!/usr/bin/env python3
"""§PASS4-EXTRA-ATH: Iliad cycles 8–12 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "ATH"

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
    say("ATH pass 4 extra cycles. Iliad, Homer. Cycles 8 through 12. "
        "Apollo's Account, Dolon's Report, The Stripped Inventory, "
        "Priam's Ransom, Thetis at the Sea-Floor.")

    # ── Cycle 8: Apollo's Account ──────────────────────────────────────────────
    print("\n-- Cycle 8: Apollo's Account --")
    quest("ath_08_act1", "The Servant at Tenedos",
        "A surviving servant of Apollo's Tenedos sanctuary has kept the plague tally for "
        "forty years. He counted the dead each morning at Chryses's direction — mules first, "
        "then dogs, then men, each category in its row. He kept the count because Chryses "
        "told him to; he kept it even after the return of Chryseis ended the plague; he kept "
        "it when the sanctuary was later burned; he has it still. He does not want money. "
        "He wants someone to take it to an archive that will not burn.",
        "SKN",
        "He explains the mule-to-dog-to-man sequence before you ask. 'The god worked in "
        "order,' he says. 'He always did.' He writes a second note explaining the progression. "
        "You receive the Plague Tally Tablet.",
        "He gives you the tablet with a note saying only: nine days, Chryse. The category "
        "sequence is unmarked.",
        "INT", 12, checkPassFlag="ath_08_act1")

    quest("ath_08_act2", "The Physician's Descendants",
        "Two descendants of Machaon — the Greek physician who treated Menelaus's arrow-wound "
        "in Book IV — have set up a healing practice in the Ilium district. They want the "
        "tablet for their own archive, which documents war-wounds and their causes. Their "
        "argument: plague wounds, like arrow-wounds, are the physician's proper subject, and "
        "this tablet is a medical record as much as a divine one.",
        "IDC",
        "They accept the classification distinction and release it without copying. One of "
        "them says: 'The god is the better physician. We only treat what he leaves behind.'",
        "They make a copy of the tablet before releasing it, noting the mule-to-man sequence "
        "as a symptom-progression document. The copy stays with them; the original continues.",
        "WIS", 12, checkPassFlag="ath_08_act2", activateCond="ath_08_act1")

    quest("ath_08_act3", "The Chryses Question",
        "A Byzantine scholar of classical theology has heard of the tablet and written "
        "requesting it for a commentary on divine wrath. His argument is that the tally does "
        "not document Apollo's anger at all — it documents Chryses's prayer being answered, "
        "which is a different theological category: not wrath but reciprocity. He holds the "
        "tablet as he speaks.",
        "CON",
        "He accepts that the ambiguity is the document's value. He writes instead: "
        "Apollo — Chryse — nine days: divine procedure, cause unresolved between wrath "
        "and reciprocity.",
        "He writes a marginal note on the tablet's linen wrapping: reciprocity, not wrath. "
        "The note travels with it.",
        "INT", 13, checkPassFlag="ath_08_act3", activateCond="ath_08_act2")

    quest("ath_08_act4", "The Mountain Road",
        "A late afternoon rockfall on the Alpine road — a minor slide that blocks the path "
        "for a night. The tablet, being ivory, is at no physical risk, but the Fighter must "
        "make camp on the exposed road in near-freezing conditions with the tablet as the "
        "only item that cannot be set down carelessly — it is small enough to be lost in "
        "darkness and heavy enough to crack on stone if dropped.",
        "CON",
        "The tablet arrives intact and dry. The linen wrapping is clean.",
        "The tablet survives but the wrapping tears; a corner of the ivory chips. The damage "
        "is cosmetic; the text is intact. Sweelinck will note the chip.",
        "STR", 14, checkPassFlag="ath_08_act4", activateCond="ath_08_act3")

    delivery("ath_08_act5", "The Archive — Apollo's Account",
        "Weimar. Sweelinck turns the tablet over twice. He reads the nine rows without "
        "speaking. He reads the reverse line — Chryse. For the priest. — and sets it down. "
        "'The mules first.' He does not say this as a question. 'Then the dogs. Then the men. "
        "Nine days in order.' He picks it up again. 'He counted every morning.'",
        "NUE",
        "You account for every element. Sweelinck writes: Divine Plague Records — Documented "
        "Sequence, First Entry. Apollo at Chryse: nine-day count by the sanctuary servant at "
        "Tenedos; mules, dogs, men in that order; the archive notes both interpretations of "
        "cause — wrath and reciprocity — without adjudicating. You receive the Archive Receipt.",
        "Sweelinck writes what he has. The gaps are noted. He files it under Divine Plague "
        "Records and thanks you for what you brought.",
        checkPassFlag="ath_08_act5", activateCond="ath_08_act4")

    # ── Cycle 9: Dolon's Report ────────────────────────────────────────────────
    print("\n-- Cycle 9: Dolon's Report --")
    quest("ath_09_act1", "The Tamarisk",
        "A Myrmidon scribe recorded everything Odysseus and Diomedes reported when they came "
        "back at dawn, still wet from the sea where they washed off the blood. He has kept "
        "the strip because it is the only intelligence document from the entire ten years of "
        "war that proved entirely accurate — Dolon's report was followed exactly and every "
        "element confirmed. He wants it placed somewhere that will understand what a perfect "
        "intelligence asset is: a man under threat of death who tells the truth because the "
        "truth is all he has left to offer.",
        "SKN",
        "You understand the voluntary exchange structure before he explains it. He gives you "
        "the strip and says: 'He was accurate about everything. The horses were exactly where "
        "he said.'",
        "You carry the strip with a note: Dolon, Trojan scout; information given in exchange "
        "for promised ransom; killed on completion; intelligence confirmed accurate at dawn.",
        "WIS", 12, checkPassFlag="ath_09_act1")

    quest("ath_09_act2", "The Thracian Survivors",
        "Two survivors of Rhesus's Thracian contingent — men who had been sleeping at the "
        "far edge of the camp and woke to find their king and twelve companions dead, the "
        "horses gone — are in the harbor quarter. They want the strip destroyed. Their "
        "argument: the intelligence report led to the death of their king on his first night "
        "in camp; he had never fought; it is a document of their disgrace.",
        "TRH",
        "They accept the argument. One of them says: 'He would have fought well the next "
        "morning.' You say nothing. He nods and lets you pass.",
        "They make you swear not to name Rhesus by name in the archive entry. You agree. "
        "The entry will read: the Thracian king, unnamed at his survivors' request.",
        "CHA", 13, checkPassFlag="ath_09_act2", activateCond="ath_09_act1")

    quest("ath_09_act3", "The Catalogue Keeper",
        "A cataloguer of Iliad manuscripts has been working on a theory that Book X — the "
        "Doloneia — was added to the poem late and is not original. He wants the strip as "
        "evidence for his hypothesis: if the intelligence document is a real artifact that "
        "predates the poem's composition, it supports the Doloneia's historicity and "
        "undermines his theory, which is inconvenient. He argues the strip should be filed "
        "under his manuscript rather than sent to the Weimar Archive.",
        "CON",
        "He accepts the separation of historical artifact from philological argument. He "
        "writes: field document, Book X parallel; authenticity question separate.",
        "He adds a note to the strip's linen wrapping: possibly late addition; Doloneia "
        "authenticity disputed. The note travels with it.",
        "INT", 12, checkPassFlag="ath_09_act3", activateCond="ath_09_act2")

    quest("ath_09_act4", "The River Crossing",
        "The ox-hide strip is at no risk from water — it is cured and robust — but the fast "
        "water makes the crossing genuinely dangerous, and the strip must be held above the "
        "waterline because the scratched text on ox-hide can be disturbed by sustained "
        "immersion even if the material survives. This is a physical transit problem, not a "
        "document problem. The Danube tributary is in flood season.",
        "CON",
        "The strip crosses dry. All text is intact.",
        "One hand drops briefly. The lower fold takes water; the last line of text — he had "
        "not yet fought; this was his first night — blurs slightly. The intelligence is "
        "readable but the final line requires inference. Sweelinck will note the blur.",
        "STR", 14, checkPassFlag="ath_09_act4", activateCond="ath_09_act3")

    delivery("ath_09_act5", "The Archive — Dolon's Report",
        "Weimar. Sweelinck unfolds the strip and reads it twice. He does not speak until "
        "he reaches the last line. 'He had not yet fought. His first night.' He sets it down. "
        "'And Odysseus waited until he finished speaking before giving the signal.' He is "
        "quiet for a moment. 'Perfect intelligence. Accurate in every particular. The man was "
        "killed when he had nothing left to give.'",
        "NUE",
        "You lay out every element: the tamarisk, the Thracian survivors, the cataloguer, "
        "the crossing. Sweelinck writes: Intelligence Records — Complete and Verified, First "
        "Entry. Dolon's Report: given voluntarily in the dark as exchange for life; confirmed "
        "accurate at dawn; source killed on completion. You receive the Archive Receipt.",
        "Sweelinck files the tablets with a note of partial provenance. The record is "
        "functional but incomplete.",
        checkPassFlag="ath_09_act5", activateCond="ath_09_act4")

    # ── Cycle 10: The Stripped Inventory ──────────────────────────────────────
    print("\n-- Cycle 10: The Stripped Inventory --")
    quest("ath_10_act1", "The Armorer's Record",
        "An Achaean armorer named Autolycus — a man whose trade was the repair and "
        "cataloguing of weapons — made the inventory the morning after Patroclus died, "
        "before Hector put the armor on. He did it because that is what armorers do: "
        "document what passes through divine hands into mortal ones, and what passes back. "
        "He fired the clay himself. He wants you to take it to an archive because he knows "
        "Achilles will die soon and the armor's history needs a record not inside Achilles's "
        "own grief.",
        "SKN",
        "You understand the theological chain before he explains it. He adds one line to "
        "the reverse in your presence: the god made it the night before the war.",
        "You take it with a note: inventory of Achilles's armor, stripped from Patroclus, "
        "now on Hector. Provenance noted briefly.",
        "INT", 12, checkPassFlag="ath_10_act1")

    quest("ath_10_act2", "Andromache at the Loom",
        "Andromache has heard that Hector is wearing Achilles's divine armor. She knows what "
        "it means — that Hector has the armor of the man who will kill him. She wants the "
        "inventory tablet not to destroy it but to keep it herself, in the room where the "
        "loom stands. Her argument: the armor's history belongs with Hector's history, and "
        "Hector's history belongs with her. She will not give it back when Hector falls.",
        "IDC",
        "She sets it in your hands and turns back to the loom. 'He will die in that armor,' "
        "she says. 'Tell them that.' You write it on the back of the wrapping.",
        "She holds the tablet for an hour before returning it. Her handprint, in clay-dust, "
        "is on its surface. It stays there.",
        "WIS", 12, checkPassFlag="ath_10_act2", activateCond="ath_10_act1")

    quest("ath_10_act3", "The Arms Dealer",
        "A Hellenistic arms trader has traced the provenance of divine armor from the myth "
        "record and wants the inventory as a legal document establishing prior ownership — "
        "specifically, he argues that divine armor given by a god to a mortal is not property "
        "in the human-legal sense and therefore subject to recovery by the temple of "
        "Hephaestus, whose craftsman made it. He has a buyer for the concept, if not the "
        "armor itself.",
        "CON",
        "He accepts the gift-vs.-commission distinction and concedes the legal claim fails. "
        "'A good try,' he says. 'Come back if you find the actual armor.'",
        "He makes a sketch of the inventory's contents — the listed pieces — for his own "
        "files. The tablet continues.",
        "CHA", 12, checkPassFlag="ath_10_act3", activateCond="ath_10_act2")

    quest("ath_10_act4", "The Blind Spot",
        "A fisherman at the Trojan harbor has seen the armor in use — he was at the walls "
        "the day Hector wore it, and he knows what it looks like in motion. He wants to "
        "tell someone what divine armor looks like on a man who is not its owner: it was "
        "too large, he says, and Hector moved differently in it, as though he knew he was "
        "wearing something that was not his. He wants this testimony to accompany the tablet "
        "because the inventory records the objects, but not what they looked like wrong.",
        "TRH",
        "You identify the phenomenological category before he finishes speaking. He nods: "
        "'Yes. That's the word. Wrong. Not too large. Just wrong.'",
        "You write his testimony on a scrap and tuck it inside the tablet's wrapping: "
        "witness says the armor looked wrong on him. He moved differently.",
        "WIS", 12, checkPassFlag="ath_10_act4", activateCond="ath_10_act3")

    delivery("ath_10_act5", "The Archive — The Stripped Inventory",
        "Weimar. Sweelinck reads the last line on the reverse — Hector son of Priam now "
        "wears it. He will not bring it back — and is quiet for a long time. 'The armorer "
        "knew,' he says. Not a question. He reads the fisherman's testimony from the wrapping. "
        "'Made by the god for a wedding. Given to a son. Lent for a morning. Stripped from a "
        "body. Worn by the man who would be killed for wearing it.'",
        "NUE",
        "You give the full account. Sweelinck writes: Armor Records — Divine Manufacture, "
        "First Entry. Achilles's Armor: inventory of pieces stripped from Patroclus by "
        "Hector; Hephaestus to Peleus to Achilles; lent to Patroclus the morning of his "
        "death; now on Hector who will die in it; witness testimony: the armor looked wrong "
        "on him. You receive the Archive Receipt.",
        "Sweelinck files it with a note of partial provenance. The record is functional.",
        checkPassFlag="ath_10_act5", activateCond="ath_10_act4")

    # ── Cycle 11: Priam's Ransom ───────────────────────────────────────────────
    print("\n-- Cycle 11: Priam's Ransom --")
    quest("ath_11_act1", "The Herald's Manifest",
        "Idaeus survived the war. He drove the wagon to Achilles's tent and back; he waited "
        "in the yard while Priam was inside. He made the manifest the next morning because "
        "he had spent the night memorizing the list, afraid that if he forgot any item the "
        "entire transaction would somehow become invalid. He is an old man who believes that "
        "records protect the past from being misremembered. He does not believe anyone will "
        "care about the ransom list in a generation. He is glad to be wrong.",
        "IDC",
        "He understands you understand. He folds it carefully, the way you fold something "
        "important, and says: 'He weighed the gold himself. None of the sons was allowed "
        "to help.'",
        "He gives you the manifest with a note: items carried by Priam son of Laomedon to "
        "the tent of Achilles; Hector's body returned in exchange.",
        "CHA", 12, checkPassFlag="ath_11_act1")

    quest("ath_11_act2", "Hecuba's Objection",
        "Hecuba tried to stop Priam going. She told him to weep Hector from home, that "
        "Achilles was a savage, that if the cruel man got hold of him he would not ransom "
        "or pity him. She did not give her blessing. She gave him wine and told him to pray "
        "to Zeus, which he did. She wants the manifest altered to include her objection — "
        "she believes the official record should show that one person in Troy told him not "
        "to go, not because she was wrong but because she wants it known she was afraid for him.",
        "IDC",
        "She dictates one sentence: I told him not to go. He went. You write it at the "
        "bottom of the manifest in a new hand. She approves it.",
        "She dictates a long paragraph; you write a summary: Hecuba advised against the "
        "journey; Priam went regardless; she gave him wine.",
        "WIS", 12, checkPassFlag="ath_11_act2", activateCond="ath_11_act1")

    quest("ath_11_act3", "The Achaean Inventory Officer",
        "An Achaean inventory officer who was stationed at the ships claims he has the right "
        "of first access to any record of goods transferred between Trojan and Achaean "
        "parties — technically all such transfers were subject to Greek military accounting. "
        "He has his own incomplete record of what came through the camp gates that night, "
        "which does not match the manifest exactly: his list omits the Thracian cup, which "
        "he never saw.",
        "SKN",
        "He accepts the divine-arrangement argument and releases the manifest without "
        "annotation. He notes in his own record: no reconciliation possible; divine escort "
        "classified.",
        "He notes in his record that the Thracian cup passed without inspection and inserts "
        "a gap in his manifest. The official record will show a discrepancy. The papyrus "
        "continues unaltered.",
        "INT", 12, checkPassFlag="ath_11_act3", activateCond="ath_11_act2")

    quest("ath_11_act4", "Achilles's Table",
        "A Byzantine scholar of Homeric hospitality has been studying the scene in which "
        "Achilles feeds Priam after agreeing to the ransom — he cuts a sheep, his men roast "
        "it, they eat together. The scholar wants the manifest to support his argument that "
        "the meal transforms the ransom from a transaction into a guest-friendship (xenia), "
        "and therefore the goods listed are no longer ransom but guest-gifts in the formal "
        "Greek sense. He argues this reclassification affects how the archive should file "
        "the document.",
        "CON",
        "He accepts the temporal sequence argument. He writes: ransom document; hospitality "
        "context noted but classification unchanged.",
        "He writes a marginal note on the papyrus wrapping: see also: xenia transformation; "
        "hospitality context disputed. The note travels with it.",
        "CHA", 13, checkPassFlag="ath_11_act4", activateCond="ath_11_act3")

    delivery("ath_11_act5", "The Archive — Priam's Ransom",
        "Weimar. Sweelinck reads it column by column. He stops at the Thracian cup. 'The "
        "Thracians gave him this when he went as envoy to their country. He grudged not even "
        "this.' He reads to the end. He reads Hecuba's line: I told him not to go. He went. "
        "He is still for a long time. 'Twelve of everything,' he says. 'And the gold weighed "
        "by the father himself, in the dark, with the sons dismissed from the courtyard.' "
        "He sets the manifest down. 'The archive has received diplomatic offers, intelligence "
        "reports, divine records, and sacred textiles. This is the first grief-ledger.'",
        "NUE",
        "You lay out every element: Idaeus, Hecuba's line, the inventory officer, the "
        "hospitality scholar. Sweelinck writes: Ransom Records — Father to Enemy, First "
        "Entry. Priam's Ransom: the complete inventory carried by Priam to the tent of "
        "Achilles for the return of Hector's body; Hecuba told him not to go; he went; the "
        "archive holds the ledger and the dissent in the same entry. You receive the Archive "
        "Receipt.",
        "Sweelinck files it with a note of partial provenance. The record is functional.",
        checkPassFlag="ath_11_act5", activateCond="ath_11_act4")

    # ── Cycle 12: Thetis at the Sea-Floor (questComplete) ─────────────────────
    print("\n-- Cycle 12: Thetis at the Sea-Floor --")
    quest("ath_12_act1", "The Rock at Tenedos",
        "The Nereid who left the cylinder there waits in the shallows. She will not come "
        "out of the water. She speaks from the sea. She says: Thetis left this for the "
        "archive because she knows it will not burn. She knows Achilles's grave will not "
        "last. She knows Troy's walls will be built over. She left the record because the "
        "only thing that survives a god's grief is the habit of keeping records. The Nereid "
        "will hand the cylinder only to someone who can say correctly what Thetis was doing "
        "when she heard Achilles cry out in grief over Patroclus's death.",
        "TRH",
        "You name all four in order: heard, screamed, was surrounded by sisters, led the "
        "lament, then rose and went to him. The Nereid comes one step out of the water, "
        "sets the cylinder in your hands, and goes back. She does not speak again.",
        "You get two elements of four. She gives you the cylinder anyway, with a look that "
        "says you got the important ones. 'She mourned first,' the Nereid says. 'That's "
        "the part men always forget.'",
        "INT", 14, checkPassFlag="ath_12_act1")

    quest("ath_12_act2", "The Night in the Tent",
        "An old Myrmidon soldier who was outside the tent the night Priam came is still "
        "in the area. He watched Achilles laugh — actually laugh, gently, when he told "
        "Priam he must sleep outside in case some counsellor saw him — and he has been "
        "trying for years to reconcile that laugh with the man who dragged Hector's body "
        "around the grave for twelve days. He wants the cylinder because he thinks Thetis's "
        "record might help him understand what kind of man Achilles was at the end.",
        "SKN",
        "You describe the full arc from Thetis's record without opening the cylinder. He "
        "nods slowly. 'He always knew,' he says. 'That's the thing. He always knew.'",
        "You read him the last entry from the cylinder: He is buried with Patroclus's bones "
        "in the golden urn I brought from Olympus. I gave it to him when he was young. He "
        "did not know what it was for. He sits down on the ground.",
        "WIS", 12, checkPassFlag="ath_12_act2", activateCond="ath_12_act1")

    quest("ath_12_act3", "The Golden Urn Question",
        "A collector of Homeric objects claims to have a fragment of the golden urn in "
        "which Achilles and Patroclus's bones were laid. He wants the Thetis record "
        "cylinder as authentication: if Thetis's own record confirms that she brought "
        "the urn from Olympus when Achilles was young, and his fragment matches the "
        "description, the archive's authentication would be worth an enormous amount. "
        "The fragment is real — it is undeniably old gold — but the provenance claim "
        "is impossible to verify and he knows it.",
        "CON",
        "He accepts the authentication argument and raises his cup. 'A reasonable position. "
        "The archive has its standards.' He does not press further.",
        "He photographs the cylinder's exterior — the sea-glazing, the silver-foot seal — "
        "and notes that it matches known Nereid artifact typology. This note circulates. "
        "The cylinder continues.",
        "CHA", 13, checkPassFlag="ath_12_act3", activateCond="ath_12_act2")

    quest("ath_12_act4", "The Road North",
        "The final transit is physical: the cylinder is sealed and will survive cold, but "
        "the road north in winter is genuinely dangerous, and Thetis's record — being "
        "divine-made — carries a faint cold weight that the Fighter can feel through the "
        "wrapping, like holding something that has been at the bottom of the sea. There is "
        "a river crossing near the German border, not flooded but frozen, with the ice "
        "uncertain in late winter.",
        "CON",
        "The Fighter reads the ice correctly and crosses without breaking through. The "
        "cylinder arrives cold and dry and sealed.",
        "The ice gives at the center; the Fighter goes in to the waist; the cylinder is "
        "held above water; Thetis's record stays dry but the Fighter arrives at Weimar "
        "half-frozen. Sweelinck opens the door and says nothing for a moment.",
        "STR", 15, checkPassFlag="ath_12_act4", activateCond="ath_12_act3")

    delivery("ath_12_act5", "The Archive — Thetis at the Sea-Floor",
        "Weimar. Sweelinck does not open the cylinder immediately. He holds it for a moment "
        "— he can feel the cold coming off it — and sets it down. Then he breaks the seal "
        "carefully and unrolls the bronze strip. He reads without speaking for a long time. "
        "He reads the last entry twice. 'She gave him the urn when he was young,' he says. "
        "'He did not know what it was for.' He sets it down. 'Every record in this archive "
        "was made by someone who survived what they were recording. Thetis made this record "
        "and her son did not survive and she did. She is still alive. She will always be "
        "alive. She will always have been there.'",
        "NUE",
        "You lay out every element: the Nereid at Tenedos, the old soldier, the collector, "
        "the crossing. Sweelinck writes: Divine Witness Records — A Mother's Archive, First "
        "Entry. Thetis at the Sea-Floor: chronological record of every act she performed "
        "for her son from the day of the quarrel to the day his bones were sealed in the "
        "golden urn; she knew he would die young and gloriously; she did everything she "
        "could; everything she did is in the record; the archive holds the record of a "
        "god's helplessness, which is the only kind of helplessness that does not end. "
        "You receive the Archive Receipt — ATH Complete.",
        "Sweelinck files what he has with noted gaps. He thanks you for what you brought.",
        checkPassFlag="ath_12_act5", activateCond="ath_12_act4", questComplete=True)

    print("\n=== ATH extra cycles complete ===")
    say("ATH cycles 8 through 12 deployed. 25 acts. The Iliad Pass 4 extra cycles complete. "
        "Weimar Archive. Archivus Sweelinck. "
        "Apollo's Account, Dolon's Report, The Stripped Inventory, "
        "Priam's Ransom, Thetis at the Sea-Floor. Quest complete.")

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
