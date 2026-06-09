<!-- SPDX-License-Identifier: MIT — Copyright (c) 2026 PaulRicheson@Roll2Hit.com -->

# Roll2Hit World Builder — Quick Reference

## Directive

> **Always use `./api.sh`. Never use raw curl.**
> If a feature is missing from `./api.sh`, request an API refactor — do not reach for curl.
> Verify, validate, and maintain the node network after every change.

---

## Start the server

```bash
./wbapi-toggle.sh start      # background, auto-restart
./wbapi-toggle.sh status     # PID + port
./wbapi-toggle.sh restart    # after server-code changes
./api.sh ping                # verify it's up
```

---

## Network health — run every session

```bash
./api.sh worldmap --regions     # visual overview: which zones have cities
./api.sh broken                 # broken edges (target: 0)
./api.sh reachability           # % reachable from hub (target: 100%)
./api.sh worldmap --city LHR   # inspect a specific node's connections
```

---

## Search → Inspect → Edit

```bash
# Find
./api.sh list node --q "birka"
./api.sh list quest --node LHR --type side
./api.sh list monster --tier hard
./api.sh list npc --occupation "merchant"

# Inspect
./api.sh get node LHR           # full node detail
./api.sh location LHR           # composite: node + quests + NPCs + monsters
./api.sh get quest shk6_act1
./api.sh chain quest_anath      # upstream/downstream quest chain

# Edit
./api.sh put node LHR label="New Label" N=BMA S=KRN
./api.sh put quest shk6_act1 desc="..." passText="..."
./api.sh put npc egil_thorvaldsen occupation="wool factor"

# Create / Delete
./api.sh post node code=NEW name=city label="New City" act=1
./api.sh del node OLD_CODE
```

---

## Map commands

```bash
./api.sh worldmap                          # world map (76 cities)
./api.sh worldmap --regions                # 6×6 region grid
./api.sh worldmap --region B2             # zoom into region
./api.sh worldmap --city LHR             # city map + connection status
./api.sh worldmap --search "forest"      # search by label/terrain/battle
./api.sh worldmap --monster skeleton     # monster-hunt map
./api.sh worldmap --route LHR --to CON  # BFS navigation A→B
```

---

## Coordinate wiring

```bash
./api.sh geo-seed --execute              # anchor cities to lat/lon
node layout-solve.js --apply             # propagate all nodes

./api.sh connect WOR E SAL              # wire two nodes
./api.sh highway LHR CON --execute      # full junction highway
./api.sh junction LHR S --execute       # single junction node
./api.sh fill-gap WOR E SAL --execute   # junction chain for gap > 4
./api.sh move LHR 12 18 --swap          # move/swap coordinates

./api.sh fix-diagonal LHR S --execute   # fix one broken edge
./api.sh fix-all-broken --execute       # batch-fix all broken edges
```

---

## Export / Import / Audit

```bash
./api.sh export node_map                 # export as JSON
./api.sh export all --format js
./api.sh import book.json               # bulk import
./api.sh audit --map                    # full integrity scan
```

---

## Need a feature curl can do but api.sh can't?

Describe the operation and request an API refactor. It will be added as a named
`./api.sh` command. Do not use raw curl as a workaround — it bypasses nonces,
retry logic, and pipe-safe error handling.

Full reference: **API-README.md**
