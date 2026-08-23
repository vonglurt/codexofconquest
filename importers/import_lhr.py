#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import LHR (Beowulf) — 7 cycles, 35 quest acts into roll2hit via WBAPI."""
import json, time, subprocess, sys

BASE = "http://localhost:1367"

def api(method, path, data=None, nonce=None):
    cmd = ["curl", "-s"]
    if method == "POST":
        cmd += ["-X", "POST"]
    elif method == "PUT":
        cmd += ["-X", "PUT"]
    cmd += ["-H", "Content-Type: application/json"]
    if nonce:
        cmd += ["-H", f"X-Nonce: {nonce}"]
    if data:
        cmd += ["-d", json.dumps(data)]
    cmd.append(f"{BASE}{path}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except Exception:
        return {"error": result.stdout[:200]}

def get_nonce(qtype, qid):
    r = api("POST", "/api/nonce", {"type": qtype, "id": qid})
    return r.get("nonce", "")

def create_quest(q):
    qid = q["id"]
    nonce = get_nonce("quest", qid)
    r = api("POST", "/api/quest", q, nonce=nonce)
    ok = r.get("ok") or r.get("id") == qid
    err = r.get("error", "")
    print(f"  {'✓' if ok else '✗'} {qid}: {err if not ok else 'created'}")
    time.sleep(0.4)
    return ok

def wait_server(retries=15):
    for _ in range(retries):
        r = api("GET", "/api/ping")
        if r.get("ok"):
            return True
        time.sleep(2)
    return False

# ---------------------------------------------------------------------------
# LHR quest data — 7 cycles, 5 acts each
# Skill stat mapping: Perception/Insight→wis, Investigation/History→int,
#                     Persuasion/Deception→cha, Athletics/Courage→str
# ---------------------------------------------------------------------------

QUESTS = [

# ── CYCLE 1 — The Mere of Monsters ─────────────────────────────────────────
{
  "id": "lhr_01_act1", "title": "The Mere of Monsters — The Horn Entrusted",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "CHA", "checkDC": 10,
  "desc": "Heorot's torchlit hall is emptying. Warriors file out into the moorland dark. Queen Wealhtheow stands at the eastern door with a mead-horn banded in gold, filled to the lip, still warm from her hands. Beowulf passes last, taking Hrunting from Unferth's outstretched arms. Hrothgar sees the horn in your hands and nods once. Wealhtheow presses it toward you: 'Bring it to my husband at the water's edge. Do not spill a drop.'",
  "passText": "The horn is in your hands, warm from hers. The mead shifts slightly with your grip. The column is already moving for the moorland road. You receive Wealhtheow's Mead-Horn.",
  "failText": "The handmaid steps forward to receive it back. The queen does not speak. Try again.",
  "checkPassFlag": "lhrMereAct1Done",
},
{
  "id": "lhr_01_act2", "title": "The Mere of Monsters — The Moorland Road",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "STR", "checkDC": 12,
  "desc": "Single file over wolf-cliffs, down through fen-paths. No moon worth trusting. Twice the column halts — sounds in the reeds that resolve into nothing. Beowulf walks ahead of everyone, alone, his iron mail ringing quietly. The mead-horn tilts at every step. A thane whispers: 'Things Grendel kept away now roam freely.' Keep the flanks. Keep it full.",
  "passText": "The sounds resolve to nothing. The column reaches the cliff-path intact. The horn is still full. You receive Moorland Crossing Token.",
  "failText": "Something brushes the treeline and the column bunches. Hold the flanks. Try again.",
  "checkPassFlag": "lhrMereAct2Done",
  "activateCond": "() => !!S_story.lhrMereAct1Done",
},
{
  "id": "lhr_01_act3", "title": "The Mere of Monsters — The Mere's Edge",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "The lake is black. Its surface does not move the way water should. On the far bank something coiled and large is still until one of Hrothgar's archers puts a bolt through it — the water thrashes and goes quiet. Hrothgar stops at the edge and holds out his hand. Give him the horn before Beowulf wades in.",
  "passText": "Hrothgar takes the horn and drinks half of it slowly, facing the water. He returns it half-empty. Beowulf removes his armor, takes Hrunting from the flat rock, and walks into the black mere without looking back. You receive Shore Watch Token.",
  "failText": "The horn spills at the shore's edge — a thane steadies you. Hrothgar waits. Try again.",
  "checkPassFlag": "lhrMereAct3Done",
  "activateCond": "() => !!S_story.lhrMereAct2Done",
},
{
  "id": "lhr_01_act4", "title": "The Mere of Monsters — The Ninth Hour",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "WIS", "checkDC": 14,
  "desc": "Hrothgar's men have been leaving since the seventh hour — not running, just the slow retreat of men who have decided someone is dead. The water went red an hour ago. The shore is silent. The half-full horn sits between your hands, cooling to the temperature of stone. Stay. Beowulf is not dead.",
  "passText": "You plant. The ninth hour passes. Then far down in the red-lit dark — something moves upward. You receive Vigil Token.",
  "failText": "Your feet move three steps toward the road. The horn tilts. Come back. Try again.",
  "checkPassFlag": "lhrMereAct4Done",
  "activateCond": "() => !!S_story.lhrMereAct3Done",
},
{
  "id": "lhr_01_act5", "title": "The Mere of Monsters — What Comes Back",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "STR", "checkDC": 10,
  "desc": "Beowulf surfaces alone, carrying Grendel's severed head by the hair. He is laughing. His mail is eaten through in one place. He looks at the horn. Give him what remains. Escort the column and its impossible burden — four men needed for the head on a spear-pole — back to Heorot. At the hall, return the empty horn to the queen.",
  "passText": "Beowulf drinks what remains in one motion. At Heorot that night he returns Hrunting to Unferth with careful words of praise. Wealhtheow stands at the far end of the hall, receives the empty horn with one nod, and turns away. You receive Empty Mead-Horn.",
  "failText": "The spear-pole bearers need relief. Hold the column together. Try again.",
  "checkPassFlag": "lhrMereAct5Done",
  "activateCond": "() => !!S_story.lhrMereAct4Done",
},

# ── CYCLE 2 — Wiglaf's Moment ───────────────────────────────────────────────
{
  "id": "lhr_02_act1", "title": "Wiglaf's Moment — The Cave Mouth",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "WIS", "checkDC": 14,
  "desc": "Eleven men stand on the hillside above the dragon's barrow entrance. Old smoke rises from the cave-throat. Beowulf is inside, alone — he gave one order: wait. The dragon comes out. The fire that precedes it is not a weapon. It is a change in the character of the air. The ten companions move together toward the treeline, fluid and fast, the way trained soldiers move when information exceeds training. Wiglaf has not moved. He says something to himself — a statement, not a shout. Then he starts walking toward the fire.",
  "passText": "You plant beside Wiglaf. The ten are at the treeline. The iron ring on your right hand is already warm from the surrounding heat. You receive Beowulf's Oath-Ring.",
  "failText": "Your feet move three steps before the ring stops you. The ten are already gone. Wiglaf doesn't look back. Find it in yourself. Try again.",
  "checkPassFlag": "lhrWiglafAct1Done",
},
{
  "id": "lhr_02_act2", "title": "Wiglaf's Moment — The Burning Shield",
  "type": "combat", "activateNode": "BRW",
  "desc": "Inside the barrow the ceiling is low and the heat concentrates. The dragon's neck fills the passage. Beowulf is on one knee against the wall, his sword Naegling broken in his lap, his shield already gone. Wiglaf's wooden shield catches fire at the room's lip — he keeps moving, using the burning remnant as a screen until it is nothing. He covers Beowulf. You come in on the other side. The hoard-gold on the floor reflects everything.",
  "passText": "Wiglaf's thrust goes in under the neck-scale. You drive under the wing at the same moment. The dragon folds. The barrow goes quiet. Beowulf says from the wall: 'Good.' You receive Wiglaf's Shield Remnant.",
  "failText": "The fire drives you back into the passage wall. Wiglaf shouts once. You recover and come in again. Try again.",
  "checkPassFlag": "lhrWiglafAct2Done",
  "activateCond": "() => !!S_story.lhrWiglafAct1Done",
},
{
  "id": "lhr_02_act3", "title": "Wiglaf's Moment — One Piece of Gold",
  "type": "skill_check", "activateNode": "BRW",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "Beowulf sits against the cave wall. The neck-wound is dark with venom. His breathing is shallow. He asks, very quietly, for one piece of gold from the hoard — just one, so he can see what he bought before his eyes close. The hoard is three feet away. The dragon's body lies across it. Find the right piece — small enough for one hand to hold, visible from where he sits.",
  "passText": "You bring a sea-serpent clasp. Beowulf looks at it for a long time. He says: 'Good.' Then he lifts the gold collar from his neck and holds it toward Wiglaf. 'You are the last of our kin. Fate has swept all my kinsmen away. I must follow.' You receive Beowulf's Final Clasp.",
  "failText": "The coils shift with a sound like millstones. Beowulf's eyes flutter. Try again — smaller piece, visible from his angle.",
  "checkPassFlag": "lhrWiglafAct3Done",
  "activateCond": "() => !!S_story.lhrWiglafAct2Done",
},
{
  "id": "lhr_02_act4", "title": "Wiglaf's Moment — The Barrow at Dusk",
  "type": "skill_check", "activateNode": "BRW",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "Wiglaf comes out carrying the gold collar in both arms — it is too large for him; he was not built for it yet. The ten men are at the treeline, all of them, in a loose cluster. They came back when the fighting was over, which is the kind of thing a man can come back from and which is also the wrong time. Wiglaf stands between the cave mouth and the treeline. He looks at each of them in turn. Stand still and receive this completely. Do not look away.",
  "passText": "Wiglaf says: 'Death is better for every earl than a life of shame.' Then nothing more. He sits on a flat stone with the collar in both arms. The ten are very still. You receive the Waegmunding Witness Token.",
  "failText": "Your attention breaks to the treeline. When you look back it is over. Hold the whole moment. Try again.",
  "checkPassFlag": "lhrWiglafAct4Done",
  "activateCond": "() => !!S_story.lhrWiglafAct3Done",
},
{
  "id": "lhr_02_act5", "title": "Wiglaf's Moment — The Headland",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "CHA", "checkDC": 14,
  "desc": "The barrow is being built on the headland above the sea as Beowulf asked. Sailors will see it on clear days. Before the fire is lit, Wiglaf places his iron oath-ring on the barrow-stone at Beowulf's hand. He turns to you. 'What do we say to them?' The ten are in a line before the pyre. The mourning-woman has begun — not words yet, just the shape of words. Find the sentence. Not absolution. Clarity.",
  "passText": "You find it. The ten hear it and do not argue. Wiglaf nods. You place your oath-ring on the stone beside his. Both rings go into the barrow with the king. The fire is lit. You receive Headland Barrow Token.",
  "failText": "You say too much. One of the ten argues back. Wiglaf stops him. 'Fewer words.' Try again.",
  "checkPassFlag": "lhrWiglafAct5Done",
  "activateCond": "() => !!S_story.lhrWiglafAct4Done",
},

# ── CYCLE 3 — Wealhtheow's Watch ────────────────────────────────────────────
{
  "id": "lhr_03_act1", "title": "Wealhtheow's Watch — The Mead-Cup Pass",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "The victory feast at Heorot is at its height. Wealhtheow has just given Beowulf the greatest necklace in the world. She moves through the hall with the mead-cup from man to man, gracious and watchful. As she passes you she does not look up. 'Observe who speaks with my nephew this evening. Write it down. Tell no one.' A handmaid deposits a small wax tablet with the queen's seal into your glove at the door. Receive it without being observed.",
  "passText": "The tablet disappears cleanly. The queen does not look back. The feast continues around you. You receive Wealhtheow's Feast Tablet.",
  "failText": "A Danish thane near the door glances at your hand. The commission will be conducted with more witnesses than planned. Try again.",
  "checkPassFlag": "lhrWatchAct1Done",
},
{
  "id": "lhr_03_act2", "title": "Wealhtheow's Watch — Three Conversations",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "INT", "checkDC": 12,
  "desc": "Hrothulf sits to Hrothgar's right-hand-right through the middle hour of the feast. Three men approach him in the spaces the high table cannot see: one is an unrecognized Danish thane; one is Unferth; one is a woman whose face is covered. Each speaks briefly and departs in a different direction. Record who, duration, direction. Catch the unknown thane's name — a servant addresses him at the ale-bench.",
  "passText": "The name is caught. The record has three names, three durations, three directions. The tablet is half-filled. You receive Three Conversations Record.",
  "failText": "The thane departs unnamed. The record notes: 'One man, tall, grey-sleeved. Unferth looked away when he passed.' Try again.",
  "checkPassFlag": "lhrWatchAct2Done",
  "activateCond": "() => !!S_story.lhrWatchAct1Done",
},
{
  "id": "lhr_03_act3", "title": "Wealhtheow's Watch — Before Sunrise",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "Wealhtheow finds you near the eastern door before dawn. She reads the tablet without expression, then: 'The woman. Where did she go?' You answer accurately. A Danish royal advisor approaches and tells the queen she should come inside before the morning count. His tone implies you should leave. Hold the conversation open long enough for the queen to add her own notation — she has four lines to write.",
  "passText": "The advisor waits. Wealhtheow adds four lines in her own hand and returns the closed tablet. The dual-authored record is complete. You receive the Sealed Commission Tablet.",
  "failText": "The advisor interposes. Wealhtheow closes the tablet and departs — then presses it back with one word in her hand. The record is complete, barely. Try again.",
  "checkPassFlag": "lhrWatchAct3Done",
  "activateCond": "() => !!S_story.lhrWatchAct2Done",
},
{
  "id": "lhr_03_act4", "title": "Wealhtheow's Watch — The Baltic Road",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "A Geat trader on the Baltic road intercepts you. He knows about the tablet — or guesses. He offers to carry the record to the Danish royal chancellor, who will want to know what you know. He is not threatening. The offer is genuinely meant as a favor. Understand what delivering the record to the chancellor means before answering.",
  "passText": "You decline without explanation. The trader accepts this and does not follow. The sealed tablet travels undiverted. You receive Baltic Road Crossing Token.",
  "failText": "He makes a second approach and names a price. Name the destination plainly. Try again.",
  "checkPassFlag": "lhrWatchAct4Done",
  "activateCond": "() => !!S_story.lhrWatchAct3Done",
},
{
  "id": "lhr_03_act5", "title": "Wealhtheow's Watch — The Archive",
  "type": "skill_check", "activateNode": "WM",
  "checkStat": "INT", "checkDC": 10,
  "desc": "Weimar. Sweelinck receives the observation note at the archive intake desk. He reads it without speaking. Then: 'She asked a stranger because she could not trust her household. This record precedes the histories. The histories say Hrothulf took the throne from her sons. This document says she already knew the shape of what was coming.' Propose the archive category.",
  "passText": "Sweelinck writes: Covert Political Observation Records — Reports Made by Uncredentialed Witnesses to Sovereigns, First Entry. The tablet is received. You receive Weimar Archive Receipt.",
  "failText": "The category is too broad. Narrow it to the commission type. Try again.",
  "checkPassFlag": "lhrWatchAct5Done",
  "activateCond": "() => !!S_story.lhrWatchAct4Done",
},

# ── CYCLE 4 — The Cup ────────────────────────────────────────────────────────
{
  "id": "lhr_04_act1", "title": "The Cup — The Slave's Camp",
  "type": "skill_check", "activateNode": "GEA",
  "checkStat": "WIS", "checkDC": 11,
  "desc": "The slave is gone. He left the cup in the marsh because it was too recognizable to trade without being caught. It sits in the bog-water with its two handles up, as if placed deliberately. Fifth century BC by the figures on its handles — the work of a people whose name is lost. A slave-hunter is also searching this camp, but for the man, not the cup. Find the cup before the bog swallows it further.",
  "passText": "The cup comes out whole. Three hundred years of stone-smell. The figures on the handles are still legible. You receive The Barrow Cup.",
  "failText": "One handle breaks when pulled from the bog. The cup comes out damaged. Come back before it sinks further. Try again.",
  "checkPassFlag": "lhrCupAct1Done",
},
{
  "id": "lhr_04_act2", "title": "The Cup — The Village",
  "type": "skill_check", "activateNode": "GEA",
  "checkStat": "CHA", "checkDC": 12,
  "desc": "The village. Three collapsed halls still smear the sky. The surviving elders disagree: one wants the cup destroyed as the object that triggered the burning; one wants it kept as evidence; a priest wants it for the church treasury. The cup must reach the archive as a historical document of catastrophe, not a sacred object. The church treasury is the wrong category.",
  "passText": "The elder releases the cup with a written provenance statement. It will travel to Weimar as evidence of a specific catastrophe. You receive Geatland Provenance Statement.",
  "failText": "The priest claims it. The argument continues at the harbor. Try again — name the archive directly.",
  "checkPassFlag": "lhrCupAct2Done",
  "activateCond": "() => !!S_story.lhrCupAct1Done",
},
{
  "id": "lhr_04_act3", "title": "The Cup — The Merchant",
  "type": "skill_check", "activateNode": "VS",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "Visby harbor. A Hanseatic merchant has heard about a two-handled gold cup from a southern Scandinavian barrow-hoard. He offers three times its weight in silver. The offer is genuine and generous. He is not threatening. The cup's value is not its gold weight but its status as the primary document of a specific catastrophe. Name what it is.",
  "passText": "You name the archive and the merchant loses interest immediately. He is a businessman; he has no use for primary documents. You receive Merchant Refusal Token.",
  "failText": "He follows to the next waystation with a final offer. He accepts the refusal without incident but it costs an hour. Try again.",
  "checkPassFlag": "lhrCupAct3Done",
  "activateCond": "() => !!S_story.lhrCupAct2Done",
},
{
  "id": "lhr_04_act4", "title": "The Cup — The Scholar",
  "type": "skill_check", "activateNode": "VS",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "A Nordic scholar in Visby who studies old Germanic objects wants to examine the cup before it reaches the archive. She believes it dates to the 5th century BC. She wants to publish a description. The cup must arrive undescribed — its status as primary evidence depends on it. She may study it but must hold publication until after archive intake.",
  "passText": "The scholar makes notes and agrees to hold publication pending archive confirmation. You receive Scholar's Notation Stub.",
  "failText": "She publishes a brief description to colleagues. Note this in the delivery record — Sweelinck will know. Try again.",
  "checkPassFlag": "lhrCupAct4Done",
  "activateCond": "() => !!S_story.lhrCupAct3Done",
},
{
  "id": "lhr_04_act5", "title": "The Cup — The Archive",
  "type": "skill_check", "activateNode": "WM",
  "checkStat": "INT", "checkDC": 10,
  "desc": "Weimar. Sweelinck receives the cup and its provenance packet. 'A slave stole this from a barrow. He did not know what he was taking. He needed something to trade. What was sleeping in the mound for three centuries was not the gold. It was the specific duration of a world.' The archive needs a new category for catalytic objects. Propose it.",
  "passText": "Sweelinck writes: Catalytic Objects — Items That Woke Dormant Consequences, First Entry. The Barrow Cup. The cup is received and filed. You receive Weimar Intake Seal.",
  "failText": "The category overlaps with existing sections. Narrow to the specific mechanism — the removal of containment. Try again.",
  "checkPassFlag": "lhrCupAct5Done",
  "activateCond": "() => !!S_story.lhrCupAct4Done",
},

# ── CYCLE 5 — The Herald's Walk ─────────────────────────────────────────────
{
  "id": "lhr_05_act1", "title": "The Herald's Walk — The Cave Mouth",
  "type": "skill_check", "activateNode": "BRW",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "Wiglaf cannot carry the news himself. He gives you a sealed birch-bark packet — wolf-seal pressed in cold wax, barely set. 'Take this to the Geat encampment. Tell them Beowulf is dead. Tell them to begin funeral preparations.' He pauses. 'Do not tell them the rest yet. Not until you see who is there.' The rest is the war prediction. Understand what Wiglaf is actually asking before you take the dispatch.",
  "passText": "You understand without asking: the death and the prediction are both true; the sequence of delivery matters. The dispatch is taken sealed. You receive Wiglaf's Dispatch.",
  "failText": "You ask what the rest is. Wiglaf says it once, briefly. The sequence is understood. Try again.",
  "checkPassFlag": "lhrHeraldAct1Done",
},
{
  "id": "lhr_05_act2", "title": "The Herald's Walk — The Patrol",
  "type": "skill_check", "activateNode": "GEA",
  "checkStat": "CHA", "checkDC": 12,
  "desc": "Two Geat warriors on patrol read the seal and know immediately that the king is dead. One wants to run ahead and warn the camp. Partial news from a frightened patrol spreads wrong — the seal is recognized; the camp must receive it whole, from the authorized carrier. Keep both patrols with you.",
  "passText": "Both patrols fall in behind you and escort you to camp in silence. The news arrives once, whole. You receive Patrol Escort Token.",
  "failText": "One patrol runs ahead anyway. The camp is already in partial alarm when you arrive. The sequence is compromised but not lost. Try again.",
  "checkPassFlag": "lhrHeraldAct2Done",
  "activateCond": "() => !!S_story.lhrHeraldAct1Done",
},
{
  "id": "lhr_05_act3", "title": "The Herald's Walk — The Camp",
  "type": "skill_check", "activateNode": "GEA",
  "checkStat": "CHA", "checkDC": 13,
  "desc": "The camp captain reads the seal and calls the household heads together. He wants to open the dispatch himself and manage the distribution of the news. His reasons are practical and not wrong — but the dispatch carries Wiglaf's seal and must be read aloud by the authorized carrier. The institutional authority of the seal transfers to the reading. Hold the role.",
  "passText": "The captain allows it. You read the dispatch aloud to the assembled household heads. The news is received once, from one voice, in order. You receive Camp Assembly Token.",
  "failText": "The captain opens it himself and hands it back. 'Read it anyway. They need a voice, not a seal.' The reading happens but not in the right order. Try again.",
  "checkPassFlag": "lhrHeraldAct3Done",
  "activateCond": "() => !!S_story.lhrHeraldAct2Done",
},
{
  "id": "lhr_05_act4", "title": "The Herald's Walk — The Prediction",
  "type": "skill_check", "activateNode": "GEA",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "The war prediction reads: 'Now that the lord is gone, the Swedes and Franks will harry this folk.' Three household heads refuse to believe it. One demands you be detained as a carrier of defeatist intelligence. Two women at the edge of the assembly are already packing — they believe the prediction; they do not intend to wait. Read the room accurately. Say nothing that causes the skeptics to dig in against the only people who are preparing.",
  "passText": "Your neutrality preserves the assembly's ability to choose. The women's preparations become the consensus by morning. You receive Prediction Delivered Token.",
  "failText": "A skeptic challenges you directly. The argument costs two hours. The women proceed anyway. Try again — say less.",
  "checkPassFlag": "lhrHeraldAct4Done",
  "activateCond": "() => !!S_story.lhrHeraldAct3Done",
},
{
  "id": "lhr_05_act5", "title": "The Herald's Walk — The Archive",
  "type": "skill_check", "activateNode": "WM",
  "checkStat": "INT", "checkDC": 10,
  "desc": "Weimar. Sweelinck receives the birch-bark packet. 'Wiglaf sent this knowing it would be disbelieved in part. He sent it anyway. The dispatch has two layers: the death and the prediction. The people who received the death wept. The people who received the prediction argued. Both were correct.' The archive needs a category for death dispatches that carry both a death and its consequence.",
  "passText": "Sweelinck writes: Death Dispatches — Messages That Carry Both a Death and Its Consequence, First Entry. Wiglaf's Dispatch. The archive notes that accurate bad news delivered whole is the only available form of preparation. You receive Weimar Dispatch Receipt.",
  "failText": "The category is too narrow — it must include the prediction as a form of preparation, not defeatism. Try again.",
  "checkPassFlag": "lhrHeraldAct5Done",
  "activateCond": "() => !!S_story.lhrHeraldAct4Done",
},

# ── CYCLE 6 — The Woman at the Pyre ─────────────────────────────────────────
{
  "id": "lhr_06_act1", "title": "The Woman at the Pyre — The Song Begins",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "The pyre headland above the sea. Before the fire is lit, a woman appears at the edge of the funeral crowd. No one knows her. She is not from Heorot. She is already singing — not Beowulf's name but the shape of what his death means for the people who will outlive it. Evil days, multitudes of slaughters, the terror of troops, humiliation, and captivity. She has seen other kings die. She is singing their future from their past. You have a blank vellum sheet. The song should be written down. She does not stop.",
  "passText": "You write it all. The final verse is barely legible because the fire is lit before the last line is complete. You receive Pyre Song Transcription.",
  "failText": "You get most of it. The middle verse has a gap where the words came too fast. Try again — hold the whole sequence before the pen.",
  "checkPassFlag": "lhrPyreAct1Done",
},
{
  "id": "lhr_06_act2", "title": "The Woman at the Pyre — The Danish Official",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "CHA", "checkDC": 12,
  "desc": "On the Baltic road, a Danish court official who was at the pyre demands to see what you wrote. The woman was unauthorized to sing — she named specific future humiliations in public, before a Geat household that is now a potential diplomatic problem. Convince him that the transcription is scholarly, not political.",
  "passText": "The official accepts the framing and does not request a copy. The original transcription travels undivided. You receive Scholar Frame Token.",
  "failText": "He takes a copy. You retain the original. Note this in the delivery record. Try again.",
  "checkPassFlag": "lhrPyreAct2Done",
  "activateCond": "() => !!S_story.lhrPyreAct1Done",
},
{
  "id": "lhr_06_act3", "title": "The Woman at the Pyre — The Nordic Scholar",
  "type": "skill_check", "activateNode": "VS",
  "checkStat": "WIS", "checkDC": 11,
  "desc": "A Norse scholar in Visby who collects records of women who sing at royal burials wants the transcription. She argues it belongs in her collection, not in a European archive that will file it as Germanic literature. Her argument has weight. Propose that her collection and the archive can reference each other rather than compete.",
  "passText": "The scholar provides her own descriptive note to travel alongside the transcription as companion material. Both will be filed together. You receive Scholar's Companion Note.",
  "failText": "She files a competing claim. The transcription arrives with the claim attached and Sweelinck files both. Try again.",
  "checkPassFlag": "lhrPyreAct3Done",
  "activateCond": "() => !!S_story.lhrPyreAct2Done",
},
{
  "id": "lhr_06_act4", "title": "The Woman at the Pyre — The Identification",
  "type": "skill_check", "activateNode": "VS",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "A Geat survivor in Visby has heard about the transcription. She says the mourning-woman was not unknown — she was the widow of one of the ten who ran from the dragon. This changes the document's character. Deliver both as a packet: the transcription remains what it is; the identification arrives as a separate supplement without becoming the transcription's editorial apparatus.",
  "passText": "The survivor writes the identification on a separate sheet. Both travel to Weimar as distinct documents. You receive Geat Survivor's Note.",
  "failText": "You incorporate the identification into the transcription's margin. Sweelinck will parse the boundary himself. Try again.",
  "checkPassFlag": "lhrPyreAct4Done",
  "activateCond": "() => !!S_story.lhrPyreAct3Done",
},
{
  "id": "lhr_06_act5", "title": "The Woman at the Pyre — The Archive",
  "type": "skill_check", "activateNode": "WM",
  "checkStat": "INT", "checkDC": 10,
  "desc": "Weimar. Sweelinck receives the transcription and its supplement. 'She did not grieve Beowulf. She grieved what would happen to the people who outlived him. She had seen it before. The poem gives her one sentence and no name.' Propose the archive category — the elegy for the future is a different document from the elegy for a person.",
  "passText": "Sweelinck writes: Anonymous Elegy Records — Mourning-Women's Songs, First Entry. The Pyre-Woman's Lament. She gets a category. You receive Weimar Elegy Receipt.",
  "failText": "The category overlaps with pyre-records. The object of her grief was not the fire but what the fire meant. Narrow it. Try again.",
  "checkPassFlag": "lhrPyreAct5Done",
  "activateCond": "() => !!S_story.lhrPyreAct4Done",
},

# ── CYCLE 7 — Unferth's Hrunting ─────────────────────────────────────────────
{
  "id": "lhr_07_act1", "title": "Unferth's Hrunting — The Request",
  "type": "skill_check", "activateNode": "HEO",
  "checkStat": "INT", "checkDC": 12,
  "desc": "Heorot's outer hall, after the victory feast has quieted. Unferth finds you alone. He gave Hrunting to Beowulf before the dive — both know the sword failed underwater. Beowulf returned it with careful words of praise: 'The sword was not at fault; the fault lay elsewhere.' The obligation this creates needs formal resolution. Reconstruct both speeches accurately from memory — Unferth's gift-speech and Beowulf's return-speech — so the exchange can be recorded and the sword's bond formally closed.",
  "passText": "Both speeches are written accurately. Unferth makes one correction — a single word — and signs the corrected version. You receive Hrunting Bond Record.",
  "failText": "Unferth corrects several words. The record is rewritten. Both sign the corrected version. Try again.",
  "checkPassFlag": "lhrHruntingAct1Done",
},
{
  "id": "lhr_07_act2", "title": "Unferth's Hrunting — The Danish Port",
  "type": "skill_check", "activateNode": "DAN",
  "checkStat": "CHA", "checkDC": 12,
  "desc": "At the coastal checkpoint on the road to Lejre, a Danish court recorder wants to log Hrunting's transfer in the official royal weapons registry. The sword has royal-gift provenance — any transfer technically requires court notification. The sword is not being transferred. It is being documented for personal release from a gift-obligation. The transaction is religious and private in character.",
  "passText": "The court recorder accepts the framing and does not log the sword. The bond record travels unregistered. You receive Checkpoint Clearance Token.",
  "failText": "The recorder logs it as 'under personal use — shrine destination noted.' The entry exists and will be followed up. Try again.",
  "checkPassFlag": "lhrHruntingAct2Done",
  "activateCond": "() => !!S_story.lhrHruntingAct1Done",
},
{
  "id": "lhr_07_act3", "title": "Unferth's Hrunting — The Shrine",
  "type": "skill_check", "activateNode": "DAN",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "The shrine at Lejre harbor. The shrine-keeper reads the bond record and agrees the obligation was correctly discharged by Beowulf's return-speech. But shrines that document released obligations are the only institutions equipped to hold this evidence — he wants to keep the original. The original must reach the archive; the shrine can have a copy.",
  "passText": "The shrine-keeper makes a copy. The original continues to Weimar. You receive Shrine Copy Acknowledgment.",
  "failText": "He keeps the original. A copy is made for the archive. Note this in the transmission record. Try again.",
  "checkPassFlag": "lhrHruntingAct3Done",
  "activateCond": "() => !!S_story.lhrHruntingAct2Done",
},
{
  "id": "lhr_07_act4", "title": "Unferth's Hrunting — The Afterword",
  "type": "skill_check", "activateNode": "DAN",
  "checkStat": "CHA", "checkDC": 11,
  "desc": "Before the ship leaves, a Geat warrior arrives with news: Unferth has been killed in the Swedish raid that followed Beowulf's death. He died carrying Hrunting — he had taken it back from the shrine to fight. The bond record now reads differently. The new information should travel as a supplement, not be incorporated into the record itself. The release document must remain what it was.",
  "passText": "The supplement is written on a separate sheet and attached to the original. Both reach Weimar as distinct documents. You receive Hrunting Afterword Supplement.",
  "failText": "You incorporate the afterword into the record's margin. Sweelinck receives it as one document. Try again — keep them separate.",
  "checkPassFlag": "lhrHruntingAct4Done",
  "activateCond": "() => !!S_story.lhrHruntingAct3Done",
},
{
  "id": "lhr_07_act5", "title": "Unferth's Hrunting — The Archive",
  "type": "skill_check", "activateNode": "WM",
  "checkStat": "INT", "checkDC": 10,
  "desc": "Weimar. Sweelinck receives the bond record and its supplement. 'Unferth gave a sword that failed. The man who received it spoke well of the sword on return. Unferth took it back from the shrine when the war came and died with it. The archive receives all of this.' The category: gift-obligation released through correct speech, and then voluntarily re-entered at the end.",
  "passText": "Sweelinck writes: Gift-Obligation Release Records — Formal Termination of Social Bonds Through Correct Speech, First Entry. Hrunting's Release and Return. Releasing an obligation does not prevent re-entry. Both acts are in the record. You receive Weimar Bond Archive Seal.",
  "failText": "The category does not account for the re-entry. Both the release and the reversal must be in the category description. Try again.",
  "checkPassFlag": "lhrHruntingAct5Done",
  "questComplete": True,
  "activateCond": "() => !!S_story.lhrHruntingAct4Done",
},

]

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"LHR import — {len(QUESTS)} quest acts across 7 cycles")
    print("Waiting for server...")
    if not wait_server():
        print("Server not responding."); sys.exit(1)
    print(f"Server up.")

    ok = 0; fail = 0
    for q in QUESTS:
        if create_quest(q):
            ok += 1
        else:
            fail += 1

    print(f"\n{'='*50}")
    print(f"Done: {ok} created, {fail} failed")
    print("Saving...")
    r = api("POST", "/api/save")
    print("Save:", r.get("ok"), r.get("path",""))
