# Plan: JRS — Jerusalem Delivered (Torquato Tasso, 1581)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** JRS-jerusalem-delivered.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `jrs_` | **questComplete:** `jrsGodfrey7Complete` (cycle 7 act 5)  
**Fighter role:** Escort carrying documents through Crusade-era Mediterranean nodes — Jerusalem, Damascus, Constantinople, Weimar

---

## Node Checklist

| Code | Name | Action | Notes |
|------|------|--------|-------|
| PKR | Acre / Ptolemais area | GET — confirm | Crusade coast node |
| SGA | Syrian Gate / Antioch area | GET — confirm | |
| JAR | Armida's garden / Damascus region | GET — confirm | |
| OLN | Oliveto / Jerusalem outskirts | GET — confirm | |
| JER | Jerusalem | GET — create if missing | ~r:179 c:233, city terrain |
| CON | Constantinople | GET — confirm | Transit hub |
| VEN | Venice | GET — confirm | Western waypoint |
| DAM | Damascus | GET — confirm | Added BGW/CAI import |
| WM | Weimar Archive | GET — confirm | |

**Check JER first** — may have been added during BEY/WAW imports.

---

## Cycles

### C1 — The Eunuch's Charge
**Route:** PKR → CON → WM | **Theme:** The document that authorized the eunuch's mission — Godfrey's commission to a marginal figure  
**Acts:** [1] skill_check@PKR · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** Godfrey's sealed commission to the eunuch Iftikhar

### C2 — Sophronia's Witness
**Route:** JER → CON → WM | **Theme:** Sophronia's false confession saved her community — the court record of a lie that was an act of love  
**Acts:** [1] skill_check@JER · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Saracen court deposition of Sophronia's conviction

### C3 — Ismen's Notebooks
**Route:** JAR → CON → WM | **Theme:** The sorcerer Ismen's working notes — magic as documented practice  
**Acts:** [1] skill_check@JAR · [2] skill_check@road · [3] combat@JAR · [4] skill_check@CON · [5] delivery@WM  
**Token:** Ismen's enchantment notebook

### C4 — Tancred's Grant
**Route:** OLN → VEN → WM | **Theme:** The land grant Tancred made during the siege — a document written in the mud of Crusade politics  
**Acts:** [1] skill_check@OLN · [2] skill_check@road · [3] skill_check@VEN · [4] skill_check@road · [5] delivery@WM  
**Token:** Tancred's sealed land grant (contested after the siege)

### C5 — Erminia's Safe Passage
**Route:** JAR → DAM → WM | **Theme:** The safe conduct that never reached Tancred — the letter that arrived after the wound  
**Acts:** [1] skill_check@JAR · [2] skill_check@road · [3] combat@road · [4] skill_check@DAM · [5] delivery@WM  
**Token:** Erminia's safe-passage letter for Tancred

### C6 — Armida's Conversion
**Route:** JAR → CON → WM | **Theme:** The document of Armida's surrender and conversion — what she renounced and what she accepted  
**Acts:** [1] skill_check@JAR · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** Armida's formal conversion record

### C7 — The Godfrey Dispatch
**Route:** JER → WM | **Theme:** Godfrey's final dispatch to Europe — the official account of Jerusalem's fall that was never sent  
**Acts:** [1] skill_check@JER · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Godfrey's unsent Jerusalem dispatch

---

## Import Session Plan

**Session 1:** Confirm PKR/SGA/JAR/OLN nodes; create JER if missing → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → questComplete → admin pass
