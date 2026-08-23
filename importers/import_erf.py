#!/usr/bin/env python3
# SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     index.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""Import ERF — Grimm's Fairy Tales (Brothers Grimm, 1812) — 7 cycles × 5 acts = 35 quests."""

import requests, subprocess, sys

BASE = "http://localhost:1367"

def say(msg):
    subprocess.run(["./say.sh", msg], check=False)

def api(method, path, **kwargs):
    r = getattr(requests, method)(BASE + path, **kwargs)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        sys.exit(1)
    return r.json()

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

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None,
          activateMissionBit=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None,
          grantItem=None, takeItem=None):
    check = requests.get(BASE + f"/api/quest/{id}")
    if check.status_code == 200:
        print(f"  SKIP (exists): {id}")
        return
    nonce_r = api("post", "/api/nonce", json={"type": "quest", "id": id})
    nonce = nonce_r["nonce"]
    quest_type = "combat" if monster and not checkStat else "skill_check"
    payload = {
        "id": id, "type": quest_type, "title": title, "desc": desc,
        "activateNode": activateNode,
        "passText": passText, "failText": failText,
        "checkStat": checkStat, "checkDC": checkDC,
    }
    if checkPassFlag:      payload["checkPassFlag"]      = checkPassFlag
    if activateCond:       payload["activateCond"]       = activateCond
    if activateMissionBit: payload["activateMissionBit"] = activateMissionBit
    if questComplete:      payload["questComplete"]      = True
    if monster:            payload["monster"]            = monster
    if monsterHP:          payload["monsterHP"]          = monsterHP
    if monsterAC:          payload["monsterAC"]          = monsterAC
    if grantItem:          payload["grantItem"]          = grantItem
    if takeItem:           payload["takeItem"]           = takeItem
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

# ─── Nodes ─────────────────────────────────────────────────────────────────

say("ERF import: creating nodes ERF city hub STB Livery Stable GLD Trade Guild CI Chancery Court DNG John's Room CHC Castle Corridor ANT Antechamber PRH Great Hall — source Grimm's Fairy Tales Brothers Grimm 1812")

create_node("ERF", "city", "Grimm Archive — The German Collection City",
            "Grimm Archive — The German Collection City",
            96, 130,
            "The German city that serves as the collection point for the Grimm archive cycles. Each cycle in cycles 3-7 begins here before the document travels to Birka, Venice, Constantinople, Rome, or London.")

create_node("STB", "city", "Livery Stable District — The Farrier's Gate",
            "Livery Stable District — The Farrier's Gate",
            98, 128,
            "The back gate of the livery yard where the farrier kept his forty-day record. The skull of the horse Falada is nailed above the arch. The merchant's daughter spoke her name to it each morning for forty days.")

create_node("GLD", "city", "Trade Guild Court — The Prior Registration",
            "Trade Guild Court — The Prior Registration",
            98, 130,
            "The trade guild court where competing document registrations collide. The arbiter's mouth twitches when the farrier's attestation precedes the impostor's registration by thirty-eight days.")

create_node("CI", "city", "Chancery Court — The Officer's Pen",
            "Chancery Court — The Officer's Pen",
            100, 130,
            "The local chancery court where the senior officer lays out all documents with a still pen. Standard procedure requires personal appearance. The impostor cannot appear because of the opposing party's own civil action.")

create_node("DNG", "camelot", "Faithful John's Restoration Room",
            "Faithful John's Restoration Room",
            98, 132,
            "The room in the castle where Faithful John was restored after years as stone. He seals the folio as the Fighter watches. He was stone for years; he looks healthier than he should. He does not ask for vindication.")

create_node("CHC", "camelot", "Castle Household Corridor — The Steward's Log",
            "Castle Household Corridor — The Steward's Log",
            100, 132,
            "The corridor junction where the head steward keeps his log-book open. He needs an origin for every item passing through. He holds the folio up to the lamp and counts pages through the wrapper.")

create_node("ANT", "camelot", "Prince's Antechamber — The Chamberlain's Preview",
            "Prince's Antechamber — The Chamberlain's Preview",
            102, 131,
            "The antechamber outside the prince's great hall. The chamberlain will deliver correspondence in the evening session, when the prince is ready — which means he opens it first. Personal correspondence with the sender's mark is outside his editorial authority.")

