import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceSnake,
  wouldHitSelf,
  bonusDue,
} from "../games/mato/mato-rules.js";

const straight = (length) =>
  Array.from({ length }, (_, index) => ({ x: 15 - index, y: 8 }));

test("a normal move frees the old tail; eating food keeps it occupied", () => {
  const loop = [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 2 },
  ];
  const next = { x: 3, y: 2 };
  assert.equal(wouldHitSelf(loop, next, false), false);
  assert.equal(wouldHitSelf(loop, next, true), true);
  assert.deepEqual(advanceSnake(loop, next), [next, ...loop.slice(0, -1)]);
});

test("food grows the snake once without mutating the previous frame", () => {
  const snake = straight(7);
  const original = structuredClone(snake);
  const next = { x: 16, y: 8 };
  const grown = advanceSnake(snake, next, { grow: true });
  assert.equal(grown.length, 8);
  assert.deepEqual(grown[0], next);
  assert.deepEqual(snake, original);
});

test("a cutting fruit moves the head and removes exactly four tail cells", () => {
  const snake = straight(12);
  const next = { x: 16, y: 8 };
  const cut = advanceSnake(snake, next, { cut: 4 });
  assert.equal(cut.length, 8);
  assert.deepEqual(cut, [next, ...snake.slice(0, 7)]);
  assert.equal(snake.length, 12);
});

test("repeated cutting fruits keep at least four cells and do not allow body collisions", () => {
  let snake = straight(6);
  snake = advanceSnake(snake, { x: 16, y: 8 }, { cut: 4 });
  snake = advanceSnake(snake, { x: 17, y: 8 }, { cut: 4 });
  assert.equal(snake.length, 4);
  assert.equal(wouldHitSelf(snake, snake[1]), true);
  assert.deepEqual(snake[0], { x: 17, y: 8 });
});

test("the twist bonus arrives every fifth fruit; legacy modes retain their interval", () => {
  for (const fruits of [0, 1, 4, 6, 9])
    assert.equal(bonusDue("twist", fruits), false);
  for (const fruits of [5, 10, 15])
    assert.equal(bonusDue("twist", fruits), true);
  assert.equal(bonusDue("classic", 30), false);
  for (const mode of ["arcade", "maze", "time"]) {
    assert.equal(bonusDue(mode, 5), false);
    assert.equal(bonusDue(mode, 6), true);
  }
});
