import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  initialAdventure,
  normalizeAdventure,
  collectionItems,
  boxOffer,
  openCollectionBox,
  purchaseCollectionItem,
  claimAdventureChapter,
  mergeAdventure,
  newPuzzle,
  puzzleMove,
} from "../src/game/adventures.ts";

const seeded = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

test("boxes charge once, contain three distinct new items and stop at collection completion", () => {
  let progress = initialAdventure(),
    balance = 300;
  assert.equal(openCollectionBox(progress, 59), null);
  for (let i = 0; i < 4; i++) {
    const before = [...progress.owned];
    const result = openCollectionBox(progress, balance, seeded(100 + i));
    assert.ok(result);
    assert.equal(result.balance, balance - 60);
    assert.equal(result.progress.lastReveal.length, 3);
    assert.ok(result.progress.lastReveal.every((id) => !before.includes(id)));
    progress = result.progress;
    balance = result.balance;
  }
  assert.equal(new Set(progress.owned).size, 12);
  assert.equal(openCollectionBox(progress, balance), null);
});
test("remaining-item odds, smaller-box price and free chapter gifts match the offer", () => {
  const progress = {
    ...initialAdventure(),
    owned: collectionItems.slice(0, 10).map((i) => i.id),
  };
  const offer = boxOffer(progress);
  assert.equal(offer.size, 2);
  assert.equal(offer.cost, 40);
  assert.equal(offer.chance, 1);
  const free = openCollectionBox({ ...progress, freeBoxes: 1 }, 0, seeded(2));
  assert.equal(free.balance, 0);
  assert.equal(free.progress.freeBoxes, 0);
  assert.equal(free.progress.freeBoxesUsed, 1);
  assert.equal(free.progress.owned.length, 12);
  const full = boxOffer(initialAdventure());
  assert.equal(full.chance, 3 / 12);
  const samples = Array(12).fill(0);
  const random = seeded(41);
  for (let i = 0; i < 12000; i++) {
    for (const id of openCollectionBox(initialAdventure(), 60, random).progress
      .lastReveal)
      samples[collectionItems.findIndex((item) => item.id === id)]++;
  }
  assert.ok(
    samples.every((n) => Math.abs(n - 3000) < 180),
    `Uniform draws: ${samples}`,
  );
});
test("direct choice refuses invalid, duplicate or unaffordable items", () => {
  const progress = initialAdventure(),
    id = collectionItems[0].id;
  assert.equal(purchaseCollectionItem(progress, 34, id), null);
  assert.equal(purchaseCollectionItem(progress, 999, "fake"), null);
  const result = purchaseCollectionItem(progress, 100, id);
  assert.equal(result.balance, 65);
  assert.equal(purchaseCollectionItem(result.progress, 100, id), null);
});
test("chapters cannot be claimed early, out of sequence, or twice", () => {
  const state = {
    shelterStage: 0,
    hasFed: false,
    hasBonded: false,
    realityVisits: 0,
    dreamDiscoveries: [],
    adventure: initialAdventure(),
  };
  assert.equal(claimAdventureChapter(state, "arrival"), null);
  state.shelterStage = 3;
  state.hasFed = true;
  state.hasBonded = true;
  const result = claimAdventureChapter(state, "arrival");
  assert.equal(result.reward, 30);
  assert.equal(result.progress.freeBoxes, 1);
  state.adventure = result.progress;
  assert.equal(claimAdventureChapter(state, "arrival"), null);
  assert.equal(claimAdventureChapter(state, "footsteps"), null);
  assert.equal(claimAdventureChapter(state, "curiosity"), null);
  state.adventure.memoryWins = 1;
  state.adventure.trailWins = 1;
  assert.equal(claimAdventureChapter(state, "curiosity").reward, 30);
});
test("save validation preserves ownership and excludes invalid equipment; merging cannot resurrect a spent free box", () => {
  const local = {
    ...initialAdventure(),
    chapters: ["arrival"],
    freeBoxesUsed: 1,
    boxesOpened: 1,
    owned: ["fern-litter"],
    equipped: { litter: "fern-litter" },
  };
  const remote = {
    ...initialAdventure(),
    chapters: ["arrival"],
    freeBoxes: 1,
    owned: ["coast-collar"],
    equipped: { collar: "coast-collar" },
  };
  const merged = mergeAdventure(local, remote);
  assert.equal(merged.freeBoxes, 0);
  assert.equal(merged.freeBoxesUsed, 1);
  assert.deepEqual(
    new Set(merged.owned),
    new Set(["fern-litter", "coast-collar"]),
  );
  const saved = normalizeAdventure({
    ...merged,
    owned: [...merged.owned, "invalid"],
    equipped: { sign: "fern-litter", collar: "coast-collar" },
    memoryWins: NaN,
  });
  assert.equal(saved.equipped.sign, undefined);
  assert.equal(saved.equipped.collar, "coast-collar");
  assert.equal(saved.memoryWins, 0);
  assert.deepEqual(
    mergeAdventure(
      { ...local, equipped: {}, equippedAt: 200 },
      { ...remote, equippedAt: 100 },
    ).equipped,
    {},
  );
  assert.deepEqual(
    mergeAdventure(
      { ...local, equippedAt: 100 },
      { ...remote, equippedAt: 200 },
    ).equipped,
    { collar: "coast-collar" },
  );
});
test("memory puzzles have real matching pairs and completion is irreversible", () => {
  for (let level = 0; level < 3; level++) {
    let round = newPuzzle("memory", level, seeded(level + 1));
    const original = round;
    assert.equal(puzzleMove(round, -1), round);
    for (let card = 0; card < round.size; card++) {
      const positions = round.cells
        .map((v, i) => (v === card ? i : -1))
        .filter((i) => i >= 0);
      assert.equal(positions.length, 2);
      round = puzzleMove(round, positions[0]);
      assert.equal(puzzleMove(round, positions[0]), round);
      round = puzzleMove(round, positions[1]);
    }
    assert.equal(round.complete, true);
    assert.equal(round.moves, round.size);
    assert.equal(round.reward, 10 + level * 5);
    assert.equal(puzzleMove(round, 0), round);
    assert.equal(original.complete, false);
  }
});
test("trail generation always offers a reachable home and rejects jumps and obstacles", () => {
  for (let level = 0; level < 3; level++)
    for (let seed = 1; seed <= 100; seed++) {
      let round = newPuzzle("trail", level, seeded(seed));
      assert.equal(puzzleMove(round, round.cells.length - 1), round);
      const queue = [[0]],
        seen = new Set([0]);
      let solution;
      while (queue.length) {
        const path = queue.shift(),
          p = path.at(-1);
        if (p === round.cells.length - 1) {
          solution = path;
          break;
        }
        for (const q of [p - 1, p + 1, p - round.size, p + round.size]) {
          const valid =
            q >= 0 &&
            q < round.cells.length &&
            !round.cells[q] &&
            Math.abs((p % round.size) - (q % round.size)) +
              Math.abs(
                Math.floor(p / round.size) - Math.floor(q / round.size),
              ) ===
              1;
          if (valid && !seen.has(q)) {
            seen.add(q);
            queue.push([...path, q]);
          }
        }
      }
      assert.ok(solution);
      for (const q of solution.slice(1)) round = puzzleMove(round, q);
      assert.equal(round.complete, true);
    }
});
test("account saves preserve story version three and bounded collection progress", async () => {
  let stored;
  const sql = async (strings, ...values) => {
    if (strings[0].includes("INSERT INTO garden_profiles"))
      stored = JSON.parse(values[3]);
    return [];
  };
  const sandbox = {
    module: { exports: {} },
    require(name) {
      if (name === "./_auth")
        return { authenticateGardenRequest: async () => ({ userId: "test" }) };
      if (name === "./_db")
        return { database: () => sql, ensureSchema: async () => {} };
      throw Error(name);
    },
    console,
  };
  vm.runInNewContext(
    readFileSync(new URL("../api/game-profile.js", import.meta.url), "utf8"),
    sandbox,
  );
  const response = {
    setHeader() {},
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await sandbox.module.exports(
    {
      method: "PUT",
      body: {
        state: {
          storyVersion: 3,
          adventure: {
            ...initialAdventure(),
            owned: ["fern-sign"],
            equipped: { sign: "fern-sign", collar: "moon-collar" },
            memoryWins: -10,
            freeBoxesUsed: 1,
            admin: true,
          },
        },
      },
    },
    response,
  );
  assert.equal(response.code, 200);
  assert.equal(stored.storyVersion, 3);
  assert.equal(stored.adventure.equipped.sign, "fern-sign");
  assert.equal(stored.adventure.equipped.collar, undefined);
  assert.equal(stored.adventure.memoryWins, 0);
  assert.equal(stored.adventure.admin, undefined);
});