create_node("PRH", "camelot", "Prince's Great Hall — The Thirty Seconds",
            "Prince's Great Hall — The Thirty Seconds",
            102, 133,
            "The prince's great hall where he reads at the pace of a man confirming each sentence. Something in his hands changes. After thirty seconds of silence: 'Tell him I read it.'")

# ─── Pre-import audit ──────────────────────────────────────────────────────
say("ERF import: pre-import audit — Grimm's Fairy Tales 1812")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Pre-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")

# ─── Cycle 1: Falada Speaks ────────────────────────────────────────────────
say("ERF cycle 1 Falada Speaks: farrier's attestation of forty days testimony to a dead horse's skull — source Grimm's Fairy Tales 1812 — nodes STB GLD CI — quest chain erf_01_act1 through erf_01_act5 — character the merchant's daughter — character the farrier — city STB Livery Stable District")

quest("erf_01_act1",
      "Falada Speaks — The Farrier's Papers",
      "The farrier at the back gate of the livery yard. The skull above the arch. Forty days. He hands the attestation over — he is not afraid of disbelief in his honesty but in his source. The merchant's daughter named herself each morning to the skull because that was the only witness she trusted. The farrier wrote it down because that is what a careful man does.",
      activateNode="STB",
      passText="The admissibility distinction clarified: the farrier's observation is the testimony, not the skull's. He hands both documents over without reservation.",
      failText="You cannot articulate the distinction. He hands them over anyway but asks you to lead with the account record, not the skull paper.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC1A1Done",
      grantItem="The Farrier's Attestation — forty mornings; the merchant's daughter speaking her name, her father's name, and the nature of her claim; notary's mark and date; the only prior independent witness")

quest("erf_01_act2",
      "Falada Speaks — The Watchman's Log",
      "A city watchman at the stable-district gate with a logbook and the patience of someone paid to delay. He needs to log what is passing through. The log entry will reach the impostor's allies within the hour.",
      activateNode="STB",
      passText="Commercial traffic vs. guild-addressed legal correspondence. The watchman logs the exit as 'courier for guild business' with no document description.",
      failText="'Sealed document, content unknown, destination guild court.' The entry is made. It will be reported.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="erfC1A2Done",
      activateCond="() => !!S_story.erfC1A1Done")

quest("erf_01_act3",
      "Falada Speaks — The Prior Registration",
      "The impostor's representative is already at the table with the guild-registered copy and a dating argument. The arbiter's mouth twitches. The farrier's attestation precedes the guild registration by thirty-eight days. Two household retainers are in the corridor if the argument fails.",
      activateNode="GLD",
      passText="Prior-consistent-statement argument presented. The arbiter stops writing and looks at the representative. Transfer order issued.",
      failText="The representative's argument catches traction. Two household retainers emerge from the corridor to take the documents 'for safekeeping.'",
      checkStat="CHA", checkDC=14,
      checkPassFlag="erfC1A3Done",
      activateCond="() => !!S_story.erfC1A2Done",
      monster="Household Retainers ×2", monsterHP=16, monsterAC=12)

quest("erf_01_act4",
      "Falada Speaks — The Injunction at the Narrows",
      "Two men in household colors at the road's narrowing point with a freshly-stamped civil injunction. Service requires the carrier to acknowledge. The chancery gate is two hundred yards ahead through the morning market.",
      activateNode="GLD",
      passText="Through the market at pace. The injunction never completed service. Chancery gate reached first.",
      failText="Injunction partially read at the gate. You argue the arbiter's transfer order supersedes before the door-officer.",
      checkStat="STR", checkDC=13,
      checkPassFlag="erfC1A4Done",
      activateCond="() => !!S_story.erfC1A3Done")

