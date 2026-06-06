# Plan: CID — Chronicle of the Cid (Anon, Southey tr., 12th C source)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** MAD-chronicle-cid.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `cid_` (not `mad_` — MAD code is shared with Don Quixote)  
**questComplete:** `cidVow7Complete` (cycle 7 act 5)  
**Fighter role:** Escort in 11th-century Iberian Reconquista — courts, castles, and the road from Burgos to Valencia

---

## Node Checklist

| Code | Name | Coords | Action | Notes |
|------|------|--------|--------|-------|
| VLC | Valencia — El Cid's Captured City | r:158 c:185 | CREATE | Iberian east coast; El Cid's prize city |
| BUR | Burgos | — | GET — check | May exist from HTY or ADA imports |
| TOL | Toledo | — | GET — check | Spanish capital; check if exists |
| WM | Weimar Archive | — | GET — confirm | |

**Create VLC:** `POST /api/node` with code=VLC, name=Valencia — El Cid's Captured City, r:158, c:185, terrain:city  
**Then:** confirm BUR/TOL exist (or create as needed for the route).

---

## Cycles

### C1 — The Lion and the Bench
**Route:** BUR → WM | **Theme:** The document of the lion incident at court — Alfonso's fear proved on paper  
**Acts:** [1] skill_check@BUR · [2] skill_check@road · [3] skill_check@BUR · [4] skill_check@road · [5] delivery@WM  
**Token:** Court witness record of the lion incident (who stood their ground, who fled)

### C2 — The Oath at Santa Gadea
**Route:** BUR → WM | **Theme:** The oath Alfonso swore not to have killed his brother — the Cid demanded it three times  
**Acts:** [1] skill_check@BUR · [2] skill_check@road · [3] skill_check@BUR · [4] skill_check@road · [5] delivery@WM  
**Token:** The Santa Gadea oath record (the triple oath Alfonso swore before the Cid)

### C3 — Corpes — The Oak Forest
**Route:** VLC → TOL → WM | **Theme:** The assault on the Cid's daughters in the oak forest — the evidence that forced the Toledo cortes  
**Acts:** [1] skill_check@VLC · [2] skill_check@road · [3] combat@road · [4] skill_check@TOL · [5] delivery@WM  
**Token:** The Corpes assault deposition (the daughters' testimony before the Toledo cortes)

### C4 — The Toledo Cortes
**Route:** TOL → WM | **Theme:** The formal indictment at Toledo — the legal record of what El Cid demanded on his daughters' behalf  
**Acts:** [1] skill_check@TOL · [2] skill_check@TOL · [3] combat@road · [4] skill_check@WM · [5] delivery@WM  
**Token:** The Toledo cortes indictment scroll

### C5 — The Dead Man's Ride
**Route:** VLC → BUR → WM | **Theme:** The Cid tied to his horse after death to win one final battle — the witness account of the impossible parade  
**Acts:** [1] skill_check@VLC · [2] skill_check@road · [3] combat@BUR · [4] skill_check@road · [5] delivery@WM  
**Token:** The battle witness record (the account of the dead man who won)

### C6 — Jimena's Dispatch
**Route:** VLC → TOL → WM | **Theme:** Jimena's letter to Alfonso after the Cid's death — asking for escort and reporting Valencia's condition  
**Acts:** [1] skill_check@VLC · [2] skill_check@road · [3] skill_check@TOL · [4] skill_check@road · [5] delivery@WM  
**Token:** Jimena's sealed dispatch to Alfonso (the letter requesting the return)

### C7 — Zbyszko's Vow Completion (see ARN) / The Cid's Will
**Route:** VLC → WM | **Theme:** The Cid's final dispositions — Valencia, Jimena, the sword Tizona — the document of his last wishes  
**Acts:** [1] skill_check@VLC · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** The Cid's last disposition document (Tizona's custody, Valencia's fate, Jimena's provisions)

---

## Import Session Plan

**Session 1:** Create VLC node → confirm BUR/TOL → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → questComplete → admin pass
