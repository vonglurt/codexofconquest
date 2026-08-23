<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson and Claude -->

# Lab Report — 5thOrgan: Polyphonic Pipe Organ Additive Synthesis in the Browser
### Design, Mathematics, and As-Built Verification of `sources/5thOrgan.html`

**Filed:** 2026-05-24 · **Ship commit:** `030c446` (2026-05-24 19:20) · **Path today:** `sources/5thOrgan.html`, moved from the repo root by `5e48dd7`
**Verified:** 2026-08-12 (§DOC-02ad) — every claim below re-measured against the live file. Original 573 lines.
**Status:** ✅ The synthesizer shipped and works. ⛔ **The game feature it was built to become did not** — `roll2hit-v3.html` contains zero Web Audio and is silent (Finding 1).

---

## Abstract

`sources/5thOrgan.html` is a self-contained, single-file polyphonic pipe organ synthesizer running in the browser on the Web Audio API. It uses additive synthesis to reconstruct organ timbre from six harmonic partials per note over a 12-voice pool — a **capacity** of 72 simultaneous sine oscillators. A lookahead sequencer plays the opening motif of Beethoven's Symphony No. 5, Op. 67 as a two-voice canon, the second voice entering 14 sixteenth notes after the first. Ten synthesis parameters are exposed as live controls. This report documents the mathematical foundations, records the as-built implementation against the specification, and reports seven measured findings.

The 2026-08-12 verification pass found the transcribable material **exact** — the motif array, the envelope algebra, the voice-stealing expression, the architecture diagram and all ten rows of the parameter table are faithful to the file — and every error in composed passages: a timbre claim off by one power of *n*, a collision proof that proves the wrong proposition, a "Results" section listing outcomes the same document later admits were never heard, and a numerical accuracy bound three orders of magnitude optimistic.

---

## I. Purpose — What This Is For, and What It Would Add to the Game

This section is the report's reason to exist and was the thinnest part of the original. It is restated here from the design's own source.

**The inspiration.** The concept was locked before a line of HTML existed, in a sibling report — `lab-report-ponies-unicorns-aspirations-future-ideas.md` §VI, *"Polyphonic Pipe Organ Synthesizer — Background Music via Sine Waves."* Its opening sentence is the whole brief:

> *"Pure mathematics: sine waves mixed in the proportions that a real pipe organ produces, driven by a sequencer that reads a note file and plays it like a player piano — **in the background, as the game is played**."*

**Why an organ.** A pipe organ is the one instrument whose acoustic physics reduce cleanly to the harmonic series. Each pipe is a resonant tube sustaining a fundamental plus integer-multiple overtones; timbre — the "color" of a stop — comes from the *relative amplitudes* of those overtones, not from waveform complexity or non-linear excitation. So the synthesis problem reduces to: sum *N* sines at the right frequencies and amplitudes. By Fourier's theorem,

```
x(t) = Σ_{n=1}^{N} A_n · sin(2π · n · f₀ · t + φ_n)
```

and for an organ the phases `φ_n` are approximately zero — all partials speak together on key-down — leaving only the amplitudes to specify.

**Why that matters to `roll2hit-v3.html` specifically.** The game is one static HTML file with no build step and no server at play time (prompt.md §0). Every conventional soundtrack option breaks that constraint: `.mp3` assets need files to fetch, a library needs a CDN, a tracker needs a decoder. An additive organ needs **none of it** — the score is a small array of integers and the instrument is arithmetic. It is the only music architecture that fits the game's own single-file invariant, which is why this shape was chosen.

**What the feature adds to play.** Three things the game currently has no mechanism for:

1. **Continuous tonal presence under a turn-based loop.** roll2hit is read-and-click: node text, a Ceremonia roll, a battle round. Nothing sustains between clicks, so pacing lives entirely in the prose. A held organ chord is the cheapest possible continuity — it makes a pause feel like a held breath instead of a stall.
2. **State expressed as timbre rather than as another text strip.** The parameters are already the right dials. Void pressure could open the harmonic falloff (bright, buzzy, wrong); act progression could add upper stops; the doom clock's approach to Day 49 could drop the filter cutoff until the world sounds muffled. That is diegetic feedback costing the player no screen space — and screen space is the scarce resource in a single-column story pane.
3. **Place with an audible identity.** 416 nodes across 111 terrains are distinguished by prose alone today. A short registration per region is a second axis of location, essentially free: one motif array per terrain family.

**Why 12 voices,** from the sibling report's §H budget: 1 for a melody, 2 for melody-plus-bass, 3 for a Bach invention, 4 for a chorale, 8–12 for full organ texture with overlapping phrase releases. Twelve covers all practical organ repertoire. *The shipped demo is a two-voice canon and uses two* — the pool is provisioned for the intended repertoire, not for the demonstration standing in for it (Finding 4).

> The file that was meant to give the game a voice currently lives in `sources/`, which is where this repo keeps its authoring tools — the directory you go to in order to be quiet.

---

## II. Verification Method (2026-08-12)