quest("erf_01_act5",
      "Falada Speaks — The Officer's Pen",
      "The senior chancery officer lays out all documents. His pen is still. The impostor's injunction arrived three minutes after the Fighter. Standard procedure requires personal appearance. The claiming party cannot appear because of the opposing party's own civil action.",
      activateNode="CI",
      passText="The statutory exception for prior independent witness named; the appearance-requirement's purpose stated. The officer opens the register and stamps the attestation received. Account record registered. Impostor's registration flagged.",
      failText="Authentication suspended pending personal appearance. Documents filed correctly but inactive. The merchant's daughter needs another path.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC1A5Done",
      activateCond="() => !!S_story.erfC1A4Done",
      takeItem="The Farrier's Attestation — filed in the chancery court; account record registered; impostor's registration flagged")

# ─── Cycle 2: Faithful John's Account ────────────────────────────────────
say("ERF cycle 2 Faithful John's Account: sealed folio explaining three acts of apparent treason delivered to the prince — source Grimm's Fairy Tales 1812 — nodes DNG CHC ANT PRH — quest chain erf_02_act1 through erf_02_act5 — character Faithful John — character the prince — city DNG restoration room — quest erf_02 chain")

quest("erf_02_act1",
      "Faithful John's Account — The Sealed Folio",
      "John seals the folio as the Fighter watches. He was stone for years; he looks healthier than he should. He does not ask for vindication. He needs the prince to know the full shape of what he received. Eight pages in John's careful hand: three acts of apparent treason explained in sequence, ending with one sentence — I do not ask forgiveness for what I would do again.",
      activateNode="DNG",
      passText="Not a plea but a gift. You carry it without adding interpretation.",
      failText="John stops you from interpreting. He gives the instruction clearly: sealed, to his hands, nothing added.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC2A1Done",
      activateCond="() => !!S_story.erfC1A5Done",
      grantItem="Faithful John's Account — sealed folio, eight pages, John's mark in wax at the fold; do not open it; its value depends on arriving intact in the prince's hands")

quest("erf_02_act2",
      "Faithful John's Account — The Steward's Log",
      "Head steward at the corridor junction with a log-book open. He needs an origin. He holds the folio up to the lamp and counts pages through the wrapper.",
      activateNode="CHC",
      passText="'Household correspondent, personal seal, private matter.' Accurate, unchallengeable, non-locating. Logged as: personal correspondence, origin unspecified.",
      failText="Your name logged as carrier attesting to private character of contents. Retrievable later. Not stopped now.",
      checkStat="CHA", checkDC=12,
      checkPassFlag="erfC2A2Done",
      activateCond="() => !!S_story.erfC2A1Done")

quest("erf_02_act3",
      "Faithful John's Account — The Chamberlain's Preview",
      "The chamberlain will deliver it in the evening session, when the prince is ready — which means he opens it first. The folio cannot arrive from the chamberlain's hand.",
      activateNode="ANT",
      passText="Personal correspondence with the sender's mark is outside the chamberlain's editorial authority. He steps aside.",
      failText="You name the origin: 'the restored man in the west wing.' The chamberlain opens the door. The Fighter will be remembered for knowing the phrase.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="erfC2A3Done",
      activateCond="() => !!S_story.erfC2A2Done")

quest("erf_02_act4",
      "Faithful John's Account — The Hall Guards",
      "Two palace guards at the double doors — standard caution, not malice. The folio needs to arrive before the prince leaves for the evening session in twenty minutes. They are doing their job. This is the last formal gate.",
      activateNode="ANT",
      passText="The last gate passed. The folio enters the great hall before the evening session.",
      failText="The guards hold you long enough that the prince's evening session begins without the folio delivered to hand.",
      checkStat="STR", checkDC=13,
      checkPassFlag="erfC2A4Done",
      activateCond="() => !!S_story.erfC2A3Done",
      monster="Palace Guards ×2", monsterHP=24, monsterAC=13)

quest("erf_02_act5",
      "Faithful John's Account — The Prince's Silence",
      "The prince reads at the pace of a man confirming each sentence. His face does not change much. Something in his hands changes. Fighter holds the wall. Thirty seconds of silence.",
      activateNode="PRH",
      passText="Nothing added. The prince reads all eight pages, falls silent for thirty seconds, says: 'Tell him I read it.'",
      failText="A small interpretive gesture added. The prince hears it accurately and does not say the seven words he was going to say.",
      checkStat="CON", checkDC=11,
      checkPassFlag="erfC2A5Done",
      activateCond="() => !!S_story.erfC2A4Done",
      takeItem="Faithful John's Account — in the prince's hands; the seal John placed on it, received intact",
      grantItem="The Prince's Instruction — seven words, verbal; given to carry back to the restored man")

