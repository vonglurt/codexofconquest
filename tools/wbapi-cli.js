#!/usr/bin/env node
// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
'use strict';
// wbapi-cli.js — Roll2Hit World Builder command-line interface
// Usage: node wbapi-cli.js <command> [args...]  -- see: node wbapi-cli.js help

const fs   = require('fs');
const path = require('path');
const WBAPI = require('../js/wbapi-core');

// ── Config ──────────────────────────────────────────────────────────────────
const DEFAULT_GAME_FILE = path.join(__dirname, '..', 'index.html');  // repo ROOT (tools/ is one level down)
const gameFile = process.env.ROLL2HIT_FILE || DEFAULT_GAME_FILE;

// ── Arg parsing ──────────────────────────────────────────────────────────────
const args  = process.argv.slice(2);
const cmd   = args[0];
const flags = {};
const pos   = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    flags[args[i].slice(2)] = args[i+1] || true;
    i++;
  } else {
    pos.push(args[i]);
  }
}
// pos[0]=cmd, pos[1]=type, pos[2]=id, pos[3]=field, pos[4]=value

// ── Output helpers ───────────────────────────────────────────────────────────
const out  = (x)  => console.log(typeof x === 'string' ? x : JSON.stringify(x, null, 2));
const err  = (msg)=> { console.error('ERROR:', msg); process.exit(1); };
const ok   = (msg)=> { console.log('OK:', msg); };

// ── Lazy load ─────────────────────────────────────────────────────────────────
let _loaded = false;
function load() {
  if (_loaded) return;
  if (!fs.existsSync(gameFile)) err(`Game file not found: ${gameFile}\nSet ROLL2HIT_FILE env var to override.`);
  WBAPI.load(gameFile);
  _loaded = true;
}

// ── Type → namespace ─────────────────────────────────────────────────────────
const NS = {
  node: ()=>WBAPI.nodes, quest: ()=>WBAPI.quests,
  monster: ()=>WBAPI.monsters, npc: ()=>WBAPI.npcs,
  location: ()=>WBAPI.location,
};
function ns(type) {
  const n = NS[type]; if (!n) err(`Unknown type "${type}". Use: node quest monster npc location`);
  return n();
}

// ═════════════════════════════════════════════════════════════════════════════
// Commands
// ═════════════════════════════════════════════════════════════════════════════

