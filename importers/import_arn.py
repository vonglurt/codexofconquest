#!/usr/bin/env python3
# ═══════════════════════════════════════════════════════════════════════════
# ⚠️  ARCHAIC — OUT OF DATE.  Historical one-shot importer (POSTs to the
#     localhost:1367 WBAPI).  Content was long ago imported and lives in
#     roll2hit-v3.html.  This script likely NO LONGER RUNS against the current
#     server/schema.  Kept for reference only — do not run without review.
#     Import history: BACKLOG.md / plan-archive.md / 1367-sources/.
# ═══════════════════════════════════════════════════════════════════════════
"""§IMPORT-100 ARN: Knights of the Cross (Sienkiewicz, 1900, set 1399) — 35 acts, 7 cycles"""

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

def quest(id, title, desc, activateNode, passText, failText, checkStat, checkDC,
          checkPassFlag=None, activateCond=None, questComplete=False,
          monster=None, monsterHP=None, monsterAC=None):
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
    if checkPassFlag:  payload["checkPassFlag"]  = checkPassFlag
    if activateCond:   payload["activateCond"]   = activateCond
    if questComplete:  payload["questComplete"]  = True
    if monster:        payload["monster"]        = monster
    if monsterHP:      payload["monsterHP"]      = monsterHP
    if monsterAC:      payload["monsterAC"]      = monsterAC
    api("post", "/api/quest", json=payload, headers={"X-Nonce": nonce})
    print(f"  OK: {id} — {title}")

