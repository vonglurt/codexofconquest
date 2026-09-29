// SPDX-License-Identifier: MIT — Copyright (c) 2026 Paul Richeson
// §MESH-03d — content packs: signed, content-addressed sets of quests and the monsters
// they fight. A pack's id is the SHA-256 of the canonical form of everything but `sig`,
// so any relay that alters a byte changes the id the receiver recomputes.
'use strict';
const crypto = require('crypto');

const PACK_FORMAT = 'coc-pack/1';
const PACK_ID = /^[0-9a-f]{64}$/;

// sign(buf) → base64 sig and verify(buf, pubB64, sigB64) → bool, both Ed25519 over raw bytes.
module.exports = function createPacks({ canonical, sign, verify, pub }) {
  const unsigned = ({ sig, ...rest }) => rest;
  const packId = (pack) => crypto.createHash('sha256').update(canonical(unsigned(pack))).digest('hex');

  function walkBits(q, visit) {
    (function walk(arr) {
      if (!Array.isArray(arr)) return;
      for (const b of arr) {
        if (!b || typeof b !== 'object') continue;
        visit(b);
        walk(b.onPass); walk(b.onFail);
        if (Array.isArray(b.options)) b.options.forEach((o) => walk(o && o.bits));
      }
    })([...(q.bits || []), ...(Array.isArray(q.onComplete) ? q.onComplete : [])]);
  }

  // Monster keys a quest fights, from its bit chains and kill goals.
  function monsterRefs(q) {
    const keys = new Set();
    walkBits(q, (b) => { if (b.kind === 'combat' && b.key) keys.add(b.key); });
    for (const k of q.killGoals || []) if (k && k.key) keys.add(k.key);
    return [...keys];
  }

  // Ledger item keys a quest's reward bits grant, slugged as the client's mint does.
  const itemKey = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
  function rewardItemKeys(q) {
    const keys = new Set();
    walkBits(q, (b) => {
      if (b.kind === 'reward' && Array.isArray(b.items)) for (const it of b.items) if (it && it.name) keys.add(itemKey(it.name));
    });
    return [...keys];
  }

  // quests: {id: entry}; monsters: {key: entry}; base: the contentHash it was built on.
  function makePack({ quests, monsters, base }) {
    const body = { format: PACK_FORMAT, base, author: pub(), quests, monsters };
    const pack = { ...body, sig: sign(Buffer.from(canonical(body))) };
    return { id: packId(pack), pack };
  }

  // null when the pack is intact and signed by its author; otherwise the reason.
  function verifyPack(pack, expectedId) {
    if (!pack || typeof pack !== 'object' || pack.format !== PACK_FORMAT) return 'format';
    if (!pack.quests || typeof pack.quests !== 'object' || !pack.monsters || typeof pack.monsters !== 'object') return 'format';
    if (expectedId && packId(pack) !== expectedId) return 'bad-id';
    if (!pack.author || !pack.sig) return 'unsigned';
    if (!verify(Buffer.from(canonical(unsigned(pack))), pack.author, pack.sig)) return 'bad-sig';
    return null;
  }

  return { PACK_FORMAT, PACK_ID, packId, monsterRefs, rewardItemKeys, makePack, verifyPack };
};
