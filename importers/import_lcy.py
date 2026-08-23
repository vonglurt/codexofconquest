#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import LCY — The White Company (Doyle) — 7 cycles, 35 acts."""

import json, subprocess, time, sys

BASE = "http://localhost:1367"

def api(method, path, body=None, headers=None):
    cmd = ["curl", "-s", "-X", method, f"{BASE}{path}",
           "-H", "Content-Type: application/json"]
    if headers:
        for k, v in headers.items():
            cmd += ["-H", f"{k}: {v}"]
    if body:
        cmd += ["-d", json.dumps(body)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except Exception:
        return None

def wait_server():
    print("Waiting for server...")
    for _ in range(20):
        r = api("GET", "/api/ping")
        if r and r.get("ok"):
            print("Server up.")
            return True
        time.sleep(2)
    print("Server not responding.", file=sys.stderr)
    return False

def get_nonce(quest_id):
    r = api("POST", "/api/nonce", {"type": "quest", "id": quest_id})
    return r["nonce"] if r and "nonce" in r else None

def create_quest(q):
    nonce = get_nonce(q["id"])
    if not nonce:
        print(f"  ✗ {q['id']}: nonce failed")
        return False
    r = api("POST", "/api/quest", q, {"X-Nonce": nonce})
    if r and r.get("ok"):
        print(f"  ✓ {q['id']}: created")
        return True
    err = r.get("error", "unknown") if r else "no response"
    incomplete = r.get("incomplete", []) if r else []
    if incomplete:
        fields = [x["field"] for x in incomplete]
        print(f"  ✗ {q['id']}: missing {fields}")
    else:
        print(f"  ✗ {q['id']}: {err}")
    return False

print("LCY import — The White Company — 35 quest acts across 7 cycles")
if not wait_server():
    sys.exit(1)

quests = [

# ── CYCLE 1: The Fortune-Knot ─────────────────────────────────────────────────

{
  "id": "lcy_01_act1",
  "title": "The Fortune-Knot — The Challenge at the Gate",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "desc": "The White Company stands in the dust below a French castle on a rock. Sir Nigel — small, precise, his sword hand already moving — has just accepted a formal challenge from the garrison officer on the parapet. He walks up the road alone. You are his assigned rear-guard. Aylward's voice, low behind you: 'If he doesn't come back, you know what that means.' Lady Mary's pale blue silk scarf is knotted on the hilt. Three knots. Three deeds not yet won.",
  "passText": "You call the warning three seconds early. Sir Nigel sidesteps the crossbow bolt without breaking stride. He keeps walking, does not look back, but Aylward nods once — his version of approval. You receive Aylward's Marked Arrow.",
  "failText": "The bolt misses by half a foot — Sir Nigel sidesteps without breaking stride, as if he heard it before you spoke. He does not look back. You have been too slow, and the Company watches.",
  "checkPassFlag": "lcyFortuneAct1Done",
},
{
  "id": "lcy_01_act2",
  "title": "The Fortune-Knot — The Breach at Villefranche",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyFortuneAct1Done",
  "desc": "Inside the castle wall — rubble underfoot, torchlight from the gallery above, the Company forcing through a narrow breach behind Sir Nigel who has not stopped talking since he entered. A crossbow gallery on the upper tier overlooks the entire breach corridor. The archer has already fired once and missed. He is loading again. Sir Nigel is ten feet ahead, still advancing.",
  "passText": "You reach the stair, close the distance, end the threat before the reload is finished. The breach clears. Sir Nigel reaches the inner gate without a second wound. He makes a small iron-gloved gesture — his version of complete approval. You receive Sir Nigel's Gauntlet-Nod.",
  "failText": "The bolt finds a gap — a glancing strike on the pauldron, not mortal, but Sir Nigel staggers. The Company's advance halts for a moment. The breach costs more men than it should.",
  "checkPassFlag": "lcyFortuneAct2Done",
},
{
  "id": "lcy_01_act3",
  "title": "The Fortune-Knot — The Keep After",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyFortuneAct2Done",
  "desc": "A stone room in the castle keep. Rush-light. Sir Nigel sits on a bench with his left arm held carefully still — a lance found the gap at his shoulder. The surgeon says not mortal. Alleyne stands nearby, silent. Sir Nigel unties the scarf from his sword hilt one-handed, with the careful precision he gives to everything. He holds it out. The three knots are still intact.",
  "passText": "You hold your hands open and still. He places the scarf across your palms. You fold it once and put it inside your coat without a word. Sir Nigel looks at his surgeon. That is all. You receive Lady Mary's Scarf.",
  "failText": "Your hands move toward it too quickly. Sir Nigel sees it. He ties the scarf back on the hilt himself, one-handed. 'I will find another arrangement.' He does not look at you again that night.",
  "checkPassFlag": "lcyFortuneAct3Done",
},
{
  "id": "lcy_01_act4",
  "title": "The Fortune-Knot — The Navarrese Pass",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 14,
  "activateCond": "() => !!S_story.lcyFortuneAct3Done",
  "desc": "A mountain pass in Navarre, three days from Najera. A Castilian agent on a grey horse has intercepted the column at a narrows. His eyes have been on you since he arrived. You carry something he has been told to find. The Company stands in column behind you. Sir Nigel is sixty yards back, out of earshot. The agent's hand is not on his sword yet. Neither is yours. The scarf is inside your coat.",
  "passText": "You produce the Black Prince's warrant copy without hesitation, as if that was always the answer. He reads it twice. He waves you through. You receive Black Prince's Warrant Copy.",
  "failText": "He is not convinced. He orders a physical search of the column. You manage to pass the scarf to Aylward before the search reaches you — Aylward hides it among the shafts — but the delay costs half a day. Sir Nigel says nothing. His silence is the cost.",
  "checkPassFlag": "lcyFortuneAct4Done",
},
{
  "id": "lcy_01_act5",
  "title": "The Fortune-Knot — The Battle of Najera",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyFortuneAct4Done",
  "desc": "The field at Najera in the grey before dawn. Two armies' torches on the far side. The Company is formed and still. Sir Nigel comes to you in the last quiet minutes, holds out his hand for the scarf. His shoulder is healed — you can tell by how he holds the arm. Two deeds remain. He expects to have them by noon. You can hear the enemy's horse on the far ground.",
  "passText": "You take it from inside your coat and place it in his hand, knots up, without a word. He ties it to his lance — the same three knots — and rides without looking back. At noon the charge is done, the field is won, and Sir Nigel has his two remaining deeds. You receive Najera Field Token.",
  "failText": "Your hand tightens for a moment. He waits. It is a long second. You release it. He ties it to his lance without comment, but Aylward, behind you, makes a sound that is not quite a laugh. You will feel this when the battle is over.",
  "checkPassFlag": "lcyFortuneAct5Done",
},

# ── CYCLE 2: Maude's Glove ────────────────────────────────────────────────────

{
  "id": "lcy_02_act1",
  "title": "Maude's Glove — The Eve of Najera",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyFortuneAct5Done",
  "desc": "The Company's camp at the field edge, the night before Najera. Fires low, archers fletching. Alleyne comes to your fire after the camp goes quiet. He opens his coat enough to show the edge of a cuff — leather, worked, a woman's glove. He closes it again. Outside the camp the Spanish plain goes on in the dark. Tomorrow the volleys begin at dawn. He has not said her name once in six months.",
  "passText": "You hold still and receive it without questions. He opens his coat, shows the full glove, closes it again. 'Tomorrow if something happens.' He walks back to his fire. You receive Alleyne's Watch-Word — the understanding that you now carry what he cannot risk losing.",
  "failText": "You ask questions. He closes his coat and says nothing. He comes back an hour later, after you have sat with the silence, and tries again. You must receive it correctly before the dawn.",
  "checkPassFlag": "lcyGloveAct1Done",
},
{
  "id": "lcy_02_act2",
  "title": "Maude's Glove — The Battle",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyGloveAct1Done",
  "desc": "Dawn. Three volleys. The field is what fields become. You are holding the Company's left flank when the French cavalry remnant breaks through and suddenly the second rank is the first rank and Alleyne is in the middle of a collision he was not positioned for. His side is open. The coat is opening at the wound. His first thought is not the wound — it is the glove.",
  "passText": "You see it before the coat opens. You move in front of him. He presses the glove into your fist: 'Don't let it burn.' The surgeons take him. You receive Maude's Glove — right hand, good leather, worked at the cuff, six months of Spain in the creases.",
  "failText": "You see it a second late. The coat is already open. The glove is visible. Two soldiers are staring. You get between them and Alleyne in time, but the moment costs you both.",
  "checkPassFlag": "lcyGloveAct2Done",
},
{
  "id": "lcy_02_act3",
  "title": "Maude's Glove — The Field's Edge",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyGloveAct2Done",
  "desc": "The battle is over. The Company is accounting for itself — numbers called, names answered. Some of the French baggage is burning at the far end. You move through the policing lines with the glove in a closed fist. A Company sergeant stops you at the medical line, checking everyone through. He notes the closed fist. His pen is on his ledger. He is doing his job.",
  "passText": "You give him the right answer in the right register. He looks at your hand, writes one word, waves you through. You receive Sergeant's Log Mark — a smudged inventory receipt that proves nothing, which is the point.",
  "failText": "He wants to see your hand. He logs the glove as 'personal effects — pending.' You spend two hours recovering it from the effects tent. The glove is intact. The hours are not.",
  "checkPassFlag": "lcyGloveAct3Done",
},
{
  "id": "lcy_02_act4",
  "title": "Maude's Glove — The Surgeon's Tent",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyGloveAct3Done",
  "desc": "The tent smells of vinegar and blood. Alleyne sits on a camp chest, pale, bound, drinking water. He opens his coat before you speak. Outside: numbers called, names answered. Sir Nigel has his three deeds. The scarf is on the lance. In here it is very quiet and Alleyne is holding his coat open.",
  "passText": "You place it inside without ceremony. He closes the coat. He says: 'Did you look at it?' You answer. He nods. 'She said: I have no sword. That's all.' Outside the accounting continues. You receive Alleyne's Coat-Clasp — the buckle from his coat, given without comment.",
  "failText": "You place it with too much care. He looks at you. 'It is a glove,' he says, quietly. He takes it himself and puts it away. You have shown him more than he wanted visible.",
  "checkPassFlag": "lcyGloveAct4Done",
},
{
  "id": "lcy_02_act5",
  "title": "Maude's Glove — Tilford Gate",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyGloveAct4Done",
  "desc": "Hampshire. Tilford Hall. The same gate the Company left through six months ago. October. Maude Loring is at the gate with a ledger under her arm — she transferred it to her left hand when she heard the horses. Alleyne has dismounted. He is opening his coat. She is watching his hands.",
  "passText": "You stand still. He gives her the glove — whole, cuff intact. She puts it on. Right hand. 'You kept it whole.' 'I had help.' The gate closes. You receive Tilbury Road Token — the road back to your own gate.",
  "failText": "You move forward, instinctively, to be useful. She glances at you. Alleyne pauses. The moment requires fewer people in it. Step back and let the reunion complete.",
  "checkPassFlag": "lcyGloveAct5Done",
},

# ── CYCLE 3: Aylward's Vow Arrow ──────────────────────────────────────────────

{
  "id": "lcy_03_act1",
  "title": "Aylward's Vow Arrow — The Wagons, Gascony",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyGloveAct5Done",
  "desc": "The Company's baggage line, a night halt in Gascony. Aylward is going through his quivers with the methodical calm of a man who has done this five thousand times. He pulls one arrow out separately, holds it to the light. Twenty years old. Three parallel lines at the nock, cut with a knife at some camp twenty years ago. 'There'll be a shot, before this campaign is done, that the other shafts can't make. You'll keep this. Inside your coat.'",
  "passText": "You receive the arrow nock-end first, without questions or ceremony. You put it inside your coat where the leather is. You receive Aylward's Vow Arrow — twenty years of French summers in the grain of the wood.",
  "failText": "You ask what the three lines mean. Aylward studies you. 'Inside your coat,' he says again. 'When you're ready to hold it right.' He waits until you stop asking.",
  "checkPassFlag": "lcyArrowAct1Done",
},
{
  "id": "lcy_03_act2",
  "title": "Aylward's Vow Arrow — The Night Before",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyArrowAct1Done",
  "desc": "The camp outside Najera, the night before the battle. Thomas Wyken, a rival archer, has been cataloguing Aylward's quiver since Gascony. He finds you at the supply line after dark and offers good coin — he only wants to borrow the shaft for the morning's first volleys. He is watching not your face but your coat's left breast, where a shaft would ride. The arrow is inside your coat.",
  "passText": "Your hands do not confirm the shaft's location. You give Wyken nothing to read. He leaves empty-handed. You receive Wyken's Coin — the bribe refused, kept as evidence of the attempt.",
  "failText": "Your hands betray the location. Wyken does not take it — you are too alert — but he knows where it is and will try again before dawn. You must watch through the night.",
  "checkPassFlag": "lcyArrowAct2Done",
},
{
  "id": "lcy_03_act3",
  "title": "Aylward's Vow Arrow — The Dawn Line",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyArrowAct2Done",
  "desc": "The Company's archer line, Najera — first light, formation. Aylward is in the third rank, the best angle for the long shot he has been calculating since yesterday. He checks his quivers. He looks at you. He does not ask. He stands and waits. Two positions to your left, Thomas Wyken is watching. He made his bet with three other archers at midnight.",
  "passText": "You move to position before the formation closes and hand Aylward the arrow nock-first. He takes it without looking at Wyken. You take his flank. 'Twenty years I've kept this. Because the shot has to be worth it.' You receive Formation Position — Aylward's left-flank mark.",
  "failText": "The formation closes before you reach position. Aylward must adjust his angle. The long shot is harder. Wyken makes a sound. You have cost Aylward the margin he was owed.",
  "checkPassFlag": "lcyArrowAct3Done",
},
{
  "id": "lcy_03_act4",
  "title": "Aylward's Vow Arrow — The Shot",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyArrowAct3Done",
  "desc": "Three volleys. The first two are mass fire. The third is individual marks. Aylward draws on the third volley — a mounted officer two hundred yards out, half-hidden behind the break in the cavalry line. He holds. The cavalry is forty yards closer. He releases. The officer falls. He turns to you and gives one nod — the full version, not the partial one. The shaft is gone. He holds the empty draw-hand open for a moment.",
  "passText": "You receive the nod completely — not too much acknowledgment, not too little. Aylward recovers the broken nock-piece from the field before the accounting is finished and gives it to you at the harbor in Bordeaux. 'Take it wherever you take things.' You receive Vow Arrow Nock-Piece.",
  "failText": "You show too much reaction and Aylward sees it. He recovers the nock-piece alone and holds it himself through the accounting. He gives it to you eventually, but the moment has already passed without you in it.",
  "checkPassFlag": "lcyArrowAct4Done",
},
{
  "id": "lcy_03_act5",
  "title": "Aylward's Vow Arrow — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyArrowAct4Done",
  "desc": "Weimar. Sweelinck at the intake desk. You carry the three-lined nock-piece from the Bordeaux harbor through two gate inspections, a Venetian factor's curiosity about the three marks, and a river crossing. Sweelinck holds it to the light and asks what the three lines mean. You tell him what Aylward told you — which is nothing, because Aylward never explained them.",
  "passText": "You tell him what is true: twenty years in reserve, one shot, gone. Sweelinck writes: 'Maintained Equipment Records — The Object Reserved for the Moment That Required It. First entry.' The nock-piece is filed. You receive Archive Receipt — Maintained Equipment.",
  "failText": "You invent an explanation for the three lines. Sweelinck studies you. 'The not-knowing is the document,' he says. 'Try again with what is accurate.' You must give him the true answer.",
  "checkPassFlag": "lcyArrowAct5Done",
},

# ── CYCLE 4: John's First ─────────────────────────────────────────────────────

{
  "id": "lcy_04_act1",
  "title": "John's First — Beaulieu Road",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyArrowAct5Done",
  "desc": "The road outside Beaulieu Abbey, morning. John of Hordle — enormous, cheerful, recently expelled for brawling over a cheese — reaches into his belt-pack and produces a folded sheet in the monastery's careful hand: 'John of Hordle, expelled for brawling in the cellar — cause: dispute over a wheel of cheese.' He reads it. He laughs. 'I kept it because it says CHEESE. You hold it. I'll want it later.'",
  "passText": "You take the note without commentary on the cheese. John nods with the specific approval of a man who has been correctly understood. You receive Beaulieu Expulsion Note — cause: dispute over a wheel of cheese. The cellarer signed it. The abbot witnessed. The word CHEESE appears twice.",
  "failText": "You make a remark about the cheese. John looks at you. 'I know,' he says, 'but I don't need you to know it too.' He puts the note back. You must approach it differently.",
  "checkPassFlag": "lcyJohnAct1Done",
},
{
  "id": "lcy_04_act2",
  "title": "John's First — The Breach at Villefranche",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyJohnAct1Done",
  "desc": "The castle breach at Villefranche — rubble, fire, first combat. John has been in fights before, in the monastery and on the road. He has never been in a battle. He understands the distinction clearly now that there is a French man-at-arms in front of him and iron in both their hands. He stops. It is not fear — the word is wrong. He simply cannot, for a moment, make his body begin. The French man-at-arms is not waiting.",
  "passText": "You hold the left side of the breach alone for the duration of that moment. The man-at-arms is dealt with. John recovers, finishes what he started, and is — as expected — efficient. You receive Breach Gap Token — the position held while someone found themselves.",
  "failText": "You cannot hold the breach alone long enough. The Company's advance costs more men than it should. John recovers anyway, but the moment is already expensive.",
  "checkPassFlag": "lcyJohnAct2Done",
},
{
  "id": "lcy_04_act3",
  "title": "John's First — After the Battle",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyJohnAct2Done",
  "desc": "The castle courtyard, the Company accounting for itself. John is sitting on a section of wall with his back to everyone, which is not something John does. Aylward sits beside him and says nothing for a long time. 'Every man wept after his first. Every one of them. The ones who didn't — you wouldn't want them in your Company.' John asks: 'Does it stop?' Aylward: 'Mostly. Enough.'",
  "passText": "You stay at the correct distance. Not inside the conversation; not so far that you miss it. Aylward finishes what he is doing and looks at you with the nod that means he registered your presence correctly. You receive Aylward's Witness Mark — the acknowledgment that you understood the distance.",
  "failText": "You step inside the conversation. Aylward's voice stops. John looks at the ground. You have made yourself visible at the wrong moment. Step back and wait for what comes after.",
  "checkPassFlag": "lcyJohnAct3Done",
},
{
  "id": "lcy_04_act4",
  "title": "John's First — The Pyrenees",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyJohnAct3Done",
  "desc": "The Navarrese road, mountain, three days from Najera. John has been in four more battles since Villefranche and is the best fighter in the Company at close range. He asks for the Beaulieu note, reads it, says: 'A man who wept over a cheese probably weeps over some things and not others. Depends on whether it matters.' He hands it back. Aylward asks you, separately, to tell him honestly whether John is sound.",
  "passText": "You give Aylward the honest answer without embellishment: John is sound. Not undamaged — sound. Aylward absorbs this. He gives the specific nod that means he will act on it. You receive Aylward's Assessment — the understanding that honesty was the required answer.",
  "failText": "You frame it too carefully, or too charitably. Aylward studies you. 'That is not what I asked,' he says. 'I asked whether he is sound.' Give him the true answer.",
  "checkPassFlag": "lcyJohnAct4Done",
},
{
  "id": "lcy_04_act5",
  "title": "John's First — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyJohnAct4Done",
  "desc": "Weimar. Sweelinck at the intake desk. John went home to Hampshire with a plan involving a mill and a woman he has not told anyone about. He asked you, at the Bordeaux harbor, to deliver the note. 'Put it somewhere it doesn't get thrown away. The cheese is part of it, I think. The whole thing.' A customs man in Lyon wanted to confiscate it as a foreign ecclesiastical document. You explained it was a personal record. He read the word CHEESE. He waved you through.",
  "passText": "Sweelinck reads the note twice. 'Beaulieu Expulsion Note. Cause: dispute over a cheese. Retained by the subject for the length of a Castilian campaign.' He writes: 'First Action Records — The Cost of the First Time, Accounted. First entry. He kept the cheese note so the whole thing would be true. Not just the battles.' You receive Archive Receipt — First Action.",
  "failText": "Sweelinck reads the note and looks at you. 'What is the cheese doing here?' You explain that John kept it through the entire campaign. 'Why?' You need the complete answer before he files it.",
  "checkPassFlag": "lcyJohnAct5Done",
},

# ── CYCLE 5: The French Prisoner's Account ────────────────────────────────────

{
  "id": "lcy_05_act1",
  "title": "The French Prisoner's Account — The Prisoner's Tent",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyJohnAct5Done",
  "desc": "A campaign tent, Gascony. Renaud du Plessis, a French minor noble, thirty-five, captured at a river crossing and treated with courtesy. Sir Nigel has given you one hour and the tent. Du Plessis studies you: 'You will not force me. So you will give me a reason. This is the English method.' He waits. The Company needs the route through the Navarrese passes. He is afraid and loyal to his own lord.",
  "passText": "You give him a reason that is honest and does not require him to betray his lord as a person — only to prevent unnecessary deaths at a pass that will be taken in any case. He recognizes the difference. He produces a folded sheet and begins writing. You receive Du Plessis Route Account — route on one side, the reason he gave it on the other.",
  "failText": "The reason you give him is tactical, not honest. He knows the difference. 'I am not unintelligent,' he says. 'Try again. Or we sit here for the rest of your hour.' Find the honest reason.",
  "checkPassFlag": "lcyPrisonerAct1Done",
},
{
  "id": "lcy_05_act2",
  "title": "The French Prisoner's Account — The Mountain Road",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyPrisonerAct1Done",
  "desc": "The Navarrese pass, the specific route du Plessis named. The first garrison is at the top of the second switchback — thirty men, a gate. Du Plessis was right. At the second waypoint, a Castilian rider comes down from the north claiming the pass is clear, no garrison at the exit. He is very insistent. You carry the folded account. The route is working so far. One of them is wrong.",
  "passText": "You determine that du Plessis's account is accurate and the Castilian rider is not. The route continues. You receive Waypoint Confirmation — the margin of trust in the voluntary account over the insistent denial.",
  "failText": "You give the Castilian rider too much credence. The column adjusts and finds the garrison exactly where du Plessis said it would be. The adjustment costs time and trust.",
  "checkPassFlag": "lcyPrisonerAct2Done",
},
{
  "id": "lcy_05_act3",
  "title": "The French Prisoner's Account — The Pass Exit",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyPrisonerAct2Done",
  "desc": "The final waypoint — the pass exit, exactly where du Plessis's account said. Twenty men, a wall, a gate that opens inward. Du Plessis's account notes a detail: the gate is hung incorrectly and lists to the left when the bar is lifted. It opens if you push left first. You are in the Company's advance unit. The garrison is at the wall.",
  "passText": "You approach the gate in the advance unit and handle it — push left first — before the garrison can seal it. The specific detail is the margin. The pass opens. You receive Gate Detail Token — the particular knowledge that made the difference.",
  "failText": "You approach the gate without using the detail. The garrison seals it. The pass costs the Company more than it needed to. Du Plessis's account had the answer; you did not use it.",
  "checkPassFlag": "lcyPrisonerAct3Done",
},
{
  "id": "lcy_05_act4",
  "title": "The French Prisoner's Account — The Field, After",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyPrisonerAct3Done",
  "desc": "After Najera — the campaign resolved. Du Plessis was exchanged at the harbor, as agreed. The night before his release, unsolicited, he wrote a second side to the route sheet: the reason he gave it, signed and dated, in his own hand. 'The reason you gave me was honest. I want the record to hold that it was voluntary.' He gives you the two-sided sheet when he leaves. One of his countrymen in the exchange party does not know he gave you anything.",
  "passText": "You reach the ship before the exchange party departs. The sheet — route and reason, both sides — is in your hands before anyone can observe the transfer. You receive Du Plessis Full Account — the complete document, route and reason, both in his hand.",
  "failText": "You are too slow and the exchange party is boarding when you arrive. Du Plessis manages to pass the sheet through a third party, but the countrymen notice. The document reaches you intact but the transfer is observed.",
  "checkPassFlag": "lcyPrisonerAct4Done",
},
{
  "id": "lcy_05_act5",
  "title": "The French Prisoner's Account — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyPrisonerAct4Done",
  "desc": "Weimar. Sweelinck receives the two-sided sheet. He reads the route side. He turns it over and reads the reason side. The Venetian factor's intelligence inquiry on the road asked what intelligence document you were carrying. You explained it was a personal record of a voluntary disclosure. The factor read the reason side. He waved you through.",
  "passText": "Sweelinck reads both sides. 'He wrote both sides himself. The route and the reason, unprompted, before surrender.' He writes: 'Voluntary Intelligence Records — Disclosure Made Without Compulsion and the Reason It Was Given. First entry.' He files it. 'The interesting document is the back.' You receive Archive Receipt — Voluntary Intelligence.",
  "failText": "Sweelinck reads the route side and asks about the back. You have not explained the sequence correctly. He needs to understand that both sides were written voluntarily before he can file it in the right category.",
  "checkPassFlag": "lcyPrisonerAct5Done",
},

# ── CYCLE 6: Du Guesclin's Parole Gauntlet ────────────────────────────────────

{
  "id": "lcy_06_act1",
  "title": "Du Guesclin's Parole Gauntlet — The Surrender",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyPrisonerAct5Done",
  "desc": "The Najera field, after the battle. Du Guesclin — large, calm, entirely un-humiliated by having been captured — removes his right iron gauntlet and places it at Sir Nigel's feet. 'My parole to you, Sir Nigel. I am your prisoner until ransom is settled.' Sir Nigel: 'And I give you my word for your safety until then.' He turns to you: 'Keep the gauntlet. Guard the tent. I will be back before dawn.'",
  "passText": "You receive the gauntlet correctly — not as a trophy, as a word given and held. The weight of it settles in your hands as a responsibility rather than a possession. You receive Du Guesclin's Parole Gauntlet — right iron gauntlet, Spanish campaign dust in the knuckle-joins, armorer's mark inside the cuff.",
  "failText": "You hold the gauntlet with too much ceremony or too little. Sir Nigel sees it and says nothing, but du Guesclin does: 'It is a pledge, not a prize.' Receive it again.",
  "checkPassFlag": "lcyGuesclinAct1Done",
},
{
  "id": "lcy_06_act2",
  "title": "Du Guesclin's Parole Gauntlet — Midnight",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "STR", "checkDC": 14,
  "activateCond": "() => !!S_story.lcyGuesclinAct1Done",
  "desc": "Outside the prisoner's tent — the camp has gone dark, third watch. Six men from the Company's outer wing move toward the tent in the dark. They are not drunk. They are deliberate. They know Sir Nigel is not here and they have decided that du Guesclin's ransom is a cost England should not pay. They are wrong about the math and wrong about the honor. Sir Nigel gave his word. A soldier at the front: 'Step aside. This is Company business.'",
  "passText": "You hold the doorframe through the first rush. Six men, determined, but they did not come expecting a fight from their own side. They regroup, recalculate, and leave. The tent door held. You receive Tent Door Held — the position that kept the word intact.",
  "failText": "One of them gets past you. Du Guesclin is not harmed — he is prepared — but the parole is tested. The six men leave, but the test has been recorded in their accounting of what is possible.",
  "checkPassFlag": "lcyGuesclinAct2Done",
},
{
  "id": "lcy_06_act3",
  "title": "Du Guesclin's Parole Gauntlet — Before Dawn",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyGuesclinAct2Done",
  "desc": "Inside the tent — du Guesclin, the Fighter, the gray hour before light. The six men are not coming back tonight. Du Guesclin is awake. He has been awake since the midnight noise. 'You held the door.' It is not a question. 'My ransom will be paid. I have given my parole and I keep it. Sir Nigel gave his word and his man kept it. That is worth more than the ransom.' He is assessing what kind of army the Black Prince commands.",
  "passText": "You answer his implied question correctly: the word was kept because it was given, not because the arithmetic supported it. Du Guesclin nods. He has the assessment he needed. You receive Du Guesclin's Assessment — the calculation of what kind of army maintains its word.",
  "failText": "You frame the answer in terms of duty or orders. Du Guesclin studies you. 'I asked about the word, not the chain of command,' he says. Answer again with the honest reason.",
  "checkPassFlag": "lcyGuesclinAct3Done",
},
{
  "id": "lcy_06_act4",
  "title": "Du Guesclin's Parole Gauntlet — The Ransom",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "CHA", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyGuesclinAct3Done",
  "desc": "The Black Prince's court, near Bordeaux. The ransom accounting is underway. Du Guesclin's parole gauntlet must be present as proof that the surrender was accepted under correct terms. The six soldiers from the midnight attempt are also in the accounting party, trying to register a competing claim on du Guesclin's person as a battlefield capture — which would override Sir Nigel's parole and put the prisoner's fate in a different court.",
  "passText": "You present the gauntlet at the correct moment in the accounting, before the competing claim is formally entered. The parole's precedence is established. The six soldiers' claim is secondary. You receive Ransom Precedence — the accounting outcome that confirmed the word.",
  "failText": "You present the gauntlet a moment too late. The competing claim is already entered. The accounting must be unwound, which takes time and costs Sir Nigel's court position.",
  "checkPassFlag": "lcyGuesclinAct4Done",
},
{
  "id": "lcy_06_act5",
  "title": "Du Guesclin's Parole Gauntlet — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyGuesclinAct4Done",
  "desc": "Weimar. Sir Nigel returned to England with the ransom settled and du Guesclin released. He gave you the gauntlet at Portsmouth: 'He kept his parole. I kept my word. That is the whole record. Take it somewhere it will be filed correctly.' A London records clerk wanted to classify it as war-spoil. You explained it was a parole pledge. He asked for proof. You showed him the armorer's mark inside the cuff.",
  "passText": "Sweelinck reads the armorer's mark. 'Du Guesclin's parole gauntlet. Held at Najera, 1367. Word given and kept on both sides.' He writes: 'Parole Records — The Pledge Held by a Knight's Personal Word. First entry.' He files it. 'Both sides. That is what makes it a record.' You receive Archive Receipt — Parole Records.",
  "failText": "Sweelinck asks which side gave the parole and which held it. You explain one direction only. 'You have described a surrender,' he says, 'not a parole. The document is bilateral.' Give him the full account.",
  "checkPassFlag": "lcyGuesclinAct5Done",
},

# ── CYCLE 7: Lady Mary's Deed ─────────────────────────────────────────────────

{
  "id": "lcy_07_act1",
  "title": "Lady Mary's Deed — Tilford Hall",
  "type": "skill_check",
  "activateNode": "LCY",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyGuesclinAct5Done",
  "desc": "Tilford Hall, Hampshire. Sir Nigel has been in Spain for three months. Lady Mary has been running the estate, managing two rents and a creditor's patience, doing the accounts each evening after the household is in bed. Today the creditor's agent arrived with a distraint order, valid in three days if the deed is not presented to the Winchester court as primary title. She goes to the solar chest. 'I need this at the Winchester register before the third bell on Friday. Come back with the filing receipt.'",
  "passText": "You receive the deed in both hands with the weight it is given — no questions, no ceremony, only the understanding that she has placed everything at Tilford in your hands. You receive Tilford Household Deed — the original deed to the Loring household, land, hall, mill, and eastern field. Old Loring seal, cracked at the edge. The wax held anyway.",
  "failText": "You ask clarifying questions. She looks at you. 'Come back with the filing receipt.' The deed is placed in your hands and the question has been answered. Go.",
  "checkPassFlag": "lcyLadyAct1Done",
},
{
  "id": "lcy_07_act2",
  "title": "Lady Mary's Deed — The Winchester Road",
  "type": "skill_check",
  "activateNode": "LDN",
  "checkStat": "STR", "checkDC": 13,
  "activateCond": "() => !!S_story.lcyLadyAct1Done",
  "desc": "The Winchester road — a day and a half of English autumn. The creditor's agent is also on the road and riding faster. He carries a competing purchase-right claim that predates the distraint by a week — if filed first, it overrides Lady Mary's deed. A bridge is out at Alresford. You know the ford two miles east. He does not.",
  "passText": "You take the ford at Alresford — October footing, uncertain, manageable. You arrive at Winchester's register office before the creditor's agent. The deed is in hand. You receive Winchester Road Token — the specific knowledge of the ford that was not on his map.",
  "failText": "The ford at Alresford is rougher than expected. You lose time. The creditor's agent arrives first at the register office. His competing claim is already filed as preliminary by the time you reach the clerk.",
  "checkPassFlag": "lcyLadyAct2Done",
},
{
  "id": "lcy_07_act3",
  "title": "Lady Mary's Deed — The Register Office",
  "type": "skill_check",
  "activateNode": "LDN",
  "checkStat": "CHA", "checkDC": 12,
  "activateCond": "() => !!S_story.lcyLadyAct2Done",
  "desc": "Winchester — the court register, morning of day three. The register clerk has the creditor's competing claim on his desk — preliminary, pending the deed's review. The preliminary can still be superseded if the deed is presented before the third bell. The clerk has a procedural objection: the deed's seal is cracked, which he notes as a potential chain-of-custody concern. He wants one thing: a signed attestation from a witness who saw Lady Mary place the deed in your hands.",
  "passText": "You have no witness present, but the deed combined with your account and the creditor's agent's visible discomfort establishes the chain. The agent's reaction to your presence is evidence. The clerk accepts the deed. You receive Filing Receipt — dated, stamped, the primary record.",
  "failText": "You address the chain-of-custody concern directly and it makes the clerk more cautious. Let the agent's behavior speak first — his discomfort at your arrival is the attestation the clerk needs.",
  "checkPassFlag": "lcyLadyAct3Done",
},
{
  "id": "lcy_07_act4",
  "title": "Lady Mary's Deed — The Return",
  "type": "skill_check",
  "activateNode": "LDN",
  "checkStat": "WIS", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyLadyAct3Done",
  "desc": "The return road to Tilford — receipt in hand. The deed is filed. The creditor's appeal window is eight days but the filing receipt is dated and stamped and constitutes the primary record. At an inn, two riders are eating. You do not know them. They are not threatening. But one asks, conversationally, whether you have been to Winchester lately on estate business.",
  "passText": "You determine this is a survey of what you carry, not casual conversation. You give them nothing and move on. The receipt reaches Tilford intact. You receive Return Clear — the road home without incident.",
  "failText": "You answer the question conversationally. They do not take the receipt — you are too alert — but they now know you carry it. The road to Tilford requires more vigilance.",
  "checkPassFlag": "lcyLadyAct4Done",
},
{
  "id": "lcy_07_act5",
  "title": "Lady Mary's Deed — The Archive",
  "type": "skill_check",
  "activateNode": "WM",
  "checkStat": "CHA", "checkDC": 11,
  "activateCond": "() => !!S_story.lcyLadyAct4Done",
  "desc": "Weimar. Lady Mary received the receipt at Tilford and went back to the accounts. Before Sir Nigel came home from Spain, she gave you the deed: 'Not for me. For the record. Someone should have the record of what is done at home while the deeds are being won.' The road from Hampshire is long. A Venetian factor in Bruges wanted to know what property instruments you carried. You explained it was a personal record. He waved you through.",
  "passText": "Sweelinck reads the deed and the filing receipt attached. He writes very carefully: 'Tilford Household Deed. Presented at Winchester court by a carrier acting for Lady Mary Loring, while Sir Nigel Loring was winning his three deeds at Najera.' He sets his pen down. 'Household Management Records — The Endurance That No One Writes Songs About. First entry. She is right. Someone should have the record.' You receive Archive Receipt — Household Management.",
  "failText": "Sweelinck reads the deed and asks who filed it at Winchester. You tell him. He asks: 'And where was Sir Nigel Loring?' You need to give him the complete picture — both sides of the same date — before he can file it in the right category.",
  "checkPassFlag": "lcyLadyAct5Done",
  "questComplete": True,
},

]

created = 0
failed = 0
for q in quests:
    if create_quest(q):
        created += 1
    else:
        failed += 1

print(f"\n{'='*50}")
print(f"Done: {created} created, {failed} failed")

print("Saving...")
r = api("POST", "/api/save")
print("Save:", r.get("ok") if r else False)