def main():
    say("§IMPORT 100 ARN. Knights of the Cross. Sienkiewicz, 1900, set 1399. "
        "Creating nodes Kraków, Spychów, Teutonic Border, Chapel near Mazovian border.")

    print("=== §IMPORT-100 ARN: Knights of the Cross ===")

    # --- Nodes ---
    print("\n-- Nodes --")
    create_node("KRK", "city", "Kraków — Polish Royal Court",
                1, 112, 212,
                "The royal capital: stone streets, a castle above the city, the chancery building "
                "adjacent to the cathedral, clerks and diplomats and nobles in the anteroom, the smell "
                "of beeswax and ink and diplomatic tension; the place where competing versions of events "
                "are adjudicated by people who must choose which record to make permanent.")
    create_node("JUR", "camelot", "Spychów — Jurand's Castle",
                1, 108, 212,
                "A timber-and-stone fortified manor on the Polish-Teutonic border in Mazovia: "
                "frost-hardened earth, a small village under the castle's shadow, the smell of pine "
                "smoke and horse; a frontier holding that has been fighting the same war for twenty years.")
    create_node("TKT", "road", "Teutonic Border Crossing — The Order's Gate",
                1, 104, 212,
                "A fortified timber gate on the Order's territorial boundary: raised road through flat "
                "marshland, two watchtowers, a customs post, the Order's black-cross banner over the "
                "gate; cold, procedurally exact, staffed by men trained to treat every crossing as "
                "potentially hostile.")
    create_node("CHP", "camelot", "Chapel Near the Mazovian Border",
                1, 108, 210,
                "A small stone chapel room near the Mazovian border: tallow candle on a table, winter "
                "light through a narrow window, a bench and a locked almery; a stopping place for "
                "travelers between the Order's territory and Spychów; the kind of space where a man "
                "who has been carrying something for eleven days finally finds someone to trust with it.")

    say("Nodes created. Beginning cycle 1: Jurand's Scratch. "
        "Source: Knights of the Cross, Sienkiewicz. "
        "Node route Spychów, Teutonic border, Kraków. "
        "Token: The Witnesses' Sealed Account.")

    # --- Cycle 1: Jurand's Scratch ---
    print("\n-- Cycle 1: Jurand's Scratch --")
    quest("arn_01_act1", "The Three Farmers",
          "Three Polish farmers sit in the castle's outer hall looking like men who know they are "
          "about to put their names on something large. Sigismund, the eldest, does most of the "
          "talking. He describes what they found: the man in the snow, the wounds, the way he "
          "would not stop trying to communicate, and finally the cross he scratched in the dirt "
          "with his remaining fingers until they understood. They know what putting their seals "
          "on this document will cost them if the Order's factor learns they exist.",
          "JUR",
          "You give them the practical argument: their account is already known to the steward "
          "and the parish priest; the document is the thing that makes it useful rather than "
          "merely existing. Names on paper are safer than names circulating in rumor, which can "
          "be denied; paper, properly sealed, reaches the chancellor. They sign. They look "
          "relieved in the way people do when a decision they have been avoiding is made for them.",
          "Sigismund will not sign without a guarantee of protection for his family if the Order "
          "learns. You cannot promise what you don't have. The parish priest witnesses instead; "
          "the document goes out with fewer seals than planned but still authentic and still useful.",
          "CHA", 13,
          checkPassFlag="arnC1A1Done")

    quest("arn_01_act2", "The Order's Crossing",
          "The Order's border post is timber-framed, manned by two brothers-in-arms and a "
          "civilian toll-keeper. They stop everything. They read wrappings and check "
          "load-manifests. The officer who runs the post is not cruel — he is procedurally exact. "
          "He asks: what is in the sealed packet? You give a partial truth: a legal document "
          "addressed to the royal chancellor. He is not satisfied. He asks who authorized the seal.",
          "TKT",
          "You name the parish priest — a name the officer recognizes as belonging to Polish "
          "ecclesiastical jurisdiction, outside the Order's remit. Sealed parish correspondence "
          "to the royal chancellor is not something the crossing officer wants to be the man who "
          "stopped. He waves you through.",
          "He holds you at the post until his superior arrives. Two hours, cold, the document "
          "inside your coat. The superior also lets you through — he is even less interested in "
          "the ecclesiastical question — but the delay means the Order's courier who was also at "
          "the post has a two-hour head start toward Kraków.",
          "CHA", 14,
          checkPassFlag="arnC1A2Done",
          activateCond="() => !!S_story.arnC1A1Done")

    quest("arn_01_act3", "The Factor's Man",
          "Three miles past the border a man on a horse falls in behind you. He is not uniformed. "
          "He is not threatening in any visible way. He has been at the border post since before "
          "you arrived and he left twenty minutes after you did. He is keeping exactly the same "
          "distance behind you through two changes of road direction, which is not accidental.",
          "TKT",
          "You identify the tail before he commits to an action, which gives you the choice of "
          "pace and route. You take a farm track that rejoins the main road five miles south "
          "through terrain that makes following difficult; when you rejoin the road he is not "
          "visible behind you.",
          "You do not identify him until he has closed the distance enough to force a "
          "confrontation. He does not want to fight — he wants to see what you are carrying. "
          "The confrontation is short and ends with him on the ground and you moving fast.",
          None, None,
          checkPassFlag="arnC1A3Done",
          activateCond="() => !!S_story.arnC1A2Done",
          monster="Teutonic factor's informant", monsterHP=15, monsterAC=11)

    quest("arn_01_act4", "The Envoy's Session",
          "The Teutonic Order's diplomatic envoy arrived in Kraków two days ago. He has been "
          "describing Jurand of Spychów as a notorious aggressor whose current condition is the "
          "result of his own recklessness entering an Order garrison armed. The version is "
          "detailed, internally consistent, and supported by two signed Teutonic depositions. "
          "The chancellor's session where this testimony closes is happening this afternoon. "
          "You need the counter-document in the chancellor's hands before the session closes.",
          "KRK",
          "The chancellor's gate-clerk knows what a parish seal looks like and understands that "
          "testimony running opposite to the Order's version is exactly what the chancellor "
          "wants to see before concluding. He interrupts the session. The chancellor receives "
          "you. The session is extended.",
          "The gate-clerk will not interrupt a diplomatic session for an unknown carrier. You "
          "go around — find a Polish noble who can vouch for the Spychów cross — and get in "
          "through a side introduction. Slower. More witnessed. Still effective.",
          "CHA", 15,
          checkPassFlag="arnC1A4Done",
          activateCond="() => !!S_story.arnC1A3Done")

    quest("arn_01_act5", "The Chancellor's Table",
          "The chancellor is a careful man. He reads the document twice. He examines the parish "
          "seal. He asks two questions about the crossing and the farmers' names and whether any "
          "of them were previously known to the Order's factor in the district — he wants to "
          "establish that this is not a prepared counter-document. You answer what you know. He "
          "sets the document beside the Order's depositions on his table. They sit there together: "
          "the smooth diplomatic vellum and the parish-sealed linen. He says: both documents "
          "will be entered into the record.",
          "KRK",
          "You read the pause before 'both documents.' He believes the farmers. He cannot say "
          "so in a room still technically in diplomatic session. But the record will contain "
          "what happened to Jurand, in a voice the Order cannot erase, beside the Order's "
          "version — and the difference is visible to anyone who reads both.",
          "You cannot read him at all. You have done what you were sent to do. The document "
          "is in the record. Whether the truth survives the process of records is a question "
          "above your pay.",
          "WIS", 12,
          checkPassFlag="arnC1A5Done",
          activateCond="() => !!S_story.arnC1A4Done")

    say("Cycle 1 complete. Beginning cycle 2: Danusia's Last Song. "
        "Token: Danusia's Death-Witness Record. "
        "Node route: Chapel near Mazovian border to Spychów.")

    # --- Cycle 2: Danusia's Last Song ---
    print("\n-- Cycle 2: Danusia's Last Song --")
    quest("arn_02_act1", "The Hospital Brother",
          "The brother is middle-aged and careful and has been carrying this record for eleven "
          "days, not knowing who to trust with it. He was present when Danusia died in Zbyszko's "
          "arms. He wrote down what she said immediately after — not as an account for anyone, "
          "just because he is the kind of man who writes things down when he witnesses them — "
          "and then he understood that what he had written had to reach Jurand at Spychów and "
          "he had no way to get it there himself. He is looking at you with the specific "
          "expression of a man deciding whether to trust.",
          "CHP",
          "You understand. You don't say much. The brother holds your gaze for a moment, then "
          "slides the folded vellum across the table. He does not mean: can you read. He means: "
          "can you read these words, in that room, to that man, without flinching or softening "
          "or stopping partway through. You demonstrate that you understand the difference.",
          "You give assurances that are technically accurate but miss the nature of the request. "
          "The brother gives you the record but his uncertainty about your readiness follows "
          "the vellum all the way to Spychów.",
          "WIS", 12,
          checkPassFlag="arnC2A1Done")

    quest("arn_02_act2", "The Border Patrol",
          "Three Teutonic knights on the border track ahead. They are checking travelers "
          "coming from the west toward Polish territory in winter. Your timing and direction "
          "— from a chapel near the Mazovian border toward Spychów — is not their business, "
          "technically, but they are the kind of men who make things their business. You could "
          "explain what the death-record is. The explanation would be accurate. But naming "
          "Danusia, naming Jurand, naming the circumstances will consume three hours. The "
          "marsh on the left side of the track is frozen, probably solid enough to bear "
          "weight in the dark.",
          "CHP",
          "The frozen marsh holds. You move through the dark at the track's edge. The patrol's "
          "torches diminish behind you. You are on the main road again before the moon rises.",
          "They see you. You go through the explanation. It costs three hours and the patrol's "
          "attitude about Jurand makes you choose your words very carefully. You are cold and "
          "late when you continue.",
          "DEX", 12,
          checkPassFlag="arnC2A2Done",
          activateCond="() => !!S_story.arnC2A1Done")

    quest("arn_02_act3", "The Marsh Crossing",
          "The path through the deeper marsh is a summer route, normally. In winter it is ice "
          "over standing water with a narrow section where the ice will bear one person at a "
          "time moving carefully. You are carrying a piece of vellum wrapped in oilcloth. The "
          "oilcloth protects against splash; it does not protect against submersion. The narrow "
          "section is forty feet. The ice gives out a specific sound when it is close to failing. "
          "You must cross this section before dark. There is no other route to Spychów that "
          "does not add two days.",
          "JUR",
          "You cross in four minutes, testing each step. The ice groans twice but holds. You "
          "are on the solid path again before the sound resolves itself into anything decisive.",
          "You go through up to your knee. The oilcloth does its job. You are cold and wet "
          "and delayed and need an hour at a farmhouse fire before you can continue. The "
          "record is intact but the afternoon is gone.",
          "STR", 13,
          checkPassFlag="arnC2A3Done",
          activateCond="() => !!S_story.arnC2A2Done")

    quest("arn_02_act4", "The Castle's Caretaker",
          "The woman at Spychów's gate is one of the sisters who have been caring for Jurand "
          "since he was returned. She is not hostile — she is protective, and she has spent "
          "three months deciding who is allowed to see him and who is not. A stranger arriving "
          "with a message from someone who was with Danusia is exactly the kind of thing she "
          "has been turning away since the first week. She is not going to let you through "
          "on your word.",
          "JUR",
          "You describe the hospital brother specifically enough — the chapel, the eleven days, "
          "the tallow candle on the table, the folded vellum — that she can confirm the source. "
          "She looks at you for a long moment. She steps aside. 'He is in the east room. "
          "I will come with you.'",
          "She will not let you through tonight. You sleep in the village and try again in the "
          "morning. By morning her superior has been consulted and the process becomes slower.",
          "CHA", 13,
          checkPassFlag="arnC2A4Done",
          activateCond="() => !!S_story.arnC2A3Done")

    quest("arn_02_act5", "Jurand's Room",
          "The east room is warm and quiet. Jurand is in a low chair near the fire. He is "
          "enormous — or was; the injuries have left a man who was enormous — and he is looking "
          "at you with the specific attention of a man who has learned to gather everything "
          "from faces and voices because those are what remain available to him. You unfold "
          "the vellum. You show him the brother's seal. He cannot see it clearly but he nods. "
          "You read. The three sentences are what a woman says when she knows she is dying "
          "and she wants the person she loves to know specific things, and one of the things "
          "is her father, who is not there.",
          "JUR",
          "Three sentences. His daughter's voice through the hospital brother's careful hand "
          "and your voice. The fire burns. Jurand does not move. After a long moment he puts "
          "one ruined hand over the other in his lap, which is the only gesture available to "
          "him, and he nods once. You give the vellum to the sister on your way out. "
          "It belongs at Spychów.",
          "Your voice changes on the third sentence. You get through it, but something in "
          "the change is visible to the man in the chair. He understands. But it was not "
          "the clean delivery.",
          "CON", 11,
          checkPassFlag="arnC2A5Done",
          activateCond="() => !!S_story.arnC2A4Done")

    say("Cycle 2 complete. Beginning cycle 3: Danusia's Veil. "
        "Token: Danusia's Intercession Veil. "
        "Node route: Kraków, Birka, Weimar.")

    # --- Cycle 3: Danusia's Veil ---
    print("\n-- Cycle 3: Danusia's Veil --")
    quest("arn_03_act1", "The Chancery File",
          "The court clerk who handled the intercession proceeding has kept Danusia's white "
          "head-cloth in the chancery file. He was present at the scaffold. He knows what "
          "the act cost her — she was a child who did not know what she had done until the "
          "court acknowledged it, and what she had done was formally claim a condemned man "
          "under Polish customary law, using the only instrument available to her. The chancery "
          "file is being cleared. The cloth has no official classification. He wants to give "
          "it to someone who understands that it is a legal document before it is a "
          "personal memory.",
          "KRK",
          "You give it back to him in the right order: the formal claim, the court's "
          "acknowledgment, the return of the cloth to Danusia after the proceedings. He holds "
          "your gaze for a moment. He lifts the veil from the chancery file and sets it "
          "in your hands.",
          "You take the veil without fully demonstrating you understand the legal weight. "
          "He gives it to you with the hesitation of a man handing something important to "
          "someone who may not know why it matters.",
          "WIS", 11,
          checkPassFlag="arnC3A1Done")

    quest("arn_03_act2", "Macko on the Northern Road",
          "Macko of Bogdaniec intercepts you on the northern road out of Kraków. He knows "
          "the veil is being moved; the steward told him. He wants it to stay in Poland. "
          "His argument is not about possession — it is about where things like this belong. "
          "The archive preserves what courts discard; the chancery file is being cleared. "
          "Closed proceedings go to storage; unusual items disappear. You have one argument "
          "available: the archive holds what no Polish court has a category for.",
          "KRK",
          "The chancery file is being cleared. The cloth will disappear into storage with "
          "no category and no way back. The archive preserves the sequence: the act, the "
          "acknowledgment, the keeping, the end. He stands aside, unhappy but honest about "
          "why he is wrong.",
          "He is not persuaded by the archival argument. You find an alternate route north "
          "before he formally objects. His grief is genuine; it has not changed what the "
          "document is.",
          "CHA", 12,
          checkPassFlag="arnC3A2Done",
          activateCond="() => !!S_story.arnC3A1Done")

    quest("arn_03_act3", "The Harbor Contact",
          "A Teutonic courier in Birka recognizes you and reports to his contact in the "
          "harbor district. The Order has a sustained interest in suppressing evidence of "
          "Danusia's existence and the legal intercession that created the evidentiary trail "
          "leading back to her father. The veil is one end of that trail. A hired man "
          "approaches when you enter the harbor square.",
          "BK",
          "He is down in the harbor district. The cloth is intact in the document wallet. "
          "You keep moving east toward the road to Weimar.",
          "He delays you long enough that the evening gate closes. You spend the night inside "
          "the city with the veil before continuing in the morning.",
          None, None,
          checkPassFlag="arnC3A3Done",
          activateCond="() => !!S_story.arnC3A2Done",
          monster="Teutonic Order courier's contact", monsterHP=19, monsterAC=12)

    quest("arn_03_act4", "The Road Question",
          "Three days east of Birka, on the road to Weimar, a traveler asks about the white "
          "cloth visible at the top of your pack. He is not a threat — he is curious, the "
          "way travelers are curious on long roads. The veil travels as linen goods. The "
          "question requires an answer that is accurate and uninteresting.",
          "BK",
          "Linen goods, you tell him. He looks at the cloth once and rides on. Three days "
          "to Weimar.",
          "You say more than is necessary. He loses interest before you finish, but the "
          "exchange cost you something in road pace.",
          "CON", 11,
          checkPassFlag="arnC3A4Done",
          activateCond="() => !!S_story.arnC3A3Done")

    quest("arn_03_act5", "Intercession Records",
          "Sweelinck examines the cloth. He notes the court clerk's documentation attached "
          "to the bundle — the formal proceeding, the date, the court's acknowledgment of "
          "the claim. He reads the clerk's description of the act: a maiden's intercession "
          "under Polish customary law, performed at a public execution, legally sufficient "
          "to delay the sentence. He sets the cloth in the archive space.",
          "WM",
          "Sweelinck opens Intercession Records. She was a child. She knew what she was "
          "doing. The court acknowledged it. The cloth went back to her. She kept it until "
          "she died. The archive holds the sequence.",
          "Sweelinck receives the cloth. He will categorize it when he has examined the "
          "documentation properly.",
          "WIS", 10,
          checkPassFlag="arnC3A5Done",
          activateCond="() => !!S_story.arnC3A4Done")

    say("Cycle 3 complete. Beginning cycle 4: Zbyszko's Battle Vow. "
        "Token: Zbyszko's Battle Vow Parchment. "
        "Node route: Kraków, Venice, Weimar.")

    # --- Cycle 4: Zbyszko's Battle Vow ---
    print("\n-- Cycle 4: Zbyszko's Battle Vow --")
    quest("arn_04_act1", "The Herald's Problem",
          "The royal herald who sealed Zbyszko's battle vow also made the completion notation "
          "when it was reported to the court. He did not know Danusia was dead when he added "
          "the date. He found out afterward. He cannot look at his own handwriting in the "
          "completion line. He wants the parchment to leave the chancery. The document is "
          "not a failure and not a tragedy — it is a completion with nowhere to arrive. "
          "Understand what the document is before the road.",
          "KRK",
          "The document is what was promised, completed when promised, with nowhere to arrive "
          "— which is a different category than failed or tragic. The herald understands you "
          "understand. He hands it over with the relief of a man setting down something too "
          "heavy for an office hallway.",
          "You take it. The distinction settles on the road south when you understand what "
          "the completion notation is and what it sits next to.",
          "WIS", 12,
          checkPassFlag="arnC4A1Done")

    quest("arn_04_act2", "The Knight on the Southern Road",
          "A Polish knight on the road south served with Zbyszko in two of the three combats "
          "the vow required. He wants to know why the vow document is leaving Poland. His "
          "concern is specific: three Teutonic Knights are named in the completion notation "
          "and the Order has active diplomatic interest in how those deaths are characterized "
          "in official records.",
          "KRK",
          "The archive holds the record of the vow and its completion, not a war crimes "
          "account. The names are in the vow because Zbyszko named his opponents as the "
          "vow's terms before anyone was dead. He lets you continue south.",
          "He is not persuaded by the archival distinction. You find an alternate road south. "
          "The argument was correct; it was not the right argument for this man.",
          "CHA", 12,
          checkPassFlag="arnC4A2Done",
          activateCond="() => !!S_story.arnC4A1Done")

    quest("arn_04_act3", "The Venetian Scholar",
          "A Venetian legal scholar in the harbor district identifies the parchment as a "
          "formal chivalric instrument and wants to use it in a treatise on oath-enforcement "
          "across European legal traditions. He offers a significant sum and offers to "
          "translate it into Latin. The parchment is sealed. The archive receives it in "
          "the original language, in its current form, with the completion notation intact.",
          "VEN",
          "After it arrives at the archive, a copy for scholarly use can be arranged through "
          "the archive's copying service. He accepts these terms and gives you his address "
          "for the copy request.",
          "He is disappointed by the refusal to sell. He lets you leave, but he has taken "
          "enough notes about the document's visible details that his treatise will reference "
          "it from description rather than from the text.",
          "CHA", 13,
          checkPassFlag="arnC4A3Done",
          activateCond="() => !!S_story.arnC4A2Done")

    quest("arn_04_act4", "The Alpine Road",
          "Alpine road north of Venice. Three days to Weimar. The parchment is in the sealed "
          "wallet. The completion notation is inside — the three names, the three dates, and "
          "the line in a different hand below them. Nothing requires looking at it between "
          "here and delivery. The road is cold and clear.",
          "VEN",
          "Three days. The wallet stays sealed. The road is cold and clear. You deliver the "
          "parchment intact to Weimar without adding anything to what Zbyszko sealed.",
          "You open the wallet once, to check the seal. You read the completion notation. "
          "It takes longer than expected to close the wallet again and keep moving north.",
          "CON", 11,
          checkPassFlag="arnC4A4Done",
          activateCond="() => !!S_story.arnC4A3Done")

    quest("arn_04_act5", "Chivalric Vow Records",
          "Sweelinck reads the vow's terms: three peacock helmet crests from Teutonic Knights, "
          "dedicated to Danusia Jurandowna. He reads the completion notation: three names, "
          "three dates. He reads the date differential between the vow's completion and the "
          "line below it. He closes the parchment and marks it for permanent archive.",
          "WM",
          "Sweelinck opens Chivalric Vow Records. The vow was completed. The recipient was "
          "dead. The completion notation is in a different hand because the herald who sealed "
          "it was not the herald who recorded the completion. The archive notes this without "
          "comment.",
          "Sweelinck receives the parchment. He will examine it fully when he can examine "
          "it without the date differential requiring immediate categorization.",
          "WIS", 10,
          checkPassFlag="arnC4A5Done",
          activateCond="() => !!S_story.arnC4A4Done")

    say("Cycle 4 complete. Beginning cycle 5: The Order's Internal Report on Jurand. "
        "Token: Order's Internal Report. "
        "Node route: Teutonic border, Constantinople, Weimar.")

    # --- Cycle 5: The Order's Internal Report on Jurand ---
    print("\n-- Cycle 5: The Order's Internal Report on Jurand --")
    quest("arn_05_act1", "The Defector's File",
          "A defected Teutonic official at the border crossing has had the file since Grunwald. "
          "He kept it because he knew it was evidence and because he could not decide what "
          "to do with it. He needs to know you understand what the document is before he "
          "gives it up: not evidence of a crime in legal terms — the Order has already been "
          "broken at Grunwald — but a record of the precise language an institution uses to "
          "describe what it has decided not to call by its name. Administrative German. "
          "Three authorizing signatures. The word: neutralization.",
          "TKT",
          "The document is the language the institution chose. Not the act itself — the act "
          "has other witnesses. This is what the institution wrote about the act: the word it "
          "selected, the signatures that authorized the selection. You understand why that "
          "record is different from a description of the act. He hands it over.",
          "He gives you the file, but his uncertainty about whether you understand what you "
          "are carrying follows it southeast toward Constantinople.",
          "WIS", 13,
          checkPassFlag="arnC5A1Done")

    quest("arn_05_act2", "The Eastern Road Watch",
          "The Order's remaining chapters have agents watching the eastern roads for exactly "
          "this kind of document. The report has three of their seals and three of their "
          "signatures. A document like this can be used in multiple proceedings, none of which "
          "they want. The route southeast through the mountain passes is less watched than "
          "the direct road to Constantinople.",
          "TKT",
          "The southeastern route adds two days and removes the main checkpoint. You rejoin "
          "the road south of the last known Order watch-post. No encounter logged.",
          "An Order agent on the main road stops you briefly. The archive transit exemption "
          "clears you. He lets you through, but the encounter is logged and a report will "
          "go east within the day.",
          "DEX", 13,
          checkPassFlag="arnC5A2Done",
          activateCond="() => !!S_story.arnC5A1Done")

    quest("arn_05_act3", "The Harbor Agent",
          "A Teutonic Order agent at the Constantinople harbor knows which document you are "
          "carrying — someone at the border talked. He has a counteroffer: the report for "
          "a set of Polish atrocity documents the Order has compiled. His logic is that both "
          "archives receive both accounts. His offer is a forgery negotiation wrapped in "
          "archival language. He moves when you reach the harbor square.",
          "CON",
          "He is down in the harbor district. The report is intact. You keep moving toward "
          "the road north.",
          "His counteroffer delays you long enough that the harbor gate closes. You spend "
          "the night inside the city with the document before continuing north in the morning.",
          None, None,
          checkPassFlag="arnC5A3Done",
          activateCond="() => !!S_story.arnC5A2Done",
          monster="Teutonic Order harbor agent", monsterHP=24, monsterAC=13)

    quest("arn_05_act4", "Three Days to Weimar",
          "Three days north to Weimar. The document is in German. You can read the word "
          "'neutralization.' You understand what it describes. Deliver it without adding "
          "a gloss. The archive does not need your translation. The archive needs the document "
          "as the institution wrote it — the language the institution chose, intact and "
          "unedited, next to the language the witnesses chose.",
          "CON",
          "Three days. The document stays sealed. You deliver it without editorial addition, "
          "which is the only correct way to deliver a document whose primary evidence is the "
          "words the institution selected.",
          "You write a note to attach to the document explaining what 'neutralization' means "
          "in plain language. You remove it before you reach Weimar. The archive does not "
          "need your translation.",
          "CON", 11,
          checkPassFlag="arnC5A4Done",
          activateCond="() => !!S_story.arnC5A3Done")

    quest("arn_05_act5", "Institutional Authorization Records",
          "Sweelinck reads the German. He reads the authorizing paragraph and the three "
          "signatures below it. He reads the section that describes what was done to Jurand "
          "of Spychów in administrative language, as a border security measure. He closes "
          "the file and creates the category.",
          "WM",
          "Sweelinck opens Institutional Authorization Records. The word is 'neutralization.' "
          "Three signatures authorized it. The archive holds the language the institution "
          "chose, next to the language the witnesses chose. The distance between them is "
          "the document.",
          "Sweelinck receives the file. He will read the German when he has a translator "
          "he trusts with the category. The file is in archive custody regardless.",
          "WIS", 10,
          checkPassFlag="arnC5A5Done",
          activateCond="() => !!S_story.arnC5A4Done")

    say("Cycle 5 complete. Beginning cycle 6: The Captured Battle Standard. "
        "Token: Grunwald Battle Standard. "
        "Node route: Kraków, Rome, Weimar.")

    # --- Cycle 6: The Captured Battle Standard ---
    print("\n-- Cycle 6: The Captured Battle Standard --")
    quest("arn_06_act1", "The King's Dispatch",
          "The royal herald hands over the standard with transit papers from Jagiełło's "
          "chancery. The papers specify destination: the Papal court at Rome, attention of "
          "the Office of Holy Orders. The standard was captured at Grunwald, laid at the "
          "king's feet, and is being sent to the institution that gave the Order its crusading "
          "authority. The king wants the authority's source to hold the evidence of where "
          "that authority ended. Understand the institutional logic before you take the bundle.",
          "KRK",
          "The standard was blessed by Rome before the campaign. It did not return with the "
          "army. It goes to Rome because the institution that gave the Order its authority "
          "should hold the evidence that the authority has been militarily answered. You "
          "understand the sequence before you take the bundle from the herald's hands.",
          "You take the standard. The institutional logic of sending it to Rome settles on "
          "the road south when you understand that the destination is not ceremonial — it "
          "is a formal return of the instrument to its source.",
          "WIS", 12,
          checkPassFlag="arnC6A1Done")

    quest("arn_06_act2", "The Mountain Route",
          "Remnant Teutonic chapters are watching the roads south from Poland. The standard "
          "is wrapped in linen and tied to a pole — wrapped things on poles are recognizable "
          "to anyone who knows what to look for. The mountain route through the Alpine passes "
          "adds three days and removes two checkpoints.",
          "KRK",
          "The mountain route adds three days and removes both checkpoints. The standard "
          "travels as wrapped merchant's cargo. No one inspects a merchant's pole bundle "
          "in the passes.",
          "A checkpoint on the main road south inspects the bundle. The transit papers from "
          "Jagiełło's chancery clear it, but the encounter is logged by someone who will "
          "send a report east before you reach the Italian border.",
          "DEX", 12,
          checkPassFlag="arnC6A2Done",
          activateCond="() => !!S_story.arnC6A1Done")

    quest("arn_06_act3", "The Papal Official",
          "A Papal official at Rome wants to receive the standard in a formal ceremony with "
          "witnesses before routing it to the Office of Holy Orders. His logic: the receipt "
          "should be documented publicly so the Order cannot claim it was never delivered. "
          "Your instruction: delivered to the Office, transit papers as documentation. "
          "Both goals are the same goal. Resolve the procedural disagreement before the "
          "Office closes for the evening.",
          "ROM",
          "The transit papers are the documentation. The formal receipt by the Office is "
          "the ceremony. Both are the same proceeding if the Office clerk is present for "
          "the handover. He agrees. The Office clerk is summoned. The handover is witnessed. "
          "The standard goes to the Office of Holy Orders.",
          "He insists on a separate ceremony. You wait two days while it is arranged. "
          "The standard reaches the Office on schedule but through a longer procedure "
          "than the transit papers specified.",
          "CHA", 13,
          checkPassFlag="arnC6A3Done",
          activateCond="() => !!S_story.arnC6A2Done")

    quest("arn_06_act4", "The Receipt and the Road North",
          "The Papal office has given you a receipt and directed you to Weimar for archival "
          "deposit of the transit record. The standard stays in Rome, in the Office of Holy "
          "Orders. You carry the transit papers, the Papal receipt, and Sweelinck's "
          "commission. Three days north through the Alpine passes back to Weimar.",
          "ROM",
          "Three days north with transit papers and a Papal receipt. The standard is in Rome. "
          "The archive receives the record of where it ended. The road is cold and clear.",
          "You think about the standard for most of the road north — the blessing it received, "
          "the campaign it did not survive. The archive receives the transit papers. What "
          "you think about is not part of the record.",
          "CON", 11,
          checkPassFlag="arnC6A4Done",
          activateCond="() => !!S_story.arnC6A3Done")

    quest("arn_06_act5", "Captured Standard Records",
          "Sweelinck examines the transit papers and the Papal receipt. He notes the "
          "standard's last recorded location: Rome, Office of Holy Orders. He notes the "
          "transit chain: Grunwald battlefield, Jagiełło's chancery, the alpine route, "
          "the Papal court, the Office. He marks it for permanent archive and sets the "
          "transit record in the archive space.",
          "WM",
          "Sweelinck opens Captured Standard Records. The standard was blessed before the "
          "campaign. It did not return with the army. It went to Rome instead. The archive "
          "holds the transit record. What the Papal office does with the standard is not "
          "in this file.",
          "Sweelinck receives the transit papers. He will verify the Papal receipt against "
          "the Vatican archive's correspondence before completing the categorization.",
          "WIS", 10,
          checkPassFlag="arnC6A5Done",
          activateCond="() => !!S_story.arnC6A4Done")

    say("Cycle 6 complete. Beginning cycle 7: Zbyszko's Vow Completion. "
        "Token: Zbyszko's Vow Completion Record. "
        "Node route: Spychów, London, Weimar. This is the final cycle.")

    # --- Cycle 7: Zbyszko's Vow Completion ---
    print("\n-- Cycle 7: Zbyszko's Vow Completion --")
    quest("arn_07_act1", "The Sealed Parchment",
          "Zbyszko hands you the sealed parchment at Spychów. He says: take it to Weimar. "
          "He says nothing else. The seal is fresh — he made it this morning. The parchment "
          "records the formal completion of his battle vow: three knights named, three dates, "
          "three combats, three peacock crests. At the bottom, in different ink from the "
          "vow's terms: Danusia's name and her death date. He added them after the completion "
          "and before the sealing. Understand before the road why the completion record goes "
          "to the archive and not to the Polish court.",
          "JUR",
          "The court holds legal instruments — vows, charters, disputes. This is not that. "
          "This is what a man did when the reason for doing it could no longer receive it. "
          "The archive holds the category the court has no filing system for. You understand "
          "before you leave Spychów.",
          "You take the parchment. On the road north the distinction settles: the court holds "
          "what has legal standing; the archive holds what has human standing when the legal "
          "standing has nowhere to operate.",
          "WIS", 11,
          checkPassFlag="arnC7A1Done")

    quest("arn_07_act2", "Macko Again",
          "Macko of Bogdaniec intercepts you on the northern road out of Spychów. He knows "
          "what is in the parchment — he was present at two of the three combats. He wants "
          "to know why it goes to a German archive and not to the Mazovian royal collection "
          "where Polish honors are recorded. He is not wrong about the Mazovian collection. "
          "He is not fully right about what the parchment contains.",
          "JUR",
          "The Mazovian collection holds Polish honors. This document contains Danusia's name "
          "and death date added after the completion, before the sealing — a personal "
          "annotation to a formal record. The archive holds what the royal collection has "
          "no category for. He stands aside, unconvinced but out of arguments.",
          "He is not persuaded. You find an alternate route north. His objection was not "
          "wrong; it simply did not account for what the document contains at the bottom.",
          "CHA", 12,
          checkPassFlag="arnC7A2Done",
          activateCond="() => !!S_story.arnC7A1Done")

    quest("arn_07_act3", "The English Herald",
          "An English herald in London who collects records of formal chivalric vows from "
          "across Europe wants to copy the document for his collection. His scholarship is "
          "genuine. The parchment is sealed. The vow's terms and the combat names are public "
          "knowledge elsewhere; the addition at the bottom is not. The archive receives the "
          "original sealed.",
          "LDN",
          "Copies of the vow's terms and combats can be arranged through the archive after "
          "deposit — those portions are documented elsewhere. The addition at the bottom is "
          "not for copying. He agrees and gives you his address for the copy request.",
          "He wants the addition specifically — it is, he argues, the most historically "
          "interesting element. You decline to break the seal for him. He lets you leave, "
          "disappointed and scholarly about it.",
          "CHA", 12,
          checkPassFlag="arnC7A3Done",
          activateCond="() => !!S_story.arnC7A2Done")

    quest("arn_07_act4", "Three Days to Weimar",
          "Three days east to Weimar. The parchment is sealed. Zbyszko's signet is on it. "
          "You know what is at the bottom because he told you when he handed it over. "
          "Nothing requires doing anything with that knowledge between here and delivery. "
          "Keep moving. The archive is the right place for it. That is all the road requires.",
          "LDN",
          "Three days. The parchment stays sealed. You know what is at the bottom and you "
          "carry it to the archive without adding anything. That is all the road requires.",
          "You think about what is at the bottom for most of the road to Weimar. The "
          "parchment stays sealed. The thinking is not part of the delivery.",
          "CON", 11,
          checkPassFlag="arnC7A4Done",
          activateCond="() => !!S_story.arnC7A3Done")

    quest("arn_07_act5", "Vow Completion Records",
          "Sweelinck breaks the seal. He reads the vow's terms. He reads the three names "
          "and dates and the completion notation. He reads the bottom. He is quiet for a "
          "moment. Then he closes the parchment, opens the category, and files this record "
          "alongside the vow parchment from cycle 4 — the beginning and the end of the "
          "same obligation, in the same archive space.",
          "WM",
          "Sweelinck opens Vow Completion Records. The vow was made for Danusia. She died "
          "before the third feather. He completed it anyway. Her name and death date are "
          "at the bottom in different ink. He added them after the completion and before "
          "the sealing. That is the document the archive receives.",
          "Sweelinck receives the parchment. He will file it alongside the vow record when "
          "he has examined both in sequence. The archive holds both.",
          "WIS", 10,
          checkPassFlag="arnC7A5Done",
          activateCond="() => !!S_story.arnC7A4Done",
          questComplete=True)

    say("All 35 quests imported for ARN Knights of the Cross.")

    # --- Save and Audit ---
    print("\n-- Save --")
    api("post", "/api/save", json={})
    print("  Saved.")

    print("\n-- Audit --")
    r = requests.get(BASE + "/api/audit").json()
    p = {x["section"]: x["count"] for x in r["parse"]}
    print(f"  NODE_MAP: {p.get('NODE_MAP')}")
    print(f"  QUEST_DB: {p.get('QUEST_DB')}")

if __name__ == "__main__":
    main()