# ─── Cycle 3: The Name in the Forest ──────────────────────────────────────
say("ERF cycle 3 The Name in the Forest: charcoal-burner's oilcloth account of Rumpelstiltskin's name overheard at his forest fire — source Grimm's Fairy Tales 1812 — nodes ERF BK WM — quest chain erf_03_act1 through erf_03_act5")

quest("erf_03_act1",
      "The Name in the Forest — The Charcoal-Burner's Account",
      "The charcoal-burner was tending his kiln three miles from any road when the creature danced around his own fire singing his own name. He was certain no one was there. The charcoal-burner wrote it down at first light because he is a craftsman who keeps notes and recognized he had overheard something remarkable. Now he needs confirmation the account will be taken seriously.",
      activateNode="ERF",
      passText="Not argument about admissibility — confirmation the account will be taken seriously. He hands both the oilcloth and the morning copy over without further question.",
      failText="You argue admissibility before confirming the account's seriousness. He hands them over but with less confidence in the carrier.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC3A1Done",
      activateCond="() => !!S_story.erfC2A5Done",
      grantItem="The Charcoal-Burner's Account — oilcloth record and morning copy; the name written before dawn; a craftsman's notation of something remarkable; Baltic factor mark pending")

quest("erf_03_act2",
      "The Name in the Forest — The Lübeck Factor",
      "The Lübeck factor is reading the oilcloth's fold pattern, not your face. He is trying to determine which side the writing begins on — which would tell him whether the account was made in haste or at leisure.",
      activateNode="ERF",
      passText="You do not confirm which side the writing begins on. The factor cannot determine the account's composition conditions. He waves you through.",
      failText="Your answer inadvertently confirms the writing begins on the left. The factor notes this as evidence of a hasty record — admissibility argument incoming at Birka.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC3A2Done",
      activateCond="() => !!S_story.erfC3A1Done")

quest("erf_03_act3",
      "The Name in the Forest — Haakon's Notation",
      "At Birka, Haakon the archivist is adding the Baltic factor mark to the account — a notation that changes its evidentiary standing. It requires forty seconds of uninterrupted work. Factor hall agents are in the corridor.",
      activateNode="BK",
      passText="The hall entrance held for forty seconds. Haakon completes the factor mark. The notation changes the account's evidentiary standing. Hidden Identity Records pathway opened.",
      failText="The interruption forces Haakon to stop. He completes it eventually, but the factor hall agents have reported the presence of the account.",
      checkStat="STR", checkDC=13,
      checkPassFlag="erfC3A3Done",
      activateCond="() => !!S_story.erfC3A2Done",
      monster="Factor Hall Agents ×2", monsterHP=19, monsterAC=12)

quest("erf_03_act4",
      "The Name in the Forest — The Innkeeper's Daughter",
      "The innkeeper's daughter wants to read the oilcloth page. She is serious about the request — not curious, specifically interested. The account cannot be shown. She accepts the refusal if she believes you take her seriously.",
      activateNode="BK",
      passText="She accepts the refusal. You answered her seriously without showing it. The road to Weimar is clear.",
      failText="She sees dismissal in your refusal. She finds another way to learn what was on the page. Someone on the road knows before Weimar.",
      checkStat="CON", checkDC=12,
      checkPassFlag="erfC3A4Done",
      activateCond="() => !!S_story.erfC3A3Done")

quest("erf_03_act5",
      "The Name in the Forest — Hidden Identity Records",
      "Sweelinck reads the morning copy and Haakon's notation. The Baltic factor mark argues accuracy. Hidden Identity Records opens.",
      activateNode="WM",
      passText="The morning copy is accurate: one name, one fire, one night in a forest three miles from any road. Haakon's notation confirms the account's provenance. Hidden Identity Records filed.",
      failText="The factor mark is missing or incomplete. The archive cannot open Hidden Identity Records on a single-source account without a provenance notation.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC3A5Done",
      activateCond="() => !!S_story.erfC3A4Done",
      takeItem="The Charcoal-Burner's Account — filed under Hidden Identity Records at Weimar")

