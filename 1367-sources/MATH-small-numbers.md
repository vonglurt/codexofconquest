# MATH-06 — There Are Not Enough Small Numbers

*The Strong Law of Small Numbers — Mandatory Lecture at the Event Horizon Station*
*Source: Guy (1988); Rabin (2000)*

---

## The Character: Richard the Enumerator

Richard has been at the Event Horizon Station since before any current resident can confirm their own arrival. He is compact, energetic, and precise. His posture is that of a man who has given a great many lectures and found the whole enterprise deeply satisfying.

He carries:
- A dense pamphlet, **THE STRONG LAW OF SMALL NUMBERS** — cover stamped FIFTH PRINTING
- A portable chalkboard on articulated iron legs that follows him at hip height
- A hand bell with a very clean tone
- A cup of cold tea he has not drunk in several years because he is always in the middle of something more interesting

His first words to every visitor, within thirty seconds of arrival at the EHZ platform:

> *"There aren't enough small numbers to meet the demands made of them."*
> — R.K. Guy, **The Strong Law of Small Numbers**, *The American Mathematical Monthly*, 95:8 (1988), p. 697.

He rings the bell. He is already smiling when he rings it. He loves this part.

**He has delivered this lecture to every visitor who has come through EHZ. He has a 100% completion rate not because he traps people but because the lecture is genuinely hard to leave once it begins. He starts in the middle of a good argument, his energy is real, and by the time a visitor realizes they have been standing in the same place for ten minutes they are already curious about what the urn model means. He will tell them. He is delighted to tell them. He is always delighted to tell them.**

Other EHZ residents tell new arrivals: "You'll get the lecture." Not as a warning. As information. Richard gives the lecture to everyone. Everyone leaves knowing about the Law of Small Numbers. That is how EHZ works.

He loves the audience. Every audience. He has given the lecture hundreds of times and he is as pleased at the end of this one as he was at the end of the first. The bell, the chalk, the argument — they are all exactly as good as he remembers.

The chalkboard thumps once whenever Richard says something that is both true and that the listener does not want to hear. It does not have a face. It has clear opinions about good pedagogy.

---

## Quest Stub — Full JSON

