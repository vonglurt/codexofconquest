# roll2hit.com — Source Pipeline: Outstanding Work

This file tracks quest seeds, pipeline gaps, and planned work items across all source books.
All outstanding items should be completed before a book is considered "fully processed."

---

## Pipeline Queue

Next books to process (in approximate priority order):

| Code | Title | KB | Status |
|------|-------|----|--------|
| IST | Alexiad (Anna Komnene) | 165 | **IMPORTED — 2026-06-04 — PAR new node (Palermo); IST-01–07 (7 cycles, 35 acts); questComplete on all 7; RGS→DBV; ANC→AOI; WM→NUE** |
| NWI | Anabasis (Xenophon) | 545 | **IMPORTED — 2026-06-04 — BLK/BTR/SIN/ORC/VAR/MYS/AOI/REG new nodes; NWI_001–NWI-08 (9 cycles, 45 acts); questComplete on NWI-08 (cycle 9); ANC code collision → AOI used for Ancona; TBZ→TRB; RGS→DBV (cycles 2,3,4) / REG for Regensburg (cycle 9)** |
| WAW | Quo Vadis (Sienkiewicz) | 1201 | **IMPORTED — 2026-06-04 — SAU/VFM/ANT new nodes; WAW_001–WAW-07 (8 cycles, 40 acts); questComplete on WAW-03 (cycle 8)** |
| MLA | Plutarch's Lives | 4222 | **IMPORTED — 2026-06-04 — LMO/THA/NXS new nodes; MLA-01–05/02/04/06/03 (7 cycles, 35 acts); questComplete on MLA-05 (cycle 7); island→islands terrain fix on NXS** |
| BGW | Arabian Nights (Burton) | 983 | **IMPORTED — 2026-06-04 — KHR new node (Cairo); TUN new node (Tunis); BGW-01–08 (8 cycles, 40 acts); CAI→KHR; WM→NUE; BAG→BGD** |
| CAI | Arabian Nights (Lang) | 629 | **IMPORTED — 2026-06-04 — ALB/ALP/LAT new nodes (Aleppo Hills/Storytellers'/Latakia); CAI-01–08 (8 cycles, 40 acts); WM→NUE; BAG→BGD** |
| SHK | Complete Works — Shakespeare | 5318 | **COMPLETE 2026-06-05 — All 28 parts read; 14 cycles written and imported (shk6_act1–shk14_act3, 27 live quests). See SHK-shakespeare-complete-works.md.** |
| BEY | Mandeville's Travels | 472 | **SEEDS COMPLETE 2026-06-02 — BEY-01–07 all vignettes done** |
| KYA | Shah-Nameh | 883 | **IMPORTED — 2026-06-11 — YAZ/KBL new nodes; TBZ/TRB existing; kya_c1a1–kya_c7a5 (7 cycles, 35 acts); questComplete on kya_c7a5; SIS/HRT deferred (cycles 8+)** |
| HTY | Mahabharata | 83 | **SEEDS COMPLETE 2026-06-02 — HTY-01–06 all vignettes done** |
| ADA | Ramayana | 2339 | **COMPLETE 2026-06-02 — ADA-01–48 all done. New nodes: ERZ, MOS, MRV, BUR, CAF, TAN, BUK, SAR, BYR, AMY, SIV, THE, NIC, AMD, TUN, FEZ, ANK, HAM, TIF, ADR. See ADA-ramayana.md.** |
| AMS | Tale of Genji | 435 | **SEEDS COMPLETE 2026-06-02 — AMS-01–07 all vignettes done** |
| HAV | Buccaneers of America | 247 | **SEEDS COMPLETE 2026-06-02 — HAV-01–06 all vignettes done** |
| CLJ | Dracula | 869 | **SEEDS COMPLETE 2026-06-02 — CLJ-01–09 all vignettes done** |

---

## Unprocessed Books Queue (under 60 KB — queued for reprocessing 2026-06-02)

All files under 60 KB in 1367-sources/. Each to receive full pipeline: read → vignette .md → quest-map.md + books.md + plan.md admin pass.

| Code | Title | KB | Status |
|------|-------|----|--------|
| SDQ | Rob Roy — Walter Scott | 36 | **IMPORTED — 2026-06-05 — OBH/GLA/ABF/GLN/LLM/EDI new nodes; SDQ-01–07 (7 cycles, 35 acts); questComplete on SDQ-07 act5; SDQ collision (Crones' Domain)→OBH; terrain key fix applied** |
| TBS | Knight in the Panther's Skin — Rustaveli | 41 | **IMPORTED — 2026-06-11 — GEO/PHY/GHC new nodes (placed before parser stop per BGZ pattern); tbs_c1a1–tbs_c7a5 (7 cycles, 35 acts); questComplete on tbs_c7a5; 7 NPCs** |
| LHR | Beowulf — Anon (Gummere) | 42 | **IMPORTED — 2026-06-05 — BRW/GEA/WM new nodes; HEO/DAN reused from CPH; LHR-01–07 (7 cycles, 35 acts); questComplete on LHR-07 act5; coast→beach terrain fix on GEA; WM created as central archive hub** |
| BHD | Cuchulain of Muirthemne — Lady Gregory | 43 | **IMPORTED — 2026-06-05 — EMR/PSU/ULC new nodes; BHD-01–07 (7 cycles, 35 acts); questComplete on BHD-07 act5; BHD collision→EMR (Emain Macha)** |
| ZTH | Odyssey — Homer (Butler) | 43 | **SEEDS COMPLETE 2026-06-03 — ZTH-01–07 all vignettes done. New nodes: PHC, RME. See ZTH-odyssey.md.** |
| ATH | Iliad — Homer (Lang) | 45 | **SEEDS COMPLETE 2026-06-03 — ATH-01–07 all vignettes done. No new nodes. See ATH-iliad.md.** |
| GDN | Njal's Saga — Anon (Dasent) | 45 | **IMPORTED — 2026-06-05 — IGH/SWF/ISL new nodes (Ingolf's Head/Swinefell/Althing Ground); gdn_01–07 (7 cycles, 35 acts); questComplete on gdn_07_act5; GDN node collision (Danzig)→quest prefix only** |
| JRS | Jerusalem Delivered — Torquato Tasso | 46 | **SEEDS COMPLETE 2026-06-03 — JRS-01–07 all vignettes done. No new nodes. See JRS-jerusalem-delivered.md.** |
| LIS | Lusiads — Luís de Camões | 47 | **SEEDS COMPLETE 2026-06-03 — LIS-01–07 all vignettes done. No new nodes. See LIS-lusiad.md.** |
| MAD | Chronicle of the Cid — Anon (Southey) | 48 | **SEEDS COMPLETE 2026-06-03 — CID-01–07 all vignettes done. New node: VLC. See MAD-chronicle-cid.md.** |
| INV | Ossian — James MacPherson | 48 | **IMPORTED — 2026-06-05 — CNA/HLD new nodes (Vale of Cona/Scottish Coastal Headland); INV-01–07 (7 cycles, 35 acts); questComplete on INV-07 act5; INV node collision→CNA for cycle 1** |
| LCY | The White Company — Arthur Conan Doyle | 49 | **IMPORTED — 2026-06-05 — No new nodes (LCY/LDN/WM all existing); LCY-01–07 (7 cycles, 35 acts); questComplete on LCY-07 act5** |
| FLR | Divine Comedy: Inferno — Dante Alighieri | 50 | **SEEDS COMPLETE 2026-06-03 — FLR-01–07 all vignettes done. No new nodes needed. See FLR-divine-comedy-inferno.md.** |
| HFT | Frithiof's Saga — Esaias Tegnér | 51 | **IMPORTED — 2026-06-05 — ALR/BLG/RNG/ING new nodes + HEO existed (Lejre); hft_01–07 (7 cycles, 35 acts); questComplete on hft_07_act5; HFT collision (South Shore Fishermen)→BLG hub for cycles 3–7** |
| ERF | Grimm's Fairy Tales — Brothers Grimm | 52 | **IMPORTED — 2026-06-05 — STB/GLD/CI/DNG/CHC/PRH new nodes + ANT/ERF existed; erf_01–07 (7 cycles, 35 acts); questComplete on erf_07_act5; RME→ROM; CI for cycle 1 finale (chancery court)** |
| VIE | Faust — Johann Wolfgang von Goethe | 52 | **IMPORTED — 2026-06-05 — MGR/DKN/CLK new nodes (Prison Tower/Dominican Court/Clerk's Sickroom); VIE existed; vie_01–07 (7 cycles, 35 acts); questComplete on vie_07_act5; RME→ROM** |
| ALF | Kalevala — Elias Lönnrot | 52 | **IMPORTED — 2026-06-05 — TUO/KVF/KVM new nodes (Tuonela shore/Kullervo's forest/Master's hall); alf_01–07 (7 cycles, 35 acts); questComplete on alf_07_act5; ALF collision (North Shore Path)→quest prefix only** |
| KSU | Heimskringla — Snorri Sturluson | 53 | **IMPORTED — 2026-06-05 — NID/ECF new nodes (Nidaros shrine city/Eclipse Farm); ksu_01–07 (7 cycles, 35 acts); questComplete on ksu_07_act5; KSU collision (Lake Harbor)→NID hub** |
| RKV | Poetic Edda — Anon | 53 | **IMPORTED — 2026-06-05 — VLH/AEG/RSS new nodes (Völva's Heath/Ægir's Hall/Archive Road); rkv_01–07 (7 cycles, 35 acts); questComplete on rkv_07_act5; RKV collision (Frost Warden's Throne)→AEG hub cycles 3–7; cycle 1→VLH; cycle 2→AEG/ASG/RSS** |
| BOO | Prose Edda — Snorri Sturluson | 53 | **IMPORTED — 2026-06-05 — ASG/THK/HNJ new nodes (Ásgarðr/Þökk's Cave/Hnitbjörg); boo_01–07 (7 cycles, 35 acts); questComplete on boo_07_act5; BOO node collision (Yugurt Lake)→quest prefix only** |
| CDG | The Three Musketeers — Alexandre Dumas | 54 | **IMPORTED — 2026-06-05 — BTH/REL/DAR new nodes (Bethune Convent/Relay Post/Road Junction); cdg_01–07 (7 cycles, 35 acts); questComplete on cdg_07_act5; CDG node collision (Cat Quarter)→LON hub for cycles 3–7; RME→ROM** |
| LGW | Le Morte d'Arthur — Sir Thomas Malory | 55 | **IMPORTED — 2026-06-05 — AST/RVP/CAM/LKS new nodes; LGW-01–07 (7 cycles, 35 acts); questComplete on LGW-07 act5** |
| OST | Song of Roland — Anon | 56 | **IMPORTED — 2026-06-05 — RON/PYR/AIX/FRS new nodes (Roncevaux Pass/Pyrenean High Road/Aix-la-Chapelle Chapel/Frankish Road-Town); ost_01–07 (7 cycles, 35 acts); questComplete on ost_07_act5; OST collision (Bruges—Cloth Hall)→quest prefix only; cycles 1–2 route RON/PYR/AIX/FRS naturally; cycles 3–7 hub at AIX or RON** |
| ARN | Knights of the Cross — Henryk Sienkiewicz | 57 | **IMPORTED — 2026-06-05 — KRK/JUR/TKT/CHP new nodes (Kraków/Spychów/Teutonic Border/Mazovian Chapel); arn_01–07 (7 cycles, 35 acts); questComplete on arn_07_act5; cycles 1–2 full prose; cycles 3–7 expanded from stubs** |
| VBY | Grettir's Saga — Anon | 58 | **IMPORTED — 2026-06-05 — RKN/BWH new nodes (Reykjaness shore-farm/burial mound Norwegian coast); vby_01–07 (7 cycles, 35 acts); questComplete on vby_07_act5; cycles 1–2 full prose; cycles 3–7 expanded from stubs** |
| RIX | Egil's Saga — Anon (attr. Snorri) | 58 | **IMPORTED — 2026-06-05 — no new nodes (YRK/ISL existing); rix_01–07 (7 cycles, 35 acts); questComplete on rix_07_act5; cycles 1–2 full prose; cycles 3–7 expanded from stubs** |
| GCI | Toilers of the Sea — Victor Hugo | 59 | **IMPORTED — 2026-06-05 — STP/GHL new nodes (Guernsey harbor + tidal rock); GCI-01–07 (7 cycles, 35 acts); questComplete on GCI-07 act5; cycle 1 uses STP (not existing GCI merchant ship); RME→ROM** |
| FCO | Piers Plowman — William Langland | 59 | **IMPORTED — 2026-06-05 — MGF new node (Malvern Field); PLW-01–07 (7 cycles, 35 acts); questComplete on PLW-07 act5; FCO code collision (Aeneid)→PLW quest prefix; RME→ROM** |
| MAD | Don Quixote — Miguel de Cervantes | 59 | **SEEDS COMPLETE 2026-06-03 — MAD-01–07 all vignettes done. No new nodes (SMR, CMG, MNT, MAS, ACL all pre-existing). See MAD-don-quixote.md.** |
| BRU | Amadis of Gaul — Garci Rodríguez de Montalvo | 60 | **SEEDS COMPLETE 2026-06-03 — BRU-01–07 all vignettes done. No new nodes (CHT, LTN, PBK all pre-existing). See BRU-amadis-of-gaul.md.** |

---

## Processing Protocol

### File preparation

All source `.txt` files have been pre-split into 200 KB chunks by `split-sources.sh` / `split-sources.js`. Single-newline line breaks are collapsed to spaces (paragraph breaks preserved). Chunk files are named `CODE-title.partKofN.txt`.

Files that fit in one read (≤200 KB after splitting, or originally small) are processed in a single pass. Files with N > 1 parts use the multi-pass protocol below.

---

### Single-part books (original file ≤200 KB, no split)

1. Read the entire file.
2. Write the complete `.md` document:
   - Three-pass literary summary (overview → structure → quest seeds)
   - Seven storylines
   - Full 5-act main vignette spec + UQF v1.0 JSON stub
   - Outstanding quest seeds table
3. Apply all four admin updates: `quest-map.md`, `books.md`, `plan.md`.

---

### Multi-part books (split into .part1ofN.txt chunks)

Long books get longer summaries because each part extends the existing `.md`. **Never replace earlier summary content — always append.**

**Opening a multi-part book (part 1):**
1. Read `CODE-title.part1ofN.txt`.
2. Create `CODE-title.md` and write:
   - Header block (title, source, translator, year, N-part note)
   - Three-Pass Summary — Pass 1 (overview) and Pass 2 (structure), covering only what part 1 contains
   - Preliminary storylines (may be incomplete — mark open ones as `[CONTINUES]`)
   - Any quest seeds visible so far
3. If N > 1 (more parts remain), write a continuation entry to `plan.md` (see format below) and ask the user: **"Part 1 of N done — type 'continue' to process part 2."**
4. Show a one-line status: `KYA part 1/5 done — Kaiúmers through Feridún's coronation`.

**Continuing (parts 2 through N−1):**
1. Read `CODE-title.partKofN.txt`.
2. Open the existing `CODE-title.md` and **append** to the Three-Pass Summary section:
   - New `### Part K coverage` subsection with what this part adds
   - Extend or resolve any `[CONTINUES]` storylines
   - Add new quest seeds found in this part
3. Update the continuation entry in `plan.md` (mark this part done, note next part).
4. Ask the user to continue for the next part unless the file is now complete.
5. Show a one-line status.

**Final part (part N):**
1. Read `CODE-title.partNofN.txt`.
2. Append final part coverage to the `.md`.
3. **Complete the full document:**
   - Reconcile all `[CONTINUES]` markers — resolve or close every open storyline
   - Write the full 5-act main vignette spec + UQF v1.0 JSON stub
   - Write the complete outstanding seeds table
4. Apply all four admin updates: `quest-map.md`, `books.md`, `plan.md`.
5. Remove the continuation entry from `plan.md`.

---

### Continuation entry format in plan.md

When pausing mid-book, write this block immediately after the book's seed section (or at end of file if no seeds yet):

```
### §CODE-CONT — Continue [Full Title] processing
- Parts done: 1 of N (through part K)
- Parts remaining: partKofN through partNofN
- Summary so far: [one sentence — what narrative ground was covered]
- Next step: read CODE-title.partKofN.txt, append to CODE-title.md, continue storylines
```

Remove this block when the book is fully processed.

---

### Incremental reporting rule

After every part processed, output a one-line status before asking the user to continue:

> `[CODE] part K/N done — [brief content note, e.g. "Rustam's birth through Sohrab duel"]`

Do not wait until all parts are done before showing results. Each part's output is its own deliverable.

---

### Pass 4 — Source Text Summaries

This pass adds a **Summary** section to each book's `.md` file, one source text file at a time. It is separate from the literary analysis passes (1–3) and the quest-seed passes. It reads the raw source `.txt` files and produces narrative content summaries for each.

**Trigger:** When the user asks for Pass 4, or after a full book's vignette seeds are complete and the user requests content enrichment.

**How to begin a Pass 4 session:**
1. Run `ls 1367-sources/*.txt` to list all available part files.
2. Group by book code (e.g., all `ADA-*.txt` files, all `ATH-*.txt` files, etc.).
3. Begin with the first unprocessed part file for the chosen book.

**Per part file (CODE-title.partKofN.txt):**
1. Read the part file (`CODE-title.partKofN.txt`).
2. Append to `CODE-title.md` a new section:
   ```
   ## Source Summary — Part K of N
   *[Range note: what narrative span this part covers]*

   [Narrative summary: 3–6 paragraphs describing what happens in this part — characters, events, key passages, thematic content. Written as readable prose, not bullet points. Oriented toward quest potential and game use, not academic analysis.]
   ```
3. Show one-line status: `[CODE] Part K/N summary written — [range note]`.
4. Ask user to continue for next part, or proceed autonomously if in full-loop mode.

**For single-file books (no split, fully processed):**
- If the book's `.md` already has a Three-Pass Summary, the Pass 4 summary offers a **different retelling** — a second reading angle not covered in the original summary.
- Section header: `## Source Summary — Alternative Reading`
- Content: 3–4 paragraphs offering a different perspective on the source (e.g., reading through the lens of the secondary characters, or through the book's geography, or through its silences).

**Priority order for Pass 4:**
- Start with part files not yet summarized for books whose vignette pipeline is most active.
- Do one part per commit, not multiple parts per commit.
- The pass is cumulative — stop when interrupted, resume from where left off.

**Note on scope:** Pass 4 summaries are content records, not quest designs. They inform future vignette work and provide a more complete archive of what each source book contains beyond the quest seeds already extracted.

---

## Admin Notes

- All FCO quest seeds (02–14) are in FCO-aeneid.md with paragraph-length descriptions.
- FCO-01 (main vignette) has full 5-act spec, UQF JSON stub, TOKEN, and all admin updates applied to quest-map.md and books.md.
- plan.md created: 2026-05-31.

---

---

### The Event Horizon Node (EHZ)

**Concept:** A floating station at the edge of the Neon Undercity's deepest layer — accessible via CY (the Void passages beneath Birka) through a passage that opens only when the Fighter has carried at least three mathematical documents. The Event Horizon is where all particles "park before they pass through." It is like Deep Space Nine: a waystation at the boundary between the finite and the infinite. From its observation deck, a **magical rope** rises straight up into a sky that has no ceiling — and beside it, an **emergency ladder** that goes infinite in the same direction. The rope is the shortcut; the ladder is the proof that the shortcut works.

**Visual register (Adventure Time + Deep Space Nine):** Low-gravity stone station, mathematical symbols carved into every wall in multiple traditions (Sanskrit, Arabic, Greek, Roman, Chinese), a wormhole visible from the main window that contains a group multiplication table instead of stars. The station's AI (accessible via the mechanical hum beneath the station) speaks in Noether's theorem: every question about symmetry corresponds to a conservation law, and vice versa. The emergency ladder is labeled: *DO NOT USE UNLESS THE FINITE HAS FAILED.* It is labeled in every known numeral system.

**Mechanic:** From EHZ, the Fighter can access mathematical quest-nodes not reachable from any geographic map. Nodes include: MONS (The Monster's Manifold — 196,883-dimensional space represented as a puzzle room), ZERO (The Zero Transit — where zero entered European mathematics), and CNTR (Cantor's Attic — infinite levels above the ladder).

---

### The Monster

**Source:** The Monster Group — largest of the 26 sporadic simple groups; size ~8×10^53 (approximately the number of atoms in the planet Jupiter); identified by John Conway; acts on a space of 196,883 dimensions; connected via Monstrous Moonshine (proven by Richard Borcherds, 1992) to modular forms and string theory.

**In-game presence:** The Monster is not a creature. It is a room. The MONS node is a chamber that should not fit in three dimensions but does, because the Shattered Codex's physics were written by whoever designed the Monster's irreducible representation. The Fighter enters to retrieve a document that a mathematician's ghost left there: *The Moonshine Memo* — a single page noting that the coefficient of the j-function's first non-trivial term (196,884) is one more than the Monster's smallest faithful representation dimension (196,883). The archivist at Weimar does not know what to do with it. It goes under: *Numerical Coincidences — Possibly Not Coincidences.*

**Size context to convey in-game:** If every atom in the observable universe had a copy of the observable universe inside it, the total sub-atom count would be comparable to the size of the permutation group S101 — which is *already* vastly larger than the Monster. What makes the Monster remarkable is not its size but that it abruptly *stops*. The Monster is the largest of exactly 26 exceptions that don't fit any pattern. The universe was, apparently, designed by committee. One of the committee members was not paying attention. The 26 sporadic groups are what that looks like in pure mathematics.

---

### Quest Seeds

#### MATH-01: "The Number That Means Nothing" (The Zero Quest)
*Rome → Constantinople → Weimar*

In 1367, the Hindu-Arabic numeral system including zero has been available in Europe since Fibonacci's *Liber Abaci* (1202) but Roman numerals are still in official use in many institutions. A Byzantine scholar named Konstantinos Arithmetikos has compiled a treatise demonstrating that the absence of positional notation and zero made Roman military logistics systematically worse — that Caesar's quartermasters routinely miscalculated grain supplies by 15–30% because multiplying MXLVII by DCXCIII requires a different process for every pair of numbers, while multiplying 1047 × 693 uses the same process every time.

**TOKEN:** The Zero Treatise — Konstantinos's demonstration document, with worked examples of the same calculation in both numeral systems, showing the Roman system's catastrophic performance at multiplication and division.

**Route:** CON → RME (Rome) → WM

**Theme:** The symbol that represents nothing holds the place that makes everything else count; the most important number in European administrative history arrived as a foreign concept and was resisted for two hundred years after it solved all the problems; the archive receives it not as a curiosity but as the primary document explaining why Roman accounting collapsed.

**Skill sequence:** History DC 12 (CON — recognize the treatise's significance), Persuasion DC 13 (RME — convince a Roman administrator that "nothing" is worth preserving), Investigation DC 12 (WM — propose archive category: Numeral System Transition Documents — Positional Notation Introduction).

**New node:** RME (Rome — administrative district) if not already in grid.

---

#### MATH-02: "What the Snowflake Knows" (The Group Theory Quest)
*WM → EHZ → MONS*

The Weimar archive contains a manuscript by an anonymous Islamic geometer (probably from the Maragha Observatory, c. 1260) describing the symmetries of a hexagonal crystal: twelve actions that leave it unchanged. He listed them without calling them a group. He did not know he was describing the same structure as the rotation group of certain polynomials, or the symmetry group of the water molecule. He just described what he saw.

A scholar has found the manuscript and added a comparison: the same twelve actions appear in a musical scale analysis, in a crystallography diagram, and in a description of a six-sided puzzle lock. He is asking whether these are the same thing.

**TOKEN:** The Twelve Actions Manuscript — the Islamic geometer's hexagonal symmetry description, with the modern scholar's four-way comparison appended.

**Route:** WM → EHZ → MONS → WM

**Theme:** The same structure arising in apparently unrelated situations is the first evidence that the structure is fundamental; the mathematician who lists twelve actions without calling them a group has done the hardest work; naming is secondary; the archive receives the work of noticing before the work of naming.

**Skill sequence:** History DC 12 (WM — recognize the manuscript), Investigation DC 13 (EHZ — navigate the Event Horizon's symmetry-recognition puzzle), Investigation DC 12 (MONS — identify that the Monster's 196,883 dimensions are not arbitrary but are the minimum space in which this particular structure of symmetry can live), Investigation DC 12 (WM return — propose archive category).

**Archive category:** Symmetry Documents — Structural Recurrence Across Unrelated Fields.

**Adventure Time register note:** The EHZ puzzle speaks in the voice of a small mathematical construct that has been waiting here for five hundred years and is very excited to have a visitor. It will explain group theory using examples from snowflakes, Rubik's cubes, and a very confused equation it found in the wall.

---

#### MATH-03: "The Quintic's Impossibility" (The Abel-Ruffini Quest)
*Bologna → WM*

*(Historically early — Abel-Ruffini theorem was 1799/1824, but the quest can be set with a fictional precursor: an Islamic algebraist who found that degree-5 polynomial solutions by radicals "always failed" without knowing why.)*

Al-Tusi's student Mahmud al-Hamadani has written a manuscript proving that his master's method for cubic equations does not generalize to degree-5 equations — that every attempt produces a contradiction. He cannot explain why. The why is that the permutation group S5 has a different kind of atomic structure than S4 and lower, but he does not have group theory, so he can only describe the failure accurately without naming its cause.

**TOKEN:** The Hamadani Failure Record — forty pages of accurate failed attempts at a quintic formula, ending with the note: "The structure of the problem prevents this. I do not yet know what that structure is."

**Route:** BRS (Bursa) → RGS → WM

**Theme:** The honest record of a failure that contains the proof of an impossibility is more valuable than the successful formula it was trying to find; the archive receives the failures as primary evidence; the document that says "I cannot" and is correct is the most important scientific statement in the field.

**Archive category:** Unsolved Problem Records — Documented Impossibility; records of accurate failure that constitute proof of impossibility.

---

#### MATH-04: "The Counting Quest" (Roman Numerals, Zero, Greek Spheres, Byzantine Transmission)
*JER → CON → RME → WM*

This is the long quest connecting all the counting-system threads. In 1367, three separate documents are in transit toward the Weimar archive:

1. A **Greek sphere diagram** from Archimedes (transmitted via Arabic, now in a Constantinople library) — Archimedes used a proto-set-theory to count grains of sand; his "sand-reckoner" uses a positional system that anticipates place value by fifteen centuries.

2. A **Byzantine administrative ledger** from 1340 showing the switchover moment: the same column of expenses written first in Greek numerals, then rewritten below in Arabic-Hindu numerals, because the scribe was clearly taught the new system partway through the job.

3. A **Roman surveyor's field notebook** from an archaeological find near Jerusalem — dated first century BC, containing the surveyor's private notation system that uses dots for zero (not in Roman practice — this surveyor invented positional notation independently and it died with him).

**TOKEN:** The Three Counting Documents — a cedar sleeve containing all three, to be delivered as a set; they must arrive together because the argument only works if the archive can see all three side by side.

**Route:** JER → CON → RME → WM (or JER → BEI → CON → RME → WM for connection to BEY nodes)

**Theme:** The concept of zero and positional notation was invented at least four times independently in human history and suppressed or lost at least three times; the documents that survived are not the victories but the near-misses; the Fighter carries all three because a single document proves one man thought of it; three independent documents prove it is a natural consequence of counting itself.

**Skill sequence:** History DC 12 (JER — assemble the set), Persuasion DC 12 (CON — convince Byzantine scholar not to separate the set), History DC 13 (RME — argue for all three against a Roman mathematician who wants to study them separately), Investigation DC 12 (WM — propose archive category: Independent Invention Records — Positional Notation; parallel discoveries with no transmission chain; the independence is the evidence).

---

#### MATH-05: "The Moonshine Memo" (The Monster / Event Horizon quest)
*EHZ → MONS → WM*

The number 196,883 appears in the Monster group's smallest faithful representation. The number 196,884 appears as the coefficient of the j-function in modular form theory. The difference is exactly one.

In the game's timeline, this coincidence has been noticed by a scholar named Johannes von Weisheit who arrived at the Event Horizon node via the Neon Undercity and has not been seen since. He left a single memo on the observation deck: *"The Monster knows about elliptic functions. No one told it. This is either coincidence or evidence of something so fundamental that it does not have a name yet."*

**TOKEN:** The Moonshine Memo — Johannes's single-page observation; folded once; sealed with a seal that depicts a snowflake with exactly twelve symmetries.

**Route:** EHZ → MONS → WM

**Theme:** The most important mathematical connections are discovered by noticing that two apparently unrelated things differ by exactly one; the number that is one too large is always worth asking about; the archive creates a new category for this: Mathematical Observations — Numerical Coincidences Pending Explanation; "The Monster knows about elliptic functions. The archive records this."

**Mechanic note:** The MONS node requires the Fighter to navigate a room whose walls rearrange according to group multiplication rules. The correct path through the room is found by identifying that the room's rearrangement pattern is the 196,883-dimensional representation compressed into a 3D puzzle space. Whimsy level: Adventure Time (the room complains about being misunderstood and has strong opinions about which sub-group is the baby monster).

---

### Noether's Theorem Connection

Every quest in §MATH-01 carries a Noether signature: every TOKEN that reaches the archive corresponds to a conservation law the Fighter was unknowingly maintaining throughout the quest. The archive receives not just the document but the proof that something was preserved along the way.

- MATH-01 (Zero): conservation of place-value meaning across numeral systems
- MATH-02 (Snowflake): conservation of structural identity across unrelated fields
- MATH-03 (Quintic): conservation of honest failure as a form of proof
- MATH-04 (Counting): conservation of independent discovery as natural necessity
- MATH-05 (Moonshine): conservation of coincidences that are not coincidences
- MATH-06 (Small Numbers): conservation of the correct argument regardless of whether anyone sat through it

**Archive category for the series:** Mathematical Records — Conservation of Structural Truth.

---

#### MATH-06: "There Are Not Enough Small Numbers" (The Strong Law of Small Numbers — Mandatory Lecture)
*EHZ → WM*

Richard the Enumerator has been stationed at the Event Horizon node since before any current resident can verify. He carries a pamphlet, a portable chalkboard on articulated iron legs, a hand bell, and cold tea. His opening statement to every visitor, within thirty seconds of arrival:

> *"There aren't enough small numbers to meet the demands made of them."* — R.K. Guy, 1988.

He rings the bell. The lecture begins.

**His satisfaction is not in proving the point. It is in having an audience.** He has never successfully gotten anyone to attend voluntarily. He has a 100% completion rate anyway — the chalkboard blocks the exit. When a visitor sits down (voluntarily or otherwise), the satisfaction on his face is the most genuine emotion in the room.

The lecture covers: Guy's Strong Law (small integers carry too many simultaneous mathematical properties; their coincidences are collisions, not patterns); Rabin (2000)'s formal model of belief in the law of small numbers (the urn that doesn't exist; the gambler's fallacy as a structural consequence; over-inference from short sequences; the posterior variance that is always too high after two signals); fictitious variation (observers inventing the good and bad analysts that don't exist because they've seen two performances each); endogenous observation (the person who fires underperformers and keeps overperformers long enough to confirm they're average, and ends up believing average talent is lower than it is).

The lecture concludes: *"No one has sat still long enough to hear this explained — until now."* He does not ring the bell at the end. He hands the pamphlet to the Fighter and tells them about the window he has never mentioned to anyone before.

**TOKEN:** Richard's Lecture Notes — Pamphlet: THE STRONG LAW OF SMALL NUMBERS; stamped DELIVERED. ATTENDANCE WAS NONOPTIONAL.

**Route:** EHZ → WM

**Theme:** The pattern that looks like more than coincidence because the sample is too small to contain enough counter-examples; the man whose life's work is ensuring no one leaves the station without understanding why they are wrong about the pattern they just noticed; the satisfaction of a man who finally has a full audience; the archive that receives the notes as its first entry in a category that should not need to exist but apparently does.

**Archive category:** Compulsory Education Records — Lectures Delivered on the Law of Small Numbers; Arguments Whose Correctness Did Not Depend on Whether the Audience Arrived Voluntarily; first entry: "There aren't enough small numbers to meet the demands made of them. The Fighter attended. The chalkboard thumped."

**See:** `1367-sources/MATH-small-numbers.md`

---

### Node Summary

| Node | Name | Access | Description |
|------|------|--------|-------------|
| EHZ | Event Horizon | CY passage, unlocks after 3 math documents carried | Space-station node; magical rope + infinite emergency ladder; observation deck facing the Monster's manifold; AI speaks in Noether's theorem |
| MONS | The Monster's Manifold | EHZ only | 196,883-dimensional room compressed to 3D puzzle space; the Monster's multiplication table as wall decoration; the Moonshine Memo on the floor |
| ZERO | The Zero Transit | CON or CAI | The passage point where zero entered European mathematics; a corridor with two doors: one labeled MXLVII and one labeled 1047; only one opens from the inside |
| CNTR | Cantor's Attic | EHZ → emergency ladder, ∞ rungs up | Accessible only in endgame; the room where countable and uncountable infinity meet; the ladder never ends but the first 10 rungs are enough to solve the quest |


---

## Batch 3 — Remaining Queue (Books 61–78, reversed processing order)

**Directive:** Process reversed. Each book: write/complete UQF cycles to reach questComplete, run admin pass (quest-map.md rows + theme threads, Location Grid, books.md SEEDS COMPLETE, plan.md update), commit, `say` audio, continue.

**State key:**
- `ADMIN ONLY` — cycles done, questComplete present; need books.md + plan.md + quest-map.md admin pass
- `NEEDS QC` — cycles done but questComplete missing from final cycle; add questComplete then admin pass
- `NEEDS N–7` — has N UQF cycles; write cycles N+1 through 7 then admin pass
- `OLD FORMAT` — file uses prose-pass format (not UQF stubs); write full UQF cycles 1–7 from seeds in file

| # | Code | Title | Era | Genre | KB | State | Notes |
|---|------|-------|-----|-------|----|-------|-------|
| 61 | BLQ | Decameron — Giovanni Boccaccio | 1353 | Italian Stories | 1709 | NEEDS QC | 11 cycles written, no questComplete; mark cycle 11 complete + admin pass |
| 62 | HAV | Buccaneers of America — Alexandre Exquemelin | 1678 | Pirate History | 247 | OLD FORMAT | Pass 1–3 + seeds in file; HAV-01 spec + HAV-02 spec done; write UQF 03–07 from seeds |
| 63 | AMS | Tale of Genji — Murasaki Shikibu | c.1010 | Japanese Novel | 435 | OLD FORMAT | Pass 1–3 + seeds; AMS-01 spec done + AMS-07 seed; write UQF 02–07 from seeds |
| 64 | HTY | Mahabharata — Dutt condensation | Ancient | Hindu Epic | 83 | OLD FORMAT | §HTY-01 spec + §HTY-02–06 seeds in file; write UQF 01–07 from seeds |
| 65 | CLJ | Dracula — Bram Stoker | 1897 | Gothic Horror | 869 | OLD FORMAT | Pass 1–3 + CLJ-01 spec + CLJ-02–09 seeds; write UQF 02–07 (CLJ-01 → CLJ-07) |
| 66 | WAW | Quo Vadis — Sienkiewicz | c.64–68 AD | Historical Novel | 1201 | ADMIN ONLY | 7 UQF cycles + questComplete present; run admin pass |
| 67 | NWI | Anabasis — Xenophon | c.401 BC | Greek Military | 545 | ADMIN ONLY | 8 UQF cycles + questComplete present; run admin pass |
| 68 | MLA | Plutarch's Lives — Plutarch | c.95–110 AD | Biography | 4222 | ADMIN ONLY | 7 UQF cycles + questComplete present; run admin pass |
| 69 | CRL | Froissart Chronicles (Boys transl.) | 14th–15th C | Medieval History | 802 | NEEDS QC | 8 cycles written, no questComplete; mark cycle 8 complete + admin pass |
| 70 | CPH | Gesta Danorum — Saxo Grammaticus | c.1200 | Danish Chronicles | 689 | OLD FORMAT | Pass 1–3 + 5-act vignette in file; write UQF 01–07 from seeds |
| 71 | MOL | Laxdaela Saga — Anon | ~13th C | Icelandic Saga | 347 | OLD FORMAT | Pass 1–3 + 5-act vignette in file; write UQF 01–07 from seeds |
| 72 | LBC | Nibelungenlied — Anon | c.1200 | German Epic | 660 | NEEDS 5–7 | 4 UQF cycles done; write cycles 5–7 then admin pass |
| 73 | FRO | Volsunga Saga — Anon | ~13th C | Norse Legend | 342 | NEEDS 3–7 | 2 UQF cycles done; write cycles 3–7 then admin pass |
| 74 | MSE | Canterbury Tales — Chaucer | c.1390 | Medieval Stories | 1688 | NEEDS 2–7 | 1 UQF cycle done (spec + seeds); write cycles 2–7 then admin pass |
| 75 | KIR | Mabinogion — Anon | ~12th–13th C | Celtic Myth | 365 | NEEDS 3–7 | 2 UQF cycles done; write cycles 3–7 then admin pass |
| 76 | SEN | Treasure Island — Stevenson | 1883 | Pirate Adventure | 390 | OLD FORMAT | Pass 1–3 + seeds in file; write UQF 01–07 from seeds |
| 77 | MAN | Ivanhoe — Walter Scott | 1819 | Historical Novel | 1140 | NEEDS 3–7 | 2 UQF cycles done; write cycles 3–7 then admin pass |
| 78 | STN | Robin Hood — Howard Pyle | c.1883 | Outlaw Hero | 621 | OLD FORMAT | Pass 1–3 + seeds in file; write UQF 01–07 from seeds |

---

### Batch 3 Progress

| # | Code | Title | Status |
|---|------|-------|--------|
| 61 | BLQ | Decameron | **SEEDS COMPLETE 2026-06-03 — BLQ-01–12 all vignettes done. 12 cycles. Theme threads added.** |
| 62 | HAV | Buccaneers of America | **SEEDS COMPLETE 2026-06-03 — HAV-01–07 done. UQF cycles written. No new nodes.** |
| 63 | AMS | Tale of Genji | **SEEDS COMPLETE 2026-06-03 — AMS-01–07 done. questComplete added. MRG node added. Theme threads added.** |
| 64 | HTY | Mahabharata | **SEEDS COMPLETE 2026-06-03 — HTY-01–07 done. HTY-01 stub written; HTY-07 new cycle. Theme threads added. GNJ already in grid.** |
| 65 | CLJ | Dracula | **SEEDS COMPLETE 2026-06-03 — CLJ-01–09 done. CLJ-01 UQF stub written; questComplete added to CLJ-09. Theme threads for all 9 cycles added.** |
| 66 | WAW | Quo Vadis | **SEEDS COMPLETE 2026-06-03 — WAW-01–08 done (8 cycles). questComplete added. SAU/VFM/BLO nodes added. Theme threads for all 8 cycles.** |
| 67 | NWI | Anabasis | **SEEDS COMPLETE 2026-06-03 — NWI-01–09 done (9 cycles). questComplete added. 7 new nodes (CPL/BLK/SIN/ORC/VAR/MYS/ANC). Theme threads for all 9 cycles.** |
| 68 | MLA | Plutarch's Lives | **SEEDS COMPLETE 2026-06-03 — MLA-01–07 done (7 cycles). questComplete added to MLA-07. New nodes LMO/THA/ROM added to Location Grid. Theme threads for all 7 cycles.** |
| 69 | CRL | Froissart (Boys) | **SEEDS COMPLETE 2026-06-03 — CRL-01–08 done (8 cycles). questComplete added to CRL-08. New node AVG added. Theme threads for all 8 cycles.** |
| 70 | CPH | Gesta Danorum | **SEEDS COMPLETE 2026-06-03 — CPH-01–02 done (2 cycles). questComplete added to CPH-02. Theme threads already present. Rows updated.** |
| 71 | MOL | Laxdaela Saga | **SEEDS COMPLETE 2026-06-03 — MOL-01–02 done (2 cycles). questComplete added to MOL-02. Theme threads already present. Rows updated.** |
| 72 | LBC | Nibelungenlied | **SEEDS COMPLETE 2026-06-03 — LBC-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to LBC-07. New nodes NIL/WOR/RHN/KOL/HST. Theme threads for all 7 cycles.** |
| 73 | FRO | Volsunga Saga | **SEEDS COMPLETE 2026-06-03 — FRO-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to FRO-07. New nodes FLM/ATL/WRM/ODD/LYG/HKL/SIG/VLN. Theme threads for all 7 cycles.** |
| 74 | MSE | Canterbury Tales | **SEEDS COMPLETE 2026-06-03 — MSE-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to MSE-07. New nodes BRT/ORL/ACT/RDW/CHY/PCR/LRD/SAL/COT. Theme threads for all 7 cycles.** |
| 75 | KIR | Mabinogion | **SEEDS COMPLETE 2026-06-03 — KIR-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to KIR-07. New nodes HVY/ARB/ARD/GWN/WLD/MGL/HER. Theme threads for all 7 cycles.** |
| 76 | SEN | Treasure Island | **SEEDS COMPLETE 2026-06-03 — SEN-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to SEN-07. New nodes HMS/STK/BGC/NHS/TIS. Theme threads for all 7 cycles.** |
| 77 | MAN | Ivanhoe | **SEEDS COMPLETE 2026-06-03 — MAN-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to MAN-07. New nodes SHF/HMT. Theme threads for all 7 cycles.** |
| 78 | STN | Robin Hood | **SEEDS COMPLETE 2026-06-03 — STN-01–07 done (7 cycles). Wrote cycles 3-7. questComplete added to STN-07. New nodes EMT/LEA/NTN/KLN. Theme threads for all 7 cycles.** |

---

## §IMPORT-01 — API Import Queue (Batch 3, Books 61–78)

**Directive (permanent):** When vignette seeds for a book are complete, import that book's nodes, NPCs, and quest chains into the game via API. Seed completion = import trigger. This numbered procedure is mandatory and must be followed in order for every quest in every book.

**Before starting any import:** Read `{CODE}-{title}.md` (vignette seeds + UQF cycles) and `index.md` (canonical nodes, airport codes, terrain) to understand the story geography. Location information must adhere to the story — do not invent geography.

**Node naming — two tiers:**

**Tier 1 — Cities and towns** (the player travels to these on the world map):
Use the IATA airport code of the nearest major airport as the 3-letter node code.
- If taken, use the nearest alternate airport in the same region.
- If no airport exists, derive a 3-letter abbreviation from the city/town name and record it in `index.md`.
- Examples: `PSA` (Florence/Pisa region), `NAP` (Naples), `EMA` (Nottingham/East Midlands)

**Tier 2 — Named specific locations** (a place within or near a city: market, court, inn, field, palace, guard shack, bakery, counting house, forest clearing, harbour dock, etc.):
Do NOT use airport codes. Use a 4–5 character descriptive code that encodes the city abbreviation + location type.
- Format: `{CITY}{LOC}` — 2–3 chars from the city name + 2–3 chars from the location type = 4–5 chars total
- The code must be self-explanatory: a reader should be able to guess what city and what kind of place it is
- Examples:
  - `BIRGS` — Birka Guard Shack (BIR + GS)
  - `BIRTV` — Birka Tavern (BIR + TV)
  - `PSAGLD` — Florence/Pisa guild counting house (PSA + GLD)
  - `NAPCRT` — Naples ecclesiastical court (NAP + CRT)
  - `SHWFST` — Sherwood Forest (SHW + FST)
  - `EMACHT` — Nottingham/EMA city gate (EMA + CHT)
- Record every Tier 2 code in `index.md` with: the full location name, its city anchor, terrain type, and story role.

**Rule:** City or town the player travels to = 3-letter Tier 1 code. Any specific named place inside or near that city (a building, institution, field, road junction, shack) = 4–5 char Tier 2 descriptive code. Not all locations need to be airport codes — only cities and towns do. The label must encode *why* the location exists: its name and its story purpose.

---

### §IMPORT-01 Ordered Procedure (mandatory, per quest cycle)

This procedure runs once per vignette act (one quest at a time). Complete all 8 steps before starting the next act.

**Step 1 — Verify the primary location**
- `GET /api/location/{code}` — check if the node exists
- If missing: pick IATA airport code (check uniqueness with `GET /api/list/node`), then `POST /api/node` with `r`, `c` coordinates near the story's geographic anchor
- Use `GET /api/coords/near/{anchor}?radius=8` to find an unoccupied slot
- Confirm with `GET /api/location/{code}` — terrain type and label must match the story

**Step 2 — Verify the quest NPC exists**
- `GET /api/npc/{id}` — check if the NPC named in the vignette exists
- If missing: `POST /api/npc` with name, role, home node, and dialogue stub
- NPC names derive from the story source — use the character as written

**Step 3 — Verify NPC is at the location**
- Confirm the NPC's `node` field matches the location from Step 1
- If mismatched: `PUT /api/npc/{id}` to correct the `node` field
- NPC must be resident at the node where the quest fires

**Step 4 — Verify all other locations the quest touches**
- Each act may reference additional nodes (waypoints, destination, handoff city)
- For each: `GET /api/location/{code}` — add missing nodes using Steps 1 procedure
- All `activateNode` codes in the quest chain must exist before any quest is created

**Step 5 — Add the quest via NPC**
- `POST /api/quest` — create the quest entry with the NPC as trigger anchor
- Include all required text fields: `title`, `text` (location/arrival description), `passText`, `failText`
- Set `type` from: `combat | explore | trade | social | mission_bit | skill_check`
- Set `activateNode` = the node where this act fires
- Set `checkPassFlag` = unique flag name for this act's completion
- If act > 1: set `activateCond` = previous act's `checkPassFlag`
- If final act: set `questComplete: true`

**Step 6 — Chain via mission bits**
- `GET /api/quest/{id}/chain` — verify the dependency chain is connected end-to-end
- All mission bit flags referenced by `activateCond` must exist — `POST /api/flags` for any missing
- Chain must resolve: Act 1 → Act 2 → ... → Act N (questComplete)

**Step 7 — Validate after insert**
- `GET /api/audit` — check for broken node refs, missing flags, duplicate flag names, invalid types
- Fix every error reported before proceeding
- No quest book is fully imported until audit is clean

**Step 8 — Review unresolved items with user, mark done, speak, then repeat**
- Report any items that could not be imported: missing source data, ambiguous node codes, NPC identity conflicts
- Ask the user to resolve before continuing
- When all acts of a vignette cycle are imported and audit is clean: `POST /api/save`
- **If user confirms good:** mark the vignette cycle as `IMPORTED` in the §IMPORT-01 Import Queue table (change `QUEUED` → `IMPORTED — {date}`)
- Run: `say "Cycle imported. Ready to continue. Say yes to proceed to the next quest."` (or equivalent per next cycle)
- Wait for user confirmation, then return to Step 1 for the next act / next vignette cycle

---

### Import Queue

| # | Code | Title | Starting Node | Key New Nodes | Import Status |
|---|------|-------|--------------|--------------|---------------|
| 61 | BLQ | Decameron | PSA (Florence/Pisa) | PSA/NAP/PIS/PRA/GEN/DBV/CON/BOL/VEN/FRR/RHD/FAM/ALE/BRI/BAR/AVG/MTP/MAR/ROM + NUE(existing) + 18 Tier-2 nodes; BLQ-01–12 imported (60 acts) | IMPORTED — 2026-06-03 |
| 62 | HAV | Buccaneers of America | CHI (Chios) | CHI/CAF/TRB + RHD/FAM/CON/VEN/DBV/NUE(existing); HAV-01–06 imported (30 acts) | IMPORTED — 2026-06-03 |
| 63 | AMS | Tale of Genji | NIS (Nishapur) | NIS/TBZ/BGD/SAM/MRV/MRG + TRB/CON/DBV/NUE(existing); AMS-01–07 imported (35 acts) | IMPORTED — 2026-06-04 |
| 64 | HTY | Mahabharata | TBZ (Tabriz) | BUR (Bursa, using BUR not BRS to preserve BRS for SEN/Bristol)/GNJ (Ganja) + TBZ/NIS/BGD/SAM/TRB/CON/NUE(existing); HTY-01–07 imported (35 acts) | IMPORTED — 2026-06-03 |
| 65 | CLJ | Dracula | BIS (Bistritz) | BIS/KLZ/SIB/BDA/BOR + NUE(existing); CLJ-01–09 imported (45 acts) | IMPORTED — 2026-06-03 |
| 66 | WAW | Quo Vadis | ROM (Rome) | SAU/VFM/ANT new nodes; WAW_001–WAW-07 (8 cycles, 40 acts); questComplete WAW-03 | IMPORTED — 2026-06-04 |
| 67 | NWI | Anabasis | CON (Constantinople) | BLK/BTR/SIN/ORC/VAR/MYS/AOI/REG new nodes; NWI_001–NWI-08 (9 cycles, 45 acts); questComplete NWI-08; ANC→AOI; TBZ→TRB; RGS→DBV(cycles 2,3,4)/REG(cycle 9) | IMPORTED — 2026-06-04 |
| 68 | MLA | Plutarch's Lives | LMO (Thessaloniki) | LMO/THA/NXS new nodes; MLA-01–05/02/04/06/03 (7 cycles, 35 acts); questComplete MLA-05 (cycle 7); AOI/MYS from NWI reused | IMPORTED — 2026-06-04 |
| 69 | CRL | Froissart (Boys) | LON (London) | LON/CDV/FRK/PER/BDX/SRL new nodes; AVG reused; CRL-001–008 (8 cycles, 40 acts); questComplete CRL-008 | IMPORTED — 2026-06-04 |
| 70 | CPH | Gesta Danorum | STK (Starkad's coast) | STK/DAN/HEO/DNS/BRK new nodes; CPH-01–02 (2 cycles, 10 acts); questComplete CPH-02 | IMPORTED — 2026-06-04 |
| 71 | MOL | Laxdaela Saga | LGR (Iceland) | LGR/LXF/HHL/VRG/BLT/HFG new nodes; MOL-01–02 (2 cycles, 10 acts); questComplete MOL-02 | IMPORTED — 2026-06-04 |
| 72 | LBC | Nibelungenlied | ETZ (Etzel's Court) | ETZ/DBN/NIL/WOR/RHN/KOL/HST/BTL new nodes; LBC-01–07 (7 cycles, 35 acts); questComplete LBC-07; GNH→WOR; WM→NUE | IMPORTED — 2026-06-04 |
| 73 | FRO | Volsunga Saga | SFJ (Sigmund's field) | SFJ/BK/GNP/FLM/WRM/ODD/LYG/HKL/SIG/VLN new nodes; FRO-01–07 (7 cycles, 35 acts); questComplete FRO-01/02/03/05/06/07; GNH→WOR; ATL→ETZ; WM→NUE | IMPORTED — 2026-06-04 |
| 74 | MSE | Canterbury Tales | MSE (Canterbury) | MSE/TVO/OKD/BRT/ORL/ACT/RDW/CHY/PCR/LRD/SAL/COT new nodes; MSE-01–07 (7 cycles, 35 acts); questComplete on all 7; WM→NUE | IMPORTED — 2026-06-04 |
| 75 | KIR | Mabinogion | CWT (Cwm Wyllt) | CWT/RDV/CWL/TWY/BRC/HLG/GWL/LDN/HVY/ARB/HFD/ARD/GWN/WLD/MGL new nodes (HER collision→HFD); KIR-01–07 (7 cycles, 35 acts); questComplete on all 7; WM→NUE | IMPORTED — 2026-06-04 |
| 76 | SEN | Treasure Island | ADM (Admiral Benbow) | ADM/TL/VS/HMS/SKD/BGC/NHS/TIS new nodes (STK collision→SKD); SEN-01–07 (7 cycles, 30 acts: cycles 1–2 have 5 acts, cycles 3–7 have 4 acts); questComplete on all 7; WM→NUE | IMPORTED — 2026-06-04 |
| 77 | MAN | Ivanhoe | YRK (York) | YRK/ASH/NRG/ROT/TPR/SHF/SHW/HMT new nodes (AHB collision→ASH); MAN-01–07 (7 cycles, 32 acts: cycles 1–4 have 5 acts, cycles 5–7 have 4 acts); questComplete on all 7; WM→NUE | IMPORTED — 2026-06-04 |
| 78 | STN | Robin Hood | SHW (Sherwood Forest) | BLW/GMT/NGM/EMT/LEA/NTN/KLN new nodes (SHW shared from MAN); STN-01–07 (7 cycles, 30 acts: cycles 1–2 have 5 acts, cycles 3–7 have 4 acts); questComplete on all 7; WM→NUE | IMPORTED — 2026-06-04 |
| 79 | IST | The Alexiad (Anna Komnene) | CON (Constantinople) | PAR new node (Palermo, r:187 c:210); existing: CON/DBV/RHD/THA/AOI/NUE; IST-01–07 (7 cycles, 35 acts); questComplete on all 7; RGS→DBV; ANC→AOI; WM→NUE | IMPORTED — 2026-06-04 |
| 80 | BGW | Arabian Nights (Burton tr.) | KHR new node (Cairo Booksellers' Quarter, r:193 c:230); TUN new node (Tunis Monastery, r:183 c:205); existing: FAM/ALE/VEN/TBZ/BGD/GEN/CON/NUE; BGW-01–08 (8 cycles, 40 acts); questComplete on all 8; CAI→KHR (collision); WM→NUE; BAG→BGD | IMPORTED — 2026-06-04 |
| 81 | CAI | Arabian Nights (Lang adaptation) | ALB new node (Aleppo Hills — Mar Marun Monastery, r:170 c:237); ALP new node (Aleppo — Storytellers' Quarter, r:168 c:238); LAT new node (Latakia — Syrian Mediterranean Port, r:166 c:233); existing: ANT/BGD/TRB/CON/DAM/ALE/NUE; CAI-01–08 (8 cycles, 40 acts); questComplete on all 8; WM→NUE; BAG→BGD | IMPORTED — 2026-06-04 |
| 82 | LHR | Beowulf (Gummere) | HEO/DAN reused from CPH; BRW new node (Dragon's Barrow, r:99 c:169, ruins); GEA new node (Geatland coast, r:100 c:169, beach); WM new node (Weimar Archive, r:117 c:204, scholars_qtr); LHR-01–07 (7 cycles, 35 acts); questComplete on LHR-07 act5; coast→beach terrain fix on GEA | IMPORTED — 2026-06-05 |
| 83 | LCY | The White Company (Doyle) | LCY (existing Harbor Docks–Tilbury)/LDN/WM all existing; LCY-01–07 (7 cycles, 35 acts); questComplete on LCY-07 act5 | IMPORTED — 2026-06-05 |
| 84 | LGW | Le Morte d'Arthur (Malory) | AST new node (Astolat manor, r:109 c:156, camelot); RVP new node (River Ford, r:110 c:155, freshwater_lake); CAM new node (Vale of Camlann, r:116 c:150, ruins); LKS new node (Avalon Shore, r:116 c:149, freshwater_lake); LGW/BK/ROM/CON/LDN/WM existing; LGW-01–07 (7 cycles, 35 acts); questComplete on LGW-07 act5 | IMPORTED — 2026-06-05 |
| 85 | GCI | Toilers of the Sea (Hugo) | STP new node (St. Peter Port Guernsey, r:118 c:163, docks); GHL new node (Gild-Holm-Ur tidal rock, r:119 c:163, beach); BK/VEN/CON/ROM/LDN/WM existing; GCI-01–07 (7 cycles, 35 acts); questComplete on GCI-07 act5; cycle 1 uses STP (existing GCI is merchant ship); RME→ROM | IMPORTED — 2026-06-05 |
| 86 | INV | Ossian (MacPherson) | CNA new node (Vale of Cona, r:86 c:148, highlands); HLD new node (Scottish Coastal Headland, r:86 c:152, highlands); CON/VEN/WM existing; INV-01–07 (7 cycles, 35 acts); questComplete on INV-07 act5; INV node collision (epic battleground)→CNA for cycle 1 | IMPORTED — 2026-06-05 |
| 87 | BHD | Cuchulain of Muirthemne (Gregory) | EMR new node (Emain Macha Ulster Hall, r:84 c:140, camelot); PSU new node (Plain of Murthemne Standing Stone, r:82 c:140, ruins); ULC new node (Ulster Ford Red Branch Road, r:86 c:140, road); BK/VS/WM existing; BHD-01–07 (7 cycles, 35 acts); questComplete on BHD-07 act5; BHD node collision (Camelot road)→EMR for cycle 1 | IMPORTED — 2026-06-05 |
| 89 | PLW | Piers Plowman (Langland) | MGF new node (Malvern Field, r:113 c:143, highlands); BK/VEN/CON/ROM/LDN/WM existing; PLW-01–07 (7 cycles, 35 acts); questComplete on PLW-07 act5; FCO quest-prefix collision (Aeneid already imported)→PLW prefix; RME→ROM | IMPORTED — 2026-06-05 |
| 88 | SDQ | Rob Roy (Scott) | OBH new node (Osbaldistone Hall, r:109 c:142, camelot); GLA new node (Glasgow, r:93 c:143, city); ABF new node (Aberfoyle, r:91 c:142, highlands); GLN new node (MacGregor Glen, r:89 c:141, highlands); LLM new node (Loch Lomond, r:93 c:145, freshwater_lake); EDI new node (Edinburgh, r:96 c:148, city); LON/WM existing; SDQ-01–07 (7 cycles, 35 acts); questComplete on SDQ-07 act5; SDQ collision (Crones' Domain)→OBH; PUT /api/node/{code} terrain key fix applied | IMPORTED — 2026-06-05 |
| 90 | GDN | Njal's Saga (Anon, Dasent) | IGH new node (Ingolf's Head Iceland coast, r:82 c:108, beach); SWF new node (Swinefell Flosi's hall, r:84 c:110, camelot); ISL new node (Althing Ground Iceland, r:86 c:112, highlands); HHL/BK/VS/HEO/CON/WM existing; gdn_01–07 (7 cycles, 35 acts); questComplete on gdn_07_act5; GDN node collision (Danzig Grain Port)→quest prefix only (no node created) | IMPORTED — 2026-06-05 |
| 91 | BOO | Prose Edda (Snorri, c.1220) | ASG new node (Ásgarðr Frigg's Hall, r:78 c:112, camelot); THK new node (Þökk's Cave, r:80 c:108, ruins); HNJ new node (Hnitbjörg, r:82 c:110, highlands); BK/VEN/CON/ROM/LDN/WM existing; boo_01–07 (7 cycles, 35 acts); questComplete on boo_07_act5; BOO node collision (Yugurt Lake)→quest prefix only (no node created) | IMPORTED — 2026-06-05 |
| 92 | ALF | Kalevala (Lönnrot, 1849) | TUO new node (Tuonela boundary shore, r:84 c:116, ruins); KVF new node (Kullervo's forest clearing, r:80 c:114, highlands); KVM new node (Master's hall, r:82 c:116, camelot); BK/CON/ROM/LDN/WM existing; alf_01–07 (7 cycles, 35 acts); questComplete on alf_07_act5; ALF collision (North Shore Path)→quest prefix only | IMPORTED — 2026-06-05 |
| 93 | KSU | Heimskringla (Snorri, c.1230) | NID new node (Nidaros shrine city, r:79 c:118, city); ECF new node (Eclipse Farm coast, r:77 c:116, beach); BK/VEN/CON/ROM/LDN/WM existing; ksu_01–07 (7 cycles, 35 acts); questComplete on ksu_07_act5; KSU collision (Lake Harbor)→NID hub for cycles 3–7 | IMPORTED — 2026-06-05 |
| 94 | CDG | The Three Musketeers (Dumas & Maquet, 1844) | BTH new node (Bethune Convent, r:86 c:118, camelot); REL new node (Relay Post, r:88 c:120, city); DAR new node (Road Junction, r:90 c:122, highlands); LON/CDV/TL/BK/VEN/CON/ROM/LDN/WM existing; cdg_01–07 (7 cycles, 35 acts); questComplete on cdg_07_act5; CDG node collision (Cat Quarter)→LON hub for cycles 3–7; RME→ROM | IMPORTED — 2026-06-05 |
| 95 | VIE | Faust (Goethe, 1808) | MGR new node (Gretchen's Prison Tower, r:92 c:126, city); DKN new node (Dominican Legal Court, r:92 c:128, city); CLK new node (Clerk's Sickroom, r:94 c:127, city); VIE existing; BK/VEN/CON/ROM/LDN/WM existing; vie_01–07 (7 cycles, 35 acts); questComplete on vie_07_act5; RME→ROM | IMPORTED — 2026-06-05 |
| 96 | ERF | Grimm's Fairy Tales (Brothers Grimm, 1812) | ERF existing (Grimm Archive city hub); ANT existing (Prince's Antechamber); STB new node (Livery Stable District, r:98 c:128, city); GLD new node (Trade Guild Court, r:98 c:130, city); CI new node (Chancery Court, r:100 c:130, city); DNG new node (Faithful John's Restoration Room, r:98 c:132, camelot); CHC new node (Castle Household Corridor, r:100 c:132, camelot); PRH new node (Prince's Great Hall, r:102 c:133, camelot); BK/VEN/CON/ROM/LDN/WM existing; erf_01–07 (7 cycles, 35 acts); questComplete on erf_07_act5; RME→ROM; CI finale for cycle 1 (chancery court); PRH finale for cycle 2 (prince's seal) | IMPORTED — 2026-06-05 |
| 97 | HFT | Frithiof's Saga (Tegnér, 1825) | ALR new node (Alrekstaðir Temple, r:104 c:128, camelot); BLG new node (Balder's Grove, r:104 c:130, highlands); RNG new node (Ring's Private Chamber, r:106 c:128, camelot); ING new node (Ingeborg's Chamber, r:106 c:130, camelot); HEO existing (Lejre); BK/CON/VEN/LDN/WM existing; hft_01–07 (7 cycles, 35 acts); questComplete on hft_07_act5; HFT collision (South Shore Fishermen)→BLG hub for cycles 3–7 | IMPORTED — 2026-06-05 |
| 98 | RKV | Poetic Edda (Anon, ~10th–13th C, Codex Regius c.1270) | VLH new node (Völva's Heath, r:108 c:128, highlands); AEG new node (Ægir's Feast Hall, r:108 c:130, camelot); RSS new node (Standing Stone Archive Road, r:108 c:132, ruins); ASG/BK/CON/VEN/ROM/LDN/WM existing; rkv_01–07 (7 cycles, 35 acts); questComplete on rkv_07_act5; RKV collision (Frost Warden's Throne)→AEG hub cycles 3–7; cycle 1→VLH; cycle 2→AEG/ASG/RSS | IMPORTED — 2026-06-05 |
| 99 | OST | Song of Roland (Anon, c.1100) | RON new node (Roncevaux Pass, r:110 c:128, highlands); PYR new node (Pyrenean High Road, r:110 c:130, highlands); AIX new node (Aix-la-Chapelle Chapel, r:110 c:132, camelot); FRS new node (Frankish Road-Town, r:110 c:134, city); BK/CON/VEN/ROM/LDN/WM existing; ost_01–07 (7 cycles, 35 acts); questComplete on ost_07_act5; OST collision (Bruges—Cloth Hall)→quest prefix only; cycles 1–2 route RON/PYR/AIX/FRS naturally; cycles 3–7 hub at AIX or RON | IMPORTED — 2026-06-05 |
| 100 | ARN | Knights of the Cross (Sienkiewicz, 1900) | KRK new node (Kraków royal court, r:112 c:212, city); JUR new node (Spychów/Jurand's Castle, r:108 c:212, camelot); TKT new node (Teutonic Border Crossing, r:104 c:212, road); CHP new node (Chapel near Mazovian border, r:108 c:210, camelot); BK/CON/VEN/ROM/LDN/WM existing; arn_01–07 (7 cycles, 35 acts); questComplete on arn_07_act5; cycles 1–2 full prose vignettes; cycles 3–7 expanded from stubs | IMPORTED — 2026-06-05 |
| 101 | VBY | Grettir's Saga (Anon, c.1310) | RKN new node (Reykjaness shore-farm, r:84 c:106, beach); BWH new node (burial mound Norwegian coast, r:80 c:114, ruins); BK/CON/VEN/ROM/LDN/WM existing; vby_01–07 (7 cycles, 35 acts); questComplete on vby_07_act5; cycles 1–2 full prose vignettes; cycles 3–7 expanded from stubs | IMPORTED — 2026-06-05 |
| 102 | RIX | Egil's Saga (Anon/Snorri, c.1240) | no new nodes — YRK/ISL existing; BK/CON/VEN/ROM/LDN/WM existing; rix_01–07 (7 cycles, 35 acts); questComplete on rix_07_act5; cycles 1–2 full prose vignettes; cycles 3–7 expanded from stubs | IMPORTED — 2026-06-05 |

---

### Per-Book Import Notes

**BLQ (Decameron):** Starting city Florence (FLR) should already be in NODE_MAP. Query `GET /api/location/FLR` to confirm. All 12 vignette cycles may share the Florence anchor; place secondary nodes (plague refugee route cities) within 4–8 cells.

**HAV (Buccaneers):** Caribbean setting. No existing nodes in this region. Use `GET /api/coords/near/WM?radius=32` to find space on the western edge of the map for Caribbean placement. Terrain: `coast` for port cities, `island` for remote anchorages.

**AMS (Genji):** East Asian placement, far corner of map. Terrain: `forest` (Muro-no-Yoshino), `court` equivalent via `city`. MRG node confirmed needed.

**HTY (Mahabharata):** Ancient Indian setting. Place on southeastern edge. Terrain: `plains` (Kurukshetra battlefield), `forest` (exile aranya), `mountain` (Himavat).

**CLJ (Dracula):** Eastern Europe + England. OTP node for Transylvania interior, then route west through BUD to LHR. Terrain: `mountain` (Carpathian), `city`, `coast` (Whitby cliff).

**WAW (Quo Vadis):** Rome (FCO) is the anchor. SAU (Saul's early node), VFM (Via Flaminia waypoint), BLO (Blessed locale) all need creation near FCO. Terrain: `road` for Via waypoints, `ruins` for catacombs area.

**NWI (Anabasis):** Long overland route. IST anchors the western terminus. All 7 new nodes span Anatolia → Persia → Black Sea. Place in a geographic arc, terrain: `plains`, `mountain`, `coast`.

**MLA (Plutarch's Lives):** ATH is the philosophical anchor. LMO (Lamia region), THA (Thebes area), ROM (Roman node distinct from FCO if FCO already exists). Terrain: `city`, `ruins`.

**CRL (Froissart Boys):** CDG or nearby Paris-region node anchors. AVG (Avignon) placed south. Terrain: `city`, `road`.

**CPH (Gesta Danorum):** Northern Europe. CPH code may collide with an existing node — check `GET /api/list/node` first. If taken, use BLL (Billund/Jutland alternative).

**MOL (Laxdaela Saga):** Iceland. KEF (Keflavik) anchors. Terrain: `coast`, `tundra`.

**LBC (Nibelungenlied):** Rhine corridor. FRA anchors. NIL (Nibelung hall, forest north), WOR (Worms, city), RHN (Rhine ford, river/road), KOL (Cologne, city), HST (Hunland steppe, plains east).

**FRO (Volsunga Saga):** Norse mythic geography. OSL anchors. FLM (Fafnir's heath, plains/forest), ATL (Atli's hall, east), WRM (Worms, city), VLN (Valhal approach, mountain).

**MSE (Canterbury Tales):** LGW (Gatwick) anchors the London side; Canterbury proper use MSE (Manston/Kent) or derive CTB. Pilgrimage road nodes spaced along the route.

**KIR (Mabinogion):** CWL (Cardiff/Wales) anchors. Celtic terrain: `forest`, `coast`, `plains`. GWN (Gwynedd north Wales), ARD (Arderydd battle site).

**SEN (Treasure Island):** BRS (Bristol) anchors. HMS (Hispaniola island), STK (Stockade camp), BGC (Black Cave cache), NHS (North Harbour Shore), TIS (Treasure Island summit). Terrain: `coast`, `island`, `forest`.

**MAN (Ivanhoe):** LBA (Leeds-Bradford/Yorkshire) anchors. SHF (Sheffield area — Locksley village), HMT (Helmsley — tournament site). Terrain: `forest`, `city`.

---

## §SESSION-END-2026-06-05 — Outstanding Import Work

### Completed this session (tracking files NOT yet updated)

**§IMPORT-99 OST — La Chanson de Roland (Anon, c.1100 AD)**
- Script: `import_ost.py` — written and run cleanly
- 4 new nodes: RON (Roncevaux Pass, highlands, 110,128), PYR (Pyrenean High Road, highlands, 110,130), AIX (Aix-la-Chapelle Chapel, camelot, 110,132), FRS (Frankish Road-Town, city, 110,134)
- 35 quests: ost_01_act1 through ost_07_act5; questComplete on ost_07_act5
- OST code collision (Bruges — Cloth Hall) → quest prefix only; no OST hub node needed; cycles 1–2 route RON/PYR/AIX/FRS naturally; cycles 3–7 hub at AIX or RON
- Post-import audit: **443 nodes, 1590 quests**
- **Still needed**: update api-data-audit.md (add OST row after RKV), update plan.md line 317 (OST → IMPORTED), add import queue entry #99, update index.md (add OST collision entry + OST node section), commit as §IMPORT-99

### Next books to import (all SEEDS COMPLETE)

In approximate queue order:

| Code | Title | New Nodes | Source File |
|------|-------|-----------|-------------|
| ARN | Knights of the Cross — Sienkiewicz | KRK/JUR/TKT/CHP (per Location Grid) | ARN-knights-of-the-cross.md |
| VBY | Grettir's Saga — Anon | RKN/BWH | VBY-grettir-saga.md |
| RIX | Egil's Saga — Anon (attr. Snorri) | YRK/ISL | RIX-egil-saga.md |
| ZTH | Odyssey — Homer (Butler) | PHC/RME | ZTH-odyssey.md |
| ATH | Iliad — Homer (Lang) | none | ATH-iliad.md |
| JRS | Jerusalem Delivered — Tasso | none | JRS-jerusalem-delivered.md |
| LIS | Lusiads — Camões | none | LIS-lusiad.md |
| MAD | Chronicle of the Cid — Anon (Southey) | VLC | MAD-chronicle-cid.md |
| FLR | Divine Comedy: Inferno — Dante | none | FLR-divine-comedy-inferno.md |
| TBS | Knight in the Panther's Skin — Rustaveli | none | TBS-knight-panther-skin.md |
| BEY | Mandeville's Travels | unknown (FAM/RGS per earlier notes) | BEY-mandeville.md |
| KYA | Shah-Nameh | YAZ/KBL/SIS/TBZ/TRB/HRT — 25 cycles | §KYA-CONT in plan.md |

### Procedure on next session start

1. ~~Complete OST tracking file updates first (3 files + commit §IMPORT-99)~~ **DONE 2026-06-11**
2. Check each book's source file for node collisions before writing import script
3. RME→ROM substitution applies throughout
4. Current baseline: 443 nodes, 1590 quests

**STN (Robin Hood):** EMA (East Midlands Airport, nearest to Nottingham) anchors. EMT (Emmet Priory), LEA (Castle Lea), NTN (Nottingham city), KLN (Kirklees Nunnery). SHW (Sherwood Forest proper) placed between EMA and NTN. Terrain: `forest` (Sherwood), `city` (Nottingham), `ruins` (priories).

---

## §PHASE-1 — Source Text Acquisition Queue

Books listed here have `[ ]` in books.md because their source `.txt` files are missing. They were memory-processed in a prior session. Before these books can receive a new reading pass (Pass 4 summaries, additional cycles, or corrected vignettes), the original source text must be placed in `1367-sources/`.

**Procedure for each book:**
1. Locate the public-domain text on Project Gutenberg (search by title + author).
2. Download the plain-text `.txt` file (UTF-8, not HTML).
3. If the file is > 200 KB, run `split-sources.sh CODE title N` to split it into 200 KB parts.
4. Confirm file is named `{CODE}-{slug}.txt` (or `.partKofN.txt` if split).
5. Change books.md entry from `[ ]` to `[x]` with a note: `Source txt acquired YYYY-MM-DD`.
6. The book is then eligible for Pass 4 (source summaries) and additional vignette cycles.

**Node and import status:** all these books are already IMPORTED (API quests exist). Acquiring the source text does NOT require re-importing — it enables future passes and corrections.

---

### §PHASE-1-VBY — Grettir's Saga (Anon, c.1310)

**Code:** VBY | **Slug:** grettir-saga | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, RKN/BWH nodes)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Grettir's Saga" or "Grettir the Strong."  
Recommended translation: G.H. Hight (1914), or Eiríkr Magnússon & William Morris (1900).  
Expected size: ~370 KB. Split into 2 parts if > 200 KB.

**Files to create:**
- `VBY-grettir-saga.txt` (or `.part1of2.txt` / `.part2of2.txt`)

**After acquisition:**
- Update books.md VBY entry: `[ ]` → `[x]` + note `Source txt acquired`
- VBY-grettir-saga.md already exists from memory pass — do NOT overwrite; append new Source Summary sections using Pass 4 protocol
- Verify RKN (Reykjaness shore-farm) and BWH (burial mound, Norwegian coast) node descriptions match the actual text

---

### §PHASE-1-RIX — Egil's Saga (Anon, attr. Snorri, c.1240)

**Code:** RIX | **Slug:** egil-saga | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, no new nodes — YRK/ISL existing)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Egil's Saga" or "Egla."  
Recommended translation: W.C. Green (1893) — PG has this.  
Expected size: ~580 KB. Split into 3 parts if needed.

**Files to create:**
- `RIX-egil-saga.txt` (or split parts)

**After acquisition:**
- Update books.md RIX entry: `[ ]` → `[x]` + note
- RIX-egil-saga.md exists from memory pass — append Pass 4 Source Summary sections only
- Verify YRK (York) and ISL (Althing/Iceland) node usage matches text geography

---

### §PHASE-1-RKV — Poetic Edda (Anon, ~10th–13th C, Codex Regius c.1270)

**Code:** RKV | **Slug:** poetic-edda | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, VLH/AEG/RSS nodes)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Poetic Edda" or "Elder Edda."  
Recommended translation: Henry Adams Bellows (1936) — full Eddic poems with notes.  
Alternative: Lee M. Hollander (1962) — not PG, but widely available.  
Expected size: ~750 KB. Split into 4 parts.

**Files to create:**
- `RKV-poetic-edda.part1of4.txt` through `.part4of4.txt`

**After acquisition:**
- Update books.md RKV entry: `[ ]` → `[x]` + note
- RKV-poetic-edda.md exists — append Pass 4 Source Summary sections only
- Confirm Völuspá, Hávamál, Lokasenna content matches VLH/AEG node vignette descriptions

---

### §PHASE-1-HFT — Frithiof's Saga (Esaias Tegnér, pub. 1825)

**Code:** HFT | **Slug:** frithiof-saga | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, ALR/BLG/RNG/ING/HEO nodes)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Frithiof's Saga" or "Fridjof."  
Recommended translation: Bayard Taylor (1866) or Thomas A. Holcomb.  
Expected size: ~100–150 KB (poem, not a long prose saga). Single file, no split needed.

**Files to create:**
- `HFT-frithiof-saga.txt`

**After acquisition:**
- Update books.md HFT entry: `[ ]` → `[x]` + note
- HFT-frithiof-saga.md exists — append Pass 4 Source Summary (Alternative Reading angle, since this is a single-file poetic work)
- Confirm ALR (Alrekstaðir Temple), BLG (Balder's Grove), RNG (Ring's Chamber), ING (Ingeborg's Chamber) scene details match poem text

---

### §PHASE-1-ARN — Knights of the Cross (Henryk Sienkiewicz, 1900, 1399 setting)

**Code:** ARN | **Slug:** knights-of-the-cross | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, KRK/JUR/TKT/CHP nodes)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Knights of the Cross" + Sienkiewicz.  
Recommended translation: Jeremiah Curtin (1900) — same translator as Quo Vadis.  
Expected size: ~900–1000 KB. Split into 5 parts.

**Files to create:**
- `ARN-knights-of-the-cross.part1of5.txt` through `.part5of5.txt`

**After acquisition:**
- Update books.md ARN entry: `[ ]` → `[x]` + note
- ARN-knights-of-the-cross.md exists — append Pass 4 Source Summary sections per part
- Verify KRK (Kraków), JUR (Spychów/Jurand's castle), TKT (Teutonic border), CHP (Mazovian chapel) match novel geography

---

### §PHASE-1-OST — Song of Roland (Anon, c.1100)

**Code:** OST | **Slug:** song-of-roland | **Current books.md status:** `[ ]`  
**Import status:** IMPORTED — 2026-06-05 (7 cycles, 35 acts, RON/PYR/AIX/FRS nodes)  
**Why missing:** Prior processing was memory-only; no `.txt` was placed in the folder.

**Find:** Project Gutenberg — search "Song of Roland" or "Chanson de Roland."  
Recommended translation: John O'Hagan (1880) — PG has this.  
Alternative: L. Bacon (1914) verse translation.  
Expected size: ~150 KB. Single file, no split needed.

**Files to create:**
- `OST-song-of-roland.txt`

**After acquisition:**
- Update books.md OST entry: `[ ]` → `[x]` + note (currently `[ ]` with no status notes)
- OST-song-of-roland.md exists — append Pass 4 Source Summary (Alternative Reading)
- Verify RON (Roncevaux Pass), PYR (Pyrenean High Road), AIX (Aix-la-Chapelle Chapel), FRS (Frankish Road-Town) match chanson geography
- Also complete §IMPORT-99 OST tracking file updates (see task #10 above)

---

### §PHASE-1-TBS — Knight in the Panther's Skin (Shota Rustaveli, c.1225)

**Code:** TBS | **Slug:** knight-panther-skin | **Current books.md status:** `[ ]`  
**Import status:** NOT YET IMPORTED (seeds complete from memory pass; import is Phase 2)  
**Why missing:** Prior source file contained unrelated content (per books.md note); replaced but no correct text confirmed.

**Find:** Project Gutenberg — search "Knight in the Panther's Skin" or "Vepkhistqaosani."  
Recommended translation: Marjory Scott Wardrop (1912) — PG has this.  
Expected size: ~250 KB. Single file or 2 parts.

**Files to create:**
- `TBS-knight-panther-skin.txt` (replace any existing incorrect file)

**After acquisition:**
- Verify TBS-knight-panther-skin.md vignette seeds match actual text (since prior pass was from incorrect source)
- If seeds are inconsistent with real text: rewrite affected cycles before importing
- After verification, proceed to §PHASE-2-TBS import below
- Update books.md TBS entry: `[ ]` → `[x]` + note

---

### §PHASE-1-SHK — Shakespeare Complete Works ✓ COMPLETE 2026-06-05

**Code:** SHK | **Slug:** shakespeare-complete-works | **Status:** COMPLETE  
All 28 parts read. 14 cycles written and imported. 27 live quests (shk6_act1–shk14_act3).  
See SHK-shakespeare-complete-works.md for full cycle specs and Part 1–28 coverage notes.

---

## §PHASE-2 — API Import Queue (Seeds Complete, Not Yet Imported)

These books have complete vignette seeds in their `.md` files and are ready for API import via the §IMPORT-01 8-step procedure. Each entry below gives the node checklist and import notes needed to run the import.

**Baseline before starting:** Run `GET /api/audit` and note current node/quest counts. As of 2026-06-05: 443 nodes, 1590 quests.

**Global substitution rule throughout all Phase 2 imports:** `RME` → `ROM` (Rome node uses ROM code).

---

### §PHASE-2-ZTH — Odyssey (Homer, Butler tr., ~725 BC)

**Code:** ZTH | **Source:** ZTH-odyssey.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `zth_07_act5`

**Node checklist:**
| Code | Name | Coords | Terrain | Notes |
|------|------|--------|---------|-------|
| PHC | Phaeacia / Scheria — Alcinous's Court | ~162,215 | city | Nausicaa's kingdom; Odysseus washed ashore; GET first — may not exist |
| RME | Rome — Check: use ROM | — | — | ROM already exists (r:163 c:213); use ROM throughout |

**Pre-import checks:**
- `GET /api/location/PHC` — create if missing; use coords near ROM but offset west-south toward mythological Atlantic
- `GET /api/location/ROM` — confirm exists (added during BLQ import)
- Check for existing node at proposed PHC coords with `GET /api/coords/near/ROM?radius=12`

**Import notes:**
- Phaeacia is mythological; place PHC in the western Mediterranean region (near Sicily/Tunisia area is conventional)
- Odyssey quest prefix: `zth_`
- All 7 cycles use combinations of PHC, ROM, CON, VEN, WM and classical Mediterranean nodes

**Admin after import:**
- Add to Import Queue table in this file as row #103
- Update index.md: add PHC to Tier 1 Cities table
- Update books.md ZTH entry to include `IMPORTED — {date}`

---

### §PHASE-2-ATH — Iliad (Homer, Lang tr., ~750 BC)

**Code:** ATH | **Source:** ATH-iliad.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `ath_07_act5`

**Node checklist:**
- No new nodes. Existing: IDC (likely Troy/Ilium area), SKN, TRH — confirm all exist with `GET /api/location/{code}` before starting.

**Pre-import checks:**
- `GET /api/location/IDC` — confirm
- `GET /api/location/SKN` — confirm
- `GET /api/location/TRH` — confirm

**Import notes:**
- Iliad quest prefix: `ath_`
- All 7 cycles use existing classical Mediterranean nodes
- Confirm ROM (not RME) is used for any Rome references

**Admin after import:**
- Add to Import Queue table as row #104
- Update books.md ATH entry to include `IMPORTED — {date}`

---

### §PHASE-2-JRS — Jerusalem Delivered (Torquato Tasso, 1581)

**Code:** JRS | **Source:** JRS-jerusalem-delivered.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `jrs_07_act5`

**Node checklist:**
- No new nodes. Existing nodes per books.md: PKR, SGA, JAR, OLN, CON, VEN, DAM, RME(→ROM) — confirm all exist.

**Pre-import checks:**
- `GET /api/location/PKR` — confirm (Acre/Ptolemais area)
- `GET /api/location/SGA` — confirm (Syrian Gate?)
- `GET /api/location/JAR` — confirm (Armida's garden / Damascus region)
- `GET /api/location/OLN` — confirm
- `GET /api/location/DAM` — confirm (Damascus — added during BGW/CAI imports)

**Import notes:**
- JRS quest prefix: `jrs_`
- Crusade geography: Jerusalem (JER if it exists), Damascus (DAM), Constantinople (CON)
- Check that JER exists — it was added during BEY supplementary cycle per books.md City Travel Log

**Admin after import:**
- Add to Import Queue table as row #105
- Update books.md JRS entry to include `IMPORTED — {date}`

---

### §PHASE-2-LIS — Lusiads (Luís de Camões, 1572)

**Code:** LIS | **Source:** LIS-lusiad.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `lis_07_act5`

**Node checklist:**
- No new nodes. Existing per books.md: CVP, MDN, MLN, LHA, CON, RME(→ROM), VEN — confirm all exist.

**Pre-import checks:**
- `GET /api/location/CVP` — confirm (Cape Verde / Portuguese Atlantic?)
- `GET /api/location/MDN` — confirm (Madeira?)
- `GET /api/location/MLN` — confirm (Malindi / East Africa?)
- `GET /api/location/LHA` — confirm (Lisbon harbor?)

**Import notes:**
- LIS quest prefix: `lis_`
- Portuguese epic geography: Atlantic route from Lisbon to India (Vasco da Gama)
- Indian Ocean nodes may need creation if CVP/MDN/MLN/LHA don't exist — check carefully

**Admin after import:**
- Add to Import Queue table as row #106
- Update books.md LIS entry to include `IMPORTED — {date}`

---

### §PHASE-2-CID — Chronicle of the Cid (Anon, Southey tr., 12th C source)

**Code:** MAD | **Quest prefix:** `cid_` | **Source:** MAD-chronicle-cid.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `cid_07_act5`

**Node checklist:**
| Code | Name | Coords | Terrain | Notes |
|------|------|--------|---------|-------|
| VLC | Valencia — El Cid's Captured City | ~160,185 | city | El Cid's prize; derive from Valencia (VLC = Valencia); no IATA collision expected |

**Pre-import checks:**
- `GET /api/location/VLC` — create if missing; place on Iberian peninsula east coast
- `GET /api/coords/near/MAD?radius=10` to find open slot (MAD = Madrid if exists, or check existing Iberian nodes)
- Confirm existing SMR, CMG, MNT, MAS, ACL nodes exist (used by MAD Don Quixote — different book same code block)

**Import notes:**
- Quest prefix is `cid_` (not `mad_`) — MAD code is shared with Don Quixote
- VLC at approximately r:158–162, c:183–188 (Valencia on Iberian peninsula, east coast)
- Cid geography: Burgos → Toledo → Valencia corridor

**Admin after import:**
- Add to Import Queue table as row #107
- Update index.md: add VLC to Tier 1 Cities table
- Update books.md MAD/chronicle-cid entry to include `IMPORTED — {date}`

---

### §PHASE-2-FLR — Divine Comedy: Inferno (Dante Alighieri, c.1320)

**Code:** FLR | **Source:** FLR-divine-comedy-inferno.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `flr_07_act5`

**Node checklist:**
- No new nodes per books.md. Existing: MBR, PAR, HMN — confirm all exist.

**Pre-import checks:**
- `GET /api/location/MBR` — confirm (Malebolge? allegorical Inferno node)
- `GET /api/location/PAR` — confirm (Palermo — added during IST import; or Paradiso node?)
- `GET /api/location/HMN` — confirm
- Note: FLR code is used for Florence (fantasy ocean node "Wreck of the Unbroken" per index.md Code Collision Register) — confirm quest prefix does not collide

**Import notes:**
- FLR quest prefix: `flr_`
- Divine Comedy geography is allegorical; nodes are approximate real-world anchors (Florence, Rome) plus allegorical locations (Inferno circles)
- PSA (Florence/Pisa) is the real-world Dante anchor — acts likely begin there

**Admin after import:**
- Add to Import Queue table as row #108
- Update books.md FLR entry to include `IMPORTED — {date}`

---

### §PHASE-2-TBS — Knight in the Panther's Skin (Shota Rustaveli, c.1225)

**Code:** TBS | **Source:** TBS-knight-panther-skin.md | **Cycles:** 7 | **Acts:** 35  
**questComplete:** `tbs_07_act5`

**DEPENDENCY:** Complete §PHASE-1-TBS (source text acquisition + vignette verification) before importing. If prior vignette seeds were based on wrong source text, seeds must be rewritten first.

**Node checklist:**
- No new nodes per books.md. Existing: GEO (Georgia?), TIF (Tbilisi?), ALP (Aleppo — added during CAI import), CON, DAM, CAF — confirm all exist.

**Pre-import checks:**
- `GET /api/location/GEO` — confirm (Georgian node; may not exist — check)
- `GET /api/location/TIF` — confirm (Tbilisi/Tiflis — added during ADA import as TIF)
- `GET /api/location/ALP` — confirm (Aleppo Storytellers' Quarter — added during CAI)
- `GET /api/location/CAF` — confirm (Caffa — added during HAV import)

**Import notes:**
- TBS quest prefix: `tbs_`
- Georgian epic geography: Tbilisi (TIF), Arabia, India — trans-continental routes
- Verify TIF coordinates match Caucasus region (should be near GNJ/TBZ/MRG cluster)

**Admin after import:**
- Add to Import Queue table as row #109
- Update books.md TBS entry: `[ ]` → `[x]` + `IMPORTED — {date}`

---

### §PHASE-2-BEY — Mandeville's Travels (attr. Sir John Mandeville, c.1357)

**Code:** BEY | **Source:** BEY-mandeville.md | **Cycles:** 13 (BEY-01–07 + S08–S14) | **Acts:** ~65  
**questComplete:** `bey_s14_act5` (or per last cycle in file)

**Node checklist:**
| Code | Name | Coords | Terrain | Notes |
|------|------|--------|---------|-------|
| FAM | Famagusta | r:172 c:236 | docks | Already in index.md Tier 1 (added during BLQ import) — confirm exists |
| RGS | Ragusa / Dubrovnik | — | city | Check: DBV was used as Dubrovnik code (index.md: DBV = Dubrovnik Airport). RGS may have been replaced by DBV — confirm in API |
| MRS | Marseille | r:144 c:178 | city | Check: MAR already exists (added BLQ-11); MRS may be same node — confirm |
| BEI | Beirut | ~r:173 c:234 | city | New node if not present; Lebanese coast |
| JER | Jerusalem | ~r:179 c:233 | city | Check: may exist from WAW/NWI imports |
| SID | Sidon | ~r:172 c:233 | city | Lebanese coast south of BEI |
| COL | Cologne | ~r:112 c:197 | city | Rhine city; check if KOL exists (Nibelungenlied import used KOL for Cologne) |

**Pre-import checks:**
- `GET /api/location/FAM` — confirm exists (r:172 c:236 per index.md)
- `GET /api/location/DBV` — confirm (Dubrovnik); if RGS references in vignette, substitute DBV
- `GET /api/location/MAR` — confirm (r:144 c:178, added BLQ); MRS in books.md may be same → use MAR
- `GET /api/location/JER` — create if missing; Jerusalem ~r:179 c:233
- `GET /api/location/BEI` — create if missing; Beirut ~r:172 c:233
- `GET /api/location/SID` — create if missing; Sidon ~r:175 c:233
- `GET /api/location/KOL` — confirm (added LBC import); BEY books.md says COL — use KOL

**Import notes:**
- BEY quest prefix: `bey_`
- Mandeville's route: England → France → Mediterranean → Holy Land → Egypt → Persia → India
- 13 cycles is a large import — plan for 2–3 sessions
- Supplementary cycles (S08–S14) focus on the Mandeville authenticity/provenance angle

**Admin after import:**
- Add to Import Queue table as row #110
- Update index.md: add any confirmed new nodes (BEI, JER, SID) to Tier 1 Cities table
- Update books.md BEY entries to include `IMPORTED — {date}`

---

### §PHASE-2-KYA — Shah-Nameh (Ferdowsi, Atkinson tr., c.1010)

**Code:** KYA | **Source:** KYA-shah-nameh.md | **Cycles:** 25 (KYA-01–25) | **Acts:** ~125  
**questComplete:** `kya_25_act5`

**This is the largest single import in the queue. Plan for 4–6 sessions.**

**Node checklist:**
| Code | Name | Approx Coords | Terrain | Notes |
|------|------|--------------|---------|-------|
| YAZ | Yazd — Zoroastrian Fire Temple District | r:175 c:242 | city | Zoroastrian holy city; confirm not already present |
| KBL | Kabul — Hindu Kush Gateway | r:185 c:248 | city | Zal's kingdom; confirm not present |
| SIS | Sistan — Rustam's City | r:180 c:248 | city | Rustam/Zal's homeland; confirm not present |
| TBZ | Tabriz — Jalayirid Scholar Quarter | r:160 c:240 | city | Already in index.md Tier 1 (added AMS import) — confirm exists |
| TRB | Trebizond — Genoese Registry Quarter | r:152 c:240 | city | Already in index.md Tier 1 (added NWI/HAV imports) — confirm exists |
| HRT | Herat — Timurid City | r:178 c:248 | city | Khorasan; confirm not present |

**Pre-import checks:**
- `GET /api/location/YAZ` — create if missing at ~r:175 c:242
- `GET /api/location/KBL` — create if missing at ~r:185 c:248
- `GET /api/location/SIS` — create if missing at ~r:180 c:248
- `GET /api/location/TBZ` — confirm exists (r:160 c:240 per index.md)
- `GET /api/location/TRB` — confirm exists (r:152 c:240 per index.md)
- `GET /api/location/HRT` — create if missing at ~r:178 c:248
- Also confirm: NIS (r:168 c:240), SAM (r:157 c:240), MRG (r:162 c:238), MRV (r:165 c:240), BGD (r:182 c:238) — all used in KYA routes

**Import batch plan (25 cycles is large — split across sessions):**

| Session | Cycles | Acts | Notes |
|---------|--------|------|-------|
| A | KYA-01–05 | 25 | Node creation batch (YAZ/KBL/SIS/TBZ/TRB/HRT); Kaiúmers → Feridún arc |
| B | KYA-06–10 | 25 | Sohráb tragedy arc; nodes confirmed |
| C | KYA-11–15 | 25 | Saiáwush betrayal + Kai-khosráu arc |
| D | KYA-16–20 | 25 | Zoroaster/Gushtásp + Isfendiyár arc |
| E | KYA-21–25 | 25 | Rustam death + Sikander + Firdusi's Satire; questComplete |

**Import notes:**
- KYA quest prefix: `kya_`
- Persian epic geography spans Central Asia: YAZ → TBZ → SAM → NIS → MRG → MRV → TRB → BGD → CON → WM
- 25 cycles = ~125 quests; largest single-book import in the pipeline
- Session A must create all new nodes before any quests fire; confirm all 6 new nodes before writing first quest

**Admin after import (final session):**
- Add to Import Queue table as row #111
- Update index.md: add YAZ/KBL/SIS/HRT to Tier 1 Cities table (TBZ/TRB already present)
- Update books.md KYA entry to include `IMPORTED — {date}`
- Update §KYA-CONT entry in plan.md: mark complete, remove continuation block

---

## §PHASE-2-OST-ADMIN — Song of Roland Tracking File Cleanup

**Background:** OST was imported 2026-06-05 (import script `import_ost.py` ran cleanly; 443 nodes, 1590 quests post-import). Three tracking files were not updated in that session.

**Required updates (complete before any other Phase 2 imports):**

1. **api-data-audit.md** — Add OST row after the RKV row:
   - Format: match existing rows in the audit file
   - Content: 4 new nodes (RON/PYR/AIX/FRS), 35 quests (ost_01_act1 through ost_07_act5), questComplete on ost_07_act5, OST collision (Bruges—Cloth Hall) → quest prefix only

2. **plan.md** — The Import Queue row for OST (row #99) was written in the Session End block but not in the main Import Queue table. Confirm it appears correctly in the table or add it.

3. **index.md** — Add two entries:
   - Code Collision Register: `| OST | Song of Roland starting node | "Bruges — Cloth Hall" (docks game node) | Quest prefix only — cycles 1–2 route RON/PYR/AIX/FRS naturally; cycles 3–7 hub at AIX or RON |`
   - New section `## Song of Roland (OST) Nodes` with RON/PYR/AIX/FRS in the standard table format

4. **Commit** as `§IMPORT-99` after all 3 files are updated.

---

## §PHASE-2-SUMMARY — Import Priority Order

Run imports in this order to minimise node creation overhead (shared nodes confirmed early benefit all later imports):

| Priority | Code | Title | New Nodes | Sessions |
|----------|------|-------|-----------|---------|
| 1 | OST admin | Song of Roland tracking | — | 1 (tracking only) |
| 2 | ATH | Iliad | none | 1 |
| 3 | FLR | Divine Comedy Inferno | check MBR/PAR/HMN | 1 |
| 4 | JRS | Jerusalem Delivered | check PKR/SGA/JAR/OLN | 1 |
| 5 | LIS | Lusiads | check CVP/MDN/MLN/LHA | 1 |
| 6 | ZTH | Odyssey | PHC (new) | 1 |
| 7 | CID | Chronicle of the Cid | VLC (new) | 1 |
| 8 | TBS | Knight in the Panther's Skin | check GEO | 1–2 (after Phase 1) |
| 9 | BEY | Mandeville's Travels | BEI/JER/SID (new); KOL→KOL | 2–3 |
| 10 | KYA | Shah-Nameh | YAZ/KBL/SIS/HRT (new) | 4–6 |

---

## §PASS-4 — Source Text Reading: Summaries + New Vignette Cycles

**Triggered:** 2026-06-05. Seven books have complete `.txt` source files and complete prior-cycle `.md` files. Pass 4 reads each source part, writes a narrative source summary, and extracts one new 5-act vignette play from each part.

**Scope:** ZTH (4 parts), ATH (5 parts), JRS (4 parts), LIS (6 parts), FLR (4 parts), BEY (3 parts), KYA (5 parts) — 31 parts total.

**Protocol per part:**
1. Read `{CODE}-{slug}.partKofN.txt` in full
2. Append to `{CODE}-{slug}.md`:
   ```
   ## Source Summary — Part K of N
   *[Range note: what narrative span this part covers]*
   [3–6 paragraphs narrative summary — characters, events, key passages, quest potential]
   ```
3. Extract one new 5-act vignette from this part's content, numbered as the next cycle after existing ones
4. Vignette follows UQF format: activateNode, type, scene, prompt, failText, successText, grantItem, checkPassFlag, questComplete (final act only)
5. Theme check: read existing cycle themes in the .md file before choosing the new angle — no duplicates

**Quest writing rules (condensed from books.md):**
- Fighter = silent escort. TOKEN is grammatical subject and moves each act.
- 5 acts: Act 1 (receive token, origin node, skill\_check DC 12+), Acts 2–4 (carry + obstacle, mix of skill\_check and combat), Act 5 (deliver to WM or destination, questComplete on final cycle's Act 5)
- Required across 5 acts: romance or tenderness (1 act), moral weight (1 act), physical danger (1 act)
- grantItem each act = named object from scene. takeItem Act 5 = token consumed.
- Fail text = delay + cost, never dead end. Hero always succeeds eventually.
- Scene field (2–3 sentences, 2nd person present): orient in space, who else present, emotional register.
- French noir register: precise, cool, observational. Camera rests on the object.

**New cycle numbering:**
| Code | Existing cycles | New cycles (one per part) |
|------|----------------|--------------------------|
| ZTH  | 7              | 8–11 (parts 1–4)         |
| ATH  | 7              | 8–12 (parts 1–5)         |
| JRS  | 7              | 8–11 (parts 1–4)         |
| LIS  | 7              | 8–13 (parts 1–6)         |
| FLR  | 7              | 8–11 (parts 1–4)         |
| BEY  | 13             | 14–16 (parts 1–3)        |
| KYA  | 25             | 26–30 (parts 1–5)        |

**Output:** Each agent appends to the book's `.md` file only. Completion confirmed by presence of `## Source Summary — Part N of N` (final part) in each file.

**Phase 1 books** (VBY, RIX, RKV, HFT, ARN, OST, TBS) cannot run Pass 4 until source `.txt` files are acquired — see §PHASE-1 above.

### §PASS-4 Status

| Code | Parts | Status |
|------|-------|--------|
| ZTH  | 4 | DONE — cycles 8–11 appended (Captivity Record, Mast Agreement, Beggar's Passport, Bed That Could Not Be Moved) |
| ATH  | 5 | DONE — cycles 8–12 appended (Apollo's Account, Dolon's Report, The Stripped Inventory, Priam's Ransom, Thetis at the Sea-Floor) |
| JRS  | 4 | DONE — cycles 8–11 appended (The Desertion Record, The Physician's Account, The Siege Engineer's Account, The Preaching Record) |
| LIS  | 6 | DONE — cycles 8–13 appended (Royal Commission Letter, False Pilot's Chart, Zamorim's Court Register, Flemish Secretary's Notes, Gift Inventory, São Gabriel Voyage Log) |
| FLR  | 4 | DONE — cycles 8–11 appended (Phlegyas's Crossing Log, The Gate's Three Steps, Matilda's River Registry, Cacciaguida's Prophecy Register) |
| BEY  | 3 | DONE — cycles 14–16 appended (The Balm Test, The Great Khan's Seal Formula, The Skull Cup of Rybothe) |
| KYA  | 5 | DONE — cycles 26–30 appended (The Portrait in the Gallery, Gúrd-afríd's Broken Lance, The Khakán's Collar, The Merchant Kherád, The Cup of Three Kings) |

---

## §OUTSTANDING — All Incomplete Work (as of 2026-06-06)

Canonical list of everything not yet done. Ordered by type, then priority.

---

### Group A — API Imports: Seeds Complete, Not Yet Imported

Books with full vignette specs in their `.md` files, ready to import. Use `import_ath.py` as the template — the pattern is established. Key rule: `activateCond` must be set via `put` after `post` (CLI parser strips the `()` syntax). Each book needs its own `import_{code}.py`.

Verified 2026-06-11 against live DB. ATH/ZTH/JRS/FLR/LIS already imported.

| # | Code | Title | Cycles | Acts | New Nodes Needed | Status |
|---|------|-------|--------|------|-----------------|--------|
| 1 | ~~ATH~~ | Iliad | — | — | — | ✓ DONE (95 quests, 12 cycles) |
| 2 | ~~ZTH~~ | Odyssey | — | — | — | ✓ DONE (60 quests) |
| 3 | ~~JRS~~ | Jerusalem Delivered | — | — | — | ✓ DONE (35 quests) |
| 4 | ~~FLR~~ | Divine Comedy: Inferno | — | — | — | ✓ DONE (55 quests) |
| 5 | ~~LIS~~ | Lusiads | — | — | — | ✓ DONE (65 quests) |
| 6 | ~~CID~~ | Chronicle of the Cid | — | — | BGZ/TOL/CDN/VLC | ✓ DONE 2026-06-11 (35 quests, 7 cycles, questComplete cid_c7a5) |
| 7 | ~~TBS~~ | Knight in the Panther's Skin | — | — | GEO/PHY/GHC | ✓ DONE 2026-06-11 (35 quests, 7 cycles, questComplete tbs_c7a5) |
| 8 | ~~BEY~~ | Mandeville's Travels | — | — | LGE/ADN/RGS/MGZ/STR/AUG (ADN replaces ARD conflict; DBV used for Ragusa waystation in C2) | ✓ DONE 2026-06-11 (35 quests, 7 cycles, questComplete bey_c7a5) |
| 9 | ~~KYA~~ | Shah-Nameh | — | — | YAZ/KBL new; TBZ/TRB existing; SIS/HRT deferred | ✓ DONE 2026-06-11 (35 quests, 7 cycles, questComplete kya_c7a5) |

**Pass 4 extra cycles** (8–11/12/13/16/30) are in the `.md` files and can be imported after the base 7 cycles are live. They don't block the base import.

---

### Group B — OST Tracking File Cleanup (§IMPORT-99) ✓ DONE 2026-06-11

OST imported 2026-06-05 (443 nodes, 1590 quests). Tracking files updated 2026-06-11:
- `api-data-audit.md` — OST row was already present (written during import session)
- `plan.md` — Import Queue row #99 confirmed present (line 923)
- `index.md` — OST collision entry added to Code Collision Register; `## Song of Roland (OST) Nodes` section added (RON/PYR/AIX/FRS)

---

### Group C — SHK Audit Errors ✓ DONE (prior session)

All 27 SHK quests (`shk6_act1` through `shk14_act3`) already have `npc` fields:
`egil_thorvaldsen` (BK), `marta_vby` (VBY), `ulrich_von_gessert` (NUE).
Audit confirmed 0 errors 2026-06-11.

---

### Group D — Source Text Acquisition (Phase 1) — MOSTLY DONE 2026-06-11

Books that were memory-processed and have no `.txt` source file. All are already imported (quests are live). Acquiring the source text enables Pass 4 (additional source summaries + new cycles).

| # | Code | Title | Translation to find | Expected size | Split? | Status |
|---|------|-------|-------------------|---------------|--------|--------|
| 11 | ~~VBY~~ | Grettir's Saga | Hight 1914 (PG) | ~370 KB | 2 parts | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 12 | ~~RIX~~ | Egil's Saga | W.C. Green 1893 (PG) | ~580 KB | 3 parts | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 13 | ~~RKV~~ | Poetic Edda | Bellows 1936 (PG) | ~750 KB | 5 parts | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 14 | ~~HFT~~ | Frithiof's Saga | Schmidt tr. (PG) | ~130 KB | none | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 15 | ~~ARN~~ | Knights of the Cross | Binion tr. (PG) | ~950 KB | 7 parts | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 16 | ~~OST~~ | Song of Roland | O'Hagan 1880 (PG) | ~150 KB | 2 parts | ✓ DONE 2026-06-11 — source acquired, Pass 4 complete |
| 17 | **TBS** | Knight in the Panther's Skin | Wardrop 1912 (PG) | ~250 KB | 1–2 parts | ⏳ PENDING — Wikisource acquisition blocked |

**After acquiring TBS:** name as `TBS-knight-panther-skin.txt`, run `split-sources.sh` if > 200 KB, update books.md `[ ]` → `[x]`. Verify `.md` vignette details match real text (prior pass was from incorrect source).

---

### Group E — Shakespeare Continuation ✓ DONE 2026-06-05

**Code:** SHK | All 28 parts read, 14 cycles written and imported, 27 live quests.  
See SHK-shakespeare-complete-works.md. No remaining work.

---

### Group F — Pass 4 for Phase 1 Books — MOSTLY DONE 2026-06-11

Source texts acquired in Group D; Pass 4 (source summaries + new vignette cycles) run for 6 of 7 books. Cycles deployed via WBAPI.

| Code | Parts | Cycles added | API deployed | Status |
|------|-------|-------------|-------------|--------|
| ~~VBY~~ | 2 | 8–10 (3 new) | ✓ | ✓ DONE 2026-06-11 |
| ~~RIX~~ | 3 | 8–11 (4 new) | ✓ | ✓ DONE 2026-06-11 |
| ~~RKV~~ | 5 | 8–11 (4 new) | ✓ | ✓ DONE 2026-06-11 |
| ~~HFT~~ | Alt | 8–11 (4 new) | ✓ | ✓ DONE 2026-06-11 |
| ~~ARN~~ | 7 | 8–10 (3 new) | ✓ | ✓ DONE 2026-06-11 |
| ~~OST~~ | Alt | 8–11 (4 new) | ✓ | ✓ DONE 2026-06-11 |
| TBS | 1–2 | 8–9 | — | ⏳ BLOCKED — awaiting source text (Group D TBS) |

---

### Group G — Pass 4 Extra Cycles API Import (OPEN)

ZTH/ATH/JRS/LIS/FLR/BEY/KYA had Pass 4 summaries and extra cycles written in 2026-06-05 and stored in `All Phases Imported/` `.md` files. Base 7 cycles are live. Extra cycles (8+) are written but **not yet imported** via API.

**Procedure:** For each book, read the extra cycles from the `.md` file in `1367-sources/All Phases Imported/`, then post each act via `./api.sh post quest ...`. Use `npc=archivus_sweelinck` for all delivery/deposit acts. Confirm with `./api.sh audit` after each book. Commit after each book.

| Code | Title | Extra cycles | Acts | NPC | Status |
|------|-------|-------------|------|-----|--------|
| ZTH | Odyssey (Homer) | 8–11 (4 cycles) | 20 | archivus_sweelinck | OPEN |
| ATH | Iliad (Homer) | 8–12 (5 cycles) | 25 | archivus_sweelinck | OPEN |
| JRS | Jerusalem Delivered (Tasso) | 8–11 (4 cycles) | 20 | archivus_sweelinck | OPEN |
| LIS | Lusiads (Camões) | 8–13 (6 cycles) | 30 | archivus_sweelinck | OPEN |
| FLR | Divine Comedy: Inferno (Dante) | 8–11 (4 cycles) | 20 | archivus_sweelinck | OPEN |
| BEY | Mandeville's Travels | 14–16 (3 cycles) | 15 | archivus_sweelinck | OPEN |
| KYA | Shah-Nameh (Ferdowsi) | 26–30 (5 cycles) | 25 | archivus_sweelinck | OPEN |

Total: 31 cycles, ~155 acts. Commit cadence: one commit per book (`§PASS4-EXTRA-{CODE}: ... cycles {N}–{M} deployed`).

---

### Summary Count

| Group | Items | Effort | Status |
|-------|-------|--------|--------|
| A — API Imports | 9 books | — | ✓ DONE 2026-06-11 |
| B — OST tracking | 3 file edits + commit | — | ✓ DONE 2026-06-11 |
| C — SHK NPC fix | 1 NPC + 27 put calls | — | ✓ DONE (prior session) |
| D — Source text acquisition | 7 books | 7 downloads + splits | ✓ MOSTLY DONE — 6/7 complete; TBS pending |
| E — Shakespeare | 14 cycles, 27 quests | — | ✓ DONE 2026-06-05 |
| F — Pass 4 (Phase 1 books) | 7 books | — | ✓ MOSTLY DONE — 6/7 complete; TBS blocked |
| G — Pass 4 extra cycles import | 31 cycles, 155 acts | 7 API sessions | open |
## §MATH-01 — The Mathematical World: Group Theory, The Monster, and the Event Horizon (PLANNED)

**Status:** PLANNED — not yet in game. Requires §DUNGEON-01 node infrastructure and CY node operational before integration.

**Concept:** A trans-temporal mathematical universe overlaid on the game's 1367 setting. Mathematics in 1367 is at a precise inflection point: Hindu-Arabic numerals (zero included) are spreading from the Byzantine and Islamic worlds into Latin Europe, displacing Roman numerals; Euclid's *Elements* has been translated and re-translated; algebra exists; and the deeper structure of symmetry — which will not be named "Group Theory" for five hundred years — is implicit in every Gothic arch, every crystal, every planetary orbit. The Fighter moves through this world carrying the documents of mathematical transmission. The Event Horizon is the node where this becomes explicit.