# ─── Cycle 4: The Third Task ──────────────────────────────────────────────
say("ERF cycle 4 The Third Task: countersigned contract carried to the lord's notary before vespers — source Grimm's Fairy Tales 1812 — nodes ERF VEN WM — quest chain erf_04_act1 through erf_04_act5")

quest("erf_04_act1",
      "The Third Task — The Witness's Signature",
      "Three independent witnesses have already withdrawn. The contract's first two tasks are completed and sealed. The third task requires an independent witness to countersign before vespers. The lord's agents are not trying to steal the document — they are ensuring no qualified witness arrives in time. Recognize the concealment without pressing on it; sign without conditions.",
      activateNode="ERF",
      passText="The concealment recognized without pressing. The contract signed without conditions. You are now the witness the lord's agents will work to stop.",
      failText="Your questions about the withdrawn witnesses alert the lord's agents that you understand the concealment. They adjust their strategy.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC4A1Done",
      activateCond="() => !!S_story.erfC3A5Done",
      grantItem="The Countersigned Contract — two tasks completed and sealed; third task documented; the lord's notary must receive it before vespers; the lord's agents are watching the main road")

quest("erf_04_act2",
      "The Third Task — The Lower Valley Path",
      "The lord's toll gate is on the main road. The lower valley path avoids it: two miles longer, two unmarked fords, low river season.",
      activateNode="ERF",
      passText="The lower valley path navigated: two fords, low water, two miles longer. The toll gate was not passed. You arrive at Venice ahead of the lord's agents on the main road.",
      failText="The river is higher than expected at the second ford. You lose time and arrive at Venice at the same moment as the lord's agent from the main road.",
      checkStat="STR", checkDC=12,
      checkPassFlag="erfC4A2Done",
      activateCond="() => !!S_story.erfC4A1Done")

quest("erf_04_act3",
      "The Third Task — The Undated Addendum",
      "The advocate's document agent has an undated addendum to the original contract, which he claims supersedes the third task requirement. An undated addendum cannot modify a signed contract retroactively. The notary knows but will not name it first.",
      activateNode="VEN",
      passText="The undated addendum cannot modify a signed contract retroactively. Named in one sentence. The notary agrees on record. The addendum fails.",
      failText="The agent's procedural argument catches the notary's hesitation before the principle is named. The addendum gains standing.",
      checkStat="CHA", checkDC=14,
      checkPassFlag="erfC4A3Done",
      activateCond="() => !!S_story.erfC4A2Done",
      monster="Advocate's Document Agent ×1", monsterHP=21, monsterAC=13)

quest("erf_04_act4",
      "The Third Task — The Seven-Minute Margin",
      "The lord's rider wants the Fighter to hedge about the seven-minute margin between the receipt stamp and vespers. The receipt is dated. The fact is stated once without qualification.",
      activateNode="VEN",
      passText="The receipt is dated. Seven minutes before vespers. Stated once, without qualification. The rider's hedging request refused.",
      failText="Your answer implies the margin might be disputed. The lord's rider files an objection about the receipt's dating.",
      checkStat="CON", checkDC=11,
      checkPassFlag="erfC4A4Done",
      activateCond="() => !!S_story.erfC4A3Done")

quest("erf_04_act5",
      "The Third Task — Contract Completion Records",
      "Sweelinck reads the receipt stamp: seven minutes. The third task is always the trap. Contract Completion Records opens.",
      activateNode="WM",
      passText="Seven minutes before vespers. The third task is always the trap; the trap failed. Contract Completion Records filed alongside the completed first and second tasks.",
      failText="The receipt stamp's authenticity is questioned. The archive cannot file a contract completion without an undisputed receipt.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC4A5Done",
      activateCond="() => !!S_story.erfC4A4Done",
      takeItem="The Countersigned Contract — filed under Contract Completion Records at Weimar")

# ─── Cycle 5: Godfather's Ledger ──────────────────────────────────────────
say("ERF cycle 5 Godfather's Ledger: physician's compliance ledger documents every decision to let patients die per covenant terms — source Grimm's Fairy Tales 1812 — nodes ERF CON WM — quest chain erf_05_act1 through erf_05_act5")

