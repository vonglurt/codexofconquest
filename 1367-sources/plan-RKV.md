# Plan: RKV — Poetic Edda (Anon, ~10th–13th C, Codex Regius c.1270)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** RKV-poetic-edda.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `rkv_` | **questComplete:** `rkvGudrun7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire RKV-poetic-edda.txt (Bellows 1936 or Hollander translation, Project Gutenberg)  
**Fighter role:** Escort carrying documents from Norse mythological nodes — Völva's Heath, Ægir's Hall, Ásgarðr, the Standing Stone road — to WM

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg: "Poetic Edda" or "Elder Edda" (Bellows 1936 is on PG)
2. Download plain-text UTF-8 file (~750 KB expected; split into 4 parts)
3. File name: `RKV-poetic-edda.part1of4.txt` through `.part4of4.txt`
4. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
5. Append Pass 4 summaries to RKV-poetic-edda.md (do NOT overwrite cycles 1–7)

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| VLH | Völva's Heath — The Empty Ground | CREATED | r:108 c:128, highlands — cycle 1 hub |
| AEG | Ægir's Feast Hall | CREATED | r:108 c:130, camelot — cycles 2–7 hub |
| ASG | Ásgarðr — Frigg's Hall | EXISTS/CREATED | r:78 c:112, camelot (also BOO) |
| RSS | Standing Stone — Archive Road | CREATED | r:108 c:132, ruins — cycle 2 acts 4–5 |
| WM | Weimar Archive | EXISTS | |

---

## Cycles (all 7 imported and live)

### C1 — After Völuspá
**Route:** VLH → WM | **Theme:** What the seeress said after the poem ended — the testimony the cosmic vision cannot contain  
**Acts:** [1] skill_check@VLH · [2] skill_check@VLH · [3] skill_check@VLH · [4] skill_check@road · [5] delivery@WM  
**Token:** Völva's post-vision account (what the seeress said when Odin stopped asking)

### C2 — Loki's Escape from Ægir's Feast
**Route:** AEG → ASG → RSS → WM | **Theme:** What Loki said on his way out — the flyting's aftermath  
**Acts:** [1] skill_check@AEG · [2] skill_check@AEG · [3] skill_check@ASG · [4] skill_check@RSS · [5] delivery@WM  
**Token:** Loki's ejection record (the rune-chip under the bench at the threshold)

### C3 — Thor's Veil Pin
**Route:** AEG → WM | **Theme:** The documentation of Thor's cross-dressing mission — the official record of what he did to get his hammer back  
**Acts:** [1] skill_check@AEG · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Thrymskviða witness record (the bridal party's account of the feast)

### C4 — The Unanswered Question
**Route:** AEG → WM | **Theme:** Odin's test riddle to King Heidrekr — the question no mortal can answer, and the moment Heidrekr knew  
**Acts:** [1] skill_check@AEG · [2] skill_check@road · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Vafþrúðnismál final exchange record (the moment the giant recognized he had lost)

### C5 — The Runes' Origin
**Route:** AEG → WM | **Theme:** Odin hanged himself to learn the runes — the act of self-sacrifice as the most dangerous document in the archive  
**Acts:** [1] skill_check@AEG · [2] skill_check@road · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Hávamál rune-learning passage (Odin's own account of the nine nights, written in the runes he learned)

### C6 — The Hammer Blessing
**Route:** AEG → WM | **Theme:** Þrymskviða's marriage-blessing clause — what words are spoken over the hammer when used for a wedding  
**Acts:** [1] skill_check@AEG · [2] skill_check@road · [3] combat@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Hammer blessing formula (the specific words, with Thor's name, that constituted the wedding blessing)

### C7 — Gudrun's First Lament
**Route:** AEG → WM | **Theme:** Gudrun's lament over Sigurd's body — the oldest formulation of what an untransformed grief looks like  
**Acts:** [1] skill_check@AEG · [2] skill_check@road · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Gudrun's First Lament transcript (the lament that could not be wept away, only witnessed)