const COMMANDS = {

  // ── GET ────────────────────────────────────────────────────────────────────
  get([, type, id]) {
    load();
    if (!id) err('Usage: wbapi get <type> <id|name>');
    const result = ns(type).get(id);
    if (!result) err(`"${id}" not found in ${type}s`);
    out(result);
  },

  // ── LIST ───────────────────────────────────────────────────────────────────
  list([, type]) {
    load();
    const namespace = ns(type);
    let results;
    if (flags.node)    results = namespace.byNode?.(flags.node) || err('--node not supported for this type');
    else if (flags.terrain) results = namespace.byTerrain?.(flags.terrain) || err('--terrain not supported');
    else if (flags.type)    results = namespace.byType?.(flags.type)       || err('--type not supported');
    else if (flags.act)     results = namespace.byAct?.(Number(flags.act)) || err('--act not supported');
    else results = namespace.all?.() || err(`"list" not supported for ${type}`);
    out(results);
  },

  // ── EDIT ───────────────────────────────────────────────────────────────────
  // node wbapi-cli.js edit <type> <id> <field> <value>
  // node wbapi-cli.js edit <type> <id> <field> --file <path>
  edit([, type, id, field]) {
    load();
    if (!id || !field) err('Usage: wbapi edit <type> <id> <field> <value>\n              wbapi edit <type> <id> <field> --file <path>');

    let value;
    if (flags.file) {
      if (!fs.existsSync(flags.file)) err(`File not found: ${flags.file}`);
      value = fs.readFileSync(flags.file, 'utf8').trim();
    } else {
      value = pos[4];
      if (value === undefined) err('Provide value inline or --file <path>');
    }

    // Show old value before editing
    const col = { node:WBAPI.nodeMap, quest:WBAPI.questDb, npc:WBAPI.birkaNpcs, monster:WBAPI.monsterPool }[type];
    const key = col ? WBAPI._findKey(col, id) : null;
    if (key && col[key]?.[field] !== undefined)
      console.log(`  old: ${JSON.stringify(col[key][field])}`);

    const result = WBAPI.editField(type, id, field, value);
    if (!result.ok) err(result.error);
    console.log(`  new: ${JSON.stringify(value)}`);
    ok(`${type}:${result.key}.${field} updated`);
    autoSave();
  },

  // ── PUT (whole object merge) ────────────────────────────────────────────────
  put([, type, id]) {
    load();
    if (!id) err('Usage: wbapi put <type> <id> --file <json-file>');
    if (!flags.file) err('Provide --file <path-to-json>');
    if (!fs.existsSync(flags.file)) err(`File not found: ${flags.file}`);
    const data = JSON.parse(fs.readFileSync(flags.file,'utf8'));

    // Load old data first
    const old = ns(type).get(id);
    if (old) { console.log('  current:'); out(old); }

    const result = ns(type).put(id, data);
    if (!result.ok) err(result.error || JSON.stringify(result));
    ok(`${type}:${result.key} updated`);
    autoSave();
  },

  // ── DELETE ─────────────────────────────────────────────────────────────────
  delete([, type, id]) {
    load();
    if (!id) err('Usage: wbapi delete <type> <id|name>');

    // Show what will be deleted
    const current = ns(type).get?.(id);
    if (current) { console.log('  deleting:'); out(current); }

    const result = ns(type).delete(id);
    if (!result.ok) {
      if (result.blockedBy) {
        console.error('BLOCKED — remove sub-content first:');
        out(result.blockedBy);
        process.exit(1);
      }
      err(result.error);
    }
    ok(`${type}:${result.key} deleted`);
    autoSave();
  },

  // ── MOVE (rename a node code, re-links all quests + npcs) ─────────────────
  move([, type, oldId, newId]) {
    load();
    if (type !== 'node') err('move only supports type "node" currently');
    if (!oldId || !newId) err('Usage: wbapi move node <OLD_CODE> <NEW_CODE>');

    const old = WBAPI.nodes.get(oldId);
    if (!old) err(`Node "${oldId}" not found`);
    if (WBAPI.nodeMap[newId]) err(`Node "${newId}" already exists`);

    // Copy node under new key
    WBAPI.nodeMap[newId] = { ...WBAPI.nodeMap[oldId] };
    delete WBAPI.nodeMap[oldId];

    // Update quests that reference old code
    let qUpdated = 0;
    for (const [id, q] of Object.entries(WBAPI.questDb)) {
      let changed = false;
      for (const f of ['activateNode','waypointNode']) {
        if (q[f] === oldId) { q[f] = newId; changed = true; }
      }
      if (changed) {
        for (const field of ['activateNode','waypointNode'])
          if (WBAPI.questDb[id][field] === newId)
            WBAPI.editField('quest', id, field, newId);
        qUpdated++;
      }
    }

    // Update npcs that reference old code
    let nUpdated = 0;
    for (const [key, npc] of Object.entries(WBAPI.birkaNpcs)) {
      if (npc.node === oldId) {
        npc.node = newId;
        WBAPI.editField('npc', key, 'node', newId);
        nUpdated++;
      }
    }

    // Update NODE_MAP coords
    if (WBAPI.nodeCoords[oldId]) {
      WBAPI.nodeCoords[newId] = WBAPI.nodeCoords[oldId];
      delete WBAPI.nodeCoords[oldId];
    }

    WBAPI._buildIndexes();
    ok(`node ${oldId} → ${newId} (${qUpdated} quests, ${nUpdated} npcs updated)`);
    autoSave();
  },

  // ── SYNC (folder → game file) ──────────────────────────────────────────────
  sync([, dir]) {
    load();
    if (!dir) err('Usage: wbapi sync <world-dir>');
    const result = WBAPI.syncWorld(dir);
    if (result.errors.length) { console.error('Errors:'); result.errors.forEach(e=>console.error(' ', e)); }
    ok(`synced ${result.edited.length} items from ${dir}`);
    if (result.edited.length) autoSave();
  },

  // ── EXPORT (game file → folder) ────────────────────────────────────────────
  export([, dir]) {
    load();
    dir = dir || './world';
    const result = WBAPI.exportWorld(dir);
    ok(`exported to ${result.dir}`);
  },

  // ── SAVE ───────────────────────────────────────────────────────────────────
  save([, outputPath]) {
    load();
    // §DX-02k — `wbapi save` with no path means "dated backup", and now says so.
    const result = outputPath ? WBAPI.save(outputPath) : WBAPI.saveStamped();
    if (!result.ok) err(result.error);
    ok(`saved → ${result.path}`);
  },

  // ── CHAIN (quest dependency graph) ─────────────────────────────────────────
  chain([, id]) {
    load();
    if (!id) err('Usage: wbapi chain <quest-id>');
    const q = WBAPI.quests.get(id);
    if (!q) err(`Quest "${id}" not found`);
    out({ id, title:q.title, upstream:q.chain.upstream, downstream:q.chain.downstream });
  },

  // ── HELP ───────────────────────────────────────────────────────────────────
  help([, topic]) {
    if (topic) { printSchemaHelp(topic); return; }
    console.log(HELP_TEXT);
  },
};

// ── Auto-save after mutations ─────────────────────────────────────────────────
function autoSave() {
  if (!WBAPI._rawSrc) return;
  const result = WBAPI.saveStamped();   // §DX-02k — beside the source file, not the CWD
  if (result.ok) console.log(`  saved → ${result.path}`);
}