quest("erf_05_act1",
      "Godfather's Ledger — The Physician's Commission",
      "The physician is dying. The ledger is at the bedside: complete, meticulous, and entirely on his side. Every compliance decision documented with full notation — including the two times he violated the covenant. The guild has filed a complaint saying he let people die. The ledger proves he was contractually obligated to let them die.",
      activateNode="ERF",
      passText="One question demonstrates understanding of the compliance structure. The physician knows the ledger will be received with context, not just carried.",
      failText="No question demonstrates understanding. The physician worries the ledger will be taken without context, which makes the violation entries unexplainable.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC5A1Done",
      activateCond="() => !!S_story.erfC4A5Done",
      grantItem="The Physician's Ledger — covenant record predating guild jurisdiction; every compliance decision with notation; two violation entries with marginal notes; the guild's case depends on the ledger not arriving")

quest("erf_05_act2",
      "Godfather's Ledger — The Guild Subpoena",
      "The guild subpoena covers guild records. The ledger is a covenant record predating guild jurisdiction. The distinction must be named precisely at the transit checkpoint before Constantinople.",
      activateNode="ERF",
      passText="The guild subpoena covers guild records. The ledger is a covenant record predating guild jurisdiction. The clerk accepts the distinction. Through the checkpoint.",
      failText="The clerk treats the jurisdictional question as unresolved. He sends a query to the guild office. The delay is logged.",
      checkStat="CHA", checkDC=13,
      checkPassFlag="erfC5A2Done",
      activateCond="() => !!S_story.erfC5A1Done")

quest("erf_05_act3",
      "Godfather's Ledger — The Archive Authentication",
      "The archivist in Constantinople needs twelve minutes for authentication. The guild archive deputy is watching. Authentication must be completed without the deputy claiming the archivist acted under duress.",
      activateNode="CON",
      passText="Conditions created: the deputy cannot claim duress. The archivist completes authentication in twelve minutes. The guild's case collapses on the violation entries.",
      failText="The deputy successfully claims the archivist acted under duress. Authentication suspended. The guild's objection is logged.",
      checkStat="STR", checkDC=12,
      checkPassFlag="erfC5A3Done",
      activateCond="() => !!S_story.erfC5A2Done",
      monster="Guild Archive Sentries ×2", monsterHP=20, monsterAC=13)

quest("erf_05_act4",
      "Godfather's Ledger — The District of Association",
      "A preservation order at the waystation between Constantinople and Weimar. The order requires a guild associate in his district of association. The waystation master is outside his district.",
      activateNode="CON",
      passText="The waystation master is outside his district of association. The preservation order requires an in-district associate. The mechanism named before he begins the receipt process.",
      failText="The mechanism named after the receipt process begins. The waystation master must stop mid-process, which creates an administrative complication.",
      checkStat="WIS", checkDC=12,
      checkPassFlag="erfC5A4Done",
      activateCond="() => !!S_story.erfC5A3Done")

quest("erf_05_act5",
      "Godfather's Ledger — Compact Compliance Records",
      "Sweelinck reads three minutes forward, finds the violation entries, reads the marginal note. The guild has no case. Compact Compliance Records opens.",
      activateNode="WM",
      passText="The violation entries are documented. The marginal notes explain each violation. The ledger proves compliance was the rule, not the exception. Compact Compliance Records filed.",
      failText="The authentication gap makes the violation entries unverifiable. The archive cannot file a compliance record with disputed authentication.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC5A5Done",
      activateCond="() => !!S_story.erfC5A4Done",
      takeItem="The Physician's Ledger — filed under Compact Compliance Records at Weimar")

# ─── Cycle 6: The Bones' Song ──────────────────────────────────────────────
say("ERF cycle 6 The Bones' Song: priest's account of bone arrangement in a field proves murder against natural-death claim — source Grimm's Fairy Tales 1812 — nodes ERF ROM WM — quest chain erf_06_act1 through erf_06_act5 — RME to ROM substitution")

