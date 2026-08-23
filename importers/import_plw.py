#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import PLW — Vision of Piers Plowman (William Langland), 35 acts (7 cycles × 5 acts).
FCO code taken by Aeneid — using PLW prefix for quest IDs.
MGF new node (Malvern Field); BK/VEN/CON/ROM/LDN/WM existing.
RME doesn't exist — using ROM (Rome Prefect Court Quarter) for cycle 6."""
import time, requests

BASE = "http://localhost:1367"

def api(method, path, **kw):
    r = getattr(requests, method)(f"{BASE}{path}", **kw)
    r.raise_for_status()
    return r.json()

def get_nonce(quest_id):
    d = api("post", "/api/nonce", json={"type": "quest", "id": quest_id})
    return d["nonce"]

def create_quest(q):
    nonce = get_nonce(q["id"])
    d = api("post", "/api/quest", json=q, headers={"X-Nonce": nonce})
    if d.get("ok"):
        print(f"  OK: {q['id']} — {q['title']}")
    else:
        print(f"  ERR: {q['id']} — {d}")
    return d

def wait_server():
    time.sleep(9)
    api("get", "/api/ping")

QUESTS = [
    # ── Cycle 1 — The Pardon of Piers (all at WM) ────────────────────────
    {
        "id": "plw_01_act1",
        "title": "The Pardon of Piers — Before Dawn",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 10,
        "desc": "A man named Perkin — aged minor clerk, three days walking from a farm, ink-stained, shaking slightly — is waiting in a cold room in the Weimar archive district before dawn. He has a parchment that must reach the city gaol before a man named Perkyn is hanged for a debt he did not incur. The pardon is from Truth's own agent. It has a grey wax seal and contains two lines of Latin. No episcopal flourish. No registry mark. 'The gates will offer to inspect it,' Perkin says. 'Let no one break the seal.'",
        "passText": "You take the parchment. It weighs nothing. That will be its first problem. You understand before the gates: the pardon's authority is not in its appearance. Pardon of Piers received.",
        "failText": "You hesitate over the plain appearance. Perkin watches. He gives it to you anyway but the first exchange has cost something.",
        "checkPassFlag": "plwC1A1Done",
    },
    {
        "id": "plw_01_act2",
        "title": "The Pardon of Piers — The Gate of Licenses",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC1A1Done",
        "desc": "A gate in the archive district wall. The commissary on duty — Favel, smooth voice, heavy rings — examines the pardon without touching it. He says the seal is irregular. He produces a certified pardon-form: gilded edge, four episcopal stamps. For a modest verification fee, your document can be transferred into the proper form. The grey seal will have to be broken. The two lines will be transcribed — officially. Favel will do the transcribing himself.",
        "passText": "You decline without argument and find the unofficial route past the gate. The seal is intact.",
        "failText": "You are delayed one hour, watched, exit only through the alley route. Favel's informant marks your destination.",
        "checkPassFlag": "plwC1A2Done",
    },
    {
        "id": "plw_01_act3",
        "title": "The Pardon of Piers — The Register Hall",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC1A2Done",
        "desc": "A scholar's clerk — Brother Cyvyle, who manages the Indulgence Registry — intercepts you in the archive corridor. He offers to register the pardon, give it official standing, a wax sigil of the archive. What he does not say: authentication in Weimar requires contents to be disclosed, copied, and evaluated for theological conformity. A pardon that says only 'do well and have well' — no pope's name, no fee schedule — will be ruled invalid and confiscated as a counterfeit. His offer is genuine. His offer is also a trap that he does not know is a trap.",
        "passText": "You see the danger before agreeing. The pardon stays unregistered and intact.",
        "failText": "You agree. One hour later, before the registration process extracts the document, you escape the archive — guards alerted, seal still intact.",
        "checkPassFlag": "plwC1A3Done",
    },
    {
        "id": "plw_01_act4",
        "title": "The Pardon of Piers — The Lady's Court",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC1A3Done",
        "desc": "Dame Giftes — Lady Mede's regional agent — knows about the pardon. She produces a competing document: a beautifully executed pardon for one Perkyn, bearing the stamps of three bishops. She offers to trade. She takes your grey-sealed parchment; you take the gilded pardon; Perkyn goes free. The gilded pardon costs nothing to you. It costs everything to whoever obtained it. Perkyn will be released — but released into debt, under obligation to Dame Giftes's network for the rest of his life. She has muscle in the anteroom.",
        "passText": "You expose the leash — the gilded pardon's conditions — and shame her clerk into standing aside. The plain parchment stays in your coat.",
        "failText": "Her muscle moves. You fight your way out of the anteroom with the pardon intact before Dame Giftes seals the gaol order.",
        "checkPassFlag": "plwC1A4Done",
    },
    {
        "id": "plw_01_act5",
        "title": "The Pardon of Piers — The Gaol Gate",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC1A4Done",
        "desc": "The gaol gate. Two days before Perkyn's hanging. One guard, one lock, one prisoner. You hand the pardon through the bars. Perkyn is a small man, middle-aged, debt-lined. He holds the grey parchment for a long time. He reads the two lines: Et qui bona egerunt, ibunt in vitam eternam. Qui vero mala, in ignem eternum. He laughs — genuinely. 'It says to do well. I did not know it would be this short.' The warden looks at the plain document. It has no episcopal stamp, no registry seal. He looks at it for a long time.",
        "passText": "The warden unlocks the cell. He knows the pardon carries authority not written in the wax — the authority of having been brought through every gate that Mede owns. Perkyn walks out. Prisoner Perkyn Freed.",
        "failText": "The warden requires further argument. You make the case without the document's formal standing. Perkyn still walks out, on your word.",
        "checkPassFlag": "plwC1A5Done",
    },
    # ── Cycle 2 — The Fragments of the Torn Pardon ───────────────────────
    {
        "id": "plw_02_act1",
        "title": "Fragments of the Torn Pardon — The Field's Edge",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC1A5Done",
        "desc": "The field where Piers plowed is empty. A scholar at the field's edge explains: Piers tore his pardon in anger when a priest mocked it; the pieces scattered to the city; each person who found one claims it proves what they already believed. A widow at the field's edge found the first piece and held it under her hearthstone. She will give it to someone who asks correctly — not with authority, not with argument; with the same simplicity the pardon itself has.",
        "passText": "You ask to see what she found. You hold the fragment in both hands and read it aloud quietly: 'Do well, and have well, and God shall have thy soul.' She nods once and lets you take it. 'Bring it back to the place it belongs.' First Fragment of Piers's Pardon received.",
        "failText": "You arrive as an official. She asks what you will do with it. She gives it to you anyway but something in the first exchange has cost something.",
        "checkPassFlag": "plwC2A1Done",
    },
    {
        "id": "plw_02_act2",
        "title": "Fragments of the Torn Pardon — The Friary",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC2A1Done",
        "desc": "The Friar has his fragment framed. It reads '...pardoned perpetually with Paul's testament...' — which, read out of context, sounds like perpetual exemption for friars from temporal accountability. He is not lying about what the fragment says. He is lying about what it means by not saying what the rest of the pardon says. Navigate his argument without calling him a liar — hold your First Fragment beside his and let the combined text speak.",
        "passText": "'Read them together,' you say. He does. The full text is different from his fragment alone and he knows it. He hands it over as a contribution to scholarship. Friar's Fragment added to satchel.",
        "failText": "You argue. He argues back. You get the fragment by invoking the scholar's commission, which he does not legally have to honor.",
        "checkPassFlag": "plwC2A2Done",
    },
    {
        "id": "plw_02_act3",
        "title": "Fragments of the Torn Pardon — The Market",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC2A2Done",
        "desc": "The Pardoner has set up a stall in the market with his fragment in a glass case — 'Certified by the original!' His piece reads '...remit of sins here set forth...' and he is using it to authenticate his own indulgences. He will not give it up while it generates revenue. But he cannot refuse a public comparison. Hold the First Fragment up in the market, publicly, beside his, so the crowd can hear the full phrase.",
        "passText": "The crowd does the arithmetic. He takes the fragment from the case himself before they finish. 'An honest comparison. I have always admired honest comparison.' Pardoner's Fragment added.",
        "failText": "He closes the case before you finish reading and names a price. You get the fragment but you pay market value for it.",
        "checkPassFlag": "plwC2A3Done",
    },
    {
        "id": "plw_02_act4",
        "title": "Fragments of the Torn Pardon — The Counting House",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC2A3Done",
        "desc": "The merchant's steward has the third fragment — filed with a certificate asserting the merchant's charitable donations match 'good works done in the name of...' But the adjacent fragment completes the phrase in a way the certificate's wording cannot survive. Find the specific phrase on one of the other fragments that makes the certificate's claim technically unsupportable.",
        "passText": "'Good works done in the name of Truth, not in the name of the doer.' The steward reads it three times and pulls the fragment from the file. Merchant's Fragment added. Three of four.",
        "failText": "The steward calls the cooperative clerk. The legal argument takes until evening. You get the fragment but Covetousness's agent has had extra time.",
        "checkPassFlag": "plwC2A4Done",
    },
    {
        "id": "plw_02_act5",
        "title": "Fragments of the Torn Pardon — The Gate",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC2A4Done",
        "desc": "Covetousness's agent is at the archive gate with the last fragment and a pardoner-guild buyer who will seal it as a contested document — preventing assembly for as long as the challenge stands. The agent is not here for debate. He has the last fragment in his coat pocket.",
        "passText": "All four pieces go into the satchel. The scholar assembles them on his desk. The full text reads: 'Do well, and have well, and God shall have thy soul; Do evil, and have evil, and expect none other.' He looks up: 'It says exactly what it always said.' Scholar's Coin received.",
        "failText": "The buyer takes possession and files the challenge. The scholar assembles three pieces. The pardon says only the promise, not the condition. It is still useful. It is not complete.",
        "checkPassFlag": "plwC2A5Done",
    },
    # ── Cycle 3 — Piers's Pilgrimage Directions ──────────────────────────
    {
        "id": "plw_03_act1",
        "title": "Piers's Pilgrimage Directions — The Field's Edge",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC2A5Done",
        "desc": "Will the dreamer is at the field's edge with a parchment: his transcription of Piers's pilgrimage directions to Truth — each station named, each instruction at each junction, warnings at Pride and Covetousness, the final gate. He says: I wrote them as fast as I could while Piers spoke. They are accurate; they are also useless as directions unless you already understand what the stations mean. Understand why the archive wants a document that cannot be practically used.",
        "passText": "The document is not a guide — it is evidence that the directions were given and received, and that the destination the poem insists is reachable was once clearly mapped. Piers's Pilgrimage Directions received.",
        "failText": "You take the parchment without fully understanding its purpose. The document travels but its archival significance is partially obscured.",
        "checkPassFlag": "plwC3A1Done",
    },
    {
        "id": "plw_03_act2",
        "title": "Piers's Pilgrimage Directions — The Road North",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC3A1Done",
        "desc": "A Franciscan friar on the northern road wants the parchment to use in sermons as evidence that the pilgrimage to Truth is a defined interior route, not a general aspiration. His use is legitimate. The parchment travels to the archive first; he can request access after deposit.",
        "passText": "He accepts the explanation. The parchment continues to Birka.",
        "failText": "He argues his need is urgent. You lose an hour but keep the parchment.",
        "checkPassFlag": "plwC3A2Done",
    },
    {
        "id": "plw_03_act3",
        "title": "Piers's Pilgrimage Directions — Birka",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC3A2Done",
        "desc": "A Lady Mede agent in Birka recognizes Will's handwriting on the parchment. Mede has an interest in suppressing any literal document of the route to Truth — the route's final gate specifically excludes Lady Mede's key. He approaches at the market with two men behind him.",
        "passText": "You hold the ford. The agent does not get the parchment.",
        "failText": "He gets a hand on the case. You recover it but take a blow. The parchment is intact.",
        "checkPassFlag": "plwC3A3Done",
    },
    {
        "id": "plw_03_act4",
        "title": "Piers's Pilgrimage Directions — Road to Weimar",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC3A3Done",
        "desc": "Three days to Weimar. The parchment is in the case. The directions name Pride as a steep cliff where everyone is looking down. They name Covetousness as a fog that comes in at night and reroutes travelers. They name Meekness as a brook that must be crossed on foot. You have been on these roads before, under different names. Keep moving.",
        "passText": "You arrive in Weimar with the parchment intact and your direction clear.",
        "failText": "You stop at one of the named stations longer than intended. The parchment arrives late but intact.",
        "checkPassFlag": "plwC3A4Done",
    },
    {
        "id": "plw_03_act5",
        "title": "Piers's Pilgrimage Directions — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.plwC3A4Done",
        "desc": "Sweelinck reads the directions from the beginning. He reads the station list: Meekness, Be-Buxom-in-Speech, Conscience, the commandments, the virtues, Pride's cliff, the final gate. He reads the final gate's description. He looks up: 'The directions are accurate and cannot be used as directions unless the follower already understands what the stations mean. The archive holds them as evidence that such directions were given. The route exists. The archive cannot walk it for you.'",
        "passText": "Sweelinck opens Pilgrimage Direction Records: First Entry. The parchment is filed.",
        "failText": "The parchment is filed under allegory. The category of literal direction-giving waits for a better classification.",
        "checkPassFlag": "plwC3A5Done",
    },
    # ── Cycle 4 — The Daughters of God's Legal Debate ────────────────────
    {
        "id": "plw_04_act1",
        "title": "The Daughters of God's Legal Debate — The Field's Edge",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC3A5Done",
        "desc": "Will hands over a formal debate transcript before the field dissolves. The Four Daughters of God — Truth, Righteousness, Peace, and Mercy — debated whether Christ's Harrowing of Hell was lawful. Truth argued against it: three points, each valid within its framework. Peace's resolution overrides them not by refuting them but by establishing a higher framework. The gate opened. Understand why the archive wants the legal form and not just the outcome.",
        "passText": "Truth's three points against the Harrowing are each valid within their framework; the archive holds the structure of the override that rendered them moot. Daughters' Legal Debate received.",
        "failText": "You take the document without fully grasping what makes the structure worth preserving.",
        "checkPassFlag": "plwC4A1Done",
    },
    {
        "id": "plw_04_act2",
        "title": "The Daughters of God's Legal Debate — Road to Venice",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC4A1Done",
        "desc": "A Benedictine monk on the southern road wants to examine the debate record to settle a theological dispute in his house about whether the Harrowing was predestined or contingent on the argument's outcome. His question is not answerable from the document. The document shows the argument was made and resolved; whether it was ever in doubt is a different question that the archive cannot answer.",
        "passText": "He accepts the limitation. The debate record continues to Venice.",
        "failText": "He argues at length. You lose an hour and arrive in Venice tired but with the document intact.",
        "checkPassFlag": "plwC4A2Done",
    },
    {
        "id": "plw_04_act3",
        "title": "The Daughters of God's Legal Debate — Venice",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC4A2Done",
        "desc": "A Venetian theologian studying the relationship between law and mercy wants to compare the debate record with Byzantine theological texts on the same question. His comparison requires access to the original. He wants to take the document to his scriptorium. The archive makes comparisons available after deposit — his access is welcome, but the document goes to Weimar first.",
        "passText": "He accepts the process. He will apply to Sweelinck for access after deposit.",
        "failText": "He makes a compelling case for his comparison's urgency. You decline gracefully after a longer conversation.",
        "checkPassFlag": "plwC4A3Done",
    },
    {
        "id": "plw_04_act4",
        "title": "The Daughters of God's Legal Debate — Road to Weimar",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC4A3Done",
        "desc": "Three days north from Venice. The debate record is in the case. Truth made three valid points and was overruled. That is what the document contains: not a settled answer, but the record of a question that was raised and answered within the poem's framework. Keep moving.",
        "passText": "You arrive in Weimar with the debate record intact.",
        "failText": "You spend a night rereading Truth's three points. They are still valid within their framework. You arrive a day late.",
        "checkPassFlag": "plwC4A4Done",
    },
    {
        "id": "plw_04_act5",
        "title": "The Daughters of God's Legal Debate — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.plwC4A4Done",
        "desc": "Sweelinck reads Truth's argument. He reads Peace's resolution. He notes the moment of the gate opening. He says: 'Truth made three valid points within her framework. Peace's resolution overrides them by establishing a different framework. The archive holds both the points and the override. Truth's objections are still valid within their framework. The gate opened anyway.'",
        "passText": "Sweelinck opens Divine Legal Records: First Entry. The argument is filed with the override.",
        "failText": "The transcript is filed under theological documents without the category note.",
        "checkPassFlag": "plwC4A5Done",
    },
    # ── Cycle 5 — Glutton's Tavern Bill ──────────────────────────────────
    {
        "id": "plw_05_act1",
        "title": "Glutton's Tavern Bill — Beton's Alehouse",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC4A5Done",
        "desc": "Beton the Brewstress hands you the bill before the vision fades. Glutton set out for church to confess and ended in her alehouse from six in the morning until vespers — a gallon and a gill consumed, a pint passed, the guts rumbling like two greedy sows, the whole company of Hikke the hackney-man and Tymme the tinker and Clarice of Cocklane recorded. She says: he tried to pay at the end but had given too much away. Understand why the archive wants a tavern bill.",
        "passText": "The bill is not primarily a confession document — it is a social record, precisely detailed about what fourteenth-century English tavern life contains. Glutton's Tavern Bill received.",
        "failText": "You take the bill as a moral document. Its social-history value is only partially understood.",
        "checkPassFlag": "plwC5A1Done",
    },
    {
        "id": "plw_05_act2",
        "title": "Glutton's Tavern Bill — Road to Constantinople",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CHA", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC5A1Done",
        "desc": "A travelling monk writing a treatise on the sins wants the bill as a primary source for the chapter on Gluttony. His use is legitimate. The archive holds it for general access after deposit, which includes his access.",
        "passText": "He accepts the explanation. The bill continues to Constantinople.",
        "failText": "He argues that his treatise deadline is urgent. You explain the archive's process. The bill continues.",
        "checkPassFlag": "plwC5A2Done",
    },
    {
        "id": "plw_05_act3",
        "title": "Glutton's Tavern Bill — Constantinople",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC5A2Done",
        "desc": "A Byzantine courtier wants to purchase the bill as a curiosity — specifically as an example of how English commerce is documented at the tavern level. His interest is genuine but his offer would take the bill into a private collection. The archive is the right destination for a document that should remain accessible.",
        "passText": "You explain the archive's accessibility policy. He is disappointed but accepts.",
        "failText": "He makes a generous offer. You decline after a longer negotiation.",
        "checkPassFlag": "plwC5A3Done",
    },
    {
        "id": "plw_05_act4",
        "title": "Glutton's Tavern Bill — Road to Weimar",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC5A3Done",
        "desc": "Three weeks from Constantinople to Weimar. The bill is in the case. The afternoon it describes was entirely real within the poem's world. Glutton left the alehouse at vespers and fell at the threshold. His wife and his wench dragged him home. His first words on waking: 'Where is the bowl?' The bill predates his confession by six days. Keep moving.",
        "passText": "You arrive in Weimar with the bill intact.",
        "failText": "The road is long. You arrive having thought about the bill's specificity more than was necessary.",
        "checkPassFlag": "plwC5A4Done",
    },
    {
        "id": "plw_05_act5",
        "title": "Glutton's Tavern Bill — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.plwC5A4Done",
        "desc": "Sweelinck reads the itemized list. He reads Beton's mark at the bottom. He reads the format: itemized by person where possible, categories totaled, Glutton's portion marked when he could no longer pay for others. He says: 'The bill is specific. The archive notes it as social history as much as moral evidence. The afternoon is documented in the order things were consumed. Glutton confessed the next Sunday. The bill predates the confession by six days.'",
        "passText": "Sweelinck opens Confession Evidence Records: First Entry. The bill is filed as social history.",
        "failText": "The bill is filed under Seven Sins illustrations. The social-history category waits.",
        "checkPassFlag": "plwC5A5Done",
    },
    # ── Cycle 6 — Need's Argument ─────────────────────────────────────────
    {
        "id": "plw_06_act1",
        "title": "Need's Argument — The Field's Edge",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC5A5Done",
        "desc": "Will hands over a transcript at the field's edge before Need dissolves. Near the poem's end, the allegorical figure Need appeared and argued that necessity overrides law — a hungry man who steals food commits no sin because his need suspends the prohibition. Need cited Temperance, Fortitude, and Justice as virtues that themselves depend on necessity. The argument was not refuted. Understand why the archive wants Need's argument in particular: the archive holds arguments that the poem does not answer.",
        "passText": "The argument is made by a figure who appears without invitation and leaves without refutation. Whether the argument is correct is a question the poem does not answer. Need's Argument Transcript received.",
        "failText": "You take the transcript without fully grasping what its unrefuted status means for the archive.",
        "checkPassFlag": "plwC6A1Done",
    },
    {
        "id": "plw_06_act2",
        "title": "Need's Argument — Road to Rome",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.plwC6A1Done",
        "desc": "A Dominican friar on the road south wants to examine the argument to refute it for use in sermons against theft. His refutation is welcome; it is not in the transcript. The transcript is Need's argument as made. The friar can construct his refutation separately — the archive holds the argument, not its refutation.",
        "passText": "He accepts the distinction. The transcript continues to Rome.",
        "failText": "He argues that the argument should not circulate without a refutation attached. You keep the transcript separate.",
        "checkPassFlag": "plwC6A2Done",
    },
    {
        "id": "plw_06_act3",
        "title": "Need's Argument — Rome",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CHA", "checkDC": 14,
        "activateCond": "() => !!S_story.plwC6A2Done",
        "desc": "A church official at Rome wants to confiscate the transcript on the grounds that the argument, if circulated, will be used to justify theft. He is not wrong that it could be used this way. The archive holds arguments that can be used in multiple ways because the argument's existence is not contingent on its misuse.",
        "passText": "You obtain a church exemption letter for archival transit. The transcript continues north.",
        "failText": "The official is persistent. You appeal to a higher office and lose a day, but the transcript stays in your custody.",
        "checkPassFlag": "plwC6A3Done",
    },
    {
        "id": "plw_06_act4",
        "title": "Need's Argument — Road to Weimar",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC6A3Done",
        "desc": "Five days north from Rome. The transcript is in the sealed wallet. The church exemption letter is attached. Need's argument is inside: necessity is prior to all law; a hungry man who steals food commits no sin. The argument was not refuted before the Antichrist arrived. Keep moving.",
        "passText": "You arrive in Weimar with the transcript intact and the exemption letter attached.",
        "failText": "You think about Need's argument for most of the road. The transcript arrives late but intact.",
        "checkPassFlag": "plwC6A4Done",
    },
    {
        "id": "plw_06_act5",
        "title": "Need's Argument — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.plwC6A4Done",
        "desc": "Sweelinck reads the opening claim. He reads the three virtue examples. He reads the conclusion. He reads the citations Need used from Roman legal tradition without attribution. He says: 'The argument was not refuted. The poem does not answer whether Need was correct. The archive holds the argument and the non-refutation together. The reader can construct the refutation. Need did not stay to hear it.'",
        "passText": "Sweelinck opens Necessity Doctrine Records: First Entry. The argument is filed with the non-refutation as part of the document.",
        "failText": "The transcript is filed under legal arguments. The non-refutation note waits.",
        "checkPassFlag": "plwC6A5Done",
    },
    # ── Cycle 7 — Conscience's Departure Oath ────────────────────────────
    {
        "id": "plw_07_act1",
        "title": "Conscience's Departure Oath — Unity's Gate",
        "type": "skill_check",
        "activateNode": "MGF",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC6A5Done",
        "desc": "The archive's scribe is the only person present when Conscience walks out of Unity's gate. The Antichrist's forces have breached the walls. Conscience cries 'Grace!' He dictates his oath in the moment between leaving and moving: he will search for Piers Plowman. He does not know where Piers is. He does not know when he will return. He does not say he will succeed. He seals it with his mark and says: take it to Weimar. Understand what makes this oath different from a commission.",
        "passText": "A commission has a destination; this oath has only a direction — outward, searching — and the archive holds it as an open file, not a completed one. Conscience's Departure Oath received.",
        "failText": "You take the oath as a completed commission. The open-quest nature of the document is not fully understood on departure.",
        "checkPassFlag": "plwC7A1Done",
    },
    {
        "id": "plw_07_act2",
        "title": "Conscience's Departure Oath — Road to London",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC7A1Done",
        "desc": "A Franciscan friar who has read the poem wants the oath for a church collection of formal spiritual commitments. His collection is genuine and well-curated. The archive holds the original of an open oath because it is still technically in progress — Conscience has not returned.",
        "passText": "He accepts the explanation. The oath continues to London.",
        "failText": "He argues that Conscience's departure is complete — he departed. You explain that the quest it commits to is not complete.",
        "checkPassFlag": "plwC7A2Done",
    },
    {
        "id": "plw_07_act3",
        "title": "Conscience's Departure Oath — London",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.plwC7A2Done",
        "desc": "An English church official wants the oath categorized as a failed commitment — Conscience left and has not returned; the quest has not succeeded; this is abandonment of Unity, not a heroic departure. The archive categorizes documents by what they are, not by what the categorizer needs them to mean. The oath is open.",
        "passText": "The oath is a sworn search, not a guaranteed return. The archive's category is Open Quest Records, not Abandoned Commitments. The official is not satisfied but has no grounds to confiscate.",
        "failText": "The official is persistent. You argue the distinction for an hour. The oath stays in your custody.",
        "checkPassFlag": "plwC7A3Done",
    },
    {
        "id": "plw_07_act4",
        "title": "Conscience's Departure Oath — Road to Weimar",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.plwC7A3Done",
        "desc": "Three days to Weimar. The oath is in the sealed wallet. Conscience is searching somewhere. The poem ended on that image: a man walking out of a besieged city crying for grace, looking for someone who may not be findable. Keep moving.",
        "passText": "You arrive in Weimar with the oath intact.",
        "failText": "You stop on the road to think about what it means that the poem ends without resolution. The oath arrives late but intact.",
        "checkPassFlag": "plwC7A4Done",
    },
    {
        "id": "plw_07_act5",
        "title": "Conscience's Departure Oath — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.plwC7A4Done",
        "desc": "Sweelinck reads the oath. He reads the acknowledgment that the destination is unknown. He reads the commitment to cry 'Grace' until someone answers. He marks the file: open. He says: 'The file is open. Conscience swore and departed. The poem ended. Whether the quest succeeds is not in this file. The archive holds open quests because a quest that has not concluded is still a quest. This is the first entry.'",
        "passText": "Sweelinck opens Open Quest Records: First Entry. The file is marked open. The archive holds it until Conscience returns or the search is formally concluded.",
        "failText": "The oath is filed under departures. The Open Quest Records category waits.",
        "checkPassFlag": "plwC7A5Done",
        "questComplete": True,
    },
]

def main():
    print("Importing PLW — Vision of Piers Plowman (35 acts)...")
    wait_server()
    for q in QUESTS:
        create_quest(q)
    print("\nAll 35 acts imported. Running audit...")
    result = api("get", "/api/audit")
    errors = result.get("errors", [])
    warnings = result.get("warnings", [])
    ping = api("get", "/api/ping")
    if errors or warnings:
        print(f"AUDIT ISSUES: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors[:5]:
            print(" ", e)
    else:
        print(f"Audit clean. Nodes: {ping.get('nodes')}, Quests: {ping.get('quests')}")

if __name__ == "__main__":
    main()