// ── Schema help ───────────────────────────────────────────────────────────────
const SCHEMAS = {
  node: `NODE fields:
  name        string   Display name of the location
  terrain     string   Terrain key (e.g. "ruins", "dungeon", "city")
  act         number   Story act this node belongs to (1–5)
  battle      boolean  Whether combat can occur here
  npc         string   NPC name for inline (non-Birka) NPC
  desc        string   Short location description
  locked      boolean  Hidden until unlocked

  Example:
    node wbapi-cli.js edit node CY name "Cyrn the Ancient"
    node wbapi-cli.js edit node CY terrain dungeon`,

  quest: `QUEST fields:
  title         string   Quest display title
  type          string   "main" | "side" | "skill_check" | "hunt"
  hook          string   Opening text shown to player
  passText      string   Text shown on success
  failText      string   Text shown on failure
  rewardText    string   Reward description
  npc           string   NPC key who gives this quest
  activateNode  string   Node code where quest becomes available
  waypointNode  string   Node code where quest is completed
  gold          number   Gold reward on pass
  xp            number   XP reward on pass

  Text fields can be loaded from .txt files:
    node wbapi-cli.js edit quest quest_wis_01 passText --file world/CY/npcs/aldric/quests/quest_wis_01/passText.txt`,

  npc: `NPC fields:
  name          string   Display name
  occupation    string   Role / job title
  node          string   Node code where NPC is located
  greeting      string   Default greeting text
  questIds      array    Quest IDs this NPC gives (informational)

  Example:
    node wbapi-cli.js edit npc aldric_stonehammer occupation "Master Archivist"`,

  monster: `MONSTER fields:
  name          string   Display name
  tier          number   Difficulty tier (1–5)
  hp            number   Hit points
  ac            number   Armor class
  cr            string   Challenge rating
  type          string   Monster type (humanoid, beast, undead…)
  size          string   tiny/small/medium/large/huge/gargantuan
  drop          object   { gold, items[] } — loot table

  Example:
    node wbapi-cli.js get monster goblin`,
};

function printSchemaHelp(type) {
  const s = SCHEMAS[type];
  if (!s) { console.log(`No schema for "${type}". Try: node quest npc monster`); return; }
  console.log(s);
}

// ── Help text ─────────────────────────────────────────────────────────────────
const HELP_TEXT = `
Roll2Hit World Builder CLI
Usage: node wbapi-cli.js <command> [type] [id] [field] [value] [--flags]

QUERY COMMANDS
  get      <type> <id|name>                 Print entity as JSON
  list     <type> [--node X] [--terrain X]  List entities (filtered)
  chain    <quest-id>                        Show quest dependency chain

EDIT COMMANDS
  edit     <type> <id> <field> <value>      Edit single field inline
  edit     <type> <id> <field> --file path  Edit single field from .txt file
  put      <type> <id> --file path.json     Merge entire JSON object
  delete   <type> <id|name>                 Delete (blocked if sub-content exists)
  move     node <OLD> <NEW>                 Rename node code, re-links quests + npcs

FILE STRUCTURE COMMANDS
  export   [dir]                            Export game data → world/ folder tree
  sync     <dir>                            Apply world/ folder tree → game file
  save     [output.html]                    Save timestamped HTML

TYPES:  node  quest  monster  npc  location

FIELD HELP
  help node       Show node field reference
  help quest      Show quest field reference
  help npc        Show NPC field reference
  help monster    Show monster field reference

WORLD FOLDER STRUCTURE
  world/
    {NODE_CODE}/
      node.json            — node metadata
      npcs/
        {npc_slug}/
          npc.json         — NPC metadata
          quests/
            {quest_id}/
              meta.json    — type, nodes, rewards (non-text)
              title.txt
              hook.txt
              passText.txt
              failText.txt
              rewardText.txt
      quests/              — quests not owned by an NPC
        {quest_id}/
          (same as above)
    monsters/
      {monster_key}.json

ENVIRONMENT
  ROLL2HIT_FILE   path to index.html  (default: ./index.html)

EXAMPLES
  node wbapi-cli.js get location CY
  node wbapi-cli.js list quests --node CY
  node wbapi-cli.js edit quest quest_wis_01 passText "You recalled the ancient text."
  node wbapi-cli.js edit quest quest_wis_01 passText --file ./edits/pass.txt
  node wbapi-cli.js move node CY CY2
  node wbapi-cli.js export ./world
  node wbapi-cli.js sync ./world
  node wbapi-cli.js save
`.trim();

// ── Dispatch ──────────────────────────────────────────────────────────────────
if (!cmd || cmd === 'help') {
  COMMANDS.help(pos);
} else {
  const fn = COMMANDS[cmd];
  if (!fn) err(`Unknown command "${cmd}". Run: node wbapi-cli.js help`);
  fn(pos);
}