```json
{
  "quest_id": "MATH-06",
  "title": "There Are Not Enough Small Numbers",
  "cycle": 6,
  "book": "MATH — The Law of Small Numbers (Guy 1988; Rabin 2000)",
  "token": "Richard's Lecture Notes — Pamphlet: THE STRONG LAW OF SMALL NUMBERS; back stamped DELIVERED. ATTENDANCE WAS NONOPTIONAL.",
  "route": ["EHZ", "WM"],
  "theme": "The pattern that looks like more than coincidence because the sample is too small to contain enough counter-examples; the man whose life's work is ensuring no one leaves the station without understanding why they are wrong about the pattern they just noticed; the satisfaction of a man who finally has a listener; the archive that receives the lecture notes as its first entry in a category that should not need to exist but apparently does.",
  "archive_category": "Compulsory Education Records — Lectures Delivered on the Law of Small Numbers; Arguments Whose Correctness Did Not Depend on Whether the Audience Arrived Voluntarily; first entry: 'There aren't enough small numbers to meet the demands made of them. — R.K. Guy, 1988. The Fighter attended. The chalkboard thumped.'",
  "questComplete": true,
  "acts": [
    {
      "act": "I",
      "activateNode": "EHZ",
      "type": "dialogue",
      "scene": "The arrival platform at the Event Horizon Station. Low-gravity stone floor. Mathematical symbols in twelve writing systems carved into every surface. Richard the Enumerator is standing beside the main entrance arch, bell in hand, chalkboard beside him. He has been here since before you arrived. He rings the bell the moment your feet touch the platform. The tone is very clean. He watches you register it. His expression is the expression of a man who has been ready for this for some time.",
      "dialogue": {
        "npc": "Richard the Enumerator",
        "opening": "'There aren't enough small numbers to meet the demands made of them.' — R.K. Guy, 1988.",
        "pause": "He lets that land. He watches your face. He has watched a great many faces at this moment and he finds it interesting every time — the ones that dismiss it, the ones that feel the weight of it, the ones that are already starting to argue. All of them end up in the same lecture. He likes that too.",
        "continuation": "'You may be wondering what that means. That is the correct response. Sit down. I am going to tell you what it means. I have told many people what it means. I am going to tell you. It does not get less true with repetition. Neither does it get less satisfying to explain.'",
        "player_options": [
          {
            "option": "Decline politely.",
            "response": "Richard adjusts his lecture speed upward by 12%. The lecture occurs.",
            "skillCheck": { "ability": "CHA", "dc": 12, "success": "Richard speaks faster. He is, if anything, more satisfied — speed means he trusts you to keep up.", "fail": "Richard speaks at standard pace. He was going to do this anyway." }
          },
          {
            "option": "Attempt to walk to the exit.",
            "response": "The chalkboard moves to block the exit. It does not have a face. Richard says, 'The exit will be available at the conclusion. The conclusion follows the lecture. The lecture follows now.' He rings the bell again.",
            "outcome": "Lecture occurs."
          },
          {
            "option": "Sit down voluntarily.",
            "response": "Richard nods like this is exactly what he expected and rings the bell with extra flourish. He is already at the chalkboard. He says: 'Good. We begin.' His energy is immediate.",
            "outcome": "Lecture occurs. Richard is in full performance mode from the first sentence."
          }
        ]
      },
      "failText": "You cannot easily leave. The lecture is already interesting. You stay.",
      "successText": "The lecture begins. Richard is already in full stride."
    },
    {
      "act": "II",
      "activateNode": "EHZ",
      "type": "dialogue",
      "scene": "Richard writes on the chalkboard. The chalkboard cooperates. He writes two phrases: LAW OF LARGE NUMBERS. LAW OF SMALL NUMBERS. He underlines the second one twice.",
      "dialogue": {
        "npc": "Richard the Enumerator",
        "lecture": [
          "'Loosely put, the law of large numbers tells us that the distribution of a large random sample from a population closely resembles the distribution of the overall population. You know this. Everyone knows this. No one acts on it correctly. That is the problem this lecture addresses.'",
          "'Many people believe in the law of small numbers. They exaggerate how likely it is that a small sample resembles the parent population from which it is drawn. The law of small numbers was first labeled and demonstrated by Tversky and Kahneman in 1971. They named it. I did not name it. I have simply been explaining it since then to everyone who passes through this station.'",
          "'The related error is the gambler's fallacy: the belief that recent draws of one signal increase the odds of next drawing a different signal. If early coin flips are disproportionately heads, the law of averages — which the person believes in incorrectly — tells them the next flips are more likely to be tails. This is wrong. The coin does not remember. The urn does not compensate. The sequence is not trying to balance itself for your convenience.'",
          "'There is also the matter of over-inference from short sequences. A smaller literature than I would like demonstrates this. I am aware of the irony of a man giving a lecture about over-inference from small samples to an audience of one. I have thought about this. The lecture is still correct.'"
        ],
        "satisfaction_note": "He glances at you after the last line to see if you registered the irony. If you did, his expression shifts — just briefly — to something warmer."
      },
      "failText": "You absorb this. You have no choice. The chalkboard is still blocking the exit.",
      "successText": "The overview is complete. Richard picks up his tea, does not drink it, sets it back down. He writes SECTION 3 on the board."
    },
    {
      "act": "III",
      "activateNode": "EHZ",
      "type": "skill_check",
      "scene": "Richard draws an urn on the chalkboard. He labels it N. He draws signals coming out of the urn. He labels them i.i.d. He crosses out i.i.d. and writes WITHOUT REPLACEMENT. He underlines this. The chalkboard thumps once.",
      "skillCheck": { "ability": "INT", "dc": 12 },
      "dialogue": {
        "npc": "Richard the Enumerator",
        "lecture": [
          "'I present the model. A person observes a sequence of binary signals of some underlying quality. A sequence of good or bad investments by a financial analyst that signal her underlying competence. A sequence of good or bad performances by a company that signals its long-run prospects. A sequence of good or great films by a well-known actor that signals his thespian virtues.'",
          "'The person is a Bayesian and has correct probabilistic priors about the rate. But: whereas in reality these signals are generated by an independent, identically distributed process, the person believes they are generated by random draws without replacement from an urn of N signals — where the urn contains the proportion of the two values of the signal corresponding to the rate.'",
          "'This captures belief in the law of small numbers. The person believes the proportion of signals must balance out to the population rate before N signals are observed. When N approaches infinity, the person becomes fully Bayesian. The smaller is N, the more he believes in the law of small numbers. He believes the urn is small and will correct itself. The urn is not small. There is no urn. He invented it.'",
          "'This leads directly to the gambler's fallacy. People expect the second draw of a signal to be negatively correlated with the first draw. Because we exaggerate how likely it is that a small set of coin flips yields close to half heads and half tails: if early flips are disproportionately heads, the law of averages tells us the next flips are more likely to be tails. And if an observer is sure that a financial analyst invests successfully close to half the time even over short intervals, then he thinks that an analyst who is successful in her first year has a less than fifty percent chance of being successful next year. He is wrong. The analyst's first year is not connected to her second year by an urn. The observer invented the urn.'"
        ],
        "planted_error": "Richard writes on the board: 'An analyst who succeeds two years in a row is more likely to succeed a third year.' He pauses and looks at the board. He looks at you. He says: 'I have written something on the board. One of the things I have written this session is false. Not as a trap — as a demonstration. If you find it, the lecture concludes at normal speed. If you do not, I add the appendix.'"
      },
      "failText": "You miss the planted statement. Richard says: 'You believed the sequence. The urn has you. We continue — with the appendix.' He picks up the chalk again.",
      "successText": "You identify the planted false claim — the false pattern is that consecutive success predicts future success; under Rabin's model, consecutive success makes the observer believe the rate is MORE extreme, but the believer's gambler's fallacy should reduce predicted repetition of short strings. Richard goes still. The chalkboard thumps once. He says: 'Correct. You found it.' He writes CORRECT on the board and underlines it twice. His satisfaction is complete and visible."
    },
    {
      "act": "IV",
      "activateNode": "EHZ",
      "type": "skill_check",
      "scene": "Richard sets down his chalk and picks up the Rabin pamphlet. He reads from it directly, not from memory — though it is clear he has it memorized and is choosing to read from the text as a form of citation. The chalkboard writes key terms as he speaks: OVER-INFERENCE. POSTERIOR VARIANCE. FICTITIOUS VARIATION.",
      "skillCheck": { "ability": "WIS", "dc": 13 },
      "dialogue": {
        "npc": "Richard the Enumerator",
        "lecture": [
          "'The crux. A believer in the law of small numbers who is uncertain about the rate: because such a person exaggerates how likely it is that a short sequence of signals will closely resemble the rate, he is too confident that the underlying rate resembles the short sequence he observes.'",
          "'If he believes every pair of flips of a fair coin surely generates one head and one tail, then he believes two heads in a row indicates a biased coin. If he believes an average financial analyst is successful once every two years, then he believes an analyst who is successful two years in a row must be unusually good. The probability distribution over his possible posterior beliefs after two signals has too high a variance. He is more confident than the evidence warrants. The math formalizes this. I will spare you the formal proof. The conclusion is that after two signals, a believer in the law of small numbers always has stronger beliefs than he should.'",
          "'Now suppose the person observes a long sequence. He expects small subsequences to yield signals in approximately the same proportions as the overall sequence. He does not expect streaks. When streaks happen anyway — as they must — he must explain them. His explanation is: the rate must be more extreme than it appears. If he sees many streaks from a good analyst, he concludes the analyst is even better than her overall average suggests. If the analyst is, in fact, only average, and the observer sees occasional poor streaks, he concludes this is impossible for a good analyst and revises her downward. Over a long sequence, the believer in the law of small numbers may converge on the wrong world view — and stay there — because the false inference he makes from streaks dominates his inference from overall proportions.'",
          "'I will give you the clearest example. Suppose an observer is initially uncertain whether a financial analyst is bad, average, or good. The analyst is, in fact, good — successful sixty percent of the time. Eventually the observer will see all possible pairs of performances, including two unsuccessful years in a row. If the person is an extremely strong believer in the law of small numbers, he will believe two unsuccessful years in a row is virtually impossible for a good analyst. He will therefore conclude the analyst is average — since average analysts are the only ones who often have both successful and unsuccessful years in a row. He will believe this despite the fact that this supposedly average analyst is successful sixty percent of the time. He has a false world view. The math confirms it. The chalkboard confirms it. I confirm it.'"
        ],
        "satisfaction_interlude": "Richard stops. He looks at you. He is pleased with how the argument is landing. He says: 'Good. This is the best part. Stay with me.' He goes back to the pamphlet."
      },
      "failText": "The over-inference mechanics are too dense. You follow the argument but lose the thread at streaks. Richard notes your expression and adds a clarifying example involving dice. The chalkboard writes CLARIFICATION in small letters.",
      "successText": "You track the argument through to the long-sequence conclusion — the false world view that persists because streaks dominate proportions. The chalkboard thumps once. Richard says: 'Yes. You have it. That is the crux. Most people stop before that.' He is not performing satisfaction now. It is simply there."
    },
    {
      "act": "V",
      "activateNode": "EHZ",
      "type": "dialogue",
      "scene": "Richard sets down the pamphlet. He picks up the chalk one more time and writes SECTION 5: FICTITIOUS VARIATION and SECTION 6: ENDOGENOUS OBSERVATION. He draws a line under both. He looks at the board. He looks at you. He says: 'I am going to give you the economic applications. They are why the lecture matters outside of mathematics. Pay attention. This is where it touches your life.'",
      "dialogue": {
        "npc": "Richard the Enumerator",
        "lecture": [
          "'Suppose a person who believes in the law of small numbers observes a stream of signals from each of a series of different sources, and from such observations makes inferences about the distribution of rates among a large population of sources. Consider an observer of financial analysts. He observes two performances from a large number of analysts — as he might if he reads an article listing performances of many mutual fund managers over the last two years, or if he observed a series of them he hired for brief durations.'",
          "'If in truth all analysts are average, and a Bayesian with any initial beliefs would eventually figure this out: the believer in the law of small numbers will infer that some analysts are good and some are bad. Because he underestimates how often average analysts will have consecutive successful or unsuccessful years, he interprets what he sees as evidence of the existence of good and bad analysts. He has invented them. He is paying for them. He is convinced they exist. This is fictitious variation. It is, I believe, one of the economically most important implications of the law of small numbers. People pay for financial advice from experts whose expertise is entirely illusory. The model predicts this. The model is correct.'",
          "'The final application: when a person decides what signals to observe based on his earlier observations, the sequence of signals becomes endogenous. Suppose a person employs financial analysts one at a time and decides when to switch based on his beliefs. Such a person will switch quickly from an analyst who initially performs poorly — and when he does so, he has over-inferred that the analyst is bad. But he sticks with an analyst who initially performs well — until he discovers she is average. Because he corrects his overly positive inference but not his overly negative inference, his beliefs are biased downward. Over time, he comes to believe that average talent is less than it is. He has trained himself to believe this. The math confirms this. The behavior produces it. He is doing this right now, in markets, in hiring, in every domain where small samples are being observed and large conclusions are being drawn.'",
          "'This is what it means that there are not enough small numbers to meet the demands made of them. The demands are being made anyway. The small numbers are doing their best. They cannot do what is being asked. I enjoy explaining this. I have explained it many times. I will explain it again tomorrow. It does not get less true.'"
        ],
        "final_note": "He sets down the chalk. He rings the bell once — with pleasure, not ceremony. He says: 'That is the lecture.' He says it the way a performer says it: satisfied, ready to do it again."
      },
      "failText": "The applications land. You have absorbed more than you expected to when you arrived at this station.",
      "successText": "The lecture is complete. Richard is already moving the chalkboard back to its position near the entrance arch, ready for the next arrival."
    },
    {
      "act": "VI",
      "activateNode": "WM",
      "type": "dialogue",
      "scene": "Richard opens the pamphlet to its back cover. He produces a heavy iron stamp from his coat. He presses it into the ink pad he carries for this purpose and stamps the cover with the ease of someone who has done this many times. The impression reads: DELIVERED. ATTENDANCE WAS NONOPTIONAL. He looks at it with affection. He hands you the pamphlet. 'Take this to Weimar. Sweelinck will know what to do with it. Tell him the chalkboard thumped.' He picks up his bell. He is already looking toward the arrival arch. There will be another visitor.",
      "grantItem": "Richard's Lecture Notes — Pamphlet: THE STRONG LAW OF SMALL NUMBERS; stamped DELIVERED. ATTENDANCE WAS NONOPTIONAL.",
      "delivery": {
        "node": "WM",
        "archivist": "Sweelinck",
        "response": "Sweelinck receives the pamphlet. He reads the back stamp. He says: 'Good. Another one.' He opens the register — a register that already has many prior entries under this category — and writes the current date. Category already exists: Compulsory Education Records — Lectures Delivered on the Law of Small Numbers; Arguments Whose Correctness Did Not Depend on Whether the Audience Arrived Voluntarily. He adds the Fighter's delivery to the log: 'There aren't enough small numbers to meet the demands made of them. — R.K. Guy, 1988. The Fighter attended. The chalkboard thumped.' He blots the ink. He closes the register. He says: 'He sends one of these every few weeks. Has for years. He always says to tell him the chalkboard thumped. I always note it.'"
      },
      "failText": "The pamphlet is received. The archive category now exists.",
      "successText": "Sweelinck closes the register. The archive category now exists. Somewhere at the Event Horizon Station, the chalkboard thumps once more — not because Richard is saying something. Just because."
    }
  ]
}
```

---

*Cycle 6 complete.*
