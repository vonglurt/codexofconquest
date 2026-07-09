#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import GDN — Njal's Saga (Anon, 13th century), 35 acts (7 cycles × 5 acts).
GDN code taken by Danzig — Grain Port; quest IDs use gdn_ prefix (node codes don't conflict).
New nodes: IGH (Ingolf's Head, beach), SWF (Swinefell, camelot), ISL (Althing Ground, highlands).
Existing nodes: HHL, BK, VS, HEO, CON, WM.
"""
import requests, time, sys

BASE = "http://localhost:1367"

def api(method, path, **kwargs):
    r = getattr(requests, method)(f"{BASE}{path}", **kwargs)
    if r.status_code not in (200, 201):
        print(f"ERROR {method.upper()} {path}: {r.status_code} {r.text[:200]}")
        sys.exit(1)
    return r.json()

def get_nonce(quest_id):
    d = api("post", "/api/nonce", json={"type": "quest", "id": quest_id})
    return d["nonce"]

def create_quest(q):
    nonce = get_nonce(q["id"])
    result = api("post", "/api/quest", json=q, headers={"X-Nonce": nonce})
    print(f"  OK: {q['id']} — {q['title']}")
    return result

def create_node(code, name, label, act, r, c, desc):
    result = api("post", "/api/node", json={
        "code": code, "name": name, "label": label,
        "act": act, "r": r, "c": c, "desc": desc,
    })
    print(f"  NODE: {code} — {label}")
    return result

def wait_server():
    for _ in range(20):
        try:
            r = requests.get(f"{BASE}/api/ping", timeout=3)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(1)
    print("Server did not come back")
    sys.exit(1)

QUESTS = [
    # ── Cycle 1 — The Escort to Ossaby (SWF/IGH) ────────────────────────────
    {
        "id": "gdn_01_act1",
        "title": "The Escort to Ossaby — The Departure",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "WIS", "checkDC": 11,
        "desc": "Swinefell yard at dawn frost. Flosi stands at the gate without a cloak, grey in the cold. Hildigunna is already mounted. She does not look back. You are hired to ride escort on the column's outside from Swinefell to Ossaby, where she is to take up residence as the new wife of Hauskuld the Priest of Whiteness. A cedar chest is lashed to the packhorse. It carries the scarlet cloak Flosi gave Hauskuld at the betrothal feast. The chest is latched, not locked. Notice this in the first hour.",
        "passText": "You take your position on the column's flank. The chest is latched, not locked — you keep that fact in your head the whole first hour. You receive: Hildigunna's Escort Token.",
        "failText": "You ride without attending to the chest until Hildigunna glances back to check it herself. Flosi watches you go. You ride without full attention and carry nothing back but your wage.",
        "checkPassFlag": "gdnC1A1Done",
    },
    {
        "id": "gdn_01_act2",
        "title": "The Escort to Ossaby — The Coastal Road",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC1A1Done",
        "desc": "They stop at a ford by midday. A shepherd boy crosses the other bank and stares at them too long. Hildigunna speaks twice on the road: once to ask if you have ever been to a wedding, and once at nightfall to say: 'All the best weddings I know of have ended badly.' The chest rocks gently on the packhorse. Read the road correctly.",
        "passText": "You file the shepherd's stare away. When Hildigunna speaks at nightfall, you understand that the cloak is not a gift — it is a claim. You ride the last miles with one hand near your hilt. The chest check is noted.",
        "failText": "You say nothing and learn nothing. The chest rides silently and you arrive at the brae with no warning of what is coming.",
        "checkPassFlag": "gdnC1A2Done",
    },
    {
        "id": "gdn_01_act3",
        "title": "The Escort to Ossaby — The Headbrink Brae",
        "type": "skill_check",
        "activateNode": "IGH",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.gdnC1A2Done",
        "desc": "Three riders from the east at a gallop on open ground — they miscalculated and are not ambushing from cover. Two spears, one sword. The Fighter meets them forty yards from Hildigunna's horse. The attack is brief and violent. In the fight the chest is knocked from the packhorse.",
        "passText": "One dead, one wounded, one fleeing. You take a wound. Hildigunna gets down from her horse and retrieves the chest herself from where it fell, handling it as though it is the only thing worth saving. 'They were not after the cloak,' she says quietly. 'They were after me.' The chest check is intact.",
        "failText": "You are unhorsed. Hildigunna rides through on her own and the packhorse bolts with the chest. You recover the chest from the brae but the fight has cost ground and time.",
        "checkPassFlag": "gdnC1A3Done",
    },
    {
        "id": "gdn_01_act4",
        "title": "The Escort to Ossaby — Ossaby Morning",
        "type": "skill_check",
        "activateNode": "IGH",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC1A3Done",
        "desc": "Hauskuld Priest of Whiteness comes out to meet them himself — young, careful, unhurried, with eyes that notice everything and decide nothing quickly. He and Hildigunna exchange no endearments. He opens the chest and takes out the scarlet cloak and puts it around his own shoulders with a small, deliberate movement. 'My uncle's work,' he says. He doesn't mean the cloth. Something passes between him and Hildigunna that the Fighter cannot read — not love, not suspicion; more like the recognition of two people placed in the same story by someone else. Read what this moment means.",
        "passText": "You understand: two people who have both been placed in the same story by someone else, and are deciding whether to stay. The cloak hangs on the chair peg beside the fire all evening, filling the hall with red. It has already done all the work it was made to do.",
        "failText": "You eat at the lower bench and carry nothing back but the wound from the brae and your wage.",
        "checkPassFlag": "gdnC1A4Done",
    },
    {
        "id": "gdn_01_act5",
        "title": "The Escort to Ossaby — The Road Back",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "CON", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC1A4Done",
        "desc": "The Fighter rides back alone. The wound from the headbrink tightens in the cold. At the crest of the last hill before the Sand, Flosi's steading is visible below, smoke rising straight. Flosi is walking in the yard. He does not wave. The cloak will outlast everyone in this story — it will be washed and stored and one day taken out again, and what it means then will be worse. Ride down toward Swinefell.",
        "passText": "You ride down to Swinefell. Flosi says nothing and pays what was agreed. You touch the wound on your side. The cloak is at Ossaby on a man you will not see again. Escort Token retired.",
        "failText": "The wound tightens. You ride past the turn and reach Swinefell late. Flosi counts the time without comment.",
        "checkPassFlag": "gdnC1A5Done",
        "activateMissionBit": "gdnEscortComplete",
    },

    # ── Cycle 2 — The Reconciliation at Swinefell (IGH→SWF) ─────────────────
    {
        "id": "gdn_02_act1",
        "title": "The Reconciliation at Swinefell — Ingolf's Head",
        "type": "skill_check",
        "activateNode": "IGH",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC1A5Done",
        "desc": "The ship is on the rocks at Ingolf's Head. The wreckage is on the shore. Kari Solmund's son stands in the coastal wind with everything saved from the ship, which is not much. The storm from the west is intensifying. They are two hours' walk from Swinefell. Kari opens the leather case inside his coat and removes his pilgrim certificate from Rome. He holds it out to you: take it to Swinefell before him, give it to Flosi, let him read what it says before the door opens. 'I have killed sixteen of his companions. I want him to know that the man who walks through his door is not the man who counted the sixteen.' Understand the timing: arrive before Kari, but close enough that the certificate and the man are clearly connected.",
        "passText": "You hold the certificate in both hands and understand its weight — not as a legal document but as the last token in a feud-series that began with a scarlet cloak and ends here, in the wind, with papal parchment. Kari nods. You receive Kari's Pilgrim Certificate.",
        "failText": "You take the certificate with the manner of a messenger. 'Fast, but not running,' Kari says. 'Pilgrims don't run.' You receive the certificate but the timing note is in your mind.",
        "checkPassFlag": "gdnC2A1Done",
    },
    {
        "id": "gdn_02_act2",
        "title": "The Reconciliation at Swinefell — The Winter Storm Road",
        "type": "skill_check",
        "activateNode": "IGH",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC2A1Done",
        "desc": "The road from Ingolf's Head to Swinefell: half-mile exposed stretch above the shore, coastal wind from the west. The certificate is inside your coat, next to your skin. If it gets wet the seal is compromised and Flosi will not be able to read who signed it. Kari is behind you, walking at pilgrim's pace. Maintain the pace that keeps you ahead of Kari through the exposed stretch with the certificate kept dry.",
        "passText": "You arrive at Swinefell's gate in the full dark. The storm is still running. Kari is not yet visible on the path. The certificate is dry. You have exactly the time needed.",
        "failText": "The exposed stretch takes longer than expected. When you approach the gate, Kari's shape is visible on the path behind you — closer than he should be. You arrive barely ahead.",
        "checkPassFlag": "gdnC2A2Done",
    },
    {
        "id": "gdn_02_act3",
        "title": "The Reconciliation at Swinefell — Swinefell Gate",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC2A2Done",
        "desc": "The gatekeeper is young, cautious, and has heard the name Kari. He is not hostile. He sees a stranger at the gate in a winter storm with a sealed document. The time available for this to go correctly is shorter than the time it would take to argue about it. Name Kari, name the certificate, name Flosi as the recipient — make the gatekeeper's calculation easy before Kari appears on the path behind you.",
        "passText": "He hears the name Kari and makes an immediate calculation. He opens the gate. 'Flosi will want to receive this himself.' He leads you to the hall door without stopping. Certificate ready.",
        "failText": "He goes to wake his superior. By the time you are admitted, Kari's shape is visible in the storm approaching behind you. You arrive in the hall at almost the same moment.",
        "checkPassFlag": "gdnC2A3Done",
    },
    {
        "id": "gdn_02_act4",
        "title": "The Reconciliation at Swinefell — The Hall",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.gdnC2A3Done",
        "desc": "Flosi is in the high seat. He reads the certificate twice. A young warrior at his left — who fought in the burning's aftermath and has not been to Rome — stands up, his hand moving toward his belt, beginning to list Kari's kills: 'He killed Gunnar Lambason at the Hebrides. He killed Thorstein the White on the Scottish road—' At the exact moment Flosi's face finishes reading, and before the warrior can complete his list, name what Kari is bringing in the form that removes the warrior's voice from the room without dismissing it.",
        "passText": "'He walked to Rome,' you say, before the list is finished. 'The same road your lord walked. The same door.' The young warrior's hand comes away from his belt. Flosi looks at you for one full second — the assessment of a man deciding whether you know what you've said. He decides yes. He stands up.",
        "failText": "Flosi holds up his hand for the warrior, but the warrior has already taken one step. Flosi must address the warrior before addressing you. The moment stretches. By the time Flosi looks back at the table, Kari is at the door.",
        "checkPassFlag": "gdnC2A4Done",
    },
    {
        "id": "gdn_02_act5",
        "title": "The Reconciliation at Swinefell — The Door Opens",
        "type": "skill_check",
        "activateNode": "SWF",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC2A4Done",
        "desc": "The door opens. Kari stands in the doorway in the storm-dark, snow on his shoulders, hands at his sides. Flosi springs up. He walks to Kari and kisses him and leads him to the high seat. The hall is very quiet. The certificate is on the table. Nobody looks at it directly. Flosi will put it in the chest beside his own tonight, the two documents together — two equal entries from the same authority — and never take them out again. Hold still in the hall while the feud ends. Bear witness without moving, without drawing attention.",
        "passText": "You are entirely still. The embrace happens. Kari sits in the high seat. Flosi goes back to his chair. After some time, Flosi looks across the room and finds you. 'You brought him here correctly.' He says nothing else. Certificate taken: two equal pilgrimages filed together. Flosi's Word received.",
        "failText": "You shift once — a small movement — and one of Flosi's women looks at you. You are seen during a moment not intended to have witnesses. It ends correctly anyway, but the ending was slightly watched.",
        "checkPassFlag": "gdnC2A5Done",
        "activateMissionBit": "gdnSwinefellComplete",
    },

    # ── Cycle 3 — The Dower Trick (ISL→BK→WM) ──────────────────────────────
    {
        "id": "gdn_03_act1",
        "title": "The Dower Trick — Njal's Scribe",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC2A5Done",
        "desc": "At the Althing ground, Njal's booth. Tormod the scribe holds the transcription: the exact dower summons formula as spoken by Hrut in the 'hypothetical' consultation, recorded word for word, with Njal's marginal note: 'this is how one learns what cannot be asked for directly.' Gunnar memorised the formula and served the summons at the Althing. Hrut backed down from the fight and paid ninety hundreds in silver. Understand why the archive wants both the formula and Njal's note — not just the legal text but the extraction technique that made it possible.",
        "passText": "The hostile witness taught his own undoing. The ruse's structure is in the margin note alongside the legal formula. A technique of this kind disappears when the case closes — Njal wrote it down because he understood that. Dower Summons Transcription received.",
        "failText": "You take the transcription as a legal document without reading Njal's note carefully. Tormod adds a brief explanation of why both halves matter before releasing it to you.",
        "checkPassFlag": "gdnC3A1Done",
    },
    {
        "id": "gdn_03_act2",
        "title": "The Dower Trick — Hrut's Son",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC3A1Done",
        "desc": "On the Althing ground, a son of Hrut's household intercepts the Fighter. The family embarrassment is real: Hrut was made to teach his own summons through misdirection and the document names this plainly. He wants it suppressed, or at minimum not sent abroad. He does not dispute the legal outcome — his grandfather paid — but a document that records the technique and calls it cleverness is another matter.",
        "passText": "The technique Njal used is documented alongside the formula precisely because the boundary between cleverness and deception is the interesting part. The archive holds it because that boundary matters more than the family's preference for its own dignity. Hrut's son steps aside.",
        "failText": "He argues the family reputation at some length. You name the Althing record as the place where the case was resolved. He accepts but follows to the gate.",
        "checkPassFlag": "gdnC3A2Done",
    },
    {
        "id": "gdn_03_act3",
        "title": "The Dower Trick — The Competing Lawyer",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC3A2Done",
        "desc": "At Birka, a Scandinavian lawyer wants to examine the document. His interest is not in the margin note but in the formula itself — he wants only the legal text, separated from Njal's commentary on how it was obtained. He argues that legal formulae should travel as formulae, not attached to the particular cleverness of how they were extracted.",
        "passText": "The formula and the extraction technique are the same document precisely because separating them would falsify both. A formula obtained through misdirection and a formula obtained through consultation are not the same formula; the method is part of the record. The lawyer acknowledges the archival logic.",
        "failText": "He makes a copy of the formula section before releasing the full document. You continue with the original intact.",
        "checkPassFlag": "gdnC3A3Done",
    },
    {
        "id": "gdn_03_act4",
        "title": "The Dower Trick — The Althing Record-Keeper",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC3A3Done",
        "desc": "On the road, an official keeper of the Althing records argues that any document about Althing proceedings belongs in the Althing archive, not a foreign institution. His claim is institutional: the Althing has kept its own records since its founding; a foreign archive receiving an Althing document bypasses Icelandic record-keeping authority.",
        "passText": "The transcription was made by a private scribe, not the Althing's official recorder; it records a private consultation that happened on the Althing ground, not an official proceeding. The Althing's authority covers its official records; private notes by a lawyer's scribe are not covered. He accepts the private-record argument.",
        "failText": "He invokes the proximity-of-proceedings rule. You invoke the private-record distinction. He accepts after review but notes the disagreement in his log.",
        "checkPassFlag": "gdnC3A4Done",
    },
    {
        "id": "gdn_03_act5",
        "title": "The Dower Trick — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC3A4Done",
        "desc": "Weimar. Sweelinck reads the formula. He reads Njal's marginal note. He sets the document down. 'He made the hostile witness teach his own summons. He wrote a note in the margin explaining the technique and its ethical ambiguity. Both parts are in the archive.' He pauses. 'The note is more interesting than the formula.' He creates: Legal Innovation Records — Techniques Obtained From Hostile Sources, First Entry.",
        "passText": "The archive files the technique and the note together because Njal understood that the record of how something was done is part of what was done. Dower Summons Transcription filed.",
        "failText": "Sweelinck files the formula in the legal section and the note as a marginal addendum. The two halves are in the archive but separately indexed.",
        "checkPassFlag": "gdnC3A5Done",
        "activateMissionBit": "gdnDowerComplete",
    },

    # ── Cycle 4 — The Prophecy of the Stock (ISL→VS→WM) ────────────────────
    {
        "id": "gdn_04_act1",
        "title": "The Prophecy of the Stock — Gunnar's Writing",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC3A5Done",
        "desc": "At the Althing ground. Njal's daughter Thorgerd holds a leather case: Gunnar's own transcription of Njal's prophetic warning, written in Gunnar's hand at Njal's specific request — the prohibition, the Otkell stock named, Gunnar's acknowledgment, Njal's witnessing note at the bottom. Njal asked Gunnar to write it rather than dictate it because a man who writes his own warning has received it. After Gunnar killed the second Otkell, the document was produced at assembly as evidence of foreknowledge. Gunnar is dead. The case needs to leave Iceland. Understand why the writing matters.",
        "passText": "A prohibition written in the warned man's own hand is evidence that the knowledge was received and acknowledged, not merely transmitted. The document closed the possibility of claiming ignorance — and is why the record matters to the archive as a legal instrument, not merely a prophecy. Thorgerd hands you the case. Prophetic Prohibition Record received.",
        "failText": "You carry it without grasping the writing/dictation distinction. Thorgerd adds a note explaining her father's purpose before releasing the document.",
        "checkPassFlag": "gdnC4A1Done",
    },
    {
        "id": "gdn_04_act2",
        "title": "The Prophecy of the Stock — The Otkell Descendants",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC4A1Done",
        "desc": "A young man of the Otkell line on the road from the Althing. His grandfather was the first Otkell; his father was the second. Both dead by Gunnar's hand. He wants the document — not to destroy it but to hold it as evidence of what the prohibition said and what it meant when it was violated. He believes his family's claim for Gunnar's exile is in that document.",
        "passText": "The document's evidential status was already determined — it was produced at assembly and the exile decision is in the Althing record. This document belongs to the archive not as litigation evidence but as a record of the rarer form: a prophetic statement that acquired legal force by being acknowledged in the warned party's hand. The family's claim was resolved at assembly. He says: 'The assembly decided. It didn't help us.' He steps aside.",
        "failText": "He follows to the coastal village before accepting the form-preservation argument. You name the Althing record. He accepts.",
        "checkPassFlag": "gdnC4A2Done",
    },
    {
        "id": "gdn_04_act3",
        "title": "The Prophecy of the Stock — The Fate Philosopher",
        "type": "skill_check",
        "activateNode": "VS",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC4A2Done",
        "desc": "At Visby, a Scandinavian scholar studies the boundary between prophecy and fate. He is fascinated by the document. His argument: a prophecy that is also a contract creates a philosophical paradox — if the warned party acknowledges the prohibition, is the prophecy's fulfillment more inevitable or less? He wants to hold the document for a week to write a commentary.",
        "passText": "A week's delay for commentary means the document travels as a scholarly object rather than a legal-prophetic instrument. The archive can receive the commentary separately — that is the correct form; the commentary and the document are not the same thing, and the archive should receive the original first. He accepts the separate submission path. 'Tell the archive the paradox is still open.'",
        "failText": "He holds it for three days before releasing it. He hands you his commentary scroll to carry alongside the document. You carry both.",
        "checkPassFlag": "gdnC4A3Done",
    },
    {
        "id": "gdn_04_act4",
        "title": "The Prophecy of the Stock — The Road North in Storm",
        "type": "skill_check",
        "activateNode": "VS",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC4A3Done",
        "desc": "A violent squall on the Norwegian coastal road. The road floods at one section — ankle-deep, running fast. The leather case is good but the external markings — Njal's seal, the witnessing note's attachment cord — are vulnerable to the current. Navigate the flooded section keeping the case out of the water without losing the attachment cord that binds the witnessing note to the main document.",
        "passText": "The case crosses dry. The cord is intact. The document arrives as composed.",
        "failText": "The cord comes loose in the current. You retrieve the witnessing note before it floats away. Both documents are present but must be rebound at the next waystation.",
        "checkPassFlag": "gdnC4A4Done",
    },
    {
        "id": "gdn_04_act5",
        "title": "The Prophecy of the Stock — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC4A4Done",
        "desc": "Weimar. Sweelinck reads the prohibition. He reads the acknowledgment in Gunnar's hand. He reads Njal's witnessing note. 'He wrote it himself because Njal asked him to write it. He knew what he was writing. He killed the second man anyway.' He creates: Prophetic Prohibition Records — Warnings Acknowledged in the Warned Party's Hand, First Entry. The prohibition and the unfulfilled warning are the same document, and the difference is only time.",
        "passText": "The fulfilled prohibition and the unfulfilled warning filed together. The archive notes that what Gunnar acknowledged and what he did are both in the same hand. Prophetic Prohibition Record filed.",
        "failText": "Sweelinck files the prophecy section and the acknowledgment separately. Both are in the archive.",
        "checkPassFlag": "gdnC4A5Done",
        "activateMissionBit": "gdnProphecyComplete",
    },

    # ── Cycle 5 — Sam the Hound (HHL→BK→WM) ────────────────────────────────
    {
        "id": "gdn_05_act1",
        "title": "Sam the Hound — Olaf's Letter and Grani's Account",
        "type": "skill_check",
        "activateNode": "HHL",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC4A5Done",
        "desc": "Herðholt — Ólafr the Peacock's hall. Grani, the last surviving servant of Gunnar's Lithend household, witnessed Sam the hound's death. He walks to Herðholt with two documents: Olaf's original gift letter certifying Sam's lineage and extraordinary perceptive capabilities ('a man's wit'), and his own account of Sam's death, written on the back of a sheepskin — the drug, the blow, the silence where there should have been a warning. He wants the two pieces sewn together as a single document before they leave Iceland. Understand why the two must be sewn together rather than filed separately.",
        "passText": "The gift letter without the death account is a record of a capability; the death account without the gift letter is a record of a loss. Together they are the record of a complete act: the thing given and what happened to it. The archive that holds only one half holds a partial document. Sam's Gift Record received.",
        "failText": "You carry them separately, intending to have them sewn at the next port. Grani insists they leave together. The sewing is done at Herðholt before departure.",
        "checkPassFlag": "gdnC5A1Done",
    },
    {
        "id": "gdn_05_act2",
        "title": "Sam the Hound — Olaf's Descendants",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC5A1Done",
        "desc": "On the road from Herðholt toward the coast, a member of Olaf the Peacock's household. His family gave Sam. He argues that the gift letter belongs in the estate archive at Herðholt — it records a gift made by Olaf and the family's archive is the correct resting place for documents that record Olaf's deeds.",
        "passText": "The gift letter records a gift whose end was itself significant — Sam's death was the signal that the attack on Lithend had begun. The family archive holds the gift as a gift; the Weimar archive holds the gift as evidence of a specific form of loyalty. The distinction controls. He accepts.",
        "failText": "He argues at length that Olaf's gifts belong with Olaf's records. You name the archival distinction between gift-record and loyalty-evidence. He accepts, but notes the family's preference.",
        "checkPassFlag": "gdnC5A2Done",
    },
    {
        "id": "gdn_05_act3",
        "title": "Sam the Hound — The Animal-Keeper's Guild",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC5A2Done",
        "desc": "At Birka. The animal-keepers' guild wants to examine the lineage section of the gift letter — Olaf's certification of Sam's ancestry and capabilities. Their interest is in the breeding record, not in the death account. They argue that the two sections are separable and the lineage section belongs in their guild's registry of notable animals.",
        "passText": "The lineage record and the death account are sewn together deliberately — separating them would reduce the document from a record of what Sam was and did to a breeding entry. The guild's registry records animals; this document records a gift that served as a warning. The distinction is not separable. The guild's registrar accepts the archival logic.",
        "failText": "The guild takes a transcription of the lineage section before releasing the full document. You continue with the original intact.",
        "checkPassFlag": "gdnC5A3Done",
    },
    {
        "id": "gdn_05_act4",
        "title": "Sam the Hound — The Fjord Crossing",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC5A3Done",
        "desc": "Danish coastal crossing — the pack is wet from a squall crossing the fjord. The sewn document is double-layered sheepskin and parchment; the outer layer is damp. The sewing that binds the two halves together is good thread but it was done in haste at Herðholt. Examine the seam before the wet sets in, before the thread can stiffen and crack under repeated folding.",
        "passText": "You catch the early stiffness in the sewing thread before it becomes a crack. The seam is checked and the document arrives intact, the two halves still correctly bound.",
        "failText": "The seam stiffens in the cold. One of the stitches cracks along a fold line. The document is intact but must be re-sewn at the waystation. Sweelinck will note the repair.",
        "checkPassFlag": "gdnC5A4Done",
    },
    {
        "id": "gdn_05_act5",
        "title": "Sam the Hound — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC5A4Done",
        "desc": "Weimar. Sweelinck reads the gift letter. He reads Grani's death account. He reads them together. 'Olaf gave him a hound with a man's wit. The hound detected enemies before they could approach. They drugged him and killed him before attacking the house. Then they attacked the house.' He pauses. 'The archive does not often receive a gift whose end was itself the signal. Usually gifts and their fates are in separate records.' He creates: Gift Records — Objects Whose End Was Also Their Completion, First Entry.",
        "passText": "The archive notes: a gift whose end is itself a warning carries a specific archival form — the two halves are not the gift and its loss but the gift and what it fully did. Sam died first, and the household knew. Sam's Gift Record filed.",
        "failText": "Sweelinck files the gift letter and the death account in adjacent sections. Both are in the archive.",
        "checkPassFlag": "gdnC5A5Done",
        "activateMissionBit": "gdnSamComplete",
    },

    # ── Cycle 6 — The Ice-Leap at Markfleet (ISL→HEO→WM) ───────────────────
    {
        "id": "gdn_06_act1",
        "title": "The Ice-Leap at Markfleet — The Witnesses' Record",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC5A5Done",
        "desc": "Markarfljót riverside, Iceland. Frode the elder holds the measurement: birch-bark, three signatures, twelve ells. The measurement was taken the day after Skarphedinn's leap across the frozen Fleet — the bank-mark, the landing-mark on the ice, the gap between them; the conditions noted: frozen Fleet, loose shoelace before the run, Thrain's position when he fell. All three witnesses. Measured twice. The document is not a boast but a forensic record of an impossible act. Understand why the archive wants the measurement and not just the story.",
        "passText": "The measurement decreases the act by making it a number while remaining extraordinary. The number is the evidence: twelve ells is not a boast, it is what three men measured when they needed to know how far it was. The archive files this as evidence, not legend. Markfleet Leap Measurement received.",
        "failText": "You carry the measurement as a notable record without fully grasping the forensic distinction. Frode adds a note explaining why the witnesses measured it twice.",
        "checkPassFlag": "gdnC6A1Done",
    },
    {
        "id": "gdn_06_act2",
        "title": "The Ice-Leap at Markfleet — The Saga Compiler",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC6A1Done",
        "desc": "Coastal Iceland. A saga compiler wants the attested figure — the twelve-ell measurement — for his own account of Njal's Saga. His argument: the measurement belongs in the saga's own record, not in a foreign archive; a figure that attests to the leap should appear in the primary literary source, not be separated from it into institutional custody.",
        "passText": "The saga's literary account and the forensic measurement are different kinds of records. The saga gives the leap its narrative place; the measurement gives the leap its evidential status as physical fact. The archive preserves the evidential record; the saga preserves the story. The compiler accepts the distinction.",
        "failText": "He argues the saga's priority at length. You separate the literary account from the forensic record. He accepts but notes the measurement in his own text.",
        "checkPassFlag": "gdnC6A2Done",
    },
    {
        "id": "gdn_06_act3",
        "title": "The Ice-Leap at Markfleet — The Athletics Judge",
        "type": "skill_check",
        "activateNode": "HEO",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC6A2Done",
        "desc": "At Lejre. A Scandinavian athletics judge has heard of the leap and disputes the measurement — not the fact of the leap but the twelve-ell figure. He has his own records of competitive distances and argues that twelve ells exceeds the verified maximum for a running leap from a standing start, that the witnesses must have mismeasured, and that the document should be revised to a more plausible figure.",
        "passText": "The conditions are noted in the document: frozen Fleet, loose shoelace before the run, Thrain's position when he fell. The shoelace note is important — it means he tied it, ran, and leaped, and the sequence was continuous; there was no optimal preparation. The measurement is not a competitive record; it is a forensic record of an act under specific, non-optimal conditions. The judge acknowledges the distinction.",
        "failText": "The judge argues the plausibility of the figure at length. You name the non-competitive conditions and the double measurement. He accepts but adds his own note disputing the methodology.",
        "checkPassFlag": "gdnC6A3Done",
    },
    {
        "id": "gdn_06_act4",
        "title": "The Ice-Leap at Markfleet — The River Road",
        "type": "skill_check",
        "activateNode": "HEO",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC6A3Done",
        "desc": "German river road toward Weimar. A ford is swollen from three days of rain. The road crosses it at ankle depth in normal conditions; today it is thigh-deep and fast. The birch-bark document is water-resistant but the three witnesses' signatures are in ordinary ink. Cross the ford keeping the measurement flat and above the water.",
        "passText": "The birch-bark crosses without any contact with the water. All three signatures are legible. The measurement arrives intact.",
        "failText": "You lose footing on the river stones. The bark skims the surface of the current. You recover it before it is soaked but the corner of one witness's signature has blurred.",
        "checkPassFlag": "gdnC6A4Done",
    },
    {
        "id": "gdn_06_act5",
        "title": "The Ice-Leap at Markfleet — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC6A4Done",
        "desc": "Weimar. Sweelinck reads the measurement. He reads the conditions: frozen Fleet, loose shoelace tied before the run, Thrain's position when he fell. He reads it again. 'Twelve ells of open water. They measured twice. The shoelace note is important — it means he tied his lace, ran, and leaped, and the sequence was continuous; there was no optimal preparation; the lace was loose, he tied it, and then he ran.' He sets the document down. 'The archive does not often receive measurements.' He creates: Physical Evidence Records — Forensic Measurements of Acts at the Limit of the Body's Capacity, First Entry.",
        "passText": "The body's absolute limit located, on one afternoon in Iceland, twelve ells further than anyone expected. Filed as evidence, not legend. Markfleet Leap Measurement filed.",
        "failText": "Sweelinck files the measurement in the athletic records. The conditions note is appended separately.",
        "checkPassFlag": "gdnC6A5Done",
        "activateMissionBit": "gdnLeapComplete",
    },

    # ── Cycle 7 — The Fifth Court Gambit (ISL→CON→WM) ───────────────────────
    {
        "id": "gdn_07_act1",
        "title": "The Fifth Court Gambit — The Chamber Account",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "INT", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC6A5Done",
        "desc": "Althing ground, Thorhall's chamber. Thorhall Asgrim's son — the man who drove Skarphedinn's gifted spear through his own swollen leg to walk to the court — has written down his account of how he found the Fifth Court exploit: the three moves, the chamber-logic, the specific weakness in the process that Eyjolf had used, the self-cure included. He wants the account in the archive before the conditions that produced the insight are too far gone to reconstruct. Understand why the account includes the moment of self-cure — not as a story about courage but as a record of the conditions under which the legal insight was reached.",
        "passText": "A man who drove a spear through his own leg to be able to walk to the court was in a state different from any ordinary state of legal deliberation. The archive needs the conditions alongside the insight because a procedural innovation discovered in extreme pain and under time pressure is a different kind of evidence than one found in calm study. Thorhall hands you the account. Thorhall's Procedural Account received.",
        "failText": "You carry the account without fully grasping the conditions argument. Thorhall adds a note explaining why the self-cure is in the text before releasing it.",
        "checkPassFlag": "gdnC7A1Done",
    },
    {
        "id": "gdn_07_act2",
        "title": "The Fifth Court Gambit — The Fifth Court's Commissioners",
        "type": "skill_check",
        "activateNode": "ISL",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.gdnC7A1Done",
        "desc": "Althing ground. A commissioner of the Fifth Court argues that any account of the Fifth Court's procedural weaknesses should be in the Althing's own records, not in a foreign archive. The exploit Thorhall found is evidence of a flaw in the Fifth Court's procedure; that flaw should be sealed in the Althing archive, not circulated.",
        "passText": "The account is not a flaw-report to be suppressed — it is a record of how an existing institution's own logic was turned against a corrupted use of it. The account demonstrates that the Fifth Court worked as intended against the party that had corrupted it. The archive should receive the record of the court's function, not because the flaw needs to be known but because the functioning does. He says: 'The Fifth Court is Njal's invention. It should be in Njal's archive.' You say: yes.",
        "failText": "He accepts the function argument but notes the flaw in his own log. You continue with the document and his note in your bundle.",
        "checkPassFlag": "gdnC7A2Done",
    },
    {
        "id": "gdn_07_act3",
        "title": "The Fifth Court Gambit — Eyjolf's Descendants",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.gdnC7A2Done",
        "desc": "On the Norwegian road, a lawyer who studied under Eyjolf — the man whose Fifth Court gambit was broken — intercepts the Fighter. He argues that the account is a defamatory document: it names Eyjolf's specific procedural moves as corrupt, and a man's legal reputation deserves the same protection as any other reputation. The archive should not file defamatory accounts as primary documents.",
        "passText": "The account names specific procedural moves and their legal effects; whether those moves were corrupt is a legal question, not a defamatory claim. Thorhall's account names the moves, not the motive. The archive files the account of the procedure, which is evidence, not the account of the man's character, which would be defamation. The distinction is precise and it controls. He accepts on first framing.",
        "failText": "He argues the motive-name conflation for an hour. You eventually separate the procedure from the character assessment in the text. He accepts.",
        "checkPassFlag": "gdnC7A3Done",
    },
    {
        "id": "gdn_07_act4",
        "title": "The Fifth Court Gambit — The Alpine Cold",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.gdnC7A3Done",
        "desc": "Alpine road south of Weimar in late autumn. The parchment has become stiff and brittle in the low temperature — good quality Althing parchment, but not prepared for alpine cold. Bending it to roll it tightly risks cracking. Identify the stiffest sections before any compression occurs and keep the document flat and slightly warmed inside your coat until the road descends below the worst of the cold.",
        "passText": "You catch the early stiffness before it becomes brittleness. The account stays flat inside your coat for the descent and you examine it at each waystation. The parchment softens before any crack forms.",
        "failText": "The corner section cracks along one fold line. The text is intact but a corner is fractured. Sweelinck will note it.",
        "checkPassFlag": "gdnC7A4Done",
    },
    {
        "id": "gdn_07_act5",
        "title": "The Fifth Court Gambit — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.gdnC7A4Done",
        "desc": "Weimar. Sweelinck reads the three moves. He reads the self-cure. He reads them again. 'He drove the spear through his own leg and walked to the court without limping. While he was in the chamber he had already seen three moves ahead of everyone arguing. He then killed a man with the first stroke.' He sets the account down. 'The archive does not often receive the intelligence that won the case alongside the legal record of the case. Usually the law is in the record and the mind that found it disappears.' He creates: Legal Intelligence Records — Procedural Innovation Found Under Extreme Conditions, First Entry.",
        "passText": "The three moves, the chamber-logic, the self-cure, preserved in the form they were found — not as clean legal analysis but as the record of how an institution's logic can be wielded against its own corruption by a mind that understands it completely. Thorhall's Procedural Account filed. The Njal's Saga archive is complete.",
        "failText": "Sweelinck files the three moves in the legal records and the self-cure account separately. Both are in the archive.",
        "checkPassFlag": "gdnC7A5Done",
        "activateMissionBit": "gdnFifthCourtComplete",
        "questComplete": True,
    },
]

def main():
    print("Creating GDN nodes...")
    wait_server()

    # Check which nodes already exist
    existing = {n["id"] for n in api("get", "/api/list/node")}

    if "IGH" not in existing:
        create_node("IGH", "beach", "Ingolf's Head — Iceland Coast Wreck Site", 1, 82, 108,
            "The rocks at Ingolf's Head on the south Iceland coast where Kari Solmund's son's ship ran aground in a winter storm. The beach is strewn with wreckage. The coastal wind runs from the west. Two hours' walk from Swinefell. The place where the saga's last journey begins — a man who has killed sixteen of his enemy's companions standing on a shore with a sealed papal document and a direction to walk.")
    else:
        print("  NODE: IGH already exists — skipping")

    if "SWF" not in existing:
        create_node("SWF", "camelot", "Swinefell — Flosi's Hall, Iceland", 1, 84, 110,
            "Flosi Thordsson's hall at Swinefell in south Iceland — the steading of the man who ordered the burning of Bergthorsknoll and walked to Rome for absolution. A hall of unusual moral weight: large enough for the full company of burners to have mustered here, old enough to have seen the whole arc of the feud, and at the end the place where Kari arrived from the sea in a winter storm and Flosi sprang up and kissed him and seated him in the high place.")
    else:
        print("  NODE: SWF already exists — skipping")

    if "ISL" not in existing:
        create_node("ISL", "highlands", "Althing Ground — Iceland", 1, 86, 112,
            "The Althing at Þingvellir — the open-air Icelandic parliament on the highland rift plain where the saga's legal machinery plays out across forty chapters: the dower suit, the prophecy, the Fifth Court's invention and its corruption, the battle on the holy ground. Njal's booth, Gunnar's appearance before the assembly, Thorhall's chamber where the exploit was found. The place where Icelandic law attempted to hold, failed, and was finally recorded.")
    else:
        print("  NODE: ISL already exists — skipping")

    print("\nImporting GDN — Njal's Saga (35 acts)...")
    for q in QUESTS:
        create_quest(q)

    print("\nAll 35 acts imported. Running audit...")
    result = api("get", "/api/audit")
    errors = result.get("errors", [])
    warnings = result.get("warnings", [])
    ping = api("get", "/api/ping")
    if errors or warnings:
        print(f"AUDIT ISSUES: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors[:10]:
            print(" ", e)
    else:
        print(f"Audit clean. Nodes: {ping.get('nodes')}, Quests: {ping.get('quests')}")

if __name__ == "__main__":
    main()