quest("erf_06_act1",
      "The Bones' Song — The Successor's Discovery",
      "A priest found bones under a juniper tree while checking field drainage. He documented the arrangement — burial posture, impact angles, the difference between bones scattered by animals and bones in their last position. He is dead; his successor found the account while sorting old records. The victim's surviving brother claims natural death. The bone arrangement says otherwise.",
      activateNode="ERF",
      passText="One acknowledgment that bringing the account was correct, stated clearly. The young priest releases the folder.",
      failText="The young priest hesitates, waiting for stronger confirmation. He releases the folder eventually but without confidence the carrier understood what it contained.",
      checkStat="CHA", checkDC=11,
      checkPassFlag="erfC6A1Done",
      activateCond="() => !!S_story.erfC5A5Done",
      grantItem="The Priest's Account — field drainage notes; bone arrangement: burial posture, impact angles, last position; the priest didn't know he was filing testimony; diocesan hold applies at the Alpine checkpoint")

quest("erf_06_act2",
      "The Bones' Song — The Alpine Checkpoint",
      "The diocesan hold applies at the Alpine checkpoint on the main road. The east pass avoids it: four hours longer, weather window at risk.",
      activateNode="ERF",
      passText="The east pass navigated before the weather window closes. The diocesan checkpoint was not passed. The account arrives in Rome ahead of the hold.",
      failText="The weather window closes partway through the east pass. A delay of two hours means arriving in Rome later than planned.",
      checkStat="STR", checkDC=13,
      checkPassFlag="erfC6A2Done",
      activateCond="() => !!S_story.erfC6A1Done")

quest("erf_06_act3",
      "The Bones' Song — Fra Bartolomeo",
      "Fra Bartolomeo is uncomfortable, not corrupt. He is the diocesan record clerk in Rome who must authenticate the account. Authentication is a technical act requiring no judgment about the brother's letter. Give him the mechanism.",
      activateNode="ROM",
      passText="Authentication is a technical act. Fra Bartolomeo performs it as technical work. The account is authenticated without requiring him to judge the brother's claim.",
      failText="Fra Bartolomeo treats the authentication as a judgment call and defers to the diocesan hierarchy. The delay is noted.",
      checkStat="WIS", checkDC=13,
      checkPassFlag="erfC6A3Done",
      activateCond="() => !!S_story.erfC6A2Done",
      monster="Diocesan Record Clerk ×1", monsterHP=14, monsterAC=11)

quest("erf_06_act4",
      "The Bones' Song — The External Road",
      "A civil process server is trying to serve the Fighter at the city gate. Service requires acknowledgment. The external road avoids the city gate entirely: six hours, three unmarked fords, two days of rain.",
      activateNode="ROM",
      passText="The external road taken. Service was never completed. The account arrives at Weimar without the civil process attached.",
      failText="The city gate approached. The server completes service. The account travels to Weimar with a civil process attached that requires response.",
      checkStat="CON", checkDC=12,
      checkPassFlag="erfC6A4Done",
      activateCond="() => !!S_story.erfC6A3Done")

quest("erf_06_act5",
      "The Bones' Song — Environmental Testimony Records",
      "Sweelinck traces the impact angle. Seventeen years as a drainage anomaly. The priest didn't know he was filing testimony. Environmental Testimony Records opens.",
      activateNode="WM",
      passText="Impact angle traced. Last position confirmed. Seventeen years in a drainage ditch. The priest's field notes are testimony. Environmental Testimony Records filed.",
      failText="The authentication gap makes the angle analysis unverifiable. The archive cannot open Environmental Testimony Records on an unauthenticated bone account.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC6A5Done",
      activateCond="() => !!S_story.erfC6A4Done",
      takeItem="The Priest's Account — filed under Environmental Testimony Records at Weimar")

# ─── Cycle 7: The Name in the Soup ────────────────────────────────────────
say("ERF cycle 7 Name in the Soup: steward filed her name in a soup dish so it would enter the permanent kitchen inventory — source Grimm's Fairy Tales 1812 — nodes ERF LDN WM — quest chain erf_07_act1 through erf_07_act5 — FINAL CYCLE questComplete")

