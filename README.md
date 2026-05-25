# roll2hit.com

A single-file Adventure RPG. No server. Open the file. Play.

---

## CODER INTRO

### Running the Game

Download `roll2hit-v3.html` and open it in any modern browser with JavaScript enabled. That's it. The entire game — combat engine, world map, NPC dialogue, save system, 370 monsters, 66 terrain types, 8 acts of story — lives in one file. You can email it. Put it on a USB drive. Host it on any static file server.

Save state uses `localStorage`. Nothing leaves the browser.

### Documentation System

This directory maintains a **two-way sync** between the source HTML and the markdown files. Every data structure in `roll2hit-v3.html` has a home document. Every document entry traces back to a line in the HTML.

**Core documents — always kept in sync with the HTML:**

| File | Contents |
|------|----------|
| `index.md` | Master index, cross-reference table, SP sync log |
| `world.md` | NODE_MAP, WORLD_DB, NPC profiles, quest IDs, Birka |
| `story.md` | All 71 nodes, 8 acts, full narrative flow, branching |
| `mechanics.md` | Combat engine, XP table, conditions, economy, save format |
| `monsters.md` | All 370 MONSTER_POOL entries, WORLD_DB terrain coverage |
| `maps.md` | Grid layout, corridor map, node network, legend |

**Spec files — JavaScript architecture reference:**

- `spec-engine.md` — core combat loop, dice, initiative, action economy
- `spec-corridors.md` — corridor grid, CORRIDOR_CELLS, stalk/hunt system
- `spec-world.md` — WORLD_DB, MONSTER_POOL, terrain cascade UI
- `spec-combat.md` — combat flow, conditions, death saves, Fighter features
- `spec-migration.md` — full architecture overview, all data structures

**Lab reports** document design decisions, implementation findings, and system behavior. A new `lab-report-<title>.md` is written when:

- A **major collection** is added or redesigned — new monster group, terrain cluster, NPC faction, or item economy (e.g., the fishing bait sub-system, the Ally Cat Arc)
- A **large redesign** touches multiple systems or rewrites an existing mechanic (e.g., weapon drop economy overhaul, Luck Stat integration)
- A **new narrative theme or arc** spans multiple nodes, NPCs, or quest chains
- A **design review** is needed before implementation — IEEE-format spec to lock in data shapes and flow before touching the HTML
- A **session postmortem** captures decisions that aren't obvious from reading the code or the core docs

A lab report is **not** needed for: adding a single monster or quest (sync the core docs), correcting a value (add an implementation note to the existing report), or small additions that fit cleanly into an existing doc section.

Lab reports are archived — they reflect the system as understood at the time of writing. When shipped code diverges from the design, add an implementation note at the top rather than rewriting the archive. See `index.md` for the full list.

### Adding Content

The shell tooling workflow:

```bash
# Count current monsters
grep -c "key:'" roll2hit-v3.html          # → 370

# Find MONSTER_POOL insertion point
awk '/^const MONSTER_POOL/{found=1} found && /^};/{print NR-1; exit}' roll2hit-v3.html

# After adding a monster, verify count increased by exactly 1
AFTER=$(grep -c "key:'" roll2hit-v3.html)
[ "$AFTER" -eq "$((BEFORE + 1))" ] && echo "✅" || echo "❌ COUNT MISMATCH"

# Sync count to docs
sed -i '' "s/${BEFORE} monsters/${AFTER} monsters/g" monsters.md index.md
```

See `plan.md §XIV — The World Creator Wizard` for the full tooling reference, data integrity promises, and the Quest -1 fork invitation.

### License

MIT. Fork it. Extend it. Write Level 21. The source code is the last item in the inventory.

---

## PLAYER INTRO

### Enter Story Mode

When you open the game, click **Story Mode** to begin your quest. You arrive in Birka — a city on the edge of something wrong. The Void is rising. You have 49 days.

### Moving Through the World

The world is a map of named terrain nodes connected by roads and paths. At each location you'll see which directions are available:

| Command | Action |
|---------|--------|
| **N / E / S / W** | Move in that direction |
| **Wait** | Rest at your current location (advances time) |
| **Hunt** | Enter the wilderness to find a monster encounter |

Move toward quest markers. Talk to everyone. Read what the NPCs say — it changes as your relationship with them grows.

### Combat

When you encounter a monster (or choose to Hunt), combat begins automatically. You roll initiative, then take turns:

- **Attack** — roll to hit; damage if you connect
- **Dodge** — impose disadvantage on the enemy's next attack
- **Use Item** — potions, condition cures, grenades
- **Flee** — escape the encounter (costs a turn)

A roll of **20** is a critical hit (double damage dice). A roll of **1** is a fumble.

If HP drops to 0, make **death saving throws** — three successes stabilize you, three failures end the run.

### Leveling Up

Defeating monsters earns XP. When you hit a threshold, you level up. Each level unlocks Fighter Champion features: Action Surge, Second Wind, Critical Hit improvements, and more. The cap is **Level 20**.

What's at Level 21? That's undefined. See `plan.md §XIV`.

### Quests and NPCs

Talk to the six named NPCs in Birka: **Yael, Brynn, Quill, Pachelbel, Weckmann, Auros**. Each has quests. Completing them raises favorability. Higher favorability unlocks new dialogue, story context, and the best ending.

The **Curse of Knowledge** score tracks whether you've shared what you've learned — not your kill count. The ending notices.

### Saving

The game saves automatically to `localStorage` after every meaningful action. To back up a run, use the **Export Save** button. To restore, use **Import Save**.

### Tips

- Read the journal entries. Froberger documented this world so you wouldn't have to start from zero.
- The terrain you're standing in determines what monsters you'll encounter when you Hunt.
- Gold matters. Manage your condition economy — some debuffs cost gold to cure before battle.
- The Void Tide advances daily. Don't wait too long.


---
*© 2026 roll2hit.com — MIT License. See [LICENSE](LICENSE) for full text.*
