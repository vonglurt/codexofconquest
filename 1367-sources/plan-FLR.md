# Plan: FLR — Divine Comedy: Inferno (Dante Alighieri, c.1320)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** FLR-divine-comedy-inferno.md (7 cycles, 35 acts — all complete)  
**Quest prefix:** `flr_` | **questComplete:** `flrCliffFace7Complete` (cycle 7 act 5)  
**Fighter role:** Escort carrying documents from Italian city-states and allegorical Inferno nodes to WM  
**Fighter approach:** The Inferno is theological and political — acts balance physical danger (Inferno zones) with social/persuasion challenges (church officials, inquisitors)

---

## Node Checklist

| Code | Name | Action | Notes |
|------|------|--------|-------|
| MBR | Malebolge / allegorical Inferno node | GET — confirm | Inferno's eighth circle area |
| PAR | Palermo | GET — confirm | Added IST import; also Paradiso reference? |
| HMN | Humanist study node | GET — confirm | Archive-adjacent scholarly node |
| PSA | Florence/Pisa | GET — confirm | Dante's origin city |
| ROM | Rome (ROM not RME) | GET — confirm | Added BLQ import |
| WM | Weimar Archive | GET — confirm | |

**Note:** Verify MBR is the Inferno allegorical node, not a city. If it doesn't exist, propose coordinates as a non-geographic allegorical node similar to MONS (mathematical world).

---

## Cycles

### C1 — The Vigna Deposition
**Route:** PSA → ROM → WM | **Theme:** The political document behind Dante's exile — the deposition that convicted him without evidence  
**Acts:** [1] skill_check@PSA · [2] skill_check@road · [3] skill_check@ROM · [4] skill_check@road · [5] delivery@WM  
**Token:** The Vigna deposition scroll (Pier della Vigna's false testimony, uncertified copy)

### C2 — What Brunetto Asked
**Route:** PSA → ROM → WM | **Theme:** Brunetto Latini's archive request — the scholar in Hell still wanted his books circulated  
**Acts:** [1] skill_check@PSA · [2] skill_check@road · [3] skill_check@ROM · [4] skill_check@road · [5] delivery@WM  
**Token:** Brunetto's bequest letter (books to be donated, written before his conviction)

### C3 — Francesca's Book
**Route:** MBR → WM | **Theme:** The Arthurian manuscript that was reading itself when Francesca and Paolo were discovered — the book as accomplice  
**Acts:** [1] skill_check@MBR · [2] skill_check@road · [3] combat@road · [4] skill_check@ROM · [5] delivery@WM  
**Token:** The Lancelot manuscript (the page Galeotto served as)

### C4 — Bocca's Denial
**Route:** MBR → ROM → WM | **Theme:** The traitor who refused to give his name in Hell — the only witness account that names him anyway  
**Acts:** [1] skill_check@MBR · [2] skill_check@road · [3] skill_check@ROM · [4] skill_check@road · [5] delivery@WM  
**Token:** Bocca's identification record (the eyewitness who named him despite his denial)

### C5 — The Pre-Schism Declaration
**Route:** PSA → ROM → WM | **Theme:** The theological document that Dante cites as proof the Church exceeded its authority  
**Acts:** [1] skill_check@PSA · [2] skill_check@road · [3] combat@road · [4] skill_check@ROM · [5] delivery@WM  
**Token:** The Donation of Constantine commentary (humanist annotation proving it false)

### C6 — Ugolino's Grandson
**Route:** PSA → WM | **Theme:** The descendant of Count Ugolino who survived to testify — his account of what happened in the tower  
**Acts:** [1] skill_check@PSA · [2] skill_check@road · [3] skill_check@ROM · [4] skill_check@road · [5] delivery@WM  
**Token:** Ugolino's grandson's deposition (the tower account from the only living witness)

### C7 — The Cliff-Face Testimony
**Route:** MBR → ROM → WM | **Theme:** The crack in Hell's architecture that witnesses the Harrowing — the geological record of Christ's descent  
**Acts:** [1] skill_check@MBR · [2] skill_check@road · [3] combat@road · [4] skill_check@ROM · [5] delivery@WM — **questComplete**  
**Token:** The seismic record of the Harrowing (Roman survey noting the cliff-face crack, 33 AD)

---

## Import Session Plan

**Session 1:** Confirm MBR/PAR/HMN nodes → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → questComplete → admin pass
