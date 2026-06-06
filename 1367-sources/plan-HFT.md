# Plan: HFT — Frithiof's Saga (Esaias Tegnér, pub. 1825)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** HFT-frithiof-saga.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `hft_` | **questComplete:** `hftHelge7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire HFT-frithiof-saga.txt (Bayard Taylor 1866 or Holcomb tr., Project Gutenberg)  
**Fighter role:** Escort in Norse heroic romance — Sognefjord, Balder's sacred sites, Ring's hall — carrying documents of love, honor, and oath

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg: "Frithiof's Saga" or "Frithjof's Saga" (Tegnér; Bayard Taylor tr.)
2. Download plain-text UTF-8 file (~100–150 KB expected; no split needed)
3. File name: `HFT-frithiof-saga.txt`
4. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
5. Append Pass 4 Source Summary (Alternative Reading angle) to HFT-frithiof-saga.md

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| ALR | Alrekstaðir Temple — The Continuous Flame | CREATED | r:104 c:128, camelot — cycle 1 acts 1–2 |
| BLG | Balder's Grove — The Altar Foundation | CREATED | r:104 c:130, highlands — cycles 1 acts 4–5; cycles 3–7 hub |
| RNG | Ring's Private Chamber — The Low Fire | CREATED | r:106 c:128, camelot — cycle 2 acts 1–4 |
| ING | Ingeborg's Chamber — The Morning Window | CREATED | r:106 c:130, camelot — cycle 2 act 5 |
| HEO | Heorot — Danish Mead-Hall (Lejre) | EXISTS | From CPH/LHR import; shared node |
| WM | Weimar Archive | EXISTS | |

---

## Cycles (all 7 imported and live)

### C1 — The Sacred Flame
**Route:** ALR → BLG → WM | **Theme:** The chain of custody of Balder's sacred flame — Frithiof earns the flame by carrying its provenance  
**Acts:** [1] skill_check@ALR · [2] skill_check@ALR · [3] skill_check@road · [4] skill_check@BLG · [5] delivery@WM  
**Token:** Alrekstaðir flame chain-of-custody scroll (each keeper's name, from the old fire to the present)

### C2 — Ring's Deathbed Recognition
**Route:** RNG → ING → WM | **Theme:** King Ring's deathbed words to Frithiof — the four sentences carried across the hall  
**Acts:** [1] skill_check@RNG · [2] skill_check@RNG · [3] skill_check@RNG · [4] skill_check@ING · [5] delivery@WM  
**Token:** Ring's four deathbed sentences (sealed with his signet; Ingeborg waits for the delivery)  
**Romance act:** Act 4 — Ingeborg at the morning window, reading the face before hearing the words

### C3 — The Arm-Ring's First Journey
**Route:** BLG → HEO → WM | **Theme:** The arm-ring Frithiof took from Balder's temple — the document of its origin and his debt  
**Acts:** [1] skill_check@BLG · [2] skill_check@road · [3] combat@road · [4] skill_check@HEO · [5] delivery@WM  
**Token:** Balder's arm-ring provenance record (the temple's inventory entry before the theft)

### C4 — Angantyr's Receipt
**Route:** BLG → WM | **Theme:** Angantyr's receipt for the tribute Frithiof paid on behalf of the Sognefjord estate  
**Acts:** [1] skill_check@BLG · [2] skill_check@road · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Angantyr's tribute receipt (the payment that kept Ingeborg's brothers' honor intact)

### C5 — The False Name
**Route:** BLG → HEO → WM | **Theme:** Frithiof's false name at King Ring's court — the document that records a deception that became a truth  
**Acts:** [1] skill_check@BLG · [2] skill_check@road · [3] skill_check@HEO · [4] skill_check@road · [5] delivery@WM  
**Token:** Ring's court register (the false name entry — and the correction made after Frithiof revealed himself)

### C6 — The Arm-Ring Returns
**Route:** BLG → ALR → WM | **Theme:** Frithiof returns the arm-ring to Balder's temple after his exile — the restitution as the poem's moral center  
**Acts:** [1] skill_check@BLG · [2] skill_check@ALR · [3] skill_check@ALR · [4] skill_check@road · [5] delivery@WM  
**Token:** Balder's temple restitution record (the arm-ring returned, Frithiof's name entered as restorer)

### C7 — Helge's Weapon
**Route:** BLG → WM | **Theme:** The weapon Helge used against Frithiof — and the record that Frithiof did not kill him for it  
**Acts:** [1] skill_check@BLG · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Helge's attack record (the witness account of the assault; Frithiof's restraint noted)
