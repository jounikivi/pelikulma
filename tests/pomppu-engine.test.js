import test from "node:test";
import assert from "node:assert/strict";
import {
  W,
  H,
  LEVELS,
  createGame,
  aim,
  launch,
  armSpark,
  nextLevel,
  step,
  circleHitsRect,
} from "../games/pomppu/pomppu-engine.js";

test("ready ball follows the paddle; launch only happens once", () => {
  const game = createGame();
  aim(game, -100);
  step(game, 0.25);
  assert.equal(game.paddleX, 43);
  assert.equal(game.ball.x, 43);
  assert.equal(launch(game), true);
  assert.equal(launch(game), false);
  assert.ok(game.ball.vy < 0);
  assert.equal(game.lives, 3);
});
test("circle collision does not count a near miss at a brick corner", () => {
  const brick = { x: 20, y: 20, w: 40, h: 18 };
  assert.equal(circleHitsRect({ x: 17, y: 17, r: 4 }, brick), false);
  assert.equal(circleHitsRect({ x: 20, y: 17, r: 4 }, brick), true);
});
test("substeps stop a fast ball from tunneling through a thin brick", () => {
  const game = createGame();
  launch(game);
  const brick = game.bricks[0];
  game.bricks = [
    brick,
    { x: 300, y: 300, w: 20, h: 10, hp: 1, maxHp: 1, row: 0 },
  ];
  game.ball = { x: brick.x + 24, y: brick.y + 60, r: 5, vx: 0, vy: -420 };
  const events = step(game, 0.2);
  assert.equal(brick.hp, 0);
  assert.equal(game.score, 10);
  assert.equal(game.charge, 20);
  assert.ok(events.some((e) => e.type === "brick"));
  assert.ok(game.ball.vy > 0);
});
test("armor takes separate normal hits and charges once per hit", () => {
  const game = createGame();
  launch(game);
  const brick = { x: 140, y: 100, w: 48, h: 18, hp: 2, maxHp: 2, row: 0 };
  game.bricks = [
    brick,
    { x: 10, y: 40, w: 20, h: 10, hp: 1, maxHp: 1, row: 0 },
  ];
  const shot = () => {
    game.ball = { x: 164, y: 140, r: 5, vx: 0, vy: -300 };
    step(game, 0.12);
  };
  shot();
  assert.equal(brick.hp, 1);
  assert.equal(game.score, 5);
  assert.equal(game.charge, 20);
  shot();
  assert.equal(brick.hp, 0);
  assert.equal(game.score, 25);
  assert.equal(game.charge, 40);
});
test("spark reserves a full charge and activates on the next paddle hit", () => {
  const game = createGame();
  launch(game);
  assert.equal(armSpark(game), false);
  game.charge = 100;
  assert.equal(armSpark(game), true);
  assert.equal(game.charge, 0);
  assert.equal(game.power, 0);
  assert.equal(armSpark(game), false);
  game.ball = { x: game.paddleX, y: game.paddleY - 12, r: 5, vx: 0, vy: 280 };
  const events = step(game, 0.04);
  assert.ok(events.some((e) => e.type === "spark"));
  assert.equal(game.armed, false);
  assert.ok(game.power > 5.9);
  assert.ok(game.ball.vy < 0);
});
test("powered ball destroys armor and continues in the same direction", () => {
  const game = createGame();
  launch(game);
  game.power = 6;
  const brick = { x: 140, y: 100, w: 48, h: 18, hp: 2, maxHp: 2, row: 0 };
  game.bricks = [
    brick,
    { x: 10, y: 40, w: 20, h: 10, hp: 1, maxHp: 1, row: 0 },
  ];
  game.ball = { x: 164, y: 140, r: 5, vx: 0, vy: -300 };
  step(game, 0.12);
  assert.equal(brick.hp, 0);
  assert.ok(game.ball.vy < 0);
  assert.equal(game.score, 20);
});
test("each lost ball costs one life and the third loss ends the game", () => {
  const game = createGame();
  for (let remaining = 2; remaining >= 0; remaining--) {
    launch(game);
    game.ball.y = H + 10;
    game.ball.vy = 100;
    step(game, 0.02);
    assert.equal(game.lives, remaining);
    assert.equal(game.phase, remaining ? "ready" : "over");
  }
  assert.equal(launch(game), false);
});
test("all six stages clear in order and victory cannot load a seventh stage", () => {
  const game = createGame();
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(game.level, i);
    assert.ok(game.bricks.length > 0);
    launch(game);
    game.bricks.forEach((brick) => (brick.hp = 0));
    step(game, 0.01);
    assert.equal(game.phase, i === LEVELS.length - 1 ? "win" : "level");
    assert.equal(nextLevel(game), i < LEVELS.length - 1);
  }
  assert.equal(game.score, 600);
  assert.equal(game.lives, 3);
});
test("walls preserve finite velocity and frozen phases do not advance timers", () => {
  const game = createGame();
  launch(game);
  game.ball.x = W - 3;
  game.ball.vx = 300;
  step(game, 0.02);
  assert.ok(game.ball.vx < 0);
  assert.ok(Number.isFinite(game.ball.y));
  game.phase = "level";
  game.power = 4;
  const original = { ...game.ball };
  step(game, 0.1);
  assert.equal(game.power, 4);
  assert.deepEqual(game.ball, original);
});

test("a reserved spark survives advancing to the next stage", () => {
  const game = createGame();
  game.charge = 100;
  armSpark(game);
  game.phase = "level";
  nextLevel(game);
  assert.equal(game.armed, true);
  assert.equal(game.charge, 0);
  assert.equal(game.phase, "ready");
});

test("normal and compact courts can be completed using only paddle and spark controls", () => {
  for (const height of [360, 540]) {
    const game = createGame({ height });
    let frames = 0;
    while (frames++ < 240000 && !["win", "over"].includes(game.phase)) {
      if (game.phase === "ready") launch(game);
      if (game.phase === "level") nextLevel(game);
      aim(game, game.ball.x + Math.sin(frames / 80) * 22);
      if (game.charge === 100) armSpark(game);
      step(game, 1 / 120);
      if (!Number.isFinite(game.ball.x) || !Number.isFinite(game.ball.vy))
        assert.fail("Non-finite ball state");
    }
    assert.equal(game.phase, "win", `Court height ${height}`);
    assert.equal(game.level, 5);
    assert.ok(game.lives > 0);
    assert.ok(game.score > 600);
  }
});
