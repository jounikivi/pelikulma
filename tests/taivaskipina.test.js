import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  aim,
  step,
  pulse,
  hurtPlayer,
  collect,
  nextSector,
  checkpoint,
  restore,
  SECTORS,
} from "../games/taivaskipina/engine.js";

test("bosses use five distinct attack patterns and saves validate difficulty", () => {
  const patterns = [];
  for (let sector = 0; sector < 5; sector++) {
    const g = createGame();
    g.sector = sector;
    g.bossSpawned = true;
    g.enemies = [
      {
        type: "boss",
        x: 180,
        y: 92,
        hp: 80,
        maxHp: 80,
        r: 37,
        age: 0,
        fire: 0,
        flash: 0,
      },
    ];
    step(g, 0.01);
    patterns.push(g.bullets.map((b) => [Math.round(b.vx), Math.round(b.vy)]));
  }
  assert.deepEqual(
    patterns.map((p) => p.length),
    [5, 5, 10, 8, 12],
  );
  assert.equal(new Set(patterns.map((p) => JSON.stringify(p))).size, 5);
  assert.equal(createGame("__proto__").difficulty, "normal");
  assert.equal(
    restore({ ...checkpoint(createGame()), difficulty: "constructor" }),
    null,
  );
});
test("movement stays on the field and shooting is automatic", () => {
  const g = createGame();
  aim(g, -100, 10000);
  for (let i = 0; i < 100; i++) step(g, 0.02);
  assert.equal(g.player.x, 18);
  assert.equal(g.player.y, 536);
  assert.ok(g.shots.length > 0);
});
test("invulnerability prevents repeated damage; three broken hulls end the flight", () => {
  const g = createGame();
  assert.equal(hurtPlayer(g), false);
  for (let ship = 0; ship < 3; ship++)
    for (let hit = 0; hit < 5; hit++) {
      g.player.invincible = 0;
      assert.equal(hurtPlayer(g), true);
    }
  assert.equal(g.player.lives, 0);
  assert.equal(g.phase, "over");
  assert.equal(hurtPlayer(g), false);
});
test("pulse clears near bullets, keeps distant bullets and has an energy cost", () => {
  const g = createGame();
  g.bullets = [
    { x: 180, y: 450 },
    { x: 0, y: 0 },
  ];
  g.enemies = [{ type: "tank", x: 180, y: 420, hp: 7 }];
  assert.equal(pulse(g), true);
  assert.equal(g.bullets.length, 1);
  assert.equal(g.enemies[0].hp, -1);
  assert.equal(pulse(g), false);
  assert.ok(g.player.invincible >= 1.2);
});
test("weapons and repairs cap; redundant pickups award points", () => {
  const g = createGame();
  for (let i = 0; i < 5; i++) collect(g, { type: "weapon", x: 0, y: 0 });
  assert.equal(g.player.weapon, 3);
  assert.equal(g.score, 600);
  collect(g, { type: "repair", x: 0, y: 0 });
  assert.equal(g.player.hp, 5);
  assert.equal(g.score, 700);
  g.player.hp = 2;
  collect(g, { type: "repair", x: 0, y: 0 });
  assert.equal(g.player.hp, 3);
});
test("checkpoint is a stage-start snapshot and rejects corrupt data", () => {
  const g = createGame("hard");
  g.sector = 3;
  g.score = 5000;
  g.player.weapon = 3;
  const data = checkpoint(g),
    loaded = restore(JSON.parse(JSON.stringify(data)));
  assert.equal(loaded.sector, 3);
  assert.equal(loaded.sectorTime, 0);
  assert.equal(loaded.player.weapon, 3);
  assert.equal(loaded.score, 5000);
  assert.equal(restore({ ...data, lives: -1 }), null);
  assert.equal(restore({ ...data, sector: 99 }), null);
  assert.equal(restore({ ...data, charge: NaN }), null);
});
test("pulse timers and campaign do not advance outside play", () => {
  const g = createGame();
  g.phase = "clear";
  const old = structuredClone(g);
  step(g, 0.2);
  assert.deepEqual(g, old);
  assert.equal(pulse(g), false);
});
test("five complete sectors, wave encounters and boss fights can reach the ending", () => {
  const g = createGame("easy", 42);
  let frames = 0,
    cleared = 0,
    bosses = 0;
  // Invulnerable fixture isolates campaign and weapon progression from pilot skill.
  while (frames++ < 50000 && g.phase !== "win") {
    g.player.invincible = 100;
    const target =
      g.enemies.find((e) => e.type === "boss") ||
      g.enemies.find((e) => e.y > 0);
    if (target) aim(g, target.x, 460);
    step(g, 0.04);
    if (g.bossSpawned) bosses |= 1 << g.sector;
    if (g.phase === "clear") {
      cleared++;
      assert.equal(nextSector(g), true);
    }
    assert.ok(g.bullets.length <= 320);
    assert.ok(Number.isFinite(g.player.x));
  }
  assert.equal(g.phase, "win");
  assert.equal(g.sector, SECTORS.length - 1);
  assert.equal(cleared, 4);
  assert.equal(bosses, 31);
  assert.ok(g.score > 10000);
  assert.equal(nextSector(g), false);
});
