#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import BOO — Prose Edda (Snorri Sturluson, c.1220), 35 acts (7 cycles × 5 acts).
BOO code taken by Yugurt Lake — quest prefix boo_ used (node code separate from quest prefix).
New nodes: ASG (Asgard — Frigg's Hall, camelot), THK (Þökk's Cave, ruins), HNJ (Hnitbjörg, highlands).
Existing nodes: BK, VEN, CON, ROM, LDN, WM.
Cycles 3-7 use ASG as activateNode (source used BOO placeholder which collides with Yugurt Lake)."""
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
    # ── Cycle 1 — Þökk's Refusal (ASG→BK→THK→ASG) ──────────────────────────
    {
        "id": "boo_01_act1",
        "title": "Þökk's Refusal — The Commission",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "CON", "checkDC": 12,
        "desc": "Ásgarðr's hall smells of ash and smoke that has nowhere to go. The gods are present but silent. Frigg stands at the center and carves the bowl herself, there in front of you, from a piece of ash-wood. She hands it to you. The hall is so quiet you can hear the bowl's weight in your hands. She needs a non-divine messenger to carry the grief-bowl to every willing thing on the north road and ask each to weep for Baldr. The last stop is a cave north of the mountain pass. Come back when the bowl is full.",
        "passText": "You take the bowl. It is the lightest thing you have ever been given. Frigg nods once. You receive Baldr's Grief-Bowl — a shallow bowl carved by Frigg from ash-wood, empty, to be filled with the world's weeping.",
        "failText": "The silence in the hall presses down. You look at the bowl and look at her and try again. She waits — grief moves at its own speed.",
        "checkPassFlag": "booC1A1Done",
    },
    {
        "id": "boo_01_act2",
        "title": "Þökk's Refusal — The World That Weeps",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CHA", "checkDC": 14,
        "activateCond": "() => !!S_story.booC1A1Done",
        "desc": "The trees weep when you ask. Animals come to the bowl without being called — a deer bowing its head, a raven landing on the rim. The world is genuinely grieving. But at the road's edge, a thorn-bush refuses at first: it grew in shade and never felt Baldr's warmth. The bowl is not yet full. Every refusal matters now.",
        "passText": "The thorn-bush bends its head over the bowl. A small, cold drop. Not much. Enough. You receive the Road-Stone's Drop — a small polished stone from the woodland road, cold and slightly damp, one of the world's gifts to the bowl.",
        "failText": "It says: I grew in shade. Ask the things that grew in sun. You try a different argument — not about Baldr's warmth but about the world's state, the absence that everything feels, shade and sunlight both.",
        "checkPassFlag": "booC1A2Done",
    },
    {
        "id": "boo_01_act3",
        "title": "Þökk's Refusal — The Mountain Pass",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "STR", "checkDC": 14,
        "activateCond": "() => !!S_story.booC1A2Done",
        "desc": "The north road goes through a pass between two peaks. A recent rockfall has covered the path — loose shale, larger stones, a ledge above that looks uncertain. The bowl in both hands cannot be tilted. There is nowhere flat enough to set it down. Across the slide, a cave mouth is visible in the cliff-face. You need both hands to cross but both hands are full.",
        "passText": "You cross one careful step at a time, the bowl held level, both hands occupied. You reach the far side. The bowl is intact and full to where you left it. You receive the Mountain-Pass Stone — a flat piece of shale from the rockslide, carried out of habit by the careful hand.",
        "failText": "A stone rolls underfoot. You catch yourself against the cliff-wall. The bowl tilts — you recover it before a drop is lost. You breathe. You start again from where you stopped.",
        "checkPassFlag": "booC1A3Done",
    },
    {
        "id": "boo_01_act4",
        "title": "Þökk's Refusal — Þökk's Cave",
        "type": "skill_check",
        "activateNode": "THK",
        "checkStat": "WIS", "checkDC": 16,
        "activateCond": "() => !!S_story.booC1A3Done",
        "desc": "The cave is low, the fire small. The giantess is very large and folds herself to fit, warming grey hands. She looks up when you come to the cave mouth. There is a quality of waiting in her stillness — not the waiting of someone who was just sitting here but the waiting of someone who has been expecting this specific visitor. You ask if she will weep for Baldr.",
        "passText": "The verse she speaks is too composed. Grief takes many forms; this is not one of them. The eyes in the firelight are familiar in a way that has nothing to do with this cave. You know what you are looking at. You do not say it aloud. You turn from the cave mouth. You receive Þökk's Charred Twig — a burnt stick from the cave fire, proof of the visit and the refusal.",
        "failText": "You look at her face and see only indifference. You try again — not arguing, just looking, reading the specific quality of the refusal, the polished verse, the waiting. Something is wrong with the shape of the indifference.",
        "checkPassFlag": "booC1A4Done",
    },
    {
        "id": "boo_01_act5",
        "title": "Þökk's Refusal — The Return",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.booC1A4Done",
        "desc": "Frigg is standing where you left her. All the gods are present. The bowl in your hands is full of everything the world was willing to give — and one drop short of what was needed. She already knows from your face that it is not complete. She does not ask about the bowl. She asks about the cave. Tell her what you saw in Þökk's face — not what you concluded but exactly what you witnessed: the composed verse, the specific shape of the indifference, the waiting quality of a figure who had expected you.",
        "passText": "You tell her what you saw. Not interpretation — observation. The polished verse. The eyes in the firelight. The quality of the waiting. You were in the cave and this is what was there. Frigg takes the bowl from your hands. She closes her eyes for a moment. She already knew. She needed someone to have been present. You receive Frigg's Silver Hairpin — pressed into your palm without a word.",
        "failText": "The hall's silence presses down. You start with what is easiest and work toward what is hardest. The truth takes a second attempt to come out whole.",
        "checkPassFlag": "booC1A5Done",
        "activateMissionBit": "booGriefBowlComplete",
    },

    # ── Cycle 2 — The Mead-Theft Night (HNJ) ────────────────────────────────
    {
        "id": "boo_02_act1",
        "title": "The Mead-Theft Night — The Commission",
        "type": "skill_check",
        "activateNode": "HNJ",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.booC1A5Done",
        "desc": "Odin has bored through Hnitbjörg mountain with Rati, handed the auger to you, described exactly one sound that means Suttungr is returning, and transformed into a worm to enter the hole. The hole is in front of you. The drill is in your hands. You now know exactly one thing you are supposed to do: hold it here. The sound Odin described — distinguish it before the vigil begins.",
        "passText": "The sound is exact in your mind. You could identify it at half-distance on a windy night. You settle in front of the drill-hole and wait. You receive Rati the Auger — the boring-drill, the hole's guarantee of remaining open.",
        "failText": "You hold the pattern for two nights. On the third it blurs and you add too much margin. When Suttungr returns you are uncertain.",
        "checkPassFlag": "booC2A1Done",
    },
    {
        "id": "boo_02_act2",
        "title": "The Mead-Theft Night — Three Nights",
        "type": "skill_check",
        "activateNode": "HNJ",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.booC2A1Done",
        "desc": "Three nights of nothing. Field-workers on low paths, rain, the mountain settling. On the third night the rain stops before dawn. This is not the silence of nothing happening. This is the silence of something about to. Stay calibrated, not tense. Hold the vigil for three nights without drifting.",
        "passText": "Three nights. You have not moved from the drill-hole mouth. You know this silence. You are ready.",
        "failText": "By the third night you are over-alert. When the real sound comes you process it a beat late.",
        "checkPassFlag": "booC2A2Done",
    },
    {
        "id": "boo_02_act3",
        "title": "The Mead-Theft Night — The Sound",
        "type": "skill_check",
        "activateNode": "HNJ",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.booC2A2Done",
        "desc": "Rock against rock from the coast road below — the specific cadence Odin described. Regular, purposeful, heavy. It comes again. Suttungr did not go where he was supposed to go. Distinguish his specific approach from everything else this mountain produces before dawn.",
        "passText": "You hear the pattern three times in six minutes. It is exactly what he described. You brace the auger across the drill-hole mouth and wait.",
        "failText": "You wait too long to confirm. You get the auger braced but in a rushed way that costs you leverage.",
        "checkPassFlag": "booC2A3Done",
    },
    {
        "id": "boo_02_act4",
        "title": "The Mead-Theft Night — The Guard",
        "type": "skill_check",
        "activateNode": "HNJ",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.booC2A3Done",
        "desc": "Suttungr did not come alone. His mountain-guard reaches the ridge first, sees you, sees the hole behind you, sees the auger braced across it. He knows what the hole is and who bored it. He does not speak. He moves. Hold the drill-hole against Suttungr's mountain-guard — stone-headed war-club, AC 14, heavy blows.",
        "passText": "The guard goes down before the ridge. You re-brace the auger. Suttungr's steps are on the path below. The hole is still open.",
        "failText": "The guard gets the auger clear. Suttungr arrives to find the hole half-compromised. You recover the bracing position, but the cost was leverage.",
        "checkPassFlag": "booC2A4Done",
    },
    {
        "id": "boo_02_act5",
        "title": "The Mead-Theft Night — The Exit",
        "type": "skill_check",
        "activateNode": "HNJ",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.booC2A4Done",
        "desc": "Suttungr's hand reaches for the stone above the hole. From inside: a dry hard sound, something large moving very fast through a very small space. The whole commission reduces to this: hold the auger for two more seconds. Do not release until the eagle is past.",
        "passText": "You hold it. The eagle comes through at full speed and is gone before Suttungr's hand can close. You release the auger. A small clay vessel is in your belt-pouch — sealed, one drop of skaldic mead inside, landed on your hand when the eagle passed. Enough to make one poem true. Drop of the Skaldic Mead received.",
        "failText": "You release a half-second early. The hole narrows. Three drops of mead fall to the ground and soak into the stone. Odin flies on with the rest.",
        "checkPassFlag": "booC2A5Done",
        "activateMissionBit": "booMeadTheftComplete",
    },

    # ── Cycle 3 — Loki's Capture (ASG→BK→WM) ────────────────────────────────
    {
        "id": "boo_03_act1",
        "title": "Loki's Capture — The First Net",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.booC2A5Done",
        "desc": "Asgard. The gods have woven the first net ever made — specifically designed to catch a single salmon in a specific waterfall. The mesh pattern is unlike anything in use; it was derived from the gaps a salmon could pass through, closing them. The net must arrive at the waterfall from upstream, not downstream — downstream Loki sees through the water before the net is in position. Understand the approach angle before accepting the commission.",
        "passText": "Upstream only. The net's design announces its purpose to anyone familiar with fishing. Loki's informants at settlements along the road have been watching for unusual cargo. You receive the First Net — woven to catch one salmon in one waterfall.",
        "failText": "You take the net without grasping the approach requirement. The gods send someone to explain the upstream doctrine before you leave.",
        "checkPassFlag": "booC3A1Done",
    },
    {
        "id": "boo_03_act2",
        "title": "Loki's Capture — The Settlement Road",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "DEX", "checkDC": 12,
        "activateCond": "() => !!S_story.booC3A1Done",
        "desc": "The net is large and its mesh pattern is unlike anything used in ordinary fishing — anyone familiar with nets will understand it on sight. Loki's watchers at the settlements are looking for exactly this cargo. Carry it past the settlement road at Birka without Loki's informants identifying what it is and why it is going north.",
        "passText": "You bundle the net in canvas and walk past the settlement like a roper delivering cordage. No one stops you. The watchers look and look away. The net clears Birka unseen.",
        "failText": "A watcher at the dock recognizes the mesh. You adjust the bundle, reroute through a less-watched alley, and clear the settlement at cost of an hour.",
        "checkPassFlag": "booC3A2Done",
    },
    {
        "id": "boo_03_act3",
        "title": "Loki's Capture — The Dock Agent",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.booC3A2Done",
        "desc": "A Birka salmon merchant has recognized the net's design and is about to send word north. He has two dock agents with him and is drafting the message. Stop the message before it leaves the dock. The net's purpose must remain unknown north of Birka.",
        "passText": "You reach the dock before the message is sealed. The agents are dealt with. The merchant's draft never leaves the quay.",
        "failText": "One agent gets clear with a partial message. You intercept him before he finds a rider, but the delay is noticed.",
        "checkPassFlag": "booC3A3Done",
    },
    {
        "id": "boo_03_act4",
        "title": "Loki's Capture — The Fisherman's Question",
        "type": "skill_check",
        "activateNode": "BK",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.booC3A3Done",
        "desc": "A fisherman on the road north notices the unusual mesh pattern and asks about it. He is curious, not hostile — a craftsman interested in novel technique. Cover the net's purpose without lying about its design. The fisherman is carrying nothing and going nowhere important. Say enough and walk.",
        "passText": "You describe the mesh as experimental cordage for deep-fjord work. He accepts the answer and asks about the material. You name it and walk. The net continues north without its purpose announced.",
        "failText": "You say too much or too little and he follows for a quarter-mile asking questions. You eventually satisfy his curiosity without naming the waterfall.",
        "checkPassFlag": "booC3A4Done",
    },
    {
        "id": "boo_03_act5",
        "title": "Loki's Capture — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.booC3A4Done",
        "desc": "Weimar. Sweelinck examines the mesh pattern. The design was derived from the shape of the gaps a salmon could not pass through. Without this net, no net. He reads the upstream approach requirement. He creates: Net Records — The First Net, Made to Catch One Fish. He says: the net was the necessary invention; without the new tool, Loki remained where he was; everything after Loki's binding required the net to exist first.",
        "passText": "Net Records opens. First Net filed. Without this net, no net — and without Loki bound, Ragnarök arrives with one free agent too many.",
        "failText": "Sweelinck files the net in general cordage records. You correct the category. Net Records opens.",
        "checkPassFlag": "booC3A5Done",
        "activateMissionBit": "booNetComplete",
    },

    # ── Cycle 4 — The Rune-Learning (ASG→VEN→WM) ─────────────────────────────
    {
        "id": "boo_04_act1",
        "title": "The Rune-Learning — The Vigil Horn",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.booC3A5Done",
        "desc": "Asgard. The well-keeper at Mimir's well has kept the horn Odin held during the nine-day vigil on Yggdrasil — empty now, but the interior holds the residue of the well-water given when the vigil was done. The residue is the evidence: Mimir's water has a specific quality that cannot be faked. A Venetian scholar of ancient materials can verify it. The handling requirement: do not tip the horn. The residue on the inner surface must not be disturbed before Venice.",
        "passText": "The horn's value is in its unrinsed state. The residue is the evidence that the vigil happened as described. You receive Odin's Vigil Horn — ordinary antler, extraordinary contents.",
        "failText": "You take the horn without grasping the handling requirement. The well-keeper insists you review it before the road.",
        "checkPassFlag": "booC4A1Done",
    },
    {
        "id": "boo_04_act2",
        "title": "The Rune-Learning — The Scholar's Road",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "DEX", "checkDC": 12,
        "activateCond": "() => !!S_story.booC4A1Done",
        "desc": "A scholar traveling the same road south denies the nine-days account on theological grounds. He argues at length. The horn becomes an argument if identified — proof or counterproof, depending on which side the scholar takes. Carry it as an ordinary traveler's drinking horn and let the argument continue without the object.",
        "passText": "You say nothing about the horn. The scholar makes his argument to a silent audience. He never connects the horn on your belt to the vigil. Venice is ahead.",
        "failText": "The scholar notices the horn's unusual material and asks about it. You deflect adequately but he continues alongside you for half a day.",
        "checkPassFlag": "booC4A2Done",
    },
    {
        "id": "boo_04_act3",
        "title": "The Rune-Learning — The Venetian Verification",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "WIS", "checkDC": 13,
        "activateCond": "() => !!S_story.booC4A2Done",
        "desc": "Venice. The Venetian scholar wants to verify the residue with a chemical process that would destroy it — his testing method dissolves the surface residue to measure its mineral composition. The horn's value is documentary, not chemical. His collector's agents arrive while the negotiation is in progress. Propose visual examination only, and hold the horn through the collector's arrival.",
        "passText": "You demonstrate that visual examination of the pale residue under lamplight provides sufficient identification — the specific color and surface adhesion pattern are the signature of Mimir's water. The scholar accepts. The agents are present but do not take the horn. Visual verification complete.",
        "failText": "The scholar's agents reach for the horn. You hold it through the brief physical argument. The testing proposal is withdrawn.",
        "checkPassFlag": "booC4A3Done",
    },
    {
        "id": "boo_04_act4",
        "title": "The Rune-Learning — The Debate on the Road",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.booC4A3Done",
        "desc": "The scholar's positive identification means the horn is now controversial in northern religious circles. Someone on the road north of Venice wants to discuss what it proves about Odin's divinity, the runes, the nine days. Hold the horn without becoming party to the debate. The horn is evidence of the vigil; what the vigil proves is not your commission.",
        "passText": "You say: the horn was there. The residue on the interior is from the well at the tree's root. That is what the archive will file. The debate continues without you.",
        "failText": "The argument engages you for an hour. You eventually disengage without conceding any position. The horn is intact.",
        "checkPassFlag": "booC4A4Done",
    },
    {
        "id": "boo_04_act5",
        "title": "The Rune-Learning — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.booC4A4Done",
        "desc": "Weimar. Sweelinck tilts the horn toward the lamp. He reads the pale residue on the inner surface. He sets the horn down. 'The well-water is distinct from any other. The nine days happened as described. Ordinary antler horn — the residue is the only proof needed.' He creates: Vigil Evidence Records — The Horn from the Nine Days on the Tree.",
        "passText": "The residue on the inner surface is from Mimir's well. It cannot be faked. The nine days happened. Vigil Horn filed.",
        "failText": "Sweelinck catalogues the horn in general Norse relics. You correct the category. Vigil Evidence Records opens.",
        "checkPassFlag": "booC4A5Done",
        "activateMissionBit": "booRuneHornComplete",
    },

    # ── Cycle 5 — The Bound Fenrir (ASG→CON→WM) ──────────────────────────────
    {
        "id": "boo_05_act1",
        "title": "The Bound Fenrir — Gleipnir Thread",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.booC4A5Done",
        "desc": "Asgard. A loose thread cut from Gleipnir when the binding was done — finer than silk, stronger than iron, made from six impossible materials: a cat's footstep, a mountain's roots, a fish's breath, a bird's spittle, a woman's beard, the sinews of a bear. Tyr placed his hand in Fenrir's mouth as pledge and lost it. This thread is the archive's record of the impossible binding. Do not try to demonstrate its strength to anyone on the road — the commission is to file it as evidence, not to prove it to skeptics.",
        "passText": "The thread does not look like what it is — a loop of silk-fine fiber, easily overlooked. You receive the Gleipnir Thread — the only record that the impossible binding succeeded.",
        "failText": "You pick up the thread and immediately want to test its strength. The gods prevent you from doing so. The commission is documentary.",
        "checkPassFlag": "booC5A1Done",
    },
    {
        "id": "boo_05_act2",
        "title": "The Bound Fenrir — The Scholar's Claim",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.booC5A1Done",
        "desc": "At a road crossing near Constantinople, a scholar of divine binding recognizes the thread's description and wants to acquire it for study. He cannot have it. He argues that a thread from Gleipnir, if verified, would be the most significant theological evidence of divine material construction in any tradition. Explain the commission without describing the thread's specific properties — naming the properties is naming the purpose, and the purpose is what draws acquisition attempts.",
        "passText": "You explain the archive commission without confirming the thread's identity. He accepts that the object is assigned and cannot be diverted. You pass the crossing.",
        "failText": "He argues the acquisition case at length. You eventually name the commission authority. He accepts, noting his formal request for a copy.",
        "checkPassFlag": "booC5A2Done",
    },
    {
        "id": "boo_05_act3",
        "title": "The Bound Fenrir — The Tensile Test",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.booC5A2Done",
        "desc": "Constantinople. A Byzantine scholar wants to perform a tensile test — demonstrating the thread's strength by pulling it to its limit. The test destroys it as an archival object: once tested it becomes a demonstration, not a record. His collector's agents are present and have been briefed to take the thread for testing. Hold the thread through the collector's arrival and refuse the test.",
        "passText": "You hold the thread through the physical argument. The difference between documentary evidence and demonstration is preserved. The thread is not tested.",
        "failText": "An agent reaches for the thread. You hold it through the struggle. The test is not performed.",
        "checkPassFlag": "booC5A3Done",
    },
    {
        "id": "boo_05_act4",
        "title": "The Bound Fenrir — The Road Question",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.booC5A3Done",
        "desc": "On the road north toward Weimar, someone asks how strong Gleipnir is. They have heard of the binding. They want the Fighter to demonstrate or describe the thread's properties. The answer is: strong enough to hold Fenrir. The fragment is not for demonstration. Say so without contempt for the question.",
        "passText": "'Strong enough to hold Fenrir — that is the record.' You walk on. The thread is still in the carry-pouch, undisplayed.",
        "failText": "You say more than is necessary. The conversation extends. You eventually close it without revealing the thread.",
        "checkPassFlag": "booC5A4Done",
    },
    {
        "id": "boo_05_act5",
        "title": "The Bound Fenrir — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.booC5A4Done",
        "desc": "Weimar. Sweelinck holds the thread up to the lamp. It looks like nothing. He does not pull it. He creates: Binding Records — The Thread from the Ribbon That Held the Wolf. He says: 'The thread looks like silk. It is stronger than iron. It held Fenrir. The archive notes this without testing it, because testing it would change what it is.'",
        "passText": "The thread's value is preserved. Binding Records opens. Gleipnir Thread filed without demonstration.",
        "failText": "Sweelinck moves to test it. You stop him with the documentary argument. He acknowledges and creates Binding Records.",
        "checkPassFlag": "booC5A5Done",
        "activateMissionBit": "booGleipnirComplete",
    },

    # ── Cycle 6 — Draupnir's Return (ASG→ROM→WM) ─────────────────────────────
    {
        "id": "boo_06_act1",
        "title": "Draupnir's Return — The Cold Ring",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.booC5A5Done",
        "desc": "Asgard. Draupnir — the gold ring Odin placed on Baldr's pyre — was returned from Hel by Hermoðr. It is cold from Hel's hand in a way that cold storage cannot replicate. It also makes eight equal copies of itself every ninth night. By now there are nine rings. The original is the coldest. A Roman scholar of ancient materials can authenticate the Hel-origin cold before archiving. Identify the original ring from among the nine before beginning the road to Rome.",
        "passText": "The original is colder than the others — a specific cold that is not temperature but passage. You identify it, wrap it separately, and receive Draupnir — the gold ring returned from Hel, cold from Hel's hand.",
        "failText": "You cannot immediately identify the coldest ring. You test each one against your palm. The distinction is subtle but real. You find it.",
        "checkPassFlag": "booC6A1Done",
    },
    {
        "id": "boo_06_act2",
        "title": "Draupnir's Return — The Alpine Checkpoint",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.booC6A1Done",
        "desc": "At the Alpine checkpoint south of the pass, the guard sees nine equal gold rings and stops you. Nine equal rings look like theft. The ring's self-copying property is the explanation — and it sounds like a lie. Explain it simply and hold the position while the checkpoint officer thinks.",
        "passText": "You describe the ring's multiplication property precisely: every ninth night, eight equal copies. The guard counts the nights since the commission. The arithmetic satisfies him. You pass.",
        "failText": "The guard doesn't believe the multiplication story. You describe Draupnir's documented history and eventually satisfy his skepticism. The crossing takes an hour.",
        "checkPassFlag": "booC6A2Done",
    },
    {
        "id": "boo_06_act3",
        "title": "Draupnir's Return — The Thieves at Rome",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.booC6A2Done",
        "desc": "Rome. Gold thieves tracked the ring from the Alpine crossing — the checkpoint exchange was overheard. At the authentication scholar's table, where all nine rings are laid out for examination, two thieves arrive while the scholar is reading. Recognize them for what they are before they reach the table where the rings are displayed.",
        "passText": "You see the approach before they reach the table. The rings are swept off the table and secured. The thieves are dealt with before the original is touched.",
        "failText": "One thief gets a hand on the copies. You recover them and subdue both before any ring leaves the room.",
        "checkPassFlag": "booC6A3Done",
    },
    {
        "id": "boo_06_act4",
        "title": "Draupnir's Return — The Road Question",
        "type": "skill_check",
        "activateNode": "ROM",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.booC6A3Done",
        "desc": "On the road north from Rome, someone asks if Baldr will return. They have heard of Draupnir and its return from Hel and they conflate the ring's return with Baldr's return. The ring's return was not Baldr's return. Hold the distinction without elaborating beyond what the ring actually is.",
        "passText": "'The ring came back. Baldr did not — not yet.' You walk on. The eight copies clink softly in the pack.",
        "failText": "The question opens a longer conversation about post-Ragnarök prophecy. You eventually close it without making theological claims.",
        "checkPassFlag": "booC6A4Done",
    },
    {
        "id": "boo_06_act5",
        "title": "Draupnir's Return — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.booC6A4Done",
        "desc": "Weimar. Sweelinck holds the original ring. It is cold in a specific way. He holds the copies. They are cold differently — colder than room temperature but not cold from Hel. He notes the specific cold of the original in the file. He creates: Divine Correspondence Records — The Ring That Came Back From Hel. 'Baldr sent the ring back. He could not come with it. The archive notes the specific cold.'",
        "passText": "The Hel-origin cold is documented. Draupnir filed. The eight copies are filed alongside as the ring's multiplication record.",
        "failText": "Sweelinck cannot immediately distinguish the original from the copies. You identify it by touch. He accepts your identification.",
        "checkPassFlag": "booC6A5Done",
        "activateMissionBit": "booDraupnirComplete",
    },

    # ── Cycle 7 — The Golden Pieces (ASG→LDN→WM) ─────────────────────────────
    {
        "id": "boo_07_act1",
        "title": "The Golden Pieces — The Commission",
        "type": "skill_check",
        "activateNode": "ASG",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.booC6A5Done",
        "desc": "After Ragnarök, in the new grass, two gods found the golden game-pieces the Aesir once played with — each piece engraved with a name. One piece entered trade networks via a seafarer and reached London, where a gold merchant values it at its weight. He will melt it on his regular smelting day. What the Fighter is carrying is not gold — it is the record that the name survived the fire. Understand this before London, where the merchant sees only gold weight.",
        "passText": "Each piece is a name. What the merchant will melt is the record that a name survived Ragnarök. You receive the Aesir Game-Piece — gold disk, inscription worn but legible, the name engraved before the fire.",
        "failText": "You take the commission without grasping the name-record distinction. The gods wait until you can explain what you are carrying before you leave.",
        "checkPassFlag": "booC7A1Done",
    },
    {
        "id": "boo_07_act2",
        "title": "The Golden Pieces — The Channel Crossing",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "DEX", "checkDC": 12,
        "activateCond": "() => !!S_story.booC7A1Done",
        "desc": "The piece glows faintly where Ragnarök ash is still in the coastal water of the Channel crossing — the gold has absorbed something from the new world's beginning that old gold does not carry. Carry it through the crossing without the glow drawing attention from anyone who would recognize what it means.",
        "passText": "You wrap the piece in undyed cloth and hold it below the rail. The glow is visible only from directly above. No one on the crossing looks down. London ahead.",
        "failText": "A passenger notices the faint glow through the cloth and asks about it. You redirect the conversation. The piece reaches London unidentified.",
        "checkPassFlag": "booC7A2Done",
    },
    {
        "id": "boo_07_act3",
        "title": "The Golden Pieces — The Melt Day",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "STR", "checkDC": 13,
        "activateCond": "() => !!S_story.booC7A2Done",
        "desc": "London. The gold merchant has the piece on his melt-day table. The furnace is lit. The merchant's two guards are present. Under the archive's recognition protocol, a record object — one bearing an inscription identifying it as a named record — cannot be destroyed without first being offered to the permanent record. Name the protocol before the furnace reaches temperature.",
        "passText": "You name the archive's recognition protocol. The merchant hesitates. The guards move. You hold the table through the brief physical argument and present the piece for inspection. The inscription is legible. Protocol acknowledged. The piece leaves the melt table.",
        "failText": "The guards move first. You hold through the struggle. The merchant reads the inscription before the furnace is stoked. Protocol accepted.",
        "checkPassFlag": "booC7A3Done",
    },
    {
        "id": "boo_07_act4",
        "title": "The Golden Pieces — The Survivor's Question",
        "type": "skill_check",
        "activateNode": "LDN",
        "checkStat": "CON", "checkDC": 11,
        "activateCond": "() => !!S_story.booC7A3Done",
        "desc": "On the road from London north, someone asks what Ragnarök was like. They have heard of the fire and the new world and they want something more than the fragment knows. The piece is the record that something survived. That is enough. Say it once.",
        "passText": "'One piece arrived. One name is in the record. The games will resume when enough pieces come.' You walk on. The piece is wrapped in cloth in the carry-pouch.",
        "failText": "The question opens into eschatology. You answer for longer than intended, then close the conversation and continue.",
        "checkPassFlag": "booC7A4Done",
    },
    {
        "id": "boo_07_act5",
        "title": "The Golden Pieces — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 10,
        "activateCond": "() => !!S_story.booC7A4Done",
        "desc": "Weimar. Sweelinck reads the name on the face of the piece. He is quiet for a moment. He holds it up to the lamp. The inscription is worn but complete. He sets it down. 'One piece. One name. The games will resume when enough pieces arrive. The archive receives each one. This is the first.' He creates: Post-Ragnarök Records — The Names That Survived the Fire. The Prose Edda series is complete.",
        "passText": "Post-Ragnarök Records opens. First entry: one name, survived the fire, arrived in London via trade, recovered before the furnace. The Prose Edda archive is complete.",
        "failText": "Sweelinck files the piece in the general Norse relics category. You correct the category. Post-Ragnarök Records opens.",
        "checkPassFlag": "booC7A5Done",
        "activateMissionBit": "booGoldenPiecesComplete",
        "questComplete": True,
    },
]

def main():
    print("Creating BOO nodes...")
    wait_server()
    existing = {n["id"] for n in api("get", "/api/list/node")}

    if "ASG" not in existing:
        create_node("ASG", "camelot", "Ásgarðr — Frigg's Hall", 1, 78, 112,
            "The hall of the Aesir gods above the nine worlds — vast, smoke-filled after Baldr's pyre, every god present and silent. Frigg at the center, Odin absent, the grief as heavy and specific as weather. The archive's access point into the Norse mythological domain: the place where commissions are given for every object that crosses from the divine world into the documentary record. Each cycle returns here.")
    else:
        print("  NODE: ASG already exists — skipping")

    if "THK" not in existing:
        create_node("THK", "ruins", "Þökk's Cave — The One Who Would Not Weep", 1, 80, 108,
            "A low cave in a cliff-face north of the mountain pass: small fire, grey giantess very still, warming grey hands. The specific quality of the indifference that fills the cave — not ordinary indifference but a composed, waiting quality; the polished verse spoken clearly, without hesitation, as if it had been composed long in advance. The one place where the world's accumulated grief was insufficient.")
    else:
        print("  NODE: THK already exists — skipping")

    if "HNJ" not in existing:
        create_node("HNJ", "highlands", "Hnitbjörg — Suttungr's Mountain Vault", 1, 82, 110,
            "The mountain where Suttungr stored the mead of poetry in a vault called Ódrerir. Odin bored through it with the auger Rati, negotiated inside with Suttungr's daughter Gunnlöð for three nights, drank all three vats, and flew out as an eagle. The outer slope where the drill-hole emerges is the Fighter's station: three nights of waiting, the auger held at the mouth, the commission that reduces to one second of correct bracing.")
    else:
        print("  NODE: HNJ already exists — skipping")

    print("\nImporting BOO — Prose Edda (35 acts)...")
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
