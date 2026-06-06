# Plan: ZTH — Odyssey (Homer, Butler tr., ~725 BC)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** ZTH-odyssey.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `zth_` | **questComplete:** `zthCattleComplete` (cycle 7 act 5)  
**Fighter role:** Silent escort carrying documents from classical Mediterranean nodes to WM (Weimar Archive)

---

## Node Checklist

| Code | Name | Action | Notes |
|------|------|--------|-------|
| ITH | Ithaca — Odysseus's palace | GET — confirm | Primary hub cycles 1–4 |
| PHC | Phaeacia / Scheria — Alcinous's Court | CREATE if missing | r:~164 c:~210, city terrain; mythological island |
| SIT | Sithonia / Greek coastal waypoint | GET — confirm | Used cycle 6 |
| ROM | Rome (ROM not RME) | GET — confirm | Added BLQ import |
| WM | Weimar Archive | GET — confirm | Central deposit hub |

**Pre-import:** `GET /api/location/PHC` — if missing, `POST /api/node PHC` near r:164 c:210.

---

## Cycles

### C1 — The Wax Account
**Route:** ITH → WM | **Theme:** Penelope's accounting ledger proves the suitors' consumption
**Acts:** [1] skill_check@ITH · [2] skill_check@ITH · [3] skill_check@ITH · [4] skill_check@ITH · [5] delivery@WM  
**Token:** Euryclea's wax household account tablet

### C2 — Iphitus's Provenance · The Unraveling Chronicle
**Route:** ITH → ITH → WM | **Theme:** The weaving as document — three years of unraveling as witness record  
**Acts:** [1] skill_check@ITH · [2] skill_check@ITH · [3] combat@ITH · [4] skill_check@ITH · [5] delivery@WM  
**Token:** Penelope's shroud section (unraveled portion)

### C3 — The Unraveling Chronicle
**Route:** ITH → ITH → WM | **Theme:** What three years looks like in a thread  
**Acts:** [1] skill_check@ITH · [2] skill_check@ITH · [3] skill_check@ITH · [4] skill_check@ITH · [5] delivery@WM

### C4 — Eumaeus's Twenty Years — The Accounts No One Asked For
**Route:** ITH → ITH → WM | **Theme:** The swineherd's daily inventory as biography of loyalty  
**Acts:** [1] skill_check@ITH · [2] skill_check@ITH · [3] skill_check@ITH · [4] skill_check@ITH · [5] delivery@WM

### C5 — Nausicaa's Letter — The Document Written for the Writer
**Route:** PHC → WM | **Theme:** The girl who helped the man who would write her out of his own story  
**Acts:** [1] skill_check@PHC · [2] skill_check@PHC · [3] skill_check@PHC · [4] skill_check@PHC · [5] delivery@WM  
**Token:** Nausicaa's letter left at the palace gate  
**Node create:** PHC (Phaeacia/Scheria)

### C6 — Anticlea's Message — Testimony Delivered by the Dead
**Route:** SIT → WM | **Theme:** The dead mother's account of what happened at home while Odysseus wandered  
**Acts:** [1] skill_check@SIT · [2] skill_check@SIT · [3] skill_check@SIT · [4] skill_check@SIT · [5] delivery@WM

### C7 — The Cattle Account — The Decision the Sole Survivor Was Asleep For
**Route:** SIT → WM | **Theme:** The sole survivor's account of Helios's cattle  
**Acts:** [1] skill_check@SIT · [2] skill_check@SIT · [3] combat@SIT · [4] skill_check@SIT · [5] delivery@WM — **questComplete**

---

## Import Session Plan

**Session 1:** Create PHC node → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → mark questComplete → admin pass
