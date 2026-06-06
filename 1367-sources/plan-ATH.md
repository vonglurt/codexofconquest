# Plan: ATH — Iliad (Homer, Lang tr., ~750 BC)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** ATH-iliad.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `ath_` | **questComplete:** `athHecubaComplete` (cycle 7 act 5)  
**Fighter role:** Escort carrying documents from the Trojan War battlefield nodes to WM

---

## Node Checklist

| Code | Name | Action | Notes |
|------|------|--------|-------|
| IDC | Troy / Ilium area | GET — confirm | Primary hub |
| SKN | Scaean Gate / battlefield node | GET — confirm | Combat-zone node |
| TRH | Trojan harbor approach | GET — confirm | |
| CON | Constantinople | GET — confirm | Transit hub |
| WM | Weimar Archive | GET — confirm | |

**No new nodes required.** All nodes from prior imports. Confirm all three Troy-area codes exist before starting.

---

## Cycles

### C1 — The Herald's Tablet
**Route:** IDC → CON → WM | **Theme:** The herald Idaeus carries the formal offer — the document behind the diplomatic failure  
**Acts:** [1] skill_check@IDC · [2] skill_check@IDC · [3] skill_check@IDC · [4] skill_check@IDC · [5] delivery@WM  
**Token:** Priam's diplomatic offer tablet

### C2 — Helen at the Funeral · The Embassy's Offer
**Route:** IDC → CON → WM | **Theme:** The rejected transaction that still binds — the offer Achilles refused  
**Acts:** [1] skill_check@IDC · [2] skill_check@road\_IDC\_CON · [3] skill_check@CON · [4] skill_check@road\_CON\_WM · [5] delivery@WM

### C3 — The Embassy's Offer — The Rejected Transaction That Still Binds
**Route:** IDC → CON → WM | **Theme:** Three ambassadors, one offer, one refusal — the document that records why the war continued  
**Acts:** [1] skill_check@IDC · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** Embassy offer record with Achilles's refusal noted in margin

### C4 — Patroclus's Commission — The Last Instruction Before the Fatal Decision
**Route:** SKN → CON → WM | **Theme:** What Patroclus was told to do versus what he did  
**Acts:** [1] skill_check@SKN · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Patroclus's orders from Achilles (the instruction he exceeded)

### C5 — Andromache's Loom — The Half-Finished Morning
**Route:** IDC → WM | **Theme:** The domestic record of the hour Hector died — the embroidered cloth on the unfinished loom  
**Acts:** [1] skill_check@IDC · [2] skill_check@IDC · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Andromache's loom register (half-finished cloth pattern log)

### C6 — The Shield's Description — The World Before the Battle
**Route:** SKN → WM | **Theme:** Hephaestus's shield depicts a complete world — the document of what was worth fighting for  
**Acts:** [1] skill_check@SKN · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Shield cartographer's commentary manuscript

### C7 — Hecuba's Supplication — The Correctly Offered Gift That Was Refused
**Route:** IDC → WM | **Theme:** The gift the god refused to accept — the supplication document that records divine rejection  
**Acts:** [1] skill_check@IDC · [2] skill_check@IDC · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Hecuba's temple offering record

---

## Import Session Plan

**Session 1:** Confirm IDC/SKN/TRH nodes → import C1–C4 (20 acts)  
**Session 2:** Import C5–C7 (15 acts) → questComplete → admin pass
