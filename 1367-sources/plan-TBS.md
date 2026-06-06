# Plan: TBS — Knight in the Panther's Skin (Shota Rustaveli, c.1225)

**Phase:** 1 → 2 | **Status:** SEEDS COMPLETE but NOT YET IMPORTED — source .txt MISSING (wrong file)  
**Source:** TBS-knight-panther-skin.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `tbs_` | **questComplete:** `tbsArabian7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire CORRECT TBS-knight-panther-skin.txt (Marjory Scott Wardrop tr. 1912, Project Gutenberg)  
**Fighter role:** Escort in Georgian epic world — Tbilisi, Arabian highlands, Aleppo, Constantinople — carrying documents of loyalty, grief, and friendship

---

## Phase 1: Source Acquisition (REQUIRED BEFORE IMPORT)

**Warning:** Prior source file contained wrong content. Vignettes were memory-processed.  
Before importing, verify that cycle 1–7 vignette details match the actual Wardrop text.

1. Search Project Gutenberg: "Knight in the Panther's Skin" + Wardrop (1912)  
   Alternatively: "Vepkhistqaosani" or "Vepkh'is t'qaosani"
2. Download plain-text UTF-8 file (~250 KB; single file or 2 parts)
3. File name: `TBS-knight-panther-skin.txt` (REPLACE any existing incorrect file)
4. **Read the text** and compare against TBS-knight-panther-skin.md cycle specs
5. If discrepancies found: update affected cycles before importing
6. Update books.md: `[ ]` → `[x]` with `Source txt acquired + verified YYYY-MM-DD`

---

## Node Checklist

| Code | Name | Coords | Action | Notes |
|------|------|--------|--------|-------|
| GEO | Georgia — Mountain Road | ~r:152 c:242 | GET — confirm | May not exist; Georgian node |
| TIF | Tbilisi / Tiflis | ~r:154 c:240 | GET — confirm | Added ADA import (TIF) |
| ALP | Aleppo — Storytellers' Quarter | r:168 c:238 | GET — confirm | Added CAI import |
| CAF | Caffa — Crimea | r:134 c:237 | GET — confirm | Added HAV import |
| CON | Constantinople | r:152 c:228 | GET — confirm | |
| DAM | Damascus | — | GET — confirm | Added BGW/CAI import |
| WM | Weimar Archive | r:117 c:204 | GET — confirm | |

**If GEO doesn't exist:** `POST /api/node` GEO at r:152 c:242, terrain:highlands, label:Georgian Mountain Road Crossroads

---

## Cycles

### C1 — The Panther's Skin (Cycle 1 main vignette)
**Route:** GEO → TIF → WM | **Theme:** The weeping knight at the crossroads — the document of a grief that refused to be explained  
**Acts:** [1] skill_check@GEO · [2] skill_check@road · [3] skill_check@TIF · [4] skill_check@road · [5] delivery@WM  
**Token:** The Weeping Knight's Scroll (the written description of Nestan-Darejan, given to the Fighter to carry)

### C2 — The Panther's Skin — The Question That Makes a Man Choose to Stay
**Route:** GEO → TIF → WM | **Theme:** Avtandil's choice — to keep his vow to Tariel or to return to Tinatin  
**Acts:** [1] skill_check@GEO · [2] skill_check@road · [3] skill_check@TIF · [4] skill_check@TIF · [5] delivery@WM  
**Token:** Avtandil's leave-of-absence letter to Tinatin (the explanation she may never receive)

### C3 — The Weeping Knight of the Mountain Road
**Route:** GEO → TIF → WM | **Theme:** The court commander's report — the official record of what Avtandil saw at the crossroads  
**Acts:** [1] skill_check@GEO · [2] skill_check@road · [3] skill_check@TIF · [4] skill_check@road · [5] delivery@WM  
**Token:** Rostévan's court commander report (Avtandil's mission brief)

### C4 — The Letter That Started a War
**Route:** TIF → ALP → WM | **Theme:** Nestan-Darejan's letter to Tariel — the letter that set every event in motion  
**Acts:** [1] skill_check@TIF · [2] skill_check@road (deception) · [3] skill_check@ALP · [4] skill_check@road · [5] delivery@WM  
**Token:** Nestan-Darejan's letter to Tariel (the original; the one she was imprisoned for writing)

### C5 — Fatman's Harbor Record
**Route:** ALP → CON → WM | **Theme:** The merchant Fatman's harbor ledger — the document that proves where Nestan-Darejan was taken  
**Acts:** [1] skill_check@ALP · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Fatman's harbor ledger (the entry showing the ship that took Nestan-Darejan toward Kajeti)

### C6 — The Kadjian Fortress Survey
**Route:** CAF → CON → WM | **Theme:** The fortress survey the three friends needed to plan the rescue — the tactical document  
**Acts:** [1] skill_check@CAF · [2] skill_check@road · [3] combat@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Kadjian fortress survey (the document the three friends used to plan the assault)

### C7 — The Arabian Wedding Contract
**Route:** TIF → WM | **Theme:** The wedding contract between Tariel and Nestan-Darejan — the document that makes the quest's end official  
**Acts:** [1] skill_check@TIF · [2] skill_check@TIF · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** The Arabian wedding contract (Tariel and Nestan-Darejan; the official end of the quest)

---

## Import Session Plan (after Phase 1 verification)

**Session 1:** Confirm GEO/TIF nodes (create GEO if missing) → import C1–C3 (15 acts)  
**Session 2:** Import C4–C7 (20 acts) → questComplete → admin pass  
**Update books.md:** `[ ]` → `[x]` + `IMPORTED — {date}`
