#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§PASS4-EXTRA-ZTH: Odyssey cycles 8–11 (Pass 4 extra cycles)"""

import requests, subprocess

BASE = "http://localhost:1367"
NPC  = "archivus_sweelinck"
BOOK = "ZTH"

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    r.raise_for_status()
    return r.json()

def say(msg):
    subprocess.run(["./say.sh", msg], capture_output=True)

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          qtype="skill_check", checkPassFlag=None, activateCond=None, questComplete=False):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    payload = {
        "id": id, "type": qtype, "book": BOOK, "npc": NPC,
        "title": title, "desc": desc,
        "activateNode": activateNode,
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
        "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
    }
    if checkPassFlag: payload["checkPassFlag"] = checkPassFlag
    if activateCond:  payload["activateCond"]  = activateCond
    if questComplete: payload["questComplete"] = True
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title} [delivery]")

def main():
    say("ZTH pass 4 extra cycles. Odyssey, Homer. Cycles 8 through 11. "
        "The Captivity Record, The Mast Agreement, The Beggar's Passport, "
        "The Bed That Could Not Be Moved.")

    # ── Cycle 8: The Captivity Record ─────────────────────────────────────────
    print("\n-- Cycle 8: The Captivity Record --")
    quest("zth_08_act1", "The Parcel from Phaeacia",
        "The Phaeacian harbor at Scheria. The treasury clerk is going through unclaimed items "
        "left by Odysseus's departure — gifts, blankets, a bronze cup still unwashed. At the "
        "back of a shelf sits a parcel wrapped in oiled cloth, labeled in Hermes's hand: "
        "'miscellaneous belongings, to follow.' Inside: the tally board. The grain of the wood "
        "is dark with handling. The score marks are deep, careful, made by someone who had time.",
        "PHC",
        "You understand immediately: this is Odysseus's account of his own captivity, kept for "
        "himself because there was no one else to keep it for. It is the only record that cannot "
        "be disputed by a god, because no god made it. You receive the Ogygia Tally Board.",
        "You hold it a moment and set it down. The clerk wraps it back up. It will be noted in "
        "the departure inventory as 'one carved wooden board, origin unknown.' You take it anyway "
        "on the strength of a hunch, signing for it yourself.",
        "INT", 12, checkPassFlag="zth_08_act1")

    quest("zth_08_act2", "The Goddess's Complaint",
        "The Phaeacian court archive, where a copy of Calypso's divine grievance has been filed — "
        "the formal complaint she lodged with Zeus after Hermes came to her. It reads: seven years, "
        "faithful service, immortality offered and refused, release under compulsion. The document "
        "is cold, correct, and furious. A court scribe is cross-referencing it against the tally "
        "board you carry. He is trying to reconcile two records that describe the same seven years "
        "from opposite directions.",
        "PHC",
        "You make the case that a captivity record consisting only of the captor's version is not "
        "a captivity record — it is a self-justification. The scribe considers this and releases "
        "a certified copy of Calypso's complaint to accompany the tally board north. You receive "
        "the Certified Copy of Calypso's Complaint.",
        "The scribe decides to keep the divine complaint in the Phaeacian archive, where it belongs "
        "by provenance. You leave with the tally board only. The scribe makes a note: 'human record "
        "forwarded without divine counterpart; archivist discretion advised.'",
        "WIS", 12, checkPassFlag="zth_08_act2", activateCond="zth_08_act1")

    quest("zth_08_act3", "Nausicaa's Testimony",
        "The palace garden at dusk. Nausicaa is here alone, sitting on a low wall near the fountain. "
        "She knows you are leaving with documents about Odysseus. She does not stop you. She asks "
        "only one question: does the archive's record include any account of who found him on the "
        "beach. The tally board accounts for seven years of imprisonment. It does not account for "
        "the hour he arrived at Scheria — which she witnessed alone, and which no one else in the "
        "palace knows the details of.",
        "PHC",
        "She speaks for perhaps ten minutes. She describes the beach precisely — the olive tree, "
        "the salt on him, the way she kept her distance and called out from a safe distance as "
        "though to a man, not a wretch. It is a brief and complete account. She dictates a single "
        "paragraph for the archive. She does not ask for a copy. You receive Nausicaa's Beach Testimony.",
        "She shakes her head gently. 'Let him tell it.' You move on. The record will be incomplete "
        "on that point. You note the gap.",
        "CHA", 13, checkPassFlag="zth_08_act3", activateCond="zth_08_act2")

    quest("zth_08_act4", "The Ferryman's Question",
        "A river crossing south of Sithonia. A broad man with a pole stands at the ferry. He is not "
        "a bandit — he is a retired Phaeacian sailor who crewed one of the escort ships and has heard "
        "there are documents in circulation about Odysseus's return. He believes the tally board is "
        "a forgery: Odysseus, he says, was never a tally keeper; the man he rowed had soft palms, "
        "a storyteller's hands, not a counter's. He will not let you cross until you prove the board "
        "is genuine.",
        "SIT",
        "You take the pole from him and hold the raft steady until he steps back. He looks at you "
        "for a long moment. 'All right,' he says. 'But if it's false, the gods know.' You cross. "
        "You receive the Ferryman's Crossing Token.",
        "You go around. Two days lost, provisions short. The board travels in a damp pack and two "
        "of the score marks blur. You note the damage at the archive intake.",
        "STR", 14, checkPassFlag="zth_08_act4", activateCond="zth_08_act3")

    delivery("zth_08_act5", "The Archive — Ogygia Captivity",
        "Weimar. Sweelinck reads the tally board without touching it — he leans over it. He reads "
        "the complaint copy. He reads Nausicaa's paragraph. He sits back. 'Seven years,' he says. "
        "'A god kept him. He kept count against a god. The goddess filed a complaint that is "
        "factually accurate and completely misleading. The woman on the beach filed nothing, so we "
        "have her testimony from you, third hand, which is how we get most of the things that "
        "matter.' He begins to write.",
        "NUE",
        "You account for every element: the parcel, the clerk, Nausicaa's dusk testimony, the "
        "ferryman, the two blurred score marks and their original placement. Sweelinck writes for "
        "several minutes. 'The gaps are part of the record,' he says. 'Seven years of counting "
        "against nothing — that is itself documented in the counting.' He files. You receive the "
        "Archive Receipt — Ogygia Captivity.",
        "Sweelinck writes what you can give him. The gaps are noted as gaps. He files the board "
        "under 'Captivity Documents, Self-Reported, Unwitnessed.' He thanks you for what you brought.",
        checkPassFlag="zth_08_act5", activateCond="zth_08_act4")

    # ── Cycle 9: The Mast Agreement ───────────────────────────────────────────
    print("\n-- Cycle 9: The Mast Agreement --")
    quest("zth_09_act1", "Eurylochus's Widow",
        "A farmhouse on the eastern slope of Ithaca, well away from the palace. A woman in her "
        "fifties is grinding grain. She does not look up when you enter. On the table behind her, "
        "under a wool cloth, is a set of wax tablets — you can see the corner. Eurylochus was "
        "the second-in-command, the man who refused to enter Circe's house and was right, and who "
        "argued for breaking the oath and eating the cattle and was also right about the hunger, "
        "and who died with the rest when Zeus struck the ship. His widow has kept the tablets for "
        "twenty years. She is not hostile. She is waiting to be asked correctly.",
        "ITH",
        "You sit down across from her and say: your husband was bound by an order he did not give, "
        "for a reason he had no part in, and died for following it. The archive needs the record "
        "of that. She is still for a long moment. Then she hands you the tablets without wrapping "
        "them. You receive the Mast Binding Articles.",
        "You offer her compensation from the archive. She shakes her head. She covers the tablets "
        "again. 'He is dead. The tablets stay here.' You leave without them and must return via a "
        "different approach — she sends word a week later that she will give you a copy.",
        "WIS", 12, checkPassFlag="zth_09_act1")

    quest("zth_09_act2", "The Surviving Sailor's Corroboration",
        "The harbor at Ithaca. An old man is mending nets. He is the only other survivor of the "
        "Thrinacian voyage — he jumped ship before the cattle slaughter and made it to a passing "
        "merchant vessel. He has been on Ithaca for twelve years but no one knows who he is. He "
        "watched the Siren passage from the deck, ears stopped, unable to hear. He saw Odysseus "
        "straining at the mast. He saw the crew rowing faster when Odysseus's brows signaled "
        "release. He is the corroborating witness.",
        "ITH",
        "He speaks in a low voice for several minutes. He describes Odysseus's face at the mast "
        "precisely: calm until the song started, then something else — not terror, but something "
        "that needed a physical anchor to exist in at all. He says: the crew rowed faster. It was "
        "the right thing. He dictates a statement. You receive the Survivor's Corroboration.",
        "He says nothing happened that he wants to talk about. He goes on mending nets. You leave "
        "a wax tablet with a brief note and your name, in case he changes his mind.",
        "CHA", 12, checkPassFlag="zth_09_act2", activateCond="zth_09_act1")

    quest("zth_09_act3", "The Philosopher's Objection",
        "Constantinople. A Byzantine logician who has read the Alcinous-court account argues that "
        "the mast-binding agreement is not a contract at all: a man cannot bind himself to an "
        "agreement that overrides his own subsequent commands; authority cannot be delegated against "
        "itself; the crew's action in ignoring Odysseus's orders was either mutiny or obedience and "
        "cannot be both. He holds the tablets as he speaks, turning them over. He is not hostile to "
        "the archive. He is genuinely uncertain whether this is a document or a paradox.",
        "CON",
        "He thinks for a long time. 'The pre-authorization makes it a contract,' he says slowly. "
        "'The captain made himself an object governed by an agreement he authored. The document is "
        "the agreement, not the action.' He stamps a provenance certificate. You receive the "
        "Provenance Certificate.",
        "He sets the tablets down. 'I will note my reservation.' He writes a letter of objection "
        "to accompany the tablets, which you accept. The archive will hold both.",
        "CHA", 13, checkPassFlag="zth_09_act3", activateCond="zth_09_act2")

    quest("zth_09_act4", "The River at Night",
        "A river crossing north of Constantinople, deep in the night watch. Three men are waiting "
        "at the bridge — they are relatives of sailors who died at Thrinacia, and word has traveled "
        "that someone is carrying the only surviving document from the voyage. They are not thieves. "
        "They are grieving men who want to know if the tablets name who ate first, who argued "
        "hardest, who held back. They will take the tablets by force to read them before they "
        "reach an archive where the public record will be set.",
        "CON",
        "You hold the bridge until they back away from the dark and the water rushing below. No "
        "one speaks. They leave. You cross. The tablets are intact. You receive the Night Bridge "
        "Crossing Mark.",
        "They get the tablets for one hour before you recover them. They read what they were "
        "looking for — Eurylochus's name is in the agreement. They put the tablets back. You "
        "continue. The tablets have been read by unauthorized parties; you note it.",
        "STR", 14, checkPassFlag="zth_09_act4", activateCond="zth_09_act3")

    delivery("zth_09_act5", "The Archive — Mast Binding",
        "Weimar. Sweelinck reads the tablets slowly. He reads the corroboration. He reads the "
        "provenance certificate. He sets them in a row. 'He wrote down his own incapacitation,' "
        "he says. 'He ordered the crew to govern him. They did. He screamed and signaled and they "
        "rowed faster, exactly as instructed. The agreement held under the one condition that makes "
        "all agreements meaningful: the moment when one of the parties wanted very badly to break "
        "it.' He pauses. 'The Sirens promised everything. He heard everything. He came away knowing "
        "everything and is not on record as saying what that was.'",
        "NUE",
        "You lay out every element in sequence: widow, harbor, Constantinople, bridge. Sweelinck "
        "writes it all down. He says: 'The Sirens' island is the poem's black box. No one speaks "
        "of what was heard. We have the agreement that made the hearing possible, the crew's "
        "compliance that made the hearing survivable, and a sole survivor who has not said what the "
        "song contained. The archive notes this silence as data.' He files. You receive the Archive "
        "Receipt — Mast Binding.",
        "Sweelinck files the tablets with a note of partial provenance. The survivor's corroboration "
        "is filed separately as an unverified witness account. The record is functional but incomplete.",
        checkPassFlag="zth_09_act5", activateCond="zth_09_act4")

    # ── Cycle 10: The Beggar's Passport ───────────────────────────────────────
    print("\n-- Cycle 10: The Beggar's Passport --")
    quest("zth_10_act1", "Eumaeus's Hut",
        "The swineherd's station in the upland forest of Ithaca, a day's walk from the palace. "
        "Eumaeus is outside, working leather. The wallet hangs from a post near the door — he "
        "has not moved it since the slaughter. He knows what it is. He kept it because it was "
        "the last object his master touched before becoming himself again, and he was not ready "
        "to let that go. He is a man who worked faithfully for twenty years and was right to "
        "do so, and he is not entirely sure what to do with being right.",
        "ITH",
        "You tell him: he was the first archive this object had. He kept the cover story intact "
        "for the twenty hours between Eumaeus's hut and the palace. Without that custody the "
        "disguise fails and the suitors survive. He looks at you for a long moment. Then he takes "
        "the wallet off the post and holds it out. You receive the Beggar's Wallet.",
        "He hands it over without ceremony. 'Take it. It was never mine.' He goes back to his "
        "leather. You have the wallet but the intake notes will reflect that the chain of custody "
        "explanation was not completed.",
        "WIS", 12, checkPassFlag="zth_10_act1")

    quest("zth_10_act2", "The Nurse's Account",
        "The inner women's quarters of the palace, Ithaca. The nurse Euryclea is old and "
        "sharp-tongued and entirely composed. She knows why you are here. She recognized the "
        "scar on his thigh in the dark — twenty years older, the same boar-scar from Parnassus "
        "that she wrapped as a child. She held his ankle and understood everything in the same "
        "instant. He gripped her throat. She kept the secret for twelve hours while the plan "
        "completed. She will tell you the details. What she wants to know first is whether the "
        "archive intends to record that she knew.",
        "ITH",
        "She talks for half an hour. She describes the lamp, the angle of his thigh, the specific "
        "shape of the scar she remembered from when he was eight years old. She says: 'I had him. "
        "Then I had him again. Twenty years apart, the same.' She dictates a clean account for the "
        "archive. You receive Euryclea's Recognition Statement.",
        "She says nothing about the twelve hours. She gives you a dry recitation of the footwashing, "
        "the scar, the grip. 'He said nothing. I said nothing.' The record is factually accurate "
        "and misses the weight entirely.",
        "CHA", 12, checkPassFlag="zth_10_act2", activateCond="zth_10_act1")

    quest("zth_10_act3", "The Cover Story's Contradictions",
        "A room in the palace where the steward Medon — who survived the slaughter by hiding under "
        "the ox hides — has compiled three versions of the beggar's cover story as told to Eumaeus, "
        "Telemachus, and Penelope. They contradict each other in small but specific ways: his "
        "claimed homeland, the name of his fictional father, the number of ships he said he once "
        "commanded. Medon is not accusatory. He is confused. He wants the archive to tell him "
        "which version is the 'real' cover story so he can file correctly.",
        "ITH",
        "Medon pauses, then begins to write very carefully. 'He told Eumaeus one thing, Telemachus "
        "a second, Penelope a third,' he says, 'and in each case the thing he told them was what "
        "that person most needed to believe was possible.' He files all three versions with "
        "annotations. You receive the Three-Version Cover Record.",
        "Medon files the most internally consistent version and notes the discrepancies as copying "
        "errors. The record is tidy and wrong.",
        "INT", 13, checkPassFlag="zth_10_act3", activateCond="zth_10_act2")

    quest("zth_10_act4", "Antinous's Household",
        "The house of Antinous's father Eupeithes, outside Ithaca town. Eupeithes is gathering "
        "men to avenge his son's death. Two of them, having heard that someone is collecting "
        "documents from the palace, believe the archive is building a case to legitimize the "
        "slaughter. They are not wrong about what the archive does. They intend to take the wallet.",
        "ITH",
        "You take the blow and keep moving — out through the courtyard gate before they can "
        "organize a second approach. The wallet stays sealed. The insert is intact. You receive "
        "the Intact Wallet Seal.",
        "They get the wallet for long enough to remove the folded oiled-leather insert with the "
        "written false identities. When you recover it, the insert is gone. The wallet is intact. "
        "The written element of the cover story is lost. You note the loss.",
        "STR", 14, checkPassFlag="zth_10_act4", activateCond="zth_10_act3")

    delivery("zth_10_act5", "The Archive — Beggar's Wallet",
        "Weimar. Sweelinck opens the wallet on the table. He reads the folded insert. He reads "
        "Euryclea's statement. He reads the three-version cover record. He lays them out in order. "
        "'He walked into his own house as a stranger,' he says quietly. 'He begged from men eating "
        "his food at his table. He held still when one of them threw a stool at his shoulder. He "
        "held still when his nurse recognized him in the dark and put her hand over her mouth.' "
        "He pauses. 'The archive cannot determine from this record which it was. We file it as both.'",
        "NUE",
        "You give the full account. Sweelinck writes it into the record. He says: 'Twenty years of "
        "real wandering made the prop indistinguishable from the man. The archive holds a beggar's "
        "wallet that may be the most precisely accurate representation of its owner in the entire "
        "collection.' He files. You receive the Archive Receipt — Beggar's Wallet.",
        "Sweelinck files what he has. The gaps are noted. The wallet is catalogued under 'Disguise "
        "Artifacts, Self-Authored Identity, Ithaca.'",
        checkPassFlag="zth_10_act5", activateCond="zth_10_act4")

    # ── Cycle 11: The Bed That Could Not Be Moved ─────────────────────────────
    print("\n-- Cycle 11: The Bed That Could Not Be Moved --")
    quest("zth_11_act1", "The Palace Accounts Room",
        "The palace accounts room, Ithaca. Stacked tablets on wooden shelves, some warped, one "
        "shelf water-damaged at the far end. The scribe who filed the recognition exchange is "
        "dead — he died the following winter. What remains is his filing system, and a household "
        "steward named Dolius's son who has been going through the water-damaged tablets trying "
        "to preserve what can be preserved. He has already found it. He is holding it very "
        "carefully when you arrive. He does not know what it is. He knows it is not a bedroom "
        "allocation note.",
        "ITH",
        "You explain what the tablet contains to Dolius's son in two sentences. He hands it to "
        "you immediately, carefully, with both hands. 'I thought something had happened,' he says. "
        "'I didn't know what.' You receive the Penelope Test Tablet.",
        "You recognize the exchange but cannot immediately place it in context. Dolius's son keeps "
        "the tablet for now, pending your return. You come back the following day with enough "
        "knowledge to name it correctly.",
        "INT", 12, checkPassFlag="zth_11_act1")

    quest("zth_11_act2", "Penelope's Version",
        "The queen's upper room, late afternoon. Penelope is at her loom but not weaving — the "
        "shuttle is in her hand. She has heard you have the scribe's tablet. She is not hostile. "
        "She is deciding how much the archive deserves. What the tablet does not record is the "
        "inside of the test: that she knew, when she gave the instruction about the bed, that the "
        "real Odysseus would react exactly as this man reacted — and that the real Odysseus would "
        "know, in the same moment, exactly why she was testing him.",
        "ITH",
        "She sets the shuttle down. She speaks quietly and at length. She describes what the bed "
        "means: it was the thing he made for her, by his own hands, that was also the foundation "
        "of the house, rooted in the earth of the courtyard. No impersonator could know it. No "
        "impersonator could feel what he felt when she named it as something that could be taken "
        "away. 'He didn't argue,' she says. 'He stated.' She dictates a paragraph. You receive "
        "Penelope's Interior Account.",
        "She looks at you for a long time. 'The tablet is enough,' she says. She goes back to "
        "her loom. You leave with the tablet and a gap in the record. The archive will note it.",
        "CHA", 13, checkPassFlag="zth_11_act2", activateCond="zth_11_act1")

    quest("zth_11_act3", "Laertes in the Vineyard",
        "The farm outside Ithaca town, at midday. Laertes is in the vineyard, staking a vine. "
        "He is clean now — Athena touched him and he stands straighter than his years — but he "
        "was bent and ragged in his own field for twenty years and he still moves like a man who "
        "expects nothing. He knows the archive wants information about the recognition. He knows "
        "what Odysseus told him: the scar, the trees. He also knows what Odysseus did before "
        "that: he gave him a false identity and watched him weep for his own son. He will talk "
        "about the trees. He is not sure he will talk about the test.",
        "ITH",
        "You acknowledge, before asking anything, that being tested by your own child is a thing "
        "the archive cannot judge and does not need to frame. He is still for a moment. Then he "
        "talks about the full hour: the stranger who said he had met Odysseus years ago, the gifts, "
        "the detailed and plausible lie, the grief that came up without any help. He says: 'I knew "
        "it was him when he started lying that well.' He dictates. You receive Laertes' Recognition "
        "Account.",
        "You ask about the trees. He names all thirteen pear trees, the ten apple trees, the forty "
        "fig trees, the fifty rows of vines, in order, from memory. He gives you a clean account "
        "of the recognition. He does not mention the false identity or the hour he wept.",
        "WIS", 12, checkPassFlag="zth_11_act3", activateCond="zth_11_act2")

    quest("zth_11_act4", "The Bow as Instrument",
        "The palace armory, where the great bow has been rehung after the slaughter. The "
        "bow-maker's son — a craftsman from Same who claims the bow as an inherited piece, since "
        "Iphitus gave it and Iphitus was murdered, making the gift legally contingent — is in "
        "the armory with two men, attempting to remove it. He is not violent but he is determined, "
        "and he has a legal case that is not entirely without merit. The tablet you carry is part "
        "of the same legal question: a document confirming Odysseus's identity also confirms his "
        "claim to every object in the palace.",
        "ITH",
        "You put yourself between the men and the bow rack and stay there until they consult with "
        "their legal advisor and find their case is weaker than they thought. They leave. The bow "
        "stays. You receive the Bow Remains in Place Certificate.",
        "They take the bow. It will be subject to legal proceedings. The archive notes the "
        "connection between the tablet and the bow's contested provenance, and files accordingly. "
        "The recognition record is intact; the physical instrument of proof is disputed.",
        "STR", 14, checkPassFlag="zth_11_act4", activateCond="zth_11_act3")

    delivery("zth_11_act5", "The Archive — The Bed That Could Not Be Moved",
        "Weimar. Sweelinck reads the tablet in full. He reads Penelope's interior account. He "
        "reads Laertes' full hour. He sits back. 'The bed is rooted in the earth of the courtyard,' "
        "he says. 'The proof is that only the original person knows this. The proof is not portable. "
        "What is portable is the moment of the proof being spoken — the eruption of specific "
        "knowledge in a man who had been performing ignorance for weeks.' He is quiet. 'The archive "
        "holds the testimony of three people who recognized the same person through different "
        "anatomical and architectural facts: a scar, a set of trees, a bed that cannot be moved. "
        "Together they constitute the most thoroughly documented identity verification in the collection.'",
        "NUE",
        "You lay out every element in sequence: the water-damaged shelf, Penelope at the loom, "
        "Laertes in the vineyard, the bow rack. Sweelinck writes for a long time. He says finally: "
        "'The bed cannot be moved. The archive cannot hold the bed. What the archive holds is the "
        "record of a man who knew a thing about a bed that no one else could know, and said it "
        "without thinking, and was recognized by that saying. The document is the speaking. We file "
        "it as such.' He files. You receive the Archive Receipt — The Bed That Could Not Be Moved.",
        "Sweelinck files what you have with noted gaps. The record is significant but partial. "
        "He thanks you for what you brought.",
        checkPassFlag="zth_11_act5", activateCond="zth_11_act4", questComplete=True)

    print("\n=== ZTH extra cycles complete ===")
    say("ZTH cycles 8 through 11 deployed. 20 acts. The Odyssey Pass 4 extra cycles complete. "
        "Weimar Archive. Archivus Sweelinck. "
        "The Captivity Record, The Mast Agreement, The Beggar's Passport, "
        "The Bed That Could Not Be Moved. Quest complete.")

    # Audit
    print("\n-- Audit --")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    if errors:
        print(f"  ERRORS: {len(errors)}")
        for e in errors[:5]:
            print(f"    {e}")
    else:
        print("  0 errors")

    # Save
    api("post", "/api/save", json={})
    print("  Saved.")

if __name__ == "__main__":
    main()
