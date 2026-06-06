# Plan: RIX — Egil's Saga (Anon, attr. Snorri, c.1240)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** RIX-egil-saga.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `rix_` | **questComplete:** `rixEgil7Complete` (cycle 7 act 5)  
**Phase 1 task:** Acquire RIX-egil-saga.txt (W.C. Green 1893, Project Gutenberg)  
**Fighter role:** Escort in Norse saga world — Iceland, Norway, England (York), Constantinople — carrying documents of poetry, law, and inheritance

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg: "Egil's Saga" + W.C. Green (1893)
2. Download plain-text UTF-8 file (~580 KB expected; split into 3 parts if needed)
3. File name: `RIX-egil-saga.txt` or `RIX-egil-saga.part1of3.txt` etc.
4. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
5. Append Pass 4 summaries to RIX-egil-saga.md (do NOT overwrite existing 7 cycles)

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| YRK | York — Anglo-Saxon city | EXISTS | From MAN (Ivanhoe) import |
| ISL | Althing Ground — Iceland | EXISTS | From GDN (Njal) import; also ALF/RIX shared |
| CON | Constantinople | EXISTS | |
| WM | Weimar Archive | EXISTS | |

No new nodes needed. All existing from prior imports.

---

## Cycles (all 7 imported and live)

### C1 — The Head-Ransom
**Route:** YRK → ISL → WM | **Theme:** Höfuðlausn — the poem Egil composed overnight to ransom his own head from King Eirikr  
**Acts:** [1] skill_check@YRK · [2] skill_check@YRK · [3] combat@YRK · [4] skill_check@ISL · [5] delivery@WM  
**Token:** Höfuðlausn manuscript (the head-ransom poem, composed in one night)  
**Fighter note:** Combat act — Eirikr's guards may not accept the poem's validity

### C2 — The Raven's Errand
**Route:** ISL → CON → WM | **Theme:** Egil sends his poem Arinbjárnarkvíða to Arinbjörn — the friendship poem as legal document  
**Acts:** [1] skill_check@ISL · [2] skill_check@road · [3] skill_check@CON · [4] skill_check@road · [5] delivery@WM  
**Token:** The Raven's Errand manuscript (Egil's messenger poem to Arinbjörn)

### C3 — Arinbjörnarkvíða
**Route:** ISL → YRK → WM | **Theme:** The praise poem as the only surviving record of a friendship that saved a man's life  
**Acts:** [1] skill_check@ISL · [2] skill_check@road · [3] skill_check@YRK · [4] skill_check@road · [5] delivery@WM  
**Token:** Arinbjörnarkvíða manuscript copy

### C4 — Æthelstan's Compensation
**Route:** YRK → ISL → WM | **Theme:** The silver Æthelstan paid Egil for his son's death — the compensation record that rebalanced the grief  
**Acts:** [1] skill_check@YRK · [2] skill_check@road · [3] combat@road · [4] skill_check@ISL · [5] delivery@WM  
**Token:** Æthelstan's compensation record (silver weight and terms)

### C5 — Þorgerðr's Sonatorrek Account
**Route:** ISL → CON → WM | **Theme:** Þorgerðr's intervention — she made Egil compose Sonatorrek rather than die of grief  
**Acts:** [1] skill_check@ISL · [2] skill_check@ISL · [3] skill_check@road · [4] skill_check@CON · [5] delivery@WM  
**Token:** Sonatorrek (the grief poem) + Þorgerðr's account of why she forced him to compose it

### C6 — Ásgerðr's Inheritance Record
**Route:** ISL → YRK → WM | **Theme:** Ásgerðr's inheritance claim — the legal document that Egil fought to enforce  
**Acts:** [1] skill_check@ISL · [2] skill_check@road · [3] combat@road · [4] skill_check@YRK · [5] delivery@WM  
**Token:** Ásgerðr's inheritance claim document (the legal title Egil prosecuted at the Althing)

### C7 — Egil's Last Poem
**Route:** ISL → WM | **Theme:** Sonatorrek / Lausavísur — the poem Egil recited in old age after burying his silver — the poem of a man's argument with Odin  
**Acts:** [1] skill_check@ISL · [2] skill_check@ISL · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Egil's last poem transcript (his argument with Odin, dictated to a scribe before his death)