1. Locate the deliverable. The report names `5thOrgan.html`; `ls` at the root fails; the file is at `sources/5thOrgan.html`, relocated by `5e48dd7` (*"reorganize repo root"*). Four commits touch it, none since the reorg.
2. Batch-census every identifier the report names — 55 names in one `grep -c` loop — before reading a line of the source.
3. Re-derive every stated number rather than re-reading it: harmonic amplitudes, MIDI frequencies, note durations, loop arithmetic, filter response, Taylor-series error.
4. Simulate the two behavioural claims that cannot be read off a line — canon collision across the full selectable offset range, and the effect of a mid-play tempo change.
5. Cross-check against the sibling report that specified the design. This located the root cause of Finding 2, which no single-document pass could have found.
6. Measure the game side: does `roll2hit-v3.html` consume any of it.

**Census result: 42 of 55 named identifiers resolve (76 %).** Every one that does not is framed by the report itself as future work or reference material, with two exceptions — `ROUND_OFFSET` and `LOOKAHEAD`/`SCHEDULE_INTERVAL`, named as if they were constants in the file. They are inline literals; the *values* are correct.

---

## III. As-Built Inventory

Every anchor below resolves literally and line-exact in the live file.

**Constants and registration.** `sources/5thOrgan.html:const N_HARM@142` = 6 and `sources/5thOrgan.html:const MAX_VOX@143` = 12, both as specified. The motif at `sources/5thOrgan.html:const MOTIF = [@147` is byte-exact to the listing the report reproduces in its future-directions section, and `sources/5thOrgan.html:const MOTIF_LEN@157` = 28 sixteenths. Drawbar defaults `sources/5thOrgan.html:drawbars:  [1.000@161` are 1/*n* across all six, and `sources/5thOrgan.html:falloffDB: 6,@162` is 6 dB/oct — both exactly as documented, and together the cause of Finding 2.

**Tuning and amplitude.** `sources/5thOrgan.html:function midiHz@185` and `sources/5thOrgan.html:function harmAmp@188` implement the two published formulas without deviation; the falloff term is visible at `sources/5thOrgan.html:P.falloffDB * Math.log2(h)@189`.

**Envelope and voice pool.** Attack peaks at `sources/5thOrgan.html:vel * 0.065, when + atkS@211`, matching the specified `V_peak = velocity × 0.065`. Release begins at `sources/5thOrgan.html:Math.max(when, atkEnd)@246` — the specified `max(t_off, t_on + T_attack)` — and oscillators halt 20 ms later at `sources/5thOrgan.html:osc.stop(stopAt + 0.02)@250`. Voice stealing is oldest-first at `sources/5thOrgan.html:voices.reduce((a, b)@203`, the expression the original quotes verbatim, and the reuse guard at `sources/5thOrgan.html:slot.gen !== myGen@253` behaves exactly as described. `sources/5thOrgan.html:function noteOff@263` releases the **newest** matching voice (`sources/5thOrgan.html:v.startTime > best.startTime@266`), which matters in §VIII.C.

**Filter.** `sources/5thOrgan.html:flt.type = 'lowpass'@214` is the native `BiquadFilterNode`, and both live controls update sounding voices as claimed: `sources/5thOrgan.html:vv.filter.frequency.value=v@414` and `sources/5thOrgan.html:vv.filter.Q.value=v@415`. Drawbars likewise, at `sources/5thOrgan.html:harmAmp(hi+1)@384`.

**Sequencer.** `sources/5thOrgan.html:function buildSeq@277` computes `sources/5thOrgan.html:const s16 = (60 / bpm) / 4@278` and is called at exactly one site, `sources/5thOrgan.html:seqEvents = buildSeq(@323`. The lookahead horizon is `sources/5thOrgan.html:const horizon = now + 0.15@300` and the tick is `sources/5thOrgan.html:setTimeout(sched, 50)@317` — the documented 150 ms / 50 ms, shipped as inline literals rather than named constants. Two behaviours the original does not mention: note-offs fire at 92 % of nominal duration (`sources/5thOrgan.html:dur * s16 * 0.92@285`, a deliberate articulation gap), and a late event is clamped forward rather than dropped (`sources/5thOrgan.html:Math.max(t, now + 0.001)@306`). The loop advance at `sources/5thOrgan.html:seqStart += (gRO()@314` is Finding 3. Autoplay policy is handled before scheduling at `sources/5thOrgan.html:actx.state === 'suspended'@322`, as claimed.

**Output graph and scope.** `sources/5thOrgan.html:masterGain.connect(analyser)@180` then `sources/5thOrgan.html:analyser.connect(actx.destination)@181` — the published diagram, exactly. `sources/5thOrgan.html:analyser.fftSize@179` = 2048 and `sources/5thOrgan.html:getFloatTimeDomainData(scBuf)@429` fills a `Float32Array` of that length, so *"length = fftSize"* holds; the trace margin is `sources/5thOrgan.html:H * 0.44@440`, the specified 0.44.

**Controls.** Vertical drawbars use `sources/5thOrgan.html:writing-mode:vertical-lr@40` — and, undocumented in the original's own limitation note, also ship the legacy fallback `sources/5thOrgan.html:appearance:slider-vertical@41`. The round-offset input is `sources/5thOrgan.html:id="ro" value="14"@67`, clamped by `sources/5thOrgan.html:function gRO()@340`.

**Scale.** 448 lines total, 307 inside the `<script>` block. The original's *"~300 lines of vanilla JavaScript and HTML"* is right about the JavaScript and low by a third for the file.

---

## IV. Harmonic Series and Stop Registration

### A. The falloff law — verified exact

Each harmonic order 1–6 carries an independent gain drawbar, and the net amplitude of harmonic *h* is

```
A_h = drawbar[h] × 10^(−falloffDB × log₂(h) / 20)
```

shipped without deviation at `sources/5thOrgan.html:function harmAmp@188`. The **falloff term alone** behaves precisely as documented — at 6.0206 dB/oct it is identically 1/*n*:

| falloffDB | measured spectrum, drawbars held at 1.0 | law |
|---|---|---|
| 0 | 1.000 1.000 1.000 1.000 1.000 1.000 | flat |
| 6 | 1.000 0.501 0.335 0.251 0.201 0.168 | 1/n^1.00 |
| 12 | 1.000 0.251 0.112 0.063 0.040 0.028 | 1/n^1.99 |

### B. ⛔ The composition error (Finding 2)

The original states that at `falloffDB = 6` the engine *"reproduces the 1/n amplitude law at the default drawbar position,"* and its preset table calls the default **Principal**. Both are wrong by one power of *n*, because **the default drawbars are already 1/n** and the falloff multiplies on top of them:

| h | shipped `harmAmp(h)` | 1/n (claimed) | 1/n² (actual) |
|---|---|---|---|
| 1 | 1.00000 | 1.00000 | 1.00000 |
| 2 | 0.25059 | 0.50000 | 0.25000 |
| 3 | 0.11142 | 0.33333 | 0.11111 |
| 4 | 0.06280 | 0.25000 | 0.06250 |
| 5 | 0.04022 | 0.20000 | 0.04000 |
| 6 | 0.02800 | 0.16667 | 0.02778 |

The shipped default is **1/n² to within 0.8 %** — a Flute, not a Principal. The error propagates to the other two worked cases: *"at falloffDB = 0, flat spectrum"* is in fact 1/n, i.e. a true Principal; *"at falloffDB = 12, 1/n²"* is in fact 1/n³.

**Root cause, recovered from the corpus.** The sibling §VI specified exactly `[1.000, 0.500, 0.333, 0.250, 0.200, 0.167]` with *"gain proportional to 1/n… the result sounds like a principal organ stop"* — correct, because **at that stage there was no falloff control**. `5thOrgan.html` added the global dB/octave slider and defaulted it to 6 without re-basing the drawbars beneath it. *A parameter added on top of a completed specification silently re-signs it.* → **§DX-02am**.

### C. Stop families and pipe lengths — reference, verified against the UI

Stop families by falloff law: **Principal/Diapason** 1/n (full, open) · **Flute** 1/n² or fewer harmonics (round, warm) · **String/Viole** relatively flat (bright, reedy) · **Reed** ≈1/n with boosted odd harmonics (nasal) · **Mixture** upper harmonics only (glittering).

| Harmonic | Pipe length | Interval above fundamental | Stop named in the UI |
|---|---|---|---|
| H1 | 8′ | Unison | Principal |
| H2 | 4′ | Octave | Principal |
| H3 | 2⅔′ | Octave + fifth | Quint |
| H4 | 2′ | Two octaves | Super Octave |
| H5 | 1⅗′ | Two octaves + major third | Tierce |
| H6 | 1⅓′ | Two octaves + fifth | Larigot |

Footages exact; the UI additionally names the stops, which the original omits.

---

## V. MIDI Frequency Mapping — verified exact

`f = 440 × 2^((m − 69) / 12)`, shipped at `sources/5thOrgan.html:function midiHz@185`.

| Note | MIDI | Claimed (Hz) | Recomputed (Hz) |
|---|---|---|---|
| G4 | 67 | 392.00 | 392.00 ✅ |
| Eb4 | 63 | 311.13 | 311.13 ✅ |
| F4 | 65 | 349.23 | 349.23 ✅ |
| D4 | 62 | 293.66 | 293.66 ✅ |

The 6th harmonic of A4 is 2640 Hz ✅, comfortably below Nyquist at a 44.1 kHz sample rate. **The highest partial the shipped motif ever produces is H6 of G4 = 2352 Hz** — which matters in §VII.B.

---

## VI. Amplitude Envelope and Voice Pool — verified exact

A pipe organ's envelope is not a synthesizer's: attack 5–50 ms, **no decay phase**, full sustain for the whole key press, release 50–300 ms as the air column falls. The note does not fade while held. That profile shipped algebraically identical to the specification:

```
noteGain.gain.setValueAtTime(0, t_on)
noteGain.gain.linearRampToValueAtTime(V_peak, t_on + T_attack)     V_peak = velocity × 0.065

releaseStart = max(t_off, t_on + T_attack)
noteGain.gain.setValueAtTime(V_peak, releaseStart)
noteGain.gain.linearRampToValueAtTime(0, releaseStart + T_release)
```

Oscillators stop at `releaseStart + T_release + 20 ms` so the ramp completes before the source halts — no click.

**Voice stealing** takes the smallest `startTime`, standard oldest-first policy: the note being cut has sounded longest and its contribution to the texture is already established. Alternative policies (quietest, lowest) add complexity without perceptual benefit at this polyphony. **The generation counter** works as described — `function shutSlot` captures `myGen`, `sources/5thOrgan.html:function noteOn@198` increments `slot.gen`, and the deferred cleanup returns early when they differ, so a reused slot never has its *new* nodes disconnected.

Two behaviours worth recording that the original does not state:

- **A stolen slot's old nodes are never explicitly disconnected** — the same guard that protects the new note abandons the old cleanup. This is correctness-neutral in practice, since a UA releases a node subgraph once its sources have finished and nothing references it, but the asymmetry is undocumented.
- **`slot.active = false` is set when the note-off is *scheduled*,** up to 150 ms before it sounds. Release tails therefore do not hold slots — the right pooling choice — but the voice-dot indicators go dark early, and the acoustic voice count can briefly exceed the lit-dot count.

---

## VII. IIR Biquad Lowpass Filter

### A. Coefficients — verified exact

The bilinear transform maps the analog variable *s* to the discrete-time *z*:

```
s = (2/T) × (z − 1)/(z + 1)          T = 1/Fs
```

and the analog 2nd-order Butterworth lowpass prototype, normalized to cutoff 1, is `H(s) = 1 / (s² + s/Q + 1)`. The Audio EQ Cookbook coefficients published in the original are correct as written:

```
ω₀ = 2π f_c / F_s
α  = sin(ω₀) / (2Q)

b₀ = (1 − cos ω₀) / 2        a₀ = 1 + α
b₁ = 1 − cos ω₀              a₁ = −2 cos ω₀
b₂ = (1 − cos ω₀) / 2        a₂ = 1 − α          (normalize all by a₀)
```

with the Direct Form I difference equation `y[n] = b₀x[n] + b₁x[n−1] + b₂x[n−2] − a₁y[n−1] − a₂y[n−2]`, state carried in `x[n−1], x[n−2], y[n−1], y[n−2]`.

**Notation correction.** The original writes *"pre-warping the cutoff frequency (`ω₀ = 2 tan(π f_c / F_s)`)"* two lines above defining `ω₀ = 2π f_c / F_s` — one symbol, two meanings, and the first is additionally missing a factor of *F_s*. The pre-warped **analog** frequency is a distinct quantity and deserves a distinct symbol:

```
Ω₀ = 2 F_s · tan(π f_c / F_s)        analog, pre-warped
ω₀ = 2π f_c / F_s                    digital, used by the coefficients above
```

### B. What the filter actually does here

The feedback terms `a₁, a₂` make the impulse response infinite, giving a steeper rolloff than an FIR of equal order. The implementation delegates to the native `BiquadFilterNode` rather than running the difference equation in JavaScript — correct, and for a sound reason: it executes on the audio thread with no JS overhead. Cutoff and Q update live on all sounding voices, exactly as claimed.

**Two corrections to the rationale.** (1) *"the lowpass removes aliasing artifacts"* — it cannot. `OscillatorNode` of type `'sine'` emits a pure band-limited sine, so there is no aliasing to remove, and a filter placed after summation could not undo it if there were. The rest of that sentence — modelling the natural high-frequency rolloff of pipe resonance — is the true and sufficient justification. (2) **At the default cutoff the filter is inaudible on the shipped motif.** The highest partial is 2352 Hz against a 5000 Hz cutoff at Q = 0.707: attenuation **−0.21 dB**. To take 3 dB off H6 the cutoff must come down to 2352 Hz. The control is real and works; the default simply parks it out of the way.

---

## VIII. Sequencer — The Beethoven Canon

### A. Motif and timing — verified exact

```
Phrase A (16ths 0–13):   G4 G4 G4 [short ×3]   Eb4 [long, 8]
Phrase B (16ths 14–27):  F4 F4 F4 [short ×3]   D4  [long, 8]
Period: 28 sixteenths
```

At 108 BPM one sixteenth is `(60/108)/4` = 0.1389 s; a short note (2) is 0.2778 s and a long note (8) is 1.1111 s. All three verified against the file.

### B. The lookahead scheduler — verified

Each tick advances through `seqEvents[]` while `seqStart + event.t ≤ now + LOOKAHEAD` and hands every event an `AudioContext.currentTime` timestamp; when the array is exhausted, `seqStart` advances by one sequence duration and the index resets. This decouples the jittery JS event loop from the sample-accurate audio scheduler — the standard Web Audio pattern, correctly implemented. The published constants are the shipped values.

### C. ⛔ The collision claim proves the wrong proposition (Finding 4)

The original asserts, twice, that the two tracks never share a MIDI note. Its §XIII "proof" reads:

> *"Track 1 MIDI notes {67, 63}; Track 2 MIDI notes {65, 62} at any time offset."*

**Both tracks play the same motif.** `buildSeq` calls `addTrack(0)` and `addTrack(roundOff)` over one shared `MOTIF`, so Track 2's pitch set is {67, 63, 65, 62} — identical to Track 1's. What separates the voices is *phase*, not repertoire, and phase is a user-facing slider.

The conclusion is nonetheless true **at the default offset of 14**, where Track 1's Phrase B (F4/D4) always sounds against Track 2's Phrase A (G4/Eb4). It is not true generally. Simulating all 56 selectable offsets across the full 16-repetition sequence:

| Offset range | Simultaneous same-pitch overlaps per sequence |
|---|---|
| 1–7 | ⛔ 32 – 192 |
| **8–20** | **✅ none** |
| 21–35 | ⛔ 30 – 180 |
| **36–48** | **✅ none** |
| 49–56 | ⛔ 28 – 168 |

**30 of 56 offsets collide.** The default sits safely mid-band. A collision does not hang a note — every note-on has a matching note-off and the counts balance — but because `noteOff` releases the *newest* matching voice, the two notes exchange durations, audibly deforming the canon. → **§DX-02an**.

The original's own test script then instructs: *"5. Set Round Offset to 1 → near-unison canon (phasing effect)."* Offset 1 is the **worst** entry in the table at 192 overlaps. Step 6, *"Set Round Offset to 0,"* cannot be performed at all: the input carries `min="1"` and `gRO()` clamps with `Math.max(1, …)`. The parameter table one section earlier states the range as 1–56 correctly — *the copied table is right and the composed procedure contradicts it.*

### D. ⛔ Live parameter changes desync the loop (Finding 3)

The original states: *"BPM changes take effect on the next loop iteration."* **The opposite is true.**

`buildSeq` is called at exactly one site, inside `startPlay`, and it bakes absolute seconds into every event using the tempo at that moment. The loop advance, however, re-reads the DOM on every pass:

```js
seqStart += (gRO() + gNR() * MOTIF_LEN) * s16;   // s16 recomputed from gBPM() at loop time
```

So a mid-play change moves the loop period and **never** the event times. The tempo does not change; the seam breaks instead. Measured for 108 → 216 BPM at otherwise-default settings:

- event-array span **64.08 s**, new loop advance **32.08 s**
- at the seam, **262 of 512 events (51 %) fall into the past** and fire inside a single 50 ms tick
- 131 simultaneous `noteOn` calls against a 12-slot pool — continuous voice stealing, then silence for the remainder of the pass

The same defect applies to round-offset and repetition changes. **Fix:** rebuild `seqEvents` at the loop boundary from the current control values and derive the advance from the rebuilt array instead of recomputing it independently. → **§DX-02an**.

*(A second, benign seam artifact: the advance is 462 sixteenths while the last event lands at 461.36, an 89 ms overhang — fully masked by the 200 ms default release.)*

---

## IX. Architecture and Node Budget

```
  Sequencer timer (50 ms) ── buildSeq(bpm, offset, reps) ── seqEvents[] sorted by time
             │ noteOn(midi, vel, t) · noteOff(midi, t)
             ▼
  Voice pool, 12 slots: { active, midi, startTime, gen, noteGain, filter, oscs[6] }
             │
             ▼   per voice:  f₀ = 440 × 2^((midi − 69)/12)
     OscNode(f₀×1..6) → GainNode(A₁..A₆) → noteGain (ADSR) → BiquadFilterNode (LP)
             │ × 12
             ▼
     masterGain → AnalyserNode (oscilloscope feed) → AudioContext.destination
```

The diagram is **exact** against the file. Node budget at full polyphony: 72 oscillators + 72 harmonic gains + 12 note gains + 12 filters + 1 master + 1 analyser = **170**, arithmetic correct, and a light load for a browser that sustains an order of magnitude more.

One clarification the original invites: the *slots* are pooled, the *nodes* are not. `noteOn` calls `createGain`, `createBiquadFilter` and `createOscillator` fresh on every note, so 170 is a steady-state peak that assumes the UA collects abandoned subgraphs — not a preallocated pool. §XIII.B-1's AudioWorklet proposal would collapse it to about 15.

---

## X. Parameter Reference — verified 10/10 against the controls

| Parameter | Range | Default | Effect |
|---|---|---|---|
| BPM | 40–240 | 108 | Sequencer tempo |
| Round offset | 1–56 sixteenths | 14 | Canon voice delay |
| Repetitions | 1–64 | 16 | Passes before loop |
| H1–H6 drawbars | 0–1 | 1/n | Per-harmonic amplitude before falloff |
| Attack | 1–500 ms | 10 | Time to peak amplitude |
| Release | 10–2000 ms | 200 | Tail after key release |
| Master volume | 0–1 | 0.50 | Global gain before output |
| Filter cutoff | 200–20000 Hz | 5000 | Lowpass cutoff |
| Filter Q | 0.1–10 | 0.707 | Resonance (0.707 = Butterworth, no peak) |
| Harmonic falloff | 0–24 dB/oct | 6 | dB attenuation per harmonic octave |

Every range and every default matches the markup. Attack and Release apply to the **next** note, since `P.attackMs` is read at note-on; drawbars, volume, cutoff and Q apply to sounding voices immediately.

> ### ⛔ NOT SHIPPED — kept as specified
>
> **Preset registrations.** The original lists four beneath the table above, in the same visual register as the verified rows:
> *Principal* (falloff 6, drawbars 1/n) · *Flute* (falloff 12, H1 at 1.0, H2–H6 at 0.1) · *Reed* (falloff 3, all drawbars 0.8) · *Full Organ* (falloff 4, drawbars 1/n, cutoff 8000 Hz).
>
> **There is no preset mechanism in the file** — no buttons, no table, and zero occurrences of any of the four names. This is the document's sharpest instance of its own pattern: ten table rows copied off the markup and exact, four table rows composed and entirely absent, under one heading. *(The *Principal* row also carries Finding 2's error: falloff 6 over drawbars 1/n is a Flute.)*

---

## XI. Spec → Shipped Delta Table

| # | Claim | Verdict |
|---|---|---|
| 1 | File is `5thOrgan.html` at the repo root | ⚠️ STALE — `sources/5thOrgan.html` since `5e48dd7` |
| 2 | Motif array, `MOTIF_LEN`, `N_HARM`, `MAX_VOX` | ✅ exact |
| 3 | `A_h = drawbar[h] × 10^(−falloffDB·log₂h/20)` | ✅ exact |
| 4 | Default registration is Principal, i.e. 1-over-n | ⛔ **1/n² — a Flute** → §DX-02am |
| 5 | falloff 0 = flat · 6 = 1/n · 12 = 1/n² | ⛔ true of the curve alone; off by 1/n as shipped |
| 6 | MIDI formula and all four frequencies | ✅ exact |
| 7 | ADSR algebra, `V_peak`, release start, +20 ms stop | ✅ exact |
| 8 | Oldest-first stealing; generation counter | ✅ exact — the `reduce` is quoted verbatim |
| 9 | Audio EQ Cookbook coefficients; difference equation | ✅ exact |
| 10 | `ω₀ = 2 tan(π f_c/F_s)` offered as pre-warping | ⛔ symbol collision, missing F_s — corrected §VII.A |
| 11 | The lowpass "removes aliasing artifacts" | ⛔ no aliasing exists to remove |
| 12 | The filter shapes the timbre at defaults | ⛔ −0.21 dB on the top partial; inaudible until ~2.4 kHz |
| 13 | `LOOKAHEAD` 150 ms, `SCHEDULE_INTERVAL` 50 ms | ✅ values; ⚠️ inline literals, not named constants |
| 14 | `ROUND_OFFSET = 14` as a constant | ⚠️ a DOM input, `#ro`, defaulting to 14 |
| 15 | Loop total 462 sixteenths = 64.1 s | ✅ arithmetic exact |
| 16 | "BPM changes take effect on the next loop" | ⛔ **inverted** → §DX-02an |
| 17 | "No MIDI note collides at any time offset" | ⛔ true at 14; **30 of 56 offsets collide** → §DX-02an |
| 18 | §XIII proof: Track 2 plays {65, 62} | ⛔ both tracks play all four pitches |
| 19 | Test step 6: "Set Round Offset to 0" | ⛔ not performable — `min="1"`, clamped |
| 20 | Architecture diagram; 170-node budget | ✅ exact |
| 21 | `getFloatTimeDomainData`; 0.44 trace margin | ✅ exact |
| 22 | Parameter table, ten rows | ✅ 10/10 exact |
| 23 | Four preset registrations | ⛔ **NOT SHIPPED** — no mechanism |
| 24 | §XI "Verified behaviors" — seven audible outcomes | ⛔ contradicted by §XIII.C — never heard (Finding 5) |
| 25 | "12-voice polyphony confirmed"; "stealing at full texture" | ⛔ the demo is 2-voice; the pool cannot fill |
| 26 | Taylor series accurate to ~10⁻⁶ over [−π, π] | ⛔ 6.9 × 10⁻³ at π (Finding 6) |
| 27 | `writing-mode` browser limitation | ✅ real; ⚠️ omits the shipped `appearance` fallback |
| 28 | `actx.resume()` called before scheduling | ✅ exact |
| 29 | No MIDI keyboard input | ✅ 0 occurrences — correctly stated |
| 30 | Planned in `ponies-unicorns` §VI | ✅ confirmed — §VI is the organ section |
| 31 | "Ready for embedding in `roll2hit-v3.html` as an iframe" | ⛔ **never happened** → §AUDIO-01 (Finding 1) |

---

## XII. Findings

**1 — The game is silent, and that is this report's whole reason for existing.** `roll2hit-v3.html` contains **0** occurrences of `AudioContext`, `createOscillator`, `BiquadFilter`, `AnalyserNode`, `new Audio`, `<audio>` and `iframe`. Its 119 hits for *"sound"* and 21 for *"music"* are all narrative prose — the groan of a chain, the absence of sound where there was too much of it. The instrument was built exactly to the brief and then never connected to the thing it was built for, and the repo reorganization that filed it under `sources/` quietly settled the question by placing it among the authoring tools. **Nothing is wrong with the synthesizer.** What is missing is one `<iframe>`, or a ~120-line extraction of the voice pool, plus the design call about what it should play. → **§AUDIO-01**.

**2 — The default registration is a Flute labelled Principal.** Measured at 1/n² to within 0.8 %, against a claimed 1/n. The root cause was found by cross-checking the sibling report that specified the drawbars *before* the falloff control existed — a single-document pass could not have reached it. The fix is one of three one-line choices (rebase the drawbars to 1.0, default the falloff to 0, or relabel the default), and the choice belongs to whoever owns the sound. → **§DX-02am**.

**3 — Two sequencer defects, one fix.** The loop advance re-reads live controls while the event array stays frozen at start time, so a mid-play tempo change fires 51 % of the sequence in a single tick; and the round-offset range admits 30 colliding values whose releases the newest-first `noteOff` mis-assigns. Both are cured by rebuilding `seqEvents` at the loop boundary. → **§DX-02an**.

**4 — The 12-voice pool is provisioned for repertoire the demo does not contain.** Each track is monophonic and there are two tracks, so peak occupancy is 2 sounding voices, or about 4 counting release overlap. **No offset in 1–56 can fill the pool**, so the original's *"12-voice polyphony confirmed via voice-dot indicators"* and *"voice stealing occurs at full 12-voice texture"* describe events the shipped sequence cannot produce. The pool size is not wrong — the sibling report's budget justifies 12 for chorale texture — but the demonstration standing in for that repertoire exercises one sixth of it. The abstract's 72 oscillators is a **capacity**, and is restated as such above.

**5 — A "Results" section reporting outcomes the same document says were never observed.** §XI listed seven *"Verified behaviors"* in audible terms — *no clicks*, *smoothly brightens*, *loop transition is seamless* — and §XIII.C then states plainly: *"Testing was performed via code inspection and architectural verification rather than live audio browser testing (no browser available in this session)."* Both cannot hold. The structural verifications in §XIII.C are individually sound and re-confirmed here; the audible claims in §XI have no basis. *The more limiting statement was the reliable one, and it arrived two sections too late to correct the first.*

**6 — The Taylor series accuracy claim is optimistic by three orders of magnitude.** The five-term Horner form given is correct through *x*⁹, but the stated *"~10⁻⁶ in the range [−π, π]"* holds only to about |*x*| ≤ 1.5:

| x | 1.0 | 1.5 | π/2 | 2.0 | 2.5 | 3.0 | π |
|---|---|---|---|---|---|---|---|
| absolute error | 2.5e−8 | 2.1e−6 | 3.5e−6 | 5.0e−5 | 5.7e−4 | 4.2e−3 | **6.9e−3** |

The truncation term is *x*¹¹/11!, which at π is 7.4 × 10⁻³. §X.A of the original additionally quotes a **four**-term version of the same series as though it were the five-term one. Reference material only — nothing in the shipped file depends on it.

**7 — The proposed generative sequencer has a latent index bug.** In `genMotif`, `(r * 1664525 + 1013904223) & 0xFFFFFFFF` coerces to a **signed** 32-bit integer, so `r` goes negative — measured on 2 of the first 4 iterations from a plausible seed — and `r % SCALE_D_MINOR.length` then yields a negative index. `SCALE_D_MINOR[-1]` is `undefined`, `midiHz(undefined)` is `NaN`, and assigning `NaN` to `frequency.value` throws. Use `>>> 0` and take the modulus of the unsigned value. Recorded so the proposal is implementable as written.

---

## XIII. Design Rationale and Future Directions

### A. Why native `OscillatorNode` — rationale upheld

| Reason | Status |
|---|---|
| `ScriptProcessorNode` is deprecated and may be removed | ✅ correct |
| Native nodes run on the audio thread, free of GC jitter | ✅ correct |
| Native oscillators are DSP-optimized on most platforms | ✅ correct |
| `AudioWorklet` needs a Blob URL or a separate file — against the single-file rule | ✅ correct; the Blob workaround is noted below |

The cost is that `OscillatorNode` produces a mathematically perfect sine: clean, and slightly sterile at high amplitude.

### B. ⚠️ NOT SHIPPED — the improvement register, 79 days on

None of the four has been built. All four remain sound.

1. **AudioWorklet summing all six harmonics per voice** — collapses ~170 nodes to ~15 and removes most scheduling overhead. Workaround for the single-file rule: `URL.createObjectURL(new Blob([workletCode], {type:'text/javascript'}))`.
2. **`PeriodicWave` harmonic blending** — one oscillator per voice instead of six, encoding the six amplitudes as a Fourier series. Rejected for the live-drawbar case, and correctly: a change requires rebuilding the wave and reassigning it to every sounding voice, roughly a 3 ms operation that can click at full polyphony. The six-`GainNode` design exists precisely to keep per-harmonic updates free, and Finding 2's timbre fix does not disturb that trade.
3. **Soft-clipping waveshaper** — `y = x / (1 + |x|)`, or `tanh(k·x)`, for the air-column compression warmth a perfect sine lacks.
4. **Custom `<div>` + drag sliders** to remove `writing-mode` rendering variance, about 30 lines. Partially pre-empted: the file already ships both the standardized `writing-mode` route and the legacy `appearance:slider-vertical` fallback.

### C. ⚠️ NOT SHIPPED — song library, chord loop, generative seed

Kept as authored; this report holds the only copy.

`MOTIF` and `MOTIF_LEN` are the only song-specific data, so a song is a plain object — `{ title, motif, motifLen, bpm, roundOffset }` — chosen from a `<select>`. The voice pool and scheduler are unchanged; only the event schedule differs.

```js
const SONGS = {
  beethoven5: { title: "Beethoven Op.67",
    motif: [[0,67,2,0.85],[2,67,2,0.85],[4,67,2,0.85],[6,63,8,1.0],
            [14,65,2,0.85],[16,65,2,0.85],[18,65,2,0.85],[20,62,8,1.0]],
    motifLen: 28, bpm: 108, roundOffset: 14 },
  bach_cm:    { title: "Bach C Minor (demo)",
    motif: [[0,60,4,0.9],[4,62,4,0.9],[8,63,4,0.9],[12,65,8,1.0]],
    motifLen: 20, bpm: 96, roundOffset: 10 },
};
```

A **chord loop** generalizes each entry to `[beat, midiNotes[], dur16, vel]`, expanding to one note-on/note-off pair per note:

```js
const CHORD_LOOP = [
  [0,  [60, 64, 67], 16, 0.7],   // C major
  [16, [57, 60, 64], 16, 0.7],   // A minor
  [32, [53, 57, 60], 16, 0.7],   // F major
  [48, [55, 59, 62], 16, 0.7],   // G major
];
```

A three-note chord costs 3 slots and 18 oscillators — the original's *"4 notes × 6 harmonics = 24 oscillators"* counts a voice its own example does not have. A **generative sequencer** walks a fixed scale with an LCG, subject to Finding 7:

```js
const SCALE_D_MINOR = [62, 64, 65, 67, 69, 70, 72]; // D E F G A Bb C
function genMotif(seed, len) {
  let r = seed, motif = [], t = 0;
  for (let i = 0; i < len; i++) {
    r = (r * 1664525 + 1013904223) >>> 0;          // >>> 0, not & 0xFFFFFFFF — Finding 7
    const note = SCALE_D_MINOR[r % SCALE_D_MINOR.length];
    const dur  = [2,2,4,4,8][(r >> 8) % 5];
    motif.push([t, note, dur, 0.75 + ((r >> 16) & 0xFF) / 1020]);
    t += dur;
  }
  return { motif, motifLen: t };
}
```

The canon offset keeps a random motif polyphonically interesting regardless of which notes come out, because temporal separation is guaranteed by the offset rather than by the pitch content. Finally, a **pedal layer** sustains chord roots on dedicated slots initialized to `drawbars = [1.0, 0.5, 0, 0, 0, 0]` — fundamental plus octave, no upper harmonics — under the melodic canon.

**If any of this reaches `roll2hit-v3.html`, one house rule attaches:** randomness affecting game state must draw the seeded stream (`S_story.rngState`, mulberry32), never `Math.random()` or `Date.now()` — invariant #6. A soundtrack is cosmetic and therefore exempt; a *generative* soundtrack whose seed is persisted to the save is not.

### D. Known limitations — verified

- `writing-mode: vertical-lr` drawbars may render horizontally in some environments; functionality is unaffected. The `appearance:slider-vertical` fallback is also present.
- `OscillatorNode.start()` before `AudioContext.resume()` schedules correctly but may be deferred by autoplay policy — the Play button calls `actx.resume()` first, verified.
- No MIDI keyboard input; `navigator.requestMIDIAccess()` has 0 occurrences.
- ⚠️ **UNVERIFIED, not disputed:** *"less than 5 % of a single CPU core"* for 72 oscillators. Consistent with the sibling report's 2–5 % estimate, but no measurement exists in either document, and §XIII.C confirms no browser was available.

---

## XIV. Conclusion

The synthesizer succeeds on its own terms and the mathematics behind it is sound. A convincing additive pipe organ fits in 307 lines of dependency-free JavaScript: six oscillators per note, a drawbar per harmonic, a global dB/octave curve, a native biquad for pipe rolloff, a lookahead scheduler for sample-accurate timing, and a 12-voice pool with oldest-first stealing and a generation guard that survives reuse. Everything the original report transcribed from the file is exact. Everything it composed from memory — a preset table, a collision proof, a results list, a numerical error bound — is where all seven findings live.

Two of those findings are worth fixing in the instrument itself: a default registration that is a Flute wearing a Principal's label, and a sequencer whose loop reads live controls its event array cannot follow. Both are small.

The one that matters is not in the file at all. This was designed as background music for `roll2hit-v3.html` — *"like a player piano, in the background, as the game is played"* — and 79 days later the game has no audio of any kind. The instrument works. The constraint it was shaped around, one file with no build and no assets, is still the game's constraint. And the dials it exposes are the same dials the game's state already turns: void pressure, act number, the doom clock counting down to Day 49. The remaining work is an iframe and a design call, not a synthesizer.

---

## References

1. Bristow-Johnson, R. *Cookbook formulae for audio EQ biquad filter coefficients.* W3C Audio EQ Cookbook. https://webaudio.github.io/Audio-EQ-Cookbook/audio-eq-cookbook.html
2. Phelps, L. *Pipe Organs 101.* Lawrence Phelps & Associates. https://lawrencephelps.com/Documents/Articles/pipeorgans101.shtml
3. Teropa. *Additive Synthesis and the Harmonic Series.* https://teropa.info/blog/2016/09/20/additive-synthesis.html
4. W3C. *Web Audio API Specification.* https://www.w3.org/TR/webaudio/
5. Zölzer, U. *DAFX: Digital Audio Effects*, 2nd ed. Wiley, 2011. (IIR design, bilinear transform)
6. Loy, G. *Musimathics*, Vol. 2. MIT Press, 2007. (Harmonic series, Fourier synthesis)
7. simonbw. *web-audio-organ.* GitHub. https://github.com/simonbw/web-audio-organ
8. `lab-reports/lab-report-ponies-unicorns-aspirations-future-ideas.md` §VI — the originating specification.

---

*© 2026 Paul Richeson — MIT License. See [LICENSE](LICENSE) for full text.*
