export const W = 360,
  H = 560;
export const SECTORS = [
  {
    name: "Smaragdisalmi",
    sea: "#164c59",
    land: "#577b60",
    boss: "SALMEN VARTIJA",
  },
  {
    name: "Kuparisaaret",
    sea: "#34485d",
    land: "#b0785b",
    boss: "KUPARIKILPI",
  },
  { name: "Hohdemeri", sea: "#293b67", land: "#81648b", boss: "PRISMA" },
  { name: "Myrskyvyö", sea: "#273a4b", land: "#647d80", boss: "UKKOSKEHRÄ" },
  {
    name: "Taivaan portti",
    sea: "#3a3059",
    land: "#a88a72",
    boss: "MYRSKYSYDÄN",
  },
];
export const DIFFICULTIES = {
  easy: { label: "Rento", bullet: 0.78, fire: 1.25, score: 0.8 },
  normal: { label: "Normaali", bullet: 1, fire: 1, score: 1 },
  hard: { label: "Haaste", bullet: 1.18, fire: 0.8, score: 1.3 },
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const touches = (a, b, r) => Math.hypot(a.x - b.x, a.y - b.y) < r;
export function createGame(difficulty = "normal", seed = 731) {
  const g = {
    difficulty: Object.hasOwn(DIFFICULTIES, difficulty) ? difficulty : "normal",
    seed: seed >>> 0,
    phase: "play",
    sector: 0,
    time: 0,
    sectorTime: 0,
    wave: 0,
    nextWave: 2,
    bossSpawned: false,
    enemies: [],
    shots: [],
    bullets: [],
    pickups: [],
    effects: [],
    player: {
      x: 180,
      y: 460,
      tx: 180,
      ty: 460,
      hp: 5,
      lives: 3,
      weapon: 1,
      invincible: 2,
      fire: 0,
    },
    charge: 100,
    score: 0,
    kills: 0,
    pulses: 0,
    scroll: 0,
  };
  return g;
}
function random(g) {
  g.seed = (Math.imul(g.seed, 1664525) + 1013904223) >>> 0;
  return g.seed / 4294967296;
}
export function aim(g, x, y) {
  if (Number.isFinite(x) && Number.isFinite(y)) {
    g.player.tx = clamp(x, 18, W - 18);
    g.player.ty = clamp(y, 110, H - 24);
  }
}
function award(g, points) {
  g.score += Math.round(points * DIFFICULTIES[g.difficulty].score);
}
function damageEnemy(g, e, amount) {
  if (e.hp <= 0) return;
  e.hp -= amount;
  e.flash = 0.07;
  if (e.hp > 0) return;
  g.effects.push({
    type: "burst",
    x: e.x,
    y: e.y,
    life: 0.5,
    boss: e.type === "boss",
  });
  g.kills++;
  g.charge = Math.min(100, g.charge + 10);
  award(
    g,
    e.type === "boss"
      ? 1200
      : e.type === "tank"
        ? 200
        : e.type === "weaver"
          ? 120
          : 80,
  );
  if (e.type !== "boss" && g.kills % 5 === 0) {
    const cycle = Math.floor(g.kills / 5) % 3;
    g.pickups.push({
      x: e.x,
      y: e.y,
      type: cycle === 1 ? "weapon" : cycle === 2 ? "repair" : "energy",
    });
  }
}
export function pulse(g) {
  if (g.phase !== "play" || g.charge < 100) return false;
  g.charge = 0;
  g.pulses++;
  g.player.invincible = Math.max(g.player.invincible, 1.2);
  const p = g.player;
  g.bullets = g.bullets.filter((b) => Math.hypot(b.x - p.x, b.y - p.y) > 190);
  for (const e of g.enemies)
    if (Math.hypot(e.x - p.x, e.y - p.y) < 190)
      damageEnemy(g, e, e.type === "boss" ? 14 : 8);
  g.effects.push({ type: "pulse", x: p.x, y: p.y, life: 0.65 });
  return true;
}
export function hurtPlayer(g) {
  const p = g.player;
  if (g.phase !== "play" || p.invincible > 0) return false;
  p.hp--;
  p.invincible = 1.6;
  g.effects.push({ type: "hit", x: p.x, y: p.y, life: 0.35 });
  if (p.hp <= 0) {
    p.lives--;
    g.bullets = [];
    g.effects.push({ type: "lost", x: p.x, y: p.y, life: 0.6 });
    if (p.lives <= 0) g.phase = "over";
    else {
      p.hp = 5;
      p.weapon = Math.max(1, p.weapon - 1);
      p.x = 180;
      p.y = 460;
      p.tx = 180;
      p.ty = 460;
      p.invincible = 3;
    }
  }
  return true;
}
function spawnWave(g) {
  const count = 5 + Math.min(3, g.sector) + (g.wave % 2);
  for (let i = 0; i < count; i++) {
    const type =
      g.wave % 3 === 2 && i % 2 === 0
        ? "tank"
        : g.wave % 3 === 1
          ? "weaver"
          : "scout";
    const x = 35 + i * (290 / Math.max(1, count - 1));
    g.enemies.push({
      type,
      x,
      y: -28 - i * 23,
      baseX: x,
      hp: type === "tank" ? 7 : type === "weaver" ? 3 : 2,
      r: type === "tank" ? 17 : 12,
      age: 0,
      fire: 1 + i * 0.18 + random(g) * 0.4,
      speed: type === "tank" ? 43 : 65 + g.sector * 6,
      flash: 0,
    });
  }
  g.wave++;
  g.nextWave = g.sectorTime + 7;
}
export function checkpoint(g) {
  const p = g.player;
  return {
    version: 1,
    difficulty: g.difficulty,
    sector: g.sector,
    score: g.score,
    hp: p.hp,
    lives: p.lives,
    weapon: p.weapon,
    charge: g.charge,
  };
}
export function restore(data) {
  if (
    !data ||
    data.version !== 1 ||
    !Object.hasOwn(DIFFICULTIES, data.difficulty)
  )
    return null;
  for (const [key, min, max] of [
    ["sector", 0, 4],
    ["score", 0, 10000000],
    ["hp", 1, 5],
    ["lives", 1, 3],
    ["weapon", 1, 3],
  ])
    if (!Number.isInteger(data[key]) || data[key] < min || data[key] > max)
      return null;
  if (!Number.isFinite(data.charge) || data.charge < 0 || data.charge > 100)
    return null;
  const g = createGame(data.difficulty);
  g.sector = data.sector;
  g.score = data.score;
  g.charge = data.charge;
  Object.assign(g.player, {
    hp: data.hp,
    lives: data.lives,
    weapon: data.weapon,
  });
  return g;
}
function shootEnemy(g, e) {
  const speed = (108 + g.sector * 9) * DIFFICULTIES[g.difficulty].bullet;
  const base = Math.atan2(g.player.y - e.y, g.player.x - e.x);
  const add = (angle, velocity = speed) =>
    g.bullets.push({
      x: e.x,
      y: e.y + 8,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      r: e.type === "boss" ? 4 : 3,
    });
  if (e.type === "boss") {
    const angry = e.hp < e.maxHp * 0.5;
    if (g.sector === 0)
      for (let i = -2; i <= 2; i++)
        add(Math.PI / 2 + i * 0.26 + Math.sin(e.age) * 0.2);
    if (g.sector === 1)
      for (let i = -2; i <= 2; i++) add(base + i * 0.14, speed * 1.12);
    if (g.sector === 2)
      for (let i = 0; i < 10; i++)
        add(e.age * 0.75 + (i * Math.PI) / 5, speed * 0.9);
    if (g.sector === 3) {
      for (let i = -3; i <= 3; i++)
        add(Math.PI / 2 + i * 0.23 + Math.sin(e.age * 1.7) * 0.35);
      add(base, speed * 1.3);
    }
    if (g.sector === 4) {
      for (let i = -4; i <= 4; i++) add(Math.PI / 2 + i * 0.2);
      for (let i = -1; i <= 1; i++) add(base + i * 0.12, speed * 1.2);
    }
    if (angry) for (let i = -1; i <= 1; i++) add(base + i * 0.18, speed * 1.15);
  } else if (e.type === "tank")
    for (let i = -1; i <= 1; i++) add(base + i * 0.2);
  else add(e.type === "scout" ? Math.PI / 2 : base);
}
export function nextSector(g) {
  if (g.phase !== "clear") return false;
  g.sector++;
  g.sectorTime = 0;
  g.wave = 0;
  g.nextWave = 2;
  g.bossSpawned = false;
  g.enemies = [];
  g.bullets = [];
  g.shots = [];
  g.pickups = [];
  const p = g.player;
  p.hp = Math.min(5, p.hp + 1);
  p.weapon = Math.min(3, p.weapon + 1);
  p.invincible = 3;
  p.x = 180;
  p.y = 460;
  p.tx = 180;
  p.ty = 460;
  g.phase = "play";
  return true;
}
export function collect(g, item) {
  const p = g.player;
  if (item.type === "weapon") {
    if (p.weapon < 3) p.weapon++;
    else award(g, 200);
  } else if (item.type === "repair") {
    if (p.hp < 5) p.hp++;
    else award(g, 100);
  } else g.charge = Math.min(100, g.charge + 40);
  g.effects.push({ type: "pickup", x: item.x, y: item.y, life: 0.4 });
}
export function step(g, dt) {
  if (g.phase !== "play" || !Number.isFinite(dt) || dt <= 0) return;
  const n = Math.ceil(Math.min(dt, 0.25) * 120),
    d = Math.min(dt, 0.25) / n;
  for (let k = 0; k < n && g.phase === "play"; k++) tick(g, d);
}
function tick(g, dt) {
  g.time += dt;
  g.sectorTime += dt;
  g.scroll += dt * (32 + g.sector * 4);
  g.charge = Math.min(100, g.charge + 7 * dt);
  g.effects.forEach((e) => (e.life -= dt));
  g.effects = g.effects.filter((e) => e.life > 0).slice(-70);
  const p = g.player,
    dx = p.tx - p.x,
    dy = p.ty - p.y,
    distance = Math.hypot(dx, dy),
    travel = Math.min(distance, 390 * dt);
  if (distance > 0) {
    p.x += (dx / distance) * travel;
    p.y += (dy / distance) * travel;
  }
  p.invincible = Math.max(0, p.invincible - dt);
  p.fire -= dt;
  if (p.fire <= 0) {
    p.fire = 0.14;
    const lanes =
      p.weapon === 1 ? [0] : p.weapon === 2 ? [-6, 6] : [-10, 0, 10];
    for (const offset of lanes)
      g.shots.push({
        x: p.x + offset,
        y: p.y - 15,
        vx: p.weapon === 3 ? offset * 3 : 0,
        vy: -470,
      });
  }
  if (g.wave < 4 && g.sectorTime >= g.nextWave) spawnWave(g);
  if (
    g.wave === 4 &&
    !g.bossSpawned &&
    g.sectorTime > g.nextWave &&
    g.enemies.length === 0
  ) {
    const hp = 80 + g.sector * 28;
    g.enemies.push({
      type: "boss",
      x: 180,
      y: -60,
      baseX: 180,
      hp,
      maxHp: hp,
      r: 37,
      age: 0,
      fire: 2,
      flash: 0,
      speed: 0,
    });
    g.bossSpawned = true;
  }
  for (const e of g.enemies) {
    e.age += dt;
    e.flash = Math.max(0, e.flash - dt);
    if (e.type === "boss") {
      e.y = Math.min(92, e.y + 45 * dt);
      e.x = 180 + Math.sin(e.age * 0.65) * (90 + g.sector * 5);
    } else {
      e.y += e.speed * dt;
      if (e.type === "weaver")
        e.x = clamp(e.baseX + Math.sin(e.age * 2) * 35, 18, W - 18);
    }
    e.fire -= dt;
    if (e.fire <= 0 && e.y > 12 && e.y < 440) {
      shootEnemy(g, e);
      e.fire =
        (e.type === "boss" ? 0.9 : e.type === "tank" ? 1.7 : 2.2) *
        DIFFICULTIES[g.difficulty].fire;
    }
    if (e.hp > 0 && touches(p, e, e.r + 7)) hurtPlayer(g);
  }
  for (const s of g.shots) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    for (const e of g.enemies)
      if (e.hp > 0 && s.y > 0 && touches(s, e, e.r + 4)) {
        damageEnemy(g, e, 1);
        s.y = -100;
        break;
      }
  }
  g.shots = g.shots.filter((s) => s.y > -20);
  for (const b of g.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (touches(p, b, b.r + 5)) {
      if (hurtPlayer(g)) b.y = H + 40;
    }
  }
  g.bullets = g.bullets
    .filter((b) => b.y < H + 20 && b.y > -25 && b.x > -20 && b.x < W + 20)
    .slice(-320);
  for (const item of g.pickups) {
    item.y += 55 * dt;
    if (touches(p, item, 20)) {
      collect(g, item);
      item.y = H + 100;
    }
  }
  g.pickups = g.pickups.filter((item) => item.y < H + 20);
  const bossDead = g.enemies.some((e) => e.type === "boss" && e.hp <= 0);
  g.enemies = g.enemies.filter((e) => e.hp > 0 && e.y < H + 35);
  if (bossDead && g.phase === "play") {
    award(g, 1000 + p.hp * 100);
    g.phase = g.sector === SECTORS.length - 1 ? "win" : "clear";
    g.bullets = [];
  }
}
