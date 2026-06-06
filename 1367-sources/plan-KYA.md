# Plan: KYA — Shah-Nameh (Ferdowsi, Atkinson tr., c.1010)

**Phase:** 2 — QUEUED FOR IMPORT  
**Source:** KYA-shah-nameh.md (25 cycles, ~125 acts — all complete)  
**Quest prefix:** `kya_` | **questComplete:** `kyaFirdusi25Complete` (cycle 25 act 5)  
**Fighter role:** Escort on Persian epic routes — Sistan, Yazd, Kabul, Samarkand, Tabriz, Trebizond, Weimar  
**Scale:** Largest single import — plan 5 sessions

---

## Node Checklist

| Code | Name | Coords | Action | Notes |
|------|------|--------|--------|-------|
| YAZ | Yazd — Zoroastrian Fire Temple | r:175 c:242 | CREATE | Zoroastrian holy city |
| KBL | Kabul — Hindu Kush Gateway | r:185 c:248 | CREATE | Zal's kingdom |
| SIS | Sistan — Rustam's City | r:180 c:248 | CREATE | Rustam/Zal homeland |
| HRT | Herat — Timurid City | r:178 c:248 | CREATE | Khorasan city |
| TBZ | Tabriz | r:160 c:240 | GET — confirm | Added AMS import |
| TRB | Trebizond | r:152 c:240 | GET — confirm | Added NWI/HAV import |
| NIS | Nishapur | r:168 c:240 | GET — confirm | Added AMS import |
| SAM | Samarkand | r:157 c:240 | GET — confirm | Added AMS import |
| MRG | Maragha | r:162 c:238 | GET — confirm | Added AMS import |
| MRV | Merv | r:165 c:240 | GET — confirm | Added AMS import |
| BGD | Baghdad | r:182 c:238 | GET — confirm | Added BGW import |
| CON | Constantinople | r:152 c:228 | GET — confirm | |
| WM | Weimar Archive | r:117 c:204 | GET — confirm | |

**Session A MUST create YAZ/KBL/SIS/HRT before any quests fire.**

---

## Session Plan

### Session A — Cycles 1–5 (Kaiúmers → Feridún arc)
**Node creates:** YAZ, KBL, SIS, HRT (4 new nodes)

| Cycle | Title | Route | Key Act Type |
|-------|-------|-------|-------------|
| KYA-01 | The Derafsh Kaviani Fragment | YAZ → TBZ → TRB → WM | skill_check C1–4; delivery C5 |
| KYA-02 | The Two-Falls Custom | NIS → TBZ → WM | skill_check C1–3; combat C4; delivery C5 |
| KYA-03 | The Fire Chain | YAZ → MRG → WM | skill_check C1–4; delivery C5 |
| KYA-04 | The Demon's First Lesson | NIS → CON → WM | skill_check C1–2; combat C3; skill_check C4; delivery C5 |
| KYA-05 | The Princess of Zábulistán | KBL → TBZ → WM | skill_check C1–4; delivery C5 |

### Session B — Cycles 6–10 (Sohráb tragedy arc)

| Cycle | Title | Route | Key Act Type |
|-------|-------|-------|-------------|
| KYA-06 | The Record of Successive Honors | TBZ → TRB → WM | skill_check C1–4; delivery C5 |
| KYA-07 | The Símúrgh's Second Feather | YAZ → CON → WM | skill_check C1–3; combat C4; delivery C5 |
| KYA-08 | The Caravanserai Account | SIS → SAM → WM | skill_check C1–4; delivery C5 |
| KYA-09 | The Trophy of the Broken Girdle | SIS → MRG → WM | skill_check C1–3; combat C4; delivery C5 |
| KYA-10 | The Second Bracelet | SIS → TBZ → WM | skill_check C1–4; delivery C5 |

### Session C — Cycles 11–15 (Saiáwush betrayal + Kai-khosráu arc)

| Cycle | Title | Route | Key Act Type |
|-------|-------|-------|-------------|
| KYA-11 | The Tree at the Border | SAM → CON → WM | skill_check C1–4; delivery C5 |
| KYA-12 | The Portrait Gallery | SAM → NIS → WM | skill_check C1–4; delivery C5 |
| KYA-13 | The King from the Sky | TBZ → CON → WM | skill_check C1–3; combat C4; delivery C5 |
| KYA-14 | The Seeing Cup | MRG → TBZ → WM | skill_check C1–4; delivery C5 |
| KYA-15 | The Ring in the Bird | SAM → TBZ → WM | skill_check C1–3; combat C4; delivery C5 |

### Session D — Cycles 16–20 (Zoroaster/Gushtásp + Isfendiyár arc)

| Cycle | Title | Route | Key Act Type |
|-------|-------|-------|-------------|
| KYA-16 | The Warriors' Mounds | TRB → CON → WM | skill_check C1–4; delivery C5 |
| KYA-17 | The Golden Basin | SAM → MRG → WM | skill_check C1–4; delivery C5 |
| KYA-18 | Zerdusht's Tree | YAZ → MRG → WM | skill_check C1–4; delivery C5 |
| KYA-19 | Maníjeh's Letter | NIS → TRB → WM | skill_check C1–2; combat C3; skill_check C4; delivery C5 |
| KYA-20 | The Dragon-Cart Design | TBZ → NIS → WM | skill_check C1–4; delivery C5 |

### Session E — Cycles 21–25 (Rustam death + Sikander + Firdusi's Satire)

| Cycle | Title | Route | Key Act Type |
|-------|-------|-------|-------------|
| KYA-21 | The Kazú-Tree Arrow | SIS → NIS → WM | skill_check C1–4; delivery C5 |
| KYA-22 | The Pit Record | HRT → SAM → WM | skill_check C1–2; combat C3; skill_check C4; delivery C5 |
| KYA-23 | The Four Goblets | SAM → CON → WM | skill_check C1–4; delivery C5 |
| KYA-24 | The Wall Stone | TRB → CON → WM | skill_check C1–3; combat C4; delivery C5 |
| KYA-25 | Firdusi's Complaint | NIS → TBZ → WM | skill_check C1–4; delivery C5 — **questComplete** |

---

## Fighter Notes

- **Combat acts:** KYA-02 C4 (Persian law scholars), KYA-04 C3 (demon-scribes), KYA-07 C4 (Zoroastrian rival guardians), KYA-09 C4 (trophied-object challengers), KYA-13 C4 (diplomatic rivals), KYA-15 C4 (ring-seekers), KYA-19 C3 (sorcery-knowledge brigands), KYA-22 C3 (Herat rival scholars), KYA-24 C4 (stone-block thieves)
- **Skill check variety:** History, Insight, Persuasion, Religion, Stealth — rotate to avoid repetition across 25 cycles
- **Token variety:** physical objects (feathers, cups, rings, stones), manuscript documents, inscriptions, deposition records
