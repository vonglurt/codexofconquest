# Plan: OST — Song of Roland (Anon, c.1100)

**Phase:** 1 → 2 | **Status:** IMPORTED (quests live) — source .txt MISSING  
**Source:** OST-song-of-roland.md (7 cycles, 35 acts — complete from memory pass)  
**Quest prefix:** `ost_` | **questComplete:** on ost_07_act5  
**Phase 1 task:** Acquire OST-song-of-roland.txt (John O'Hagan tr. 1880, Project Gutenberg, ~150 KB)  
**Fighter role:** Escort in Carolingian France — Roncevaux Pass, Aix-la-Chapelle, Pyrenean roads — carrying documents of loyalty, betrayal, and judicial combat

---

## Phase 1: Source Acquisition

1. Search Project Gutenberg: "Song of Roland" + O'Hagan (1880) or L. Bacon (1914)
2. Download plain-text UTF-8 file (~150 KB; single file, no split needed)
3. File name: `OST-song-of-roland.txt`
4. Update books.md: `[ ]` → `[x]` with `Source txt acquired YYYY-MM-DD`
5. Append Pass 4 Source Summary (Alternative Reading) to OST-song-of-roland.md
6. **Also complete §IMPORT-99 tracking file updates** (api-data-audit.md, plan.md, index.md) — see task #10

---

## Node Checklist

| Code | Name | Status | Notes |
|------|------|--------|-------|
| RON | Roncevaux Pass | CREATED | r:110 c:128, highlands |
| PYR | Pyrenean High Road | CREATED | r:110 c:130, highlands |
| AIX | Aix-la-Chapelle Chapel | CREATED | r:110 c:132, camelot |
| FRS | Frankish Road-Town | CREATED | r:110 c:134, city |
| WM | Weimar Archive | EXISTS | |

**Note:** OST code collision (Bruges — Cloth Hall node is OST) → quest prefix `ost_` only; no OST hub node.

---

## Cycles (all 7 imported and live)

### C1 — The Horn of Roncevaux
**Route:** RON → AIX → WM | **Theme:** Roland's horn — the sound heard too late — the document of the delay  
**Acts:** [1] skill_check@RON · [2] skill_check@PYR · [3] combat@PYR · [4] skill_check@AIX · [5] delivery@WM  
**Token:** Roland's horn (Olifant) estate inventory entry — the only official record of the sound that reached Charlemagne

### C2 — Turpin's Blessing List
**Route:** RON → AIX → WM | **Theme:** The archbishop's blessing record — every Frankish soldier he blessed before the pass  
**Acts:** [1] skill_check@RON · [2] skill_check@RON · [3] skill_check@road · [4] skill_check@AIX · [5] delivery@WM  
**Token:** Archbishop Turpin's blessing list (names, ranks, last blessings given at Roncevaux)

### C3 — Ganelon's Prior Declaration
**Route:** AIX → WM | **Theme:** The declaration Ganelon made to Charlemagne before the betrayal — the document that didn't prevent it  
**Acts:** [1] skill_check@AIX · [2] skill_check@AIX · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Ganelon's formal declaration of loyalty (made before the Spanish mission; the betrayal is its context)

### C4 — Aude's Ring
**Route:** AIX → WM | **Theme:** Aude's betrothal ring to Roland — the token she sent back when she died rather than accept a substitute  
**Acts:** [1] skill_check@AIX · [2] skill_check@AIX · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM  
**Token:** Aude's betrothal ring (the ring she refused to keep; returned with her death)

### C5 — The Judicial Combat Record
**Route:** AIX → WM | **Theme:** The formal record of Ganelon's trial by combat — the legal procedure that convicted a traitor  
**Acts:** [1] skill_check@AIX · [2] skill_check@AIX · [3] combat@AIX · [4] skill_check@road · [5] delivery@WM  
**Token:** Ganelon's trial record (the judicial combat procedure; Pinabel's challenge; Thierry's victory)

### C6 — Durendal's Relic Inventory
**Route:** RON → AIX → WM | **Theme:** The inventory of Roland's sword — the relic record that proved it could not be broken  
**Acts:** [1] skill_check@RON · [2] skill_check@road · [3] skill_check@AIX · [4] skill_check@road · [5] delivery@WM  
**Token:** Durendal's relic inventory (the church record of the sword's relics embedded in the hilt)

### C7 — Gabriel's Command
**Route:** AIX → WM | **Theme:** Gabriel's command to Charlemagne to march again — the divine order that restarts the cycle  
**Acts:** [1] skill_check@AIX · [2] skill_check@AIX · [3] skill_check@road · [4] skill_check@road · [5] delivery@WM — **questComplete**  
**Token:** Gabriel's Command record (the vision account, dictated by Charlemagne to his chaplain the morning after)
