import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  aim,
  step,
  pulse,
  roll,
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
    for (let hit = 0; hit < g.player.maxHp; hit++) {
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
  assert.equal(g.player.hp, 1);
  assert.equal(g.score, 700);
  g.player.hp = 0;
  collect(g, { type: "repair", x: 0, y: 0 });
  assert.equal(g.player.hp, 1);
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

test("three rolls protect immediately, keep bullets, expire and reset per sector", () => {
  const g = createGame();
  g.player.invincible = 0;
  g.bullets = [{ x: 180, y: 100, vx: 0, vy: 10, r: 3 }];
  for (let i = 0; i < 3; i++) {
    assert.equal(roll(g), true);
    assert.equal(hurtPlayer(g), false);
    assert.equal(roll(g), false);
    for (let t = 0; t < 4; t++) step(g, 0.25);
  }
  assert.equal(g.player.rolls, 0);
  assert.equal(roll(g), false);
  assert.ok(g.bullets.length > 0);
  g.phase = "clear";
  nextSector(g);
  assert.equal(g.player.rolls, 3);
});
test("powerups create a seven-shot firewall and survive checkpoint restore", () => {
  const g = createGame();
  for (const type of ["weapon", "weapon", "rapid", "spread", "wing"])
    collect(g, { type, x: 180, y: 460 });
  step(g, 0.01);
  assert.equal(g.shots.length, 7);
  assert.equal(g.player.wingmen, 2);
  const loaded = restore(checkpoint(g));
  assert.equal(loaded.player.spread, true);
  assert.equal(loaded.player.rapid, true);
  assert.equal(loaded.player.wingmen, 2);
  g.player.invincible = 0;
  hurtPlayer(g);
  assert.equal(g.player.lives, 2);
  assert.equal(g.player.wingmen, 0);
  assert.equal(g.player.weapon, 2);
});
test("missed formations return from below exactly once", () => {
  const g = createGame();
  for (let t = 0; t < 9; t++) step(g, 0.25);
  const enemy = g.enemies.find((e) => e.type === "scout");
  enemy.y = 590;
  step(g, 0.01);
  assert.equal(enemy.pass, 1);
  assert.ok(enemy.speed < 0);
  assert.ok(g.enemies.includes(enemy));
  enemy.y = -45;
  step(g, 0.01);
  assert.equal(g.enemies.includes(enemy), false);
  assert.equal(g.escaped, 1);
});
test("legacy saves migrate and normal flight uses one-hit ships", () => {
  const g = createGame();
  g.player.invincible = 0;
  hurtPlayer(g);
  assert.equal(g.player.lives, 2);
  assert.equal(g.player.hp, 1);
  const legacy = {
    version: 1,
    difficulty: "normal",
    sector: 2,
    score: 1000,
    hp: 5,
    lives: 2,
    weapon: 2,
    charge: 50,
  };
  const loaded = restore(legacy);
  assert.equal(loaded.player.hp, 1);
  assert.equal(loaded.player.rolls, 3);
  assert.equal(loaded.sector, 2);
  const easy = createGame("easy");
  assert.equal(easy.player.maxHp, 3);
});
test("formations repeat consistently and stay within the lower-half flight envelope", () => {
  const a = createGame("normal", 1),
    b = createGame("normal", 99);
  for (let i = 0; i < 300; i++) {
    a.player.invincible = 100;
    b.player.invincible = 100;
    step(a, 0.04);
    step(b, 0.04);
  }
  assert.deepEqual(a.enemies, b.enemies);
  aim(a, 180, 0);
  assert.equal(a.player.ty, 269);
});

test("heavy aircraft drop equipment and only complete formations earn the bonus", () => {
  for (const escaped of [0, 1]) {
    const g = createGame();
    g.wave = 4;
    g.bossSpawned = true;
    g.formations[0] = { count: 1 + escaped, kills: 0, escaped };
    g.enemies = [
      {
        type: "tank",
        x: 180,
        y: 400,
        hp: 1,
        r: 17,
        age: 0,
        fire: 99,
        speed: 0,
        flash: 0,
        waveId: 0,
      },
    ];
    step(g, 0.2);
    assert.equal(g.pickups.length, 1);
    assert.equal(g.pickups[0].type, "weapon");
    assert.equal(g.score, escaped ? 200 : 500);
  }
});

test("returning planes wait below the field before re-entering", () => {
  const g = createGame();
  step(g, 0.25);
  g.wave = 4; g.bossSpawned = true;
  const e = { type: "scout", x: 80, baseX: 80, y: 589, hp: 2, r: 12,
    pass: 0, speed: 90, age: 0, fire: 0, flash: 0 };
  g.enemies = [e];
  step(g, 0.01);
  assert.equal(e.y, 588);
  assert.ok(e.returnWait > 0.88 && e.returnWait <= 0.9);
  step(g, 0.25); step(g, 0.25);
  assert.equal(e.y, 588);
  step(g, 0.25); step(g, 0.25);
  assert.ok(e.y < 588);
});

test("enemy fire respects arrival and close-range safety", () => {
  for (const [type, y, expected] of [["scout", 410, 0], ["boss", 20, 0], ["scout", 150, 1]]) {
    const g = createGame();
    g.wave = 4; g.bossSpawned = true;
    g.enemies = [{ type, x: 180, y, baseX: 180, hp: 20, maxHp: 20,
      r: 12, age: 0, fire: 0, flash: 0, speed: 0 }];
    step(g, 0.01);
    assert.equal(g.bullets.length, expected);
    if (type === "scout" && y === 410) {
      g.enemies[0].y = 200;
      step(g, 0.2);
      assert.equal(g.bullets.length, 0);
      step(g, 0.25);
      assert.equal(g.bullets.length, 1);
    }
  }
});

test("boss arrival gives a warning before creating a live target", () => {
  const g = createGame();
  g.wave = 4; g.nextWave = 0;
  step(g, 0.1);
  assert.ok(g.bossWarning > 0);
  assert.equal(g.bossSpawned, false);
  for (let i = 0; i < 8; i++) step(g, 0.25);
  assert.equal(g.bossSpawned, true);
  assert.equal(g.bossWarning, 0);
  assert.equal(g.enemies.filter(e => e.type === "boss").length, 1);
});

test("debrief awards bonuses once, scales difficulty and resets per sector", () => {
  for (const difficulty of ["normal", "hard"]) {
    const g = createGame(difficulty);
    g.wave = 4; g.bossSpawned = true;
    g.stats = { targets: 20, downed: 15, hits: 0 };
    g.enemies = [{ type: "boss", x: 180, y: 100, hp: 0, age: 0 }];
    step(g, 0.01);
    assert.equal(g.phase, "clear");
    assert.equal(g.debrief.percent, 75);
    assert.equal(g.debrief.total, difficulty === "hard" ? 3445 : 2650);
    const score = g.score;
    step(g, 0.25);
    assert.equal(g.score, score);
    nextSector(g);
    assert.deepEqual(g.stats, { targets: 0, downed: 0, hits: 0 });
    assert.equal(g.debrief, null);
  }
});

test("taking a hit removes the clean-flight bonus even after a repair", () => {
  const g = createGame("easy");
  g.player.invincible = 0;
  hurtPlayer(g);
  collect(g, { type: "repair", x: 180, y: 460 });
  g.enemies = [{ type: "boss", x: 180, y: 100, hp: 0, age: 0 }];
  step(g, 0.01);
  assert.equal(g.debrief.hits, 1);
  assert.equal(g.debrief.bonus.clean, 0);
});
