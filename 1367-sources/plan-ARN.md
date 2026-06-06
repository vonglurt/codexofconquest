# Plan: ARN — Knights of the Cross (Henryk Sienkiewicz, 1900, 1399 setting)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** ARN-knights-of-the-cross.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `arn_` | **questComplete:** `arnVow7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire ARN-knights-of-the-cross.txt (Jeremiah Curtin tr. 1900, Project Gutenberg, ~900–1000 KB)  
**Fighter role:** Escort in Polish-Teutonic War world — Kraków courts, borderland castles, the Teutonic Order's crossing — carrying documents of honor, captivity, and vengeance

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg: "Knights of the Cross" + Sienkiewicz (Curtin translation, 1900)
2. Download plain-text UTF-8 file (~900–1000 KB; split into 5 parts of ~200 KB)
3. File names: `ARN-knights-of-the-cross.part1of5.txt` through `.part5of5.txt`
4. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
5. Append Pass 4 summaries per part to ARN-knights-of-the-cross.md (do NOT overwrite cycles)
6. Verify KRK/JUR/TKT/CHP node descriptions match actual novel geography

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| KRK | Kraków — Royal Court | CREATED | r:112 c:212, city |
| JUR | Spychów / Jurand's Castle | CREATED | r:108 c:212, camelot |
| TKT | Teutonic Border Crossing | CREATED | r:104 c:212, road |
| CHP | Mazovian Chapel | CREATED | r:108 c:210, camelot |
| CON | Constantinople | EXISTS | |
| WM | Weimar Archive | EXISTS | |

---

## Cycles (all 7 imported and live)

### C1 — Jurand's Scratch
**Route:** KRK → JUR → WM | **Theme:** The formal challenge Jurand issued — the document of his grievance against the Teutonic Order  
**Acts:** [1] skill_check@KRK · [2] skill_check@road · [3] skill_check@JUR · [4] skill_check@road · [5] delivery@WM  
**Token:** Jurand's formal challenge document (sealed; his grievance against the Order)

### C2 — Danusia's Last Song
**Route:** JUR → TKT → WM | **Theme:** The song Danusia sang in the Teutonic fortress — the eyewitness account of her captivity  
**Acts:** [1] skill_check@JUR · [2] skill_check@road · [3] combat@TKT · [4] skill_check@road · [5] delivery@WM  
**Token:** Danusia's prison song transcription (what the hospice brother heard through the wall)

### C3 — Danusia's Veil
**Route:** KRK → JUR → WM | **Theme:** The veil Danusia threw over Zbyszko's head at court — the token that started the vow  
**Acts:** [1] skill_check@KRK · [2] skill_check@road · [3] skill_check@JUR · [4] skill_check@road · [5] delivery@WM  
**Token:** The Court Register entry (the veil incident recorded by the royal scribe)

### C4 — Zbyszko's Battle Vow
**Route:** KRK → TKT → WM | **Theme:** The formal battle vow Zbyszko swore — to collect three peacock-feathered helmets from Teutonic knights  
**Acts:** [1] skill_check@KRK · [2] skill_check@road · [3] combat@TKT · [4] skill_check@road · [5] delivery@WM  
**Token:** Zbyszko's Battle Vow record (the three helmets promised; witnesses named)

### C5 — The Order's Internal Report on Jurand
**Route:** TKT → CON → WM | **Theme:** The Teutonic Order's own report on Jurand of Spychów — the enemy's document of a man's power  
**Acts:** [1] skill_check@TKT · [2] skill_check@TKT · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** The Order's intelligence report on Jurand (the enemy assessment of his capabilities)

### C6 — The Captured Battle Standard
**Route:** TKT → KRK → WM | **Theme:** The Teutonic Order standard captured by Zbyszko — the trophy document  
**Acts:** [1] combat@TKT · [2] skill_check@road · [3] skill_check@KRK · [4] skill_check@road · [5] delivery@WM  
**Token:** Captured Teutonic Order battle standard + capture record

### C7 — Zbyszko's Vow Completion
**Route:** KRK → WM | **Theme:** The official completion record — the three helmets delivered, the vow sworn over Danusia's grave fulfilled  
**Acts:** [1] skill_check@KRK · [2] skill_check@KRK · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Vow Completion Record (the three helmets inventory; Danusia's name at the top)
