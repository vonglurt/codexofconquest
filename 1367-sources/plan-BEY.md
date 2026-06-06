# Plan: BEY — Mandeville's Travels (attr. Sir John Mandeville, c.1357)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** BEY-mandeville.md (13 cycles, ~65 acts — all complete)  
**Quest prefix:** `bey_` | **questComplete:** `beySignet13Complete` (cycle 13 act 5)  
**Fighter role:** Escort in the 14th-century pilgrim/travel-writing world — Cyprus, Rhodes, Egypt, Holy Land, Europe

---

## Node Checklist

| Code | Name | Coords | Action | Notes |
|------|------|--------|--------|-------|
| FAM | Famagusta | r:172 c:236 | GET — confirm | Added BLQ import; docks terrain |
| DBV | Ragusa / Dubrovnik | r:148 c:216 | GET — confirm | BEY .md uses RGS — substitute DBV throughout |
| MAR | Marseille | r:144 c:178 | GET — confirm | Added BLQ; BEY .md may say MRS — use MAR |
| JER | Jerusalem | ~r:179 c:233 | GET — create if missing | Holy Land anchor |
| BEI | Beirut | ~r:172 c:233 | GET — create if missing | Lebanese coast |
| SID | Sidon | ~r:175 c:233 | GET — create if missing | Lebanese coast |
| KOL | Cologne | ~r:112 c:197 | GET — confirm | Added LBC import; BEY .md says COL → use KOL |
| KHR | Cairo | r:193 c:230 | GET — confirm | Added BGW import |
| ALE | Alexandria | r:184 c:232 | GET — confirm | |
| CON | Constantinople | r:152 c:228 | GET — confirm | |
| WM | Weimar Archive | r:117 c:204 | GET — confirm | |

**Code substitutions:** Any BEY vignette referencing RGS→DBV, MRS→MAR, COL→KOL.

---

## Cycles

### C1 — The Sober Draft
**Route:** KHR → DBV → WM | **Theme:** The compiler's working notes — what Mandeville knew was borrowed versus what he saw  
**Acts:** [1] skill_check@KHR · [2] skill_check@road · [3] skill_check@DBV · [4] skill_check@road · [5] delivery@WM  
**Token:** Mandeville's source-comparison notes (the draft showing what was taken from Odoric)

### C2 — The Sultan's Commission · Supplementary Cycle
**Route:** FAM → DBV → WM | **Theme:** The Mamluk safe-conduct issued to a European who might be Mandeville  
**Acts:** [1] skill_check@FAM · [2] skill_check@road · [3] combat@road · [4] skill_check@DBV · [5] delivery@WM  
**Token:** The Sultan's safe-conduct document (sealed, "issued to a Frankish knight")

### C3 — The Odoric Annotations
**Route:** KOL → WM | **Theme:** The annotated Odoric manuscript — the source with Mandeville's borrowings marked  
**Acts:** [1] skill_check@KOL · [2] skill_check@road · [3] skill_check@road · [4] skill_check@WM · [5] delivery@WM  
**Token:** Annotated Friar Odoric manuscript (with marginal marks identifying Mandeville's use)

### C4 — The Prester John Letter
**Route:** KHR → CON → WM | **Theme:** The 12th-century letter from Prester John — evidence for neither the Ethiopian nor the fictional interpretation  
**Acts:** [1] skill_check@KHR · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** The Prester John Letter (German monastery copy, 12th C)

### C5 — The Cotton-Lamb Record
**Route:** FAM → DBV → WM | **Theme:** The earliest known debunking of the Vegetable Lamb — a Genoese trade account calling it wool  
**Acts:** [1] skill_check@FAM · [2] skill_check@road · [3] skill_check@DBV · [4] skill_check@road · [5] delivery@WM  
**Token:** Genoese Caffa trade account (1330s; the "cotton wool is not actual lambs" marginal note)

### C6 — Boldensele's Original
**Route:** KOL → WM | **Theme:** William of Boldensele's original account — predating and predating Mandeville's use of it  
**Acts:** [1] skill_check@KOL · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Boldensele's manuscript (Rhineland monastery copy, pre-Mandeville)

### C7 — The Missing Chapter
**Route:** KOL → WM | **Theme:** The extra chapter in a Latin manuscript — a conversation with a Jerusalem scholar not in any other version  
**Acts:** [1] skill_check@KOL · [2] skill_check@road · [3] skill_check@road · [4] skill_check@WM · [5] delivery@WM  
**Token:** The Latin Mandeville extra chapter manuscript

### C8 — The Intelligence Report
**Route:** FAM → DBV → WM | **Theme:** Dominican analysis identifying the Sultan's French-speaking agents  
**Acts:** [1] skill_check@FAM · [2] skill_check@road · [3] combat@road · [4] skill_check@DBV · [5] delivery@WM  
**Token:** The Intelligence Report (four named French-speaking agents, one is a current cardinal's brother)

### C9 — The Chain Document
**Route:** FAM → DBV → WM | **Theme:** Sahag ibn Minas's provenance record corroborating the Sultan's Commission  
**Acts:** [1] skill_check@FAM · [2] skill_check@road · [3] skill_check@DBV · [4] skill_check@road · [5] delivery@WM  
**Token:** The Chain Document (four-page provenance record, cedar box)

### C10 — The French-Speaking Lord
**Route:** ALE → CON → WM | **Theme:** Tariq ibn Mansur's registry entry — four assignments, one marginal note about good standing  
**Acts:** [1] skill_check@ALE · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** The French-Speaking Lord registry entry

### C11 — The Temple Entry Record
**Route:** JER → DBV → WM | **Theme:** The waqf custodian's register — independent corroboration from the other side of the doorway  
**Acts:** [1] skill_check@JER · [2] skill_check@road · [3] skill_check@DBV · [4] skill_check@road · [5] delivery@WM  
**Token:** The Temple Entry register fragment

### C12 — The Liège Rubbing
**Route:** KOL → WM | **Theme:** The stone rubbing — both Mandeville names present, neither primary  
**Acts:** [1] skill_check@KOL · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM  
**Token:** D'Outremeuse's stone rubbing + observation note

### C13 — What the Pilgrim's Signet Looked Like
**Route:** KHR → DBV → WM | **Theme:** Fourteen ordinary signets; Yasmin's annotation defines the Commission by contrast  
**Acts:** [1] skill_check@KHR · [2] skill_check@road · [3] skill_check@DBV · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** The signet collection (fourteen ordinary seals + Yasmin's annotation identifying the exception)

---

## Import Session Plan (3 sessions)

**Session 1:** Confirm FAM/DBV/MAR nodes; create JER/BEI/SID if missing → import C1–C4 (20 acts)  
**Session 2:** Import C5–C9 (25 acts)  
**Session 3:** Import C10–C13 (20 acts) → questComplete → admin pass
