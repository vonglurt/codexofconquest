#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     play.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import INV — Fragments of Ancient Poetry (Ossian / MacPherson, 1760) — 7 cycles × 5 acts = 35 quests"""
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

# Note: INV already exists as epic battleground — cycle 1 uses CNA (Vale of Cona) instead
quests = [
    # ── Cycle 1 — The Shield of Gormur (CNA — INV collision; all 5 acts at CNA) ──
    {
        "id": "inv_01_act1",
        "title": "The Shield of Gormur — The Field of Dargo",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CHA", "checkDC": 11,
        "desc": "Dargo is buried. His daughter walks north. Oscur and Dermid orbit her in silence, each watching the other. The high moor opens ahead, the iron shield on Oscur's back the most conspicuous thing in the column. Form the march before night falls.",
        "passText": "The column forms. The daughter walks first. Oscur falls in behind her. You take the middle position. The moor opens ahead.",
        "failText": "Grief and pride hold them at the mound until dark. You march the pass by torchlight; something large moves in the moorland reeds, and no one sleeps at the first camp.",
        "checkPassFlag": "invC1A1Done",
    },
    {
        "id": "inv_01_act2",
        "title": "The Shield of Gormur — The Moor Road",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.invC1A1Done",
        "desc": "A war-party of six blocks the stream-ford — opportunists who heard the battle. They want Oscur's shield. Oscur moves toward the bank. Guard his flank and ensure the daughter does not reach the ford before the fight is settled.",
        "passText": "They break before Oscur reaches the bank. The column crosses at speed. The shield catches the torchlight as the clouds part.",
        "failText": "The raiders hit the column's flanks. You take a wound driving them back; the daughter is separated for a quarter-hour. When you regroup, Dermid's face has gone cold and watchful in a new way.",
        "checkPassFlag": "invC1A2Done",
    },
    {
        "id": "inv_01_act3",
        "title": "The Shield of Gormur — The Brook of Branno",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 14,
        "activateCond": "() => !!S_story.invC1A2Done",
        "desc": "Dermid has asked Oscur to kill him. They go to the brook. You hold Oscur's shield while the sound of steel comes through the trees — brief, certain. Oscur returns alone and hangs the shield from the oak branch over the water. Do you understand what the hung shield means before tomorrow comes?",
        "passText": "You see it: the shield is not hung for display. Oscur measured the angle from where a man watches someone shoot to where a man stands as a target. He is preparing something. You say nothing. You understand that he has already decided.",
        "failText": "You do not follow Oscur's thought. The shield hangs oddly on the branch; you see only a trophy aired after the fight. When the daughter reaches for her bow at morning, you will have no warning.",
        "checkPassFlag": "invC1A3Done",
    },
    {
        "id": "inv_01_act4",
        "title": "The Shield of Gormur — The Oak Above the Stream",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CON", "checkDC": 15,
        "activateCond": "() => !!S_story.invC1A3Done",
        "desc": "The daughter draws her bow. Oscur stands behind the shield, not beside it. You are twenty paces back. The angle is wrong. You understand in this moment what is about to happen. Hold your silence and honor Oscur's chosen death, or call out and dishonor the thing he made.",
        "passText": "You hold your silence. The arrow flies. He falls. 'Blessed be that hand of snow,' he says. Both are gone. The shield sways above the stream. You are the only witness, and you witnessed correctly.",
        "failText": "You call out. The arrow glances the shield's rim — Oscur stumbles but is not struck through. The moment breaks. You will always wonder what you took from him.",
        "checkPassFlag": "invC1A4Done",
    },
    {
        "id": "inv_01_act5",
        "title": "The Shield of Gormur — The Birch's Unequal Shade",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "STR", "checkDC": 10,
        "activateCond": "() => !!S_story.invC1A4Done",
        "desc": "Three graves by the brook of Branno. You dig through the night. At morning, lower the shield from the oak branch and lay it over Oscur's grave before the final stones are set. At Fingal's hall, Ullin the bard will listen without interrupting, then begin to compose.",
        "passText": "The shield comes down clean. Iron on stone. It will rust slowly over years until the mound and the shield are one thing. Ullin asks only what you saw.",
        "failText": "The cord breaks; the shield drops into the stream and must be waded for in cold water. It is recovered, dented on a stone, and placed over the grave wet and cold. Ullin composes the song anyway.",
        "checkPassFlag": "invC1A5Done",
    },

    # ── Cycle 2 — Morna's Stone (all at CNA) ─────────────────────────────────
    {
        "id": "inv_02_act1",
        "title": "Morna's Stone — The Brook of Cona",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.invC1A5Done",
        "desc": "The vale of Cona, autumn afternoon. Two wounded figures by the brook: Duchommar on the bank explaining something no one is answering, Morna near the water with one hand in the stream. She turns to you and gives you the instruction: a stone from the brook, flat, that one, between them when they are both gone.",
        "passText": "You lift the stone from the water. It is cold and exactly as she described. You receive Morna's Stone — the boundary she is choosing because she still can.",
        "failText": "You hear the instruction but not the refusal inside it. When Duchommar asks you to carry his message you hesitate.",
        "checkPassFlag": "invC2A1Done",
    },
    {
        "id": "inv_02_act2",
        "title": "Morna's Stone — Duchommar's Account",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.invC2A1Done",
        "desc": "Duchommar has heard you lift the stone. He asks what she said. He tells you: I did not understand what I was taking from her. Tell her. You are carrying the stone. He is asking you to change its purpose.",
        "passText": "You say no. One word. He is quiet after. He understands the stone's purpose now. He does not speak again to you.",
        "failText": "You say something that is neither his message nor a refusal. He takes it as partial agreement. You have to be clearer.",
        "checkPassFlag": "invC2A2Done",
    },
    {
        "id": "inv_02_act3",
        "title": "Morna's Stone — The Waiting",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CON", "checkDC": 12,
        "activateCond": "() => !!S_story.invC2A2Done",
        "desc": "The afternoon passes. The stone in your hands warms slightly. Duchommar sleeps. Morna watches the water. You sit between them on the bank and wait. Morna says, without looking at you: you have it. Yes. Good. Time is short now and the valley is quiet.",
        "passText": "You do not move. The brook runs. Morna's hand is in the water. At some point you understand that you are ready for whatever comes next.",
        "failText": "You stand and walk the bank for a moment. Morna notices. You return. She does not speak again until the end.",
        "checkPassFlag": "invC2A3Done",
    },
    {
        "id": "inv_02_act4",
        "title": "Morna's Stone — The Placement",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "DEX", "checkDC": 11,
        "activateCond": "() => !!S_story.invC2A3Done",
        "desc": "Morna's breathing changes. The change is small and complete. The space between the two figures is two feet of autumn grass. You move to the center of that space and place the stone.",
        "passText": "Flat. Pale. Between them. The blood from Duchommar's wound reaches the stone's edge and stops. The stone is the correct stone. The placement is correct.",
        "failText": "The stone lands at an angle. You straighten it. The correction takes one more moment than it should.",
        "checkPassFlag": "invC2A4Done",
    },
    {
        "id": "inv_02_act5",
        "title": "Morna's Stone — The Road from the Vale",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC2A4Done",
        "desc": "You rise. The vale is the same vale it was before you came. Two cairns will be built here eventually. The stone is between them. You take the road north toward Fingal's hall — not carrying anything from this place. The commission is complete.",
        "passText": "The road runs north. The stone is in the ground behind you, belonging to the ground now. You were the one who arrived. You did what was asked. Nothing else.",
        "failText": "You look back once at the vale. The stone is there. You turn north.",
        "checkPassFlag": "invC2A5Done",
    },

    # ── Cycle 3 — The Ghost at Noon (CNA → CON → WM) ─────────────────────────
    {
        "id": "inv_03_act1",
        "title": "The Ghost at Noon — Shilric's Commission",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC2A5Done",
        "desc": "Shilric holds the carved tablet out without looking up. He wants the promise documented beyond his own memory — not validated or explained. The tablet reads: 'I will be here when you come back. On the hill. At noon. This is the promise.' Made before he left for the wars. She was dead when he came back. The ghost kept the promise.",
        "passText": "You take the tablet in silence. He does not look up. You receive Vinvela's Carved Tablet — the promise in her living hand, before the death that would fulfill it.",
        "failText": "You ask about the ghost. He is silent for a long time. He hands you the tablet. Take it in silence next time.",
        "checkPassFlag": "invC3A1Done",
    },
    {
        "id": "inv_03_act2",
        "title": "The Ghost at Noon — The Curiosity Collector",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.invC3A1Done",
        "desc": "On the road south, a collector intercepts you. He has heard of the Ossianic tablets — bone with knotwork edges, promise inscriptions, the specific Highland register of the mid-tidal grief voice. He collects curiosities. The tablet is a specific commission for a specific archive.",
        "passText": "You explain the distinction between a curiosity collection and a commission deposit. He understands. The road continues south.",
        "failText": "He argues the collection's merits. You hold the tablet. He eventually withdraws.",
        "checkPassFlag": "invC3A2Done",
    },
    {
        "id": "inv_03_act3",
        "title": "The Ghost at Noon — The Byzantine Classification",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.invC3A2Done",
        "desc": "A Byzantine church official at Constantinople wants to classify the tablet as either a pious relic or necromantic evidence. The tablet predates the death and records the living promise, not the ghost's speech. Its character is the human inscription — the promise made before any question of ghost arose.",
        "passText": "You explain that the tablet is the promise in her living hand, made before her death — what the ghost said is a separate account, not in the tablet. He accepts the distinction. The tablet goes north.",
        "failText": "He insists on a theological classification. You decline his categories. The tablet continues north unclassified by his office.",
        "checkPassFlag": "invC3A3Done",
    },
    {
        "id": "inv_03_act4",
        "title": "The Ghost at Noon — The Bosphorus Crossing",
        "type": "skill_check",
        "activateNode": "CON",
        "checkStat": "STR", "checkDC": 11,
        "activateCond": "() => !!S_story.invC3A3Done",
        "desc": "November Bosphorus, iron water, east wind. The ferry crossing is rough. The tablet is inside your cloak. One hand holds the cloak closed. The other holds the ferry rail.",
        "passText": "You cross with the tablet dry and intact. The wind comes from the east the whole crossing.",
        "failText": "A wave takes the deck. You brace. The tablet stays dry. The crossing costs a quarter-hour of delay.",
        "checkPassFlag": "invC3A4Done",
    },
    {
        "id": "inv_03_act5",
        "title": "The Ghost at Noon — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.invC3A4Done",
        "desc": "Sweelinck reads the inscription. The promise. The ghost kept it at noon on the promised hill at the promised hour. The archive needs a category that holds both the promise and its keeping without adjudicating the theological claim.",
        "passText": "You explain the distinction: the tablet holds the promise in her living hand; the ghost's appearance is not in the tablet — it is the event the promise anticipated and the dead fulfilled. Sweelinck creates: Ghost Testimony Records — Promises Kept by the Dead, First Entry.",
        "failText": "Sweelinck creates Ghost Testimonies — Appearances at Named Locations. Technically accurate. The tablet is filed.",
        "checkPassFlag": "invC3A5Done",
    },

    # ── Cycle 4 — Crimora's Arrow (HLD → VEN → WM) ───────────────────────────
    {
        "id": "inv_04_act1",
        "title": "Crimora's Arrow — The Restriction Order",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.invC3A5Done",
        "desc": "Crimora is at the field's edge with her bow drawn. The restriction order from the clan elders forbids her to enter the battlefield at Lena before the engagement closes. The grounds: Dargo's war-kit resembles Connal's by deliberate choice — identification is genuinely ambiguous. The restriction is correct. Reach her before she fires.",
        "passText": "You acknowledge her precision first, then show her the five minutes of improving light that let her see the kit-switch. She lowers the bow. You receive Crimora's Restriction Order.",
        "failText": "You cite the order before acknowledging her knowledge. She argues back. You show her the light. She lowers the bow.",
        "checkPassFlag": "invC4A1Done",
    },
    {
        "id": "inv_04_act2",
        "title": "Crimora's Arrow — The Clan Challenge",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.invC4A1Done",
        "desc": "A clan warrior challenges the restriction on grounds that Crimora knows the fighters better than the elders. The restriction is based on intelligence about Dargo's kit as deliberate provocation — information the warrior does not have.",
        "passText": "You explain the intelligence basis of the order. He did not know Dargo chose the kit-match deliberately. He withdraws his challenge.",
        "failText": "He is not fully convinced but accepts the clan elders' authority. The order stands.",
        "checkPassFlag": "invC4A2Done",
    },
    {
        "id": "inv_04_act3",
        "title": "Crimora's Arrow — The Venetian Scholar",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.invC4A2Done",
        "desc": "A Venetian scholar wants to publish the order as a document about women's battle roles in Highland culture. The order is a battlefield intelligence assessment, not a cultural statement. Filing under the wrong category makes it available to the wrong researchers and unavailable to the right ones.",
        "passText": "You explain the distinction between a cultural document and an intelligence assessment. He sees the categorization risk. The order goes to the archive's correct section.",
        "failText": "He argues the cultural significance is inseparable from the intelligence function. You decline the framing. The order continues to the archive.",
        "checkPassFlag": "invC4A3Done",
    },
    {
        "id": "inv_04_act4",
        "title": "Crimora's Arrow — The Mountain Storm",
        "type": "skill_check",
        "activateNode": "VEN",
        "checkStat": "STR", "checkDC": 11,
        "activateCond": "() => !!S_story.invC4A3Done",
        "desc": "A mountain storm closes the pass road north for six hours. The shepherd's hut at the path junction offers shelter. The road opens by afternoon.",
        "passText": "You wait in the hut, road opens by afternoon, make the next stage before dark. The order is in the dry pack.",
        "failText": "The storm lasts longer. You make the stage on the third day instead. The order is intact.",
        "checkPassFlag": "invC4A4Done",
    },
    {
        "id": "inv_04_act5",
        "title": "Crimora's Arrow — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.invC4A4Done",
        "desc": "Sweelinck reads the restriction order. The grounds: Dargo's war-kit resembles Connal's by deliberate choice. The restriction is correct — the intelligence is what made the restriction correct. The archive needs a category: not cultural document, not conflict record.",
        "passText": "You explain: the restriction was issued because the information was correct — intelligence assessment, not cultural statement. Sweelinck creates: Battlefield Intelligence Records — The Restriction Issued Because the Information Was Correct, First Entry.",
        "failText": "Sweelinck files under Highland Conflict Records — Female Combatant Restrictions. The order is preserved.",
        "checkPassFlag": "invC4A5Done",
    },

    # ── Cycle 5 — Euran's Message (CNA → HLD → WM) ───────────────────────────
    {
        "id": "inv_05_act1",
        "title": "Euran's Message — Euran's Haste",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC4A5Done",
        "desc": "Euran arrives at the vale at a run. He has been running for two hours. Two men, one lie, midnight meeting at the gate — a fabricated insult message sent to both, by a third party who wants the gate held by neither. The counter-dispatch names the fabrication and the fabricator. A mounted rider on the road will be intercepted. On foot, the drover's track reaches the gate in ninety minutes without being visible.",
        "passText": "You understand before he explains the route. You already know the drover's track. You go. You receive Euran's Counter-Dispatch.",
        "failText": "You ask which route. He has to explain it. You lose eight minutes but you understand.",
        "checkPassFlag": "invC5A1Done",
    },
    {
        "id": "inv_05_act2",
        "title": "Euran's Message — The Road Watcher",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.invC5A1Done",
        "desc": "Halfway to the gate, there is a figure on the high ground above the track. He has seen you. He has a horse. He works for the fabricator. His job is to intercept any counter-message from Euran. He does not know which track Euran used — his interception is precautionary.",
        "passText": "He accepts the authority argument — private commission on a private track, requiring official mandate he does not have. He watches from the high ground but does not descend.",
        "failText": "He demands to see the pouch. You refuse. He dismounts and approaches. You hold your ground. He retreats.",
        "checkPassFlag": "invC5A2Done",
    },
    {
        "id": "inv_05_act3",
        "title": "Euran's Message — The First Arrival",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "CHA", "checkDC": 12,
        "activateCond": "() => !!S_story.invC5A2Done",
        "desc": "You reach the outer edge of the gate's approach with forty minutes to spare. One of the two men — Bremo of the eastern clan — is already visible on the approach road. Give him the counter-dispatch now. The commission is specific and immediate; the fabricator's future plans are not within its scope.",
        "passText": "You intercept Bremo cleanly. He reads the counter-dispatch. He turns back. 'Euran sent this?' Yes. He says: 'I know who wrote the other one.'",
        "failText": "You hesitate, trying to calculate secondary effects. Bremo passes the outer approach and you have to run to intercept. He reads it. He turns back.",
        "checkPassFlag": "invC5A3Done",
    },
    {
        "id": "inv_05_act4",
        "title": "Euran's Message — The Gate Road South",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "STR", "checkDC": 11,
        "activateCond": "() => !!S_story.invC5A3Done",
        "desc": "The counter-dispatch has served its purpose. Euran wants it filed — the fabrication and the fabricator named, in a permanent record. Three days of Highland autumn road to the coast. The leather pouch's seal is intact and will survive rain; the folded note inside is uncoated parchment. Keep it dry against your body.",
        "passText": "Three clean days. The seal is intact when you reach the coast.",
        "failText": "The seal loosens on the second day. You re-press it with a coin-edge at the evening fire. The interior stays dry.",
        "checkPassFlag": "invC5A4Done",
    },
    {
        "id": "inv_05_act5",
        "title": "Euran's Message — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.invC5A4Done",
        "desc": "Sweelinck reads the counter-dispatch. He reads Euran's note. He opens his log and writes the fabricator's name. He asks: do you know if the fabricator has been dealt with? You tell him what Bremo said: he knows who wrote the other one.",
        "passText": "You explain: this is an intelligence act, not a conflict-prevention act — the intelligence is what the prevention required. Sweelinck creates: Counter-Intelligence Records — Messages That Prevent Collisions at the Gate, First Entry.",
        "failText": "Sweelinck files under Conflict Prevention Records — Highland Disputes. The document is preserved.",
        "checkPassFlag": "invC5A5Done",
    },

    # ── Cycle 6 — The Rock at Sea (all at HLD → WM) ───────────────────────────
    {
        "id": "inv_06_act1",
        "title": "The Rock at Sea — The Captain's Problem",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC5A5Done",
        "desc": "The rescue boat captain has a tide chart — patrol schedule scratched on oiled bark — and a three-hour window. He does not have written authorization from the clan elders to run the rescue mission. The elders authorized the rescue three days ago; the bark is new information for an already-authorized mission, not a new mission requiring new authorization.",
        "passText": "You give him the framing. He reads the bark again. 'The mission was already authorized.' He gives the order. You receive Arindel's Tide Chart.",
        "failText": "The captain wants written confirmation. You spend one hour drafting a statement he accepts. Two hours remain.",
        "checkPassFlag": "invC6A1Done",
    },
    {
        "id": "inv_06_act2",
        "title": "The Rock at Sea — The Patrol Contact",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.invC6A1Done",
        "desc": "The patrol boat makes contact before the tide window opens. Arindel's officer asks their business. The tide window opens in forty minutes — a medical escort has a forty-minute protocol registration period; they are within their rights to be on this water. If the officer waits forty minutes before deciding, the window will open and the rescue will be legal under the patrol's own rules.",
        "passText": "He accepts the medical escort framing and the forty-minute protocol. The window opens. He lets them pass.",
        "failText": "He is skeptical but professional. He accompanies the rescue boat to the rock as a witness. The mission completes.",
        "checkPassFlag": "invC6A2Done",
    },
    {
        "id": "inv_06_act3",
        "title": "The Rock at Sea — The Rock",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.invC6A2Done",
        "desc": "Daura is on the rock. She has been there three days. While the crew assists her, a wave-surge pushes the boat against the rock's base and the bark chart in the bow-pack takes a splash. The bark is oiled and will survive contact; the charcoal markings will not survive direct spray. Get to the pack before the next surge.",
        "passText": "You get the pack closed and braced before the second surge. The markings are intact.",
        "failText": "The second surge catches the edge of the pack. The bark survives; one of the charcoal patrol-time notations is smeared. Sweelinck will note the damage.",
        "checkPassFlag": "invC6A3Done",
    },
    {
        "id": "inv_06_act4",
        "title": "The Rock at Sea — The Coast Road",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "STR", "checkDC": 11,
        "activateCond": "() => !!S_story.invC6A3Done",
        "desc": "Three days south along the Highland coast. On the second day a fog bank moves in from the sea and the road becomes a matter of footing and direction rather than visibility. Two miles of coast road in thick fog, the cliff edge on the right, the road surface distinguishable from the heath by the slightly compacted soil.",
        "passText": "You hold the road through the fog section without difficulty.",
        "failText": "You go off the road once in the fog and correct. Half an hour lost.",
        "checkPassFlag": "invC6A4Done",
    },
    {
        "id": "inv_06_act5",
        "title": "The Rock at Sea — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC6A4Done",
        "desc": "Sweelinck reads the bark chart. He reads the patrol schedule. The bark has two sets of markings: the informant's charcoal patrol schedule and the captain's own notations — two intelligences on one piece of bark. The archive needs to note both sets separately.",
        "passText": "You show him the two marking sets. He writes the provenance note naming both hands. Rescue Logistics Records — The Tide Window and the Signal Fire, First Entry. Daura had been on the rock three days.",
        "failText": "Sweelinck notes the bark as a single intelligence document. The record is preserved.",
        "checkPassFlag": "invC6A5Done",
    },

    # ── Cycle 7 — The Message No One Sends (CNA → HLD → WM) — questComplete ─
    {
        "id": "inv_07_act1",
        "title": "Tonthena's Sword — The King's Emissary",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "WIS", "checkDC": 11,
        "activateCond": "() => !!S_story.invC6A5Done",
        "desc": "The king's emissary gives you the sword and a warning: there is a woman of the clan, Colna-dona, who loved Tonthena. She has been watching the approach for two days. She will meet you on the road. The note says: 'From Tonthena's king, who respected him. His sword returns to his people.' There is nothing else.",
        "passText": "You understand. She will meet you. You think about what you will say when she asks. You have no answer. You set out. You receive Tonthena's Sword.",
        "failText": "You take the sword without understanding the warning. On the road, Colna-dona's question is a surprise.",
        "checkPassFlag": "invC7A1Done",
    },
    {
        "id": "inv_07_act2",
        "title": "Tonthena's Sword — The Road Meeting",
        "type": "skill_check",
        "activateNode": "CNA",
        "checkStat": "CHA", "checkDC": 13,
        "activateCond": "() => !!S_story.invC7A1Done",
        "desc": "She is on the road. She sees the sword. She looks at your face. She says: 'Is that all there is?' The answer is yes. There is no other message. His king respected him. The sword returns to his people. The only answer that serves her is the true answer — not softened, not extended, not accompanied by consolation.",
        "passText": "'Yes.' One word. She nods. She walks alongside you for a hundred steps without speaking. Then she turns back.",
        "failText": "You say something that is not the answer to the question she asked. She looks at you for a long time. Then she says: 'Tell me what you know.' You tell her the truth anyway.",
        "checkPassFlag": "invC7A2Done",
    },
    {
        "id": "inv_07_act3",
        "title": "Tonthena's Sword — The Clan Delivery",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "WIS", "checkDC": 12,
        "activateCond": "() => !!S_story.invC7A2Done",
        "desc": "The clan elder receives the sword. He reads the note. He asks: did you carry this from Tonthena's king directly, or through intermediaries? He needs to know how many people handled it between the king's hands and his — because he will tell Colna-dona something about the delivery, and the chain of custody is part of what he will tell her.",
        "passText": "You give him the full chain: through the king's emissary at the vale of Cona, and then directly. He says: 'She met you on the road.' You say yes. He says nothing else about it.",
        "failText": "You give a simplified answer. He nods, but the simplification omits the meeting on the road. He will find out about that meeting eventually.",
        "checkPassFlag": "invC7A3Done",
    },
    {
        "id": "inv_07_act4",
        "title": "Tonthena's Sword — The Road to Weimar",
        "type": "skill_check",
        "activateNode": "HLD",
        "checkStat": "STR", "checkDC": 12,
        "activateCond": "() => !!S_story.invC7A3Done",
        "desc": "The sword must reach Weimar as a record. The road south from the Highlands is long. The sword is heavy. The linen wrapping and cord-and-note must arrive as they were received. Twelve days of southern road with the sword in a carrying pack — keep it upright where the note won't crumple.",
        "passText": "Twelve days clean. The note and cord arrive in the same condition as the morning of the delivery.",
        "failText": "On the fifth day the pack strap breaks. You repair it with cord from your kit. The note is unharmed. The repair costs two hours.",
        "checkPassFlag": "invC7A4Done",
    },
    {
        "id": "inv_07_act5",
        "title": "Tonthena's Sword — The Archive",
        "type": "skill_check",
        "activateNode": "WM",
        "checkStat": "INT", "checkDC": 11,
        "activateCond": "() => !!S_story.invC7A4Done",
        "desc": "Sweelinck unwraps the linen. He reads the note. 'His king respected him. The sword returns to his people.' He asks: what did the woman on the road ask? You tell him: 'Is that all there is?' He holds the sword across both hands.",
        "passText": "Sweelinck creates: Last Possession Records — The Object That Was All That Remained, First Entry. The sword and the note and the fact that the question was asked and answered on the road before the delivery was made — together the complete record of what the sword was.",
        "failText": "Sweelinck files under Diplomatic Objects — Returned Effects. The sword is preserved.",
        "checkPassFlag": "invC7A5Done",
        "questComplete": True,
    },
]

def main():
    wait_server()
    print(f"Importing INV — Ossian / MacPherson ({len(quests)} acts)...")
    for q in quests:
        create_quest(q)
    print("\nAll 35 acts imported. Running audit...")
    audit = api("get", "/api/audit")
    errors = audit.get("errors", [])
    if errors:
        print(f"AUDIT ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  {e}")
    else:
        print(f"Audit clean. Nodes: {audit.get('nodes')}, Quests: {audit.get('quests')}")

if __name__ == "__main__":
    main()
