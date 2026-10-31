export const W = 360;
export const H = 540;
export const LEVELS = [
  ["111111", "111111", "111111", "111111"],
  ["110011", "121121", "011110", "112211", "110011"],
  ["001100", "012210", "122221", "012210", "001100"],
  ["211112", "101101", "212212", "011110", "121121"],
  ["222222", "100001", "121121", "012210", "111111", "101101"],
  ["221122", "122221", "212212", "122221", "221122", "011110"],
];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function circleHitsRect(ball, rect) {
  const x = clamp(ball.x, rect.x, rect.x + rect.w);
  const y = clamp(ball.y, rect.y, rect.y + rect.h);
  return (ball.x - x) ** 2 + (ball.y - y) ** 2 <= ball.r ** 2;
}

function attachBall(game) {
  game.ball = { x: game.paddleX, y: game.paddleY - 8, r: 5, vx: 0, vy: 0 };
  game.armed = false;
  game.power = 0;
}

function loadLevel(game) {
  game.bricks = [];
  LEVELS[game.level].forEach((row, y) =>
    [...row].forEach((value, x) => {
      if (value === "0") return;
      const hp = Number(value);
      game.bricks.push({
        x: 21 + x * 54,
        y: 64 + y * 25,
        w: 48,
        h: 18,
        hp,
        maxHp: hp,
        row: y,
      });
    }),
  );
  game.phase = "ready";
  game.paddleX = W / 2;
  game.targetX = W / 2;
  attachBall(game);
}

export function createGame({ height = H } = {}) {
  const courtHeight = clamp(Number.isFinite(height) ? height : H, 360, 640);
  const game = {
    height: courtHeight,
    speedScale: Math.sqrt(courtHeight / H),
    level: 0,
    score: 0,
    lives: 3,
    paddleX: W / 2,
    targetX: W / 2,
    paddleW: 76,
    paddleY: courtHeight - 42,
    charge: 0,
    armed: false,
    power: 0,
    phase: "ready",
    bricks: [],
    ball: null,
  };
  loadLevel(game);
  return game;
}

export function aim(game, x) {
  if (!Number.isFinite(x)) return;
  game.targetX = clamp(x, game.paddleW / 2 + 5, W - game.paddleW / 2 - 5);
}

export function launch(game) {
  if (game.phase !== "ready") return false;
  const speed = (265 + game.level * 14) * game.speedScale;
  game.ball.vx = speed * 0.38;
  game.ball.vy = -Math.sqrt(speed ** 2 - game.ball.vx ** 2);
  game.phase = "play";
  return true;
}

export function armSpark(game) {
  if (
    !["ready", "play"].includes(game.phase) ||
    game.charge < 100 ||
    game.armed ||
    game.power > 0
  )
    return false;
  game.charge = 0;
  game.armed = true;
  return true;
}

export function nextLevel(game) {
  if (game.phase !== "level") return false;
  const armed = game.armed;
  game.level++;
  loadLevel(game);
  game.armed = armed;
  return true;
}

// Small physics steps prevent a fast ball from passing through thin bricks.
export function step(game, dt) {
  const events = [];
  if (
    !["ready", "play"].includes(game.phase) ||
    !Number.isFinite(dt) ||
    dt <= 0
  )
    return events;
  const duration = Math.min(dt, 0.25);
  const steps = Math.max(1, Math.ceil(duration * 180));
  const delta = duration / steps;
  for (let n = 0; n < steps; n++) {
    const distance = game.targetX - game.paddleX;
    game.paddleX += clamp(distance, -900 * delta, 900 * delta);
    if (game.phase === "ready") {
      game.ball.x = game.paddleX;
      game.ball.y = game.paddleY - 8;
      continue;
    }
    game.power = Math.max(0, game.power - delta);
    const ball = game.ball,
      previous = { x: ball.x, y: ball.y };
    ball.x += ball.vx * delta;
    ball.y += ball.vy * delta;
    if (ball.x < ball.r) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      events.push({ type: "wall" });
    }
    if (ball.x > W - ball.r) {
      ball.x = W - ball.r;
      ball.vx = -Math.abs(ball.vx);
      events.push({ type: "wall" });
    }
    if (ball.y < ball.r) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      events.push({ type: "wall" });
    }

    if (
      ball.vy > 0 &&
      previous.y + ball.r <= game.paddleY &&
      ball.y + ball.r >= game.paddleY &&
      ball.x + ball.r >= game.paddleX - game.paddleW / 2 &&
      ball.x - ball.r <= game.paddleX + game.paddleW / 2
    ) {
      ball.y = game.paddleY - ball.r;
      const angle =
        clamp((ball.x - game.paddleX) / (game.paddleW / 2), -1, 1) * 1.02;
      const speed = clamp(
        Math.hypot(ball.vx, ball.vy),
        265 * game.speedScale,
        440 * game.speedScale,
      );
      ball.vx = Math.sin(angle) * speed;
      if (Math.abs(ball.vx) < 25) ball.vx = 25 * (ball.vx < 0 ? -1 : 1);
      ball.vy = -Math.sqrt(speed ** 2 - ball.vx ** 2);
      if (game.armed) {
        game.armed = false;
        game.power = 6;
        events.push({ type: "spark" });
      }
      events.push({ type: "paddle", x: ball.x, y: ball.y });
    }

    for (const brick of game.bricks) {
      if (brick.hp <= 0 || !circleHitsRect(ball, brick)) continue;
      const piercing = game.power > 0;
      brick.hp = piercing ? 0 : brick.hp - 1;
      game.score += brick.hp === 0 ? brick.maxHp * 10 : 5;
      game.charge = Math.min(100, game.charge + 20);
      events.push({
        type: "brick",
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        row: brick.row,
        broken: brick.hp === 0,
      });
      if (!piercing) {
        if (previous.x + ball.r <= brick.x) {
          ball.x = brick.x - ball.r - 0.01;
          ball.vx = -Math.abs(ball.vx);
        } else if (previous.x - ball.r >= brick.x + brick.w) {
          ball.x = brick.x + brick.w + ball.r + 0.01;
          ball.vx = Math.abs(ball.vx);
        } else if (previous.y < brick.y) {
          ball.y = brick.y - ball.r - 0.01;
          ball.vy = -Math.abs(ball.vy);
        } else {
          ball.y = brick.y + brick.h + ball.r + 0.01;
          ball.vy = Math.abs(ball.vy);
        }
        const speed = Math.hypot(ball.vx, ball.vy),
          f =
            Math.min(440 * game.speedScale, speed + 3 * game.speedScale) /
            speed;
        ball.vx *= f;
        ball.vy *= f;
        break;
      }
    }
    if (game.bricks.every((brick) => brick.hp === 0)) {
      game.phase = game.level === LEVELS.length - 1 ? "win" : "level";
      game.score += 100;
      events.push({ type: game.phase });
      break;
    }
    if (ball.y - ball.r > game.height) {
      game.lives--;
      events.push({ type: "lost" });
      if (game.lives === 0) {
        game.phase = "over";
        game.power = 0;
        game.armed = false;
      } else {
        game.phase = "ready";
        attachBall(game);
      }
      break;
    }
  }
  return events;
}
