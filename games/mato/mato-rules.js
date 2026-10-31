// Pure grid rules shared by the game and regression tests.
export function wouldHitSelf(snake, next, grow = false) {
  const body = grow ? snake : snake.slice(0, -1);
  return body.some((cell) => cell.x === next.x && cell.y === next.y);
}

export function advanceSnake(snake, next, { grow = false, cut = 0 } = {}) {
  const moved = [next, ...snake];
  if (!grow) moved.pop();
  if (cut > 0) return moved.slice(0, Math.max(4, moved.length - cut));
  return moved;
}

export function bonusDue(mode, fruits) {
  if (mode === "classic" || fruits <= 0) return false;
  return fruits % (mode === "twist" ? 5 : 6) === 0;
}
