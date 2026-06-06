# Plan: LIS — The Lusiads (Luís de Camões, 1572)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** LIS-lusiad.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `lis_` | **questComplete:** `lisAdamastor7Complete` (cycle 7 act 5)  
**Fighter role:** Escort carrying documents on the Portuguese Atlantic-to-India route — Lisbon, Cape Verde, East Africa, India, and back to WM

---

## Node Checklist

| Code | Name | Action | Notes |
|------|------|--------|-------|
| CVP | Cape Verde / Portuguese Atlantic waypoint | GET — create if missing | Atlantic route node |
| MDN | Madeira or Mozambique waypoint | GET — create if missing | Mid-route Atlantic/Indian |
| MLN | Malindi / East Africa coast | GET — create if missing | Vasco da Gama's Indian Ocean pivot |
| LHA | Lisbon Harbor | GET — create if missing | Portuguese origin node |
| CON | Constantinople | GET — confirm | Western route transit |
| VEN | Venice | GET — confirm | |
| WM | Weimar Archive | GET — confirm | |

**Note:** CVP/MDN/MLN/LHA may not exist — all four Portuguese-route nodes may need creation. Check each with GET before starting. These will be on the western and southern edges of the map.

---

## Cycles

### C1 — The Stain Is the Proof
**Route:** LHA → WM | **Theme:** The blood-stained manuscript of Camões's poem — the only copy that survived the India shipwreck  
**Acts:** [1] skill_check@LHA · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Water-stained Lusiads manuscript (Camões swam ashore holding it)

### C2 — What the Cape Already Knew · The Restelo Dissent
**Route:** CVP → VEN → WM | **Theme:** The old man of Restelo's dissent speech — the record of what the poem knows is wrong about itself  
**Acts:** [1] skill_check@CVP · [2] skill_check@road · [3] skill_check@VEN · [4] skill_check@road · [5] delivery@WM  
**Token:** The Restelo Dissent transcript (the old man's objection, written by a witness)

### C3 — The Restelo Dissent (see C2 alt angle)
**Route:** LHA → CON → WM | **Theme:** The poem's internal argument against itself  
**Acts:** [1] skill_check@LHA · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM

### C4 — Inês de Castro's Testimony
**Route:** LHA → VEN → WM | **Theme:** Inês de Castro's last speech before execution — the document that records royal murder as love story  
**Acts:** [1] skill_check@LHA · [2] skill_check@road · [3] combat@road · [4] skill_check@VEN · [5] delivery@WM  
**Token:** Inês de Castro's deposition (her last testimony, transcribed)

### C5 — Pacheco's Account
**Route:** MLN → CON → WM | **Theme:** The African side of the cape rounding — the document of what was already known at Malindi  
**Acts:** [1] skill_check@MLN · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** Monsaide's prior geographic account of the Indian Ocean

### C6 — Monsaide's Letter
**Route:** MLN → VEN → WM | **Theme:** The Muslim navigator's letter to his family — written before he agreed to guide the Portuguese  
**Acts:** [1] skill_check@MLN · [2] skill_check@road · [3] combat@road · [4] skill_check@VEN · [5] delivery@WM  
**Token:** Monsaide's farewell letter

### C7 — The Adamastor Prophecy
**Route:** CVP → WM | **Theme:** The Cape of Storms spirit's prophecy — the archive receives the threat as primary document  
**Acts:** [1] skill_check@CVP · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM — **questComplete**  
**Token:** Adamastor's prophecy transcript (what the spirit said, before the storm)

---

## Import Session Plan

**Session 1:** Create LHA/CVP/MDN/MLN nodes (check each) → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → questComplete → admin pass
