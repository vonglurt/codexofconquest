# Plan: VBY — Grettir's Saga (Anon, c.1310)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** VBY-grettir-saga.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `vby_` | **questComplete:** `vbyThorstein7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire VBY-grettir-saga.txt from Project Gutenberg (G.H. Hight 1914 or Morris/Magnusson 1900)  
**Fighter role:** Escort in Icelandic saga world — dark farmsteads, outlawed roads, Iceland to Constantinople

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg for "Grettir's Saga" (Hight or Morris/Magnusson translation)
2. Download plain-text UTF-8 file
3. If > 200 KB, split: `bash split-sources.sh VBY grettir-saga N`
4. Confirm file name: `VBY-grettir-saga.txt` (or `.part1of2.txt` etc.)
5. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
6. Append Pass 4 source summaries to VBY-grettir-saga.md (do NOT overwrite cycles 1–7)

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| RKN | Reykjaness shore-farm | CREATED | r:84 c:106, beach |
| BWH | Burial mound, Norwegian coast | CREATED | r:80 c:114, ruins |
| BK | Birka | EXISTS | |
| VS | Visby | EXISTS | |
| CON | Constantinople | EXISTS | |
| LDN | London | EXISTS | |
| WM | Weimar Archive | EXISTS | |

All nodes created. No new nodes required for future re-processing.

---

## Cycles (all 7 imported and live)

### C1 — The Fire-Swimmer's Account
**Route:** RKN → BK → WM | **Theme:** Grettir swims ashore from a burning ship — the night's events on official record  
**Acts:** [1] skill_check@RKN · [2] skill_check@RKN · [3] combat@RKN · [4] skill_check@RKN/BK · [5] delivery@WM  
**Token:** The fire-swimmer's account tablet (RKN farmer's record of the night)

### C2 — The Barrow-Night
**Route:** BWH → BK → WM | **Theme:** Grettir breaks open a Norwegian burial mound and fights the draugr inside  
**Acts:** [1] skill_check@BWH · [2] skill_check@BWH · [3] skill_check@BWH · [4] skill_check@BWH · [5] delivery@WM  
**Token:** Barrow-guardian's heritage inventory (what was in the mound before Grettir opened it)

### C3 — Glámr's Dying Curse
**Route:** RKN → BK → WM | **Theme:** The dying ghost's curse that undid Grettir from within  
**Acts:** [1] skill_check@RKN · [2] skill_check@road · [3] combat@BK · [4] skill_check@road · [5] delivery@WM  
**Token:** Glámr's Curse Transcript (birch-bark, three witness signatures)

### C4 — Grettir's Outlawry Sentence
**Route:** RKN → VEN → WM | **Theme:** The Althing sentence that made helping Grettir illegal  
**Acts:** [1] skill_check@RKN · [2] skill_check@road · [3] skill_check@VEN · [4] skill_check@road · [5] delivery@WM  
**Token:** Grettir's Full Outlawry Sentence (lawspeaker's seal, "skógarmaðr for life")

### C5 — Þorsteinn's Revenge Oath
**Route:** RKN → CON → WM | **Theme:** The formal oath that authorized Iceland-to-Constantinople pursuit  
**Acts:** [1] skill_check@RKN · [2] skill_check@road (stealth) · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** Þorsteinn's Revenge Oath (Althing sworn; names Þuríðr and Narfi)

### C6 — Þuríðr's Rune Log
**Route:** RKN → ROM → WM | **Theme:** The rune inscription that turned Grettir's axe against himself — forensic evidence  
**Acts:** [1] skill_check@RKN · [2] skill_check@road (stealth) · [3] skill_check@ROM (religion check) · [4] skill_check@road · [5] delivery@WM  
**Token:** Þuríðr's Rune Inscription Transcript (vellum, pre-burn copy)

### C7 — Þorsteinn's Final Account
**Route:** CON → LDN → WM | **Theme:** The brother's written account from Constantinople — the obligation fulfilled  
**Acts:** [1] skill_check@CON · [2] skill_check@road · [3] skill_check@LDN · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Þorsteinn's Final Account (sealed in Constantinople, Þorsteinn's own hand)