quest("erf_07_act1",
      "The Name in the Soup — The Steward's Patience",
      "The steward's patience was intentional. She put her name in the soup — scratched it into the base of a serving bowl before it was fired — so that when the bowl entered the permanent kitchen inventory, her name entered with it. She knew the filing system well enough to know that a name in a kitchen inventory record would outlast any administrative purge. The steward is no longer in a position to explain this. Recognize that the filing was not ignorance.",
      activateNode="ERF",
      passText="The filing was intentional: a name hidden in a soup dish because the kitchen inventory would outlast the administrative record. The account is taken without further questions about the soup.",
      failText="You ask further questions about the soup. The steward's filing mechanism is misunderstood as accident rather than design.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC7A1Done",
      activateCond="() => !!S_story.erfC6A5Done",
      grantItem="The Kitchen Inventory Account — the bowl's base inscription; the steward's name in a soup dish; the permanent kitchen inventory is not subject to administrative purge; the purge clerk is on a faster boat")

quest("erf_07_act2",
      "The Name in the Soup — The Faster Boat",
      "The purge clerk is on a faster boat with an early-purge authorization. Arrive at the London records office before the authorization is logged in.",
      activateNode="ERF",
      passText="At the London records office before the purge authorization is logged. The bowl's account is retrieved before the purge window opens.",
      failText="The purge authorization is logged before you arrive. The records clerk is reading the early-purge list when you walk in.",
      checkStat="STR", checkDC=12,
      checkPassFlag="erfC7A2Done",
      activateCond="() => !!S_story.erfC7A1Done")

quest("erf_07_act3",
      "The Name in the Soup — The Fifth Shelf",
      "The old filing code appears on exactly one folder in the reorganized London records office. It is on the fifth shelf. Purge authorization sentries are locking the stacks. Find it before the stacks close.",
      activateNode="LDN",
      passText="Fifth shelf, old filing code, one folder. Found before the sentries lock the stacks. The bowl's account retrieved.",
      failText="The stacks lock before the folder is found. The account is inside a locked records office under purge authorization.",
      checkStat="WIS", checkDC=13,
      checkPassFlag="erfC7A3Done",
      activateCond="() => !!S_story.erfC7A2Done",
      monster="Purge Authorization Sentries ×2", monsterHP=17, monsterAC=12)

quest("erf_07_act4",
      "The Name in the Soup — The Review Window",
      "The complaint requires acknowledgment to be valid. A document retrieved before the early-purge authorization was logged is not subject to the review window. State it once without engaging the framing.",
      activateNode="LDN",
      passText="Retrieved before the authorization was logged. Not subject to the review window. Stated once. The complaint fails.",
      failText="Engaging the framing implies the review window might apply. The complaint gains a procedural foothold.",
      checkStat="CON", checkDC=12,
      checkPassFlag="erfC7A4Done",
      activateCond="() => !!S_story.erfC7A3Done")

quest("erf_07_act5",
      "The Name in the Soup — Recovered Identity Records",
      "Sweelinck reads her name. She put it in the soup so he had to file it. Recovered Identity Records opens. The Grimm series is complete.",
      activateNode="WM",
      passText="Her name in a soup dish in a kitchen inventory that outlasted every administrative purge. Sweelinck reads it and files it. Recovered Identity Records open. Grimm series complete.",
      failText="The bowl account's chain of custody is incomplete. The archive cannot open Recovered Identity Records without a confirmed retrieval record.",
      checkStat="WIS", checkDC=11,
      checkPassFlag="erfC7A5Done",
      activateCond="() => !!S_story.erfC7A4Done",
      takeItem="The Kitchen Inventory Account — filed under Recovered Identity Records at Weimar",
      questComplete=True)

# ─── Post-import audit ────────────────────────────────────────────────────
say("ERF import complete: post-import audit — Grimm's Fairy Tales Brothers Grimm 1812 — 7 cycles 5 acts 35 quests — nodes ERF STB GLD CI DNG CHC ANT PRH — checking final counts")
audit = api("get", "/api/audit")
parse = {p["section"]: p["count"] for p in audit.get("parse", [])}
print(f"Post-import: {parse.get('NODE_MAP')} nodes, {parse.get('QUEST_DB')} quests")
