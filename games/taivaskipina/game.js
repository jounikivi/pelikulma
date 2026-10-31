import {
  W,
  H,
  SECTORS,
  DIFFICULTIES,
  createGame,
  aim,
  pulse,
  nextSector,
  step,
  checkpoint,
  restore,
} from "./engine.js";
const $ = (id) => document.getElementById(id),
  cv = $("canvas"),
  ctx = cv.getContext("2d");
let difficulty = "normal",
  g = createGame(),
  screen = "menu",
  last = 0,
  sound = true,
  best = 0,
  saved = null,
  startPoint = null,
  drag = null;
const keys = new Set(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
try {
  difficulty = localStorage.getItem("taivaskipina-difficulty") || "normal";
  if (!Object.hasOwn(DIFFICULTIES, difficulty)) difficulty = "normal";
  sound = localStorage.getItem("taivaskipina-sound") !== "off";
  saved = JSON.parse(localStorage.getItem("taivaskipina-save") || "null");
  if (!restore(saved)) saved = null;
} catch {}
g = createGame(difficulty);
$("sound").checked = sound;
function text(id, value) {
  if ($(id).textContent !== String(value)) $(id).textContent = value;
}
function readBest() {
  try {
    best =
      Number(localStorage.getItem("taivaskipina-best-" + g.difficulty)) || 0;
  } catch {
    best = 0;
  }
}
function saveBest() {
  if (g.score > best) {
    best = g.score;
    try {
      localStorage.setItem("taivaskipina-best-" + g.difficulty, String(best));
    } catch {}
  }
}
function savePoint() {
  startPoint = checkpoint(g);
  saved = startPoint;
  try {
    localStorage.setItem("taivaskipina-save", JSON.stringify(startPoint));
  } catch {}
}
function clearPoint() {
  saved = null;
  try {
    localStorage.removeItem("taivaskipina-save");
  } catch {}
}
let audio,
  lastSound = 0;
function beep(f, d = 0.08) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const o = audio.createOscillator(),
      v = audio.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    v.gain.setValueAtTime(0.035, audio.currentTime);
    v.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + d);
    o.connect(v);
    v.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + d);
  } catch {}
}
function rumble() {
  try {
    if (sound) navigator.vibrate?.(25);
  } catch {}
}
function layout() {
  const stage = $("stage"),
    scale = Math.max(
      0.05,
      Math.min((stage.clientWidth - 4) / W, (stage.clientHeight - 30) / H, 1.3),
    );
  const width = Math.floor(W * scale) + 4,
    height = Math.floor(H * scale) + 30;
  const old = $("flight").getBoundingClientRect();
  if (
    screen === "game" &&
    (Math.abs(old.width - width) > 2 || Math.abs(old.height - height) > 2)
  )
    pause();
  document.documentElement.style.setProperty("--fw", width + "px");
  document.documentElement.style.setProperty("--fh", height + "px");
}
new ResizeObserver(layout).observe($("stage"));
matchMedia("(orientation: landscape)").addEventListener("change", () => {
  if (screen === "game") pause();
});
function choices() {
  document.querySelectorAll("[data-d]").forEach((b) => {
    const on = b.dataset.d === difficulty;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}
function ui() {
  saveBest();
  text("score", g.score);
  text("best", best);
  text(
    "sector",
    `${g.sector + 1}/5 ${DIFFICULTIES[g.difficulty].label.toUpperCase()}`,
  );
  text("health", `RUNKO ${g.player.hp}/5`);
  text("reserves", `${g.player.lives} KONETTA`);
  text("weapon", "ASE " + ["", "I", "II", "III"][g.player.weapon]);
  const boss = g.enemies.find((e) => e.type === "boss");
  $("boss-ui").hidden = !boss;
  if (boss) {
    text("boss-name", SECTORS[g.sector].boss);
    $("boss-health").style.width =
      Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";
  }
  text("wave", boss ? "POMOTAISTELU" : `AALTO ${g.wave}/4`);
  $("pause").disabled = screen !== "game";
  $("pulse").disabled = screen !== "game" || g.charge < 100;
  text(
    "pulse",
    g.charge >= 100
      ? "Torjuntapulssi ✦"
      : `Pulssi latautuu ${Math.floor(g.charge)} %`,
  );
  $("energy-fill").style.width = g.charge + "%";
  $("energy").setAttribute("aria-valuenow", String(Math.floor(g.charge)));
  text(
    "hint",
    g.player.invincible > 0
      ? "Suojattu hetken · ota hyvä asema."
      : "Lähiluodit kuriin pulssilla.",
  );
  $("area-banner").hidden = g.sectorTime > 2.5;
  text("area-banner", SECTORS[g.sector].name.toUpperCase());
}
function show(kind, title, msg, button) {
  saveBest();
  screen = kind;
  keys.clear();
  drag = null;
  text("dialog-title", title);
  text("msg", msg);
  text("play", button);
  $("setup").hidden = kind !== "menu";
  $("instructions").hidden = kind !== "menu";
  $("result").hidden = ["menu", "pause"].includes(kind);
  text("result-score", g.score);
  text("result-best", best);
  $("restart").hidden = kind !== "pause";
  $("continue").hidden = kind !== "menu" || !saved;
  if (saved)
    text(
      "continue",
      `Jatka: ${SECTORS[saved.sector].name} (${DIFFICULTIES[saved.difficulty].label})`,
    );
  $("save-info").hidden = !["menu", "pause"].includes(kind);
  $("ov").classList.remove("hide");
  ui();
}
function hide() {
  screen = "game";
  last = performance.now();
  $("ov").classList.add("hide");
  ui();
}
function start() {
  g = createGame(difficulty, Date.now());
  readBest();
  savePoint();
  hide();
  beep(480, 0.15);
}
function resumeSaved() {
  const restored = restore(saved);
  if (!restored) return;
  g = restored;
  difficulty = g.difficulty;
  choices();
  readBest();
  startPoint = saved;
  hide();
  beep(520);
}
function pause() {
  if (screen === "game")
    show(
      "pause",
      "Lento tauolla",
      "Jatka samasta kohdasta. Jos suljet sivun, tallennettu lento alkaa nykyisen alueen alusta.",
      "Jatka lentoa",
    );
  else if (screen === "pause") hide();
}
function firePulse() {
  if (screen === "game" && pulse(g)) {
    beep(180, 0.2);
    rumble();
    ui();
  }
}

const PLAYER = [
  ".....aa.....",
  ".....aa.....",
  "....abba....",
  "....abba....",
  "....acca....",
  "aa..acca..aa",
  "aaa.ac ca.aaa".replaceAll(" ", ""),
  "aaadaccadaaa",
  "aaaaddddaaaa",
  "....adda....",
  "....a..a....",
  "....f..f....",
];
const SCOUT = [
  "...pp...",
  "..pqqp..",
  "pppqqppp",
  "ppprrppp",
  "..prrp..",
  "..p..p..",
];
const TANK = [
  "..vvvv..",
  "vvvrrvvv",
  "vrrssrrv",
  "vrrssrrv",
  "vvvvvvvv",
  "..v..v..",
];
function sprite(pattern, x, y, size, colors) {
  for (let row = 0; row < pattern.length; row++)
    for (let col = 0; col < pattern[row].length; col++) {
      const color = colors[pattern[row][col]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.round(x + (col - pattern[row].length / 2) * size),
          Math.round(y + (row - pattern.length / 2) * size),
          size,
          size,
        );
      }
    }
}
function island(x, y, scale, color) {
  ctx.fillStyle = "#102f4288";
  ctx.fillRect(x + 6, y + 7, 64 * scale, 28 * scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + 12 * scale);
  ctx.lineTo(x + 12 * scale, y + 12 * scale);
  ctx.lineTo(x + 12 * scale, y);
  ctx.lineTo(x + 44 * scale, y);
  ctx.lineTo(x + 44 * scale, y + 8 * scale);
  ctx.lineTo(x + 64 * scale, y + 8 * scale);
  ctx.lineTo(x + 64 * scale, y + 27 * scale);
  ctx.lineTo(x + 48 * scale, y + 27 * scale);
  ctx.lineTo(x + 48 * scale, y + 36 * scale);
  ctx.lineTo(x + 9 * scale, y + 36 * scale);
  ctx.lineTo(x + 9 * scale, y + 25 * scale);
  ctx.lineTo(x, y + 25 * scale);
  ctx.fill();
  ctx.fillStyle = "#dfc78b66";
  ctx.fillRect(x + 17 * scale, y + 8 * scale, 24 * scale, 3 * scale);
}
function draw() {
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  const area = SECTORS[g.sector];
  ctx.fillStyle = area.sea;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#a0ddd91c";
  for (let i = 0; i < 34; i++) {
    const y = ((i * 47 + g.scroll * 1.5) % 640) - 40,
      x = (i * 71) % W;
    ctx.fillRect(x, y, 12, 2);
  }
  for (let i = 0; i < 6; i++)
    island(
      ((i * 133 + 40) % 390) - 30,
      ((i * 173 + g.scroll * 0.55) % 1000) - 170,
      0.8 + (i % 3) * 0.4,
      area.land,
    );
  ctx.fillStyle = "#dde1c51b";
  for (let i = 0; i < 5; i++) {
    const x = (i * 149 + 10) % W,
      y = ((i * 191 + g.scroll * 0.9) % 850) - 100;
    ctx.fillRect(x, y, 64, 14);
    ctx.fillRect(x + 12, y - 7, 32, 28);
  }
  for (const item of g.pickups) {
    ctx.fillStyle = { weapon: "#f4d477", repair: "#9be3bd", energy: "#a3d8ed" }[
      item.type
    ];
    ctx.fillRect(item.x - 9, item.y - 9, 18, 18);
    ctx.fillStyle = "#193442";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      { weapon: "W", repair: "R", energy: "E" }[item.type],
      item.x,
      item.y + 4,
    );
  }
  for (const e of g.enemies) {
    if (e.type === "boss") {
      ctx.fillStyle =
        e.flash > 0
          ? "#fff0cc"
          : ["#8db5a0", "#c29a71", "#ac8ac0", "#88a5b2", "#c79c99"][g.sector];
      const x = Math.round(e.x),
        y = Math.round(e.y);
      ctx.fillRect(x - 40, y - 8, 80, 20);
      ctx.fillRect(x - 30, y - 20, 60, 36);
      ctx.fillStyle = "#e4b18d";
      ctx.fillRect(x - 14, y - 28, 28, 60);
      ctx.fillStyle = "#35465b";
      ctx.fillRect(x - 8, y - 18, 16, 24);
      ctx.fillRect(x - 33, y + 9, 12, 16);
      ctx.fillRect(x + 21, y + 9, 12, 16);
      ctx.fillStyle = e.hp < e.maxHp * 0.5 ? "#ffbb79" : "#a9e8d8";
      ctx.fillRect(x - 28, y - 8, 9, 9);
      ctx.fillRect(x + 19, y - 8, 9, 9);
      ctx.fillRect(x - 6, y + 17, 12, 7);
    } else
      sprite(
        e.type === "tank" ? TANK : SCOUT,
        e.x,
        e.y,
        e.type === "tank" ? 4 : 3,
        {
          p:
            e.flash > 0
              ? "#fff0ca"
              : e.type === "weaver"
                ? "#d4a2d6"
                : "#ef9d8b",
          q: "#53526f",
          r: "#f3d894",
          v: e.flash > 0 ? "#fff0ca" : "#87bdad",
          s: "#344c62",
        },
      );
  }
  for (const s of g.shots) {
    ctx.fillStyle = "#fff1ad";
    ctx.fillRect(s.x - 1, s.y - 6, 3, 10);
    ctx.fillStyle = "#83dccc";
    ctx.fillRect(s.x - 1, s.y + 4, 3, 4);
  }
  for (const b of g.bullets) {
    ctx.fillStyle = "#663943";
    ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
    ctx.fillStyle = "#ffcb8f";
    ctx.fillRect(b.x - 2, b.y - 3, 4, 6);
  }
  for (const e of g.effects) {
    if (e.type === "pulse") {
      ctx.strokeStyle = "#c6f0cf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        e.x,
        e.y,
        reduced ? 185 : (1 - e.life / 0.65) * 190,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    } else if (!reduced) {
      ctx.fillStyle = e.type === "pickup" ? "#bcebc7" : "#ffe0a0";
      const t = 1 - e.life / 0.5;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.fillRect(
          e.x + Math.cos(a) * t * (e.boss ? 75 : 30),
          e.y + Math.sin(a) * t * (e.boss ? 75 : 30),
          4,
          4,
        );
      }
    }
  }
  ctx.globalAlpha = g.player.invincible > 0 ? 0.65 : 1;
  sprite(PLAYER, g.player.x, g.player.y, 2.5, {
    a: "#f4d091",
    b: "#f9e8b6",
    c: "#4a898e",
    d: "#a9dfcb",
    f: "#ed9c6e",
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.fillRect(g.player.x - 2, g.player.y - 2, 4, 4);
  if (g.player.invincible > 0) {
    ctx.strokeStyle = "#d3edc3";
    ctx.strokeRect(g.player.x - 18, g.player.y - 18, 36, 36);
  }
}
function frame(now) {
  const dt = Math.min(0.04, (now - (last || now)) / 1000);
  last = now;
  if (screen === "game") {
    let x = 0,
      y = 0;
    if (keys.has("left")) x--;
    if (keys.has("right")) x++;
    if (keys.has("up")) y--;
    if (keys.has("down")) y++;
    if (x || y) {
      const n = Math.hypot(x, y);
      aim(g, g.player.x + (x / n) * 300 * dt, g.player.y + (y / n) * 300 * dt);
    }
    const oldScore = g.score,
      oldHp = g.player.hp,
      oldLives = g.player.lives,
      oldWeapon = g.player.weapon;
    step(g, dt);
    if (g.player.lives < oldLives || g.player.hp < oldHp) {
      beep(140, 0.2);
      rumble();
    } else if (g.player.weapon > oldWeapon) beep(900, 0.12);
    else if (g.score > oldScore && now - lastSound > 100) {
      beep(580, 0.04);
      lastSound = now;
    }
    if (g.phase === "clear")
      show(
        "clear",
        "Alue vapaa!",
        `${SECTORS[g.sector].boss} on pysäytetty. Seuraavaksi ${SECTORS[g.sector + 1].name}. Ase paranee ja runko korjaantuu yhdellä.`,
        "Seuraava alue →",
      );
    else if (g.phase === "win") {
      clearPoint();
      show(
        "win",
        "Taivas on vapaa!",
        "Myrskysydän on sammunut. Viiden alueen reitti on auki — hieno lento!",
        "Aloita uusi lento",
      );
    } else if (g.phase === "over") {
      clearPoint();
      show(
        "over",
        "Lento päättyi",
        `Pääsit alueelle ${g.sector + 1}: ${SECTORS[g.sector].name}. Uusi lentoreitti odottaa.`,
        "Yritä uudelleen",
      );
    }
  }
  ui();
  draw();
  requestAnimationFrame(frame);
}
$("play").onclick = () => {
  if (screen === "pause") hide();
  else if (screen === "clear") {
    nextSector(g);
    savePoint();
    hide();
  } else start();
};
$("continue").onclick = resumeSaved;
$("restart").onclick = start;
$("pause").onclick = pause;
$("pulse").onclick = firePulse;
document.querySelectorAll("[data-d]").forEach(
  (b) =>
    (b.onclick = () => {
      difficulty = b.dataset.d;
      g = createGame(difficulty);
      readBest();
      choices();
      try {
        localStorage.setItem("taivaskipina-difficulty", difficulty);
      } catch {}
      ui();
    }),
);
for (const element of [cv, $("touchpad")]) {
  element.addEventListener("pointerdown", (e) => {
    if (screen !== "game") return;
    e.preventDefault();
    element.setPointerCapture(e.pointerId);
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      px: g.player.tx,
      py: g.player.ty,
      scale: W / cv.getBoundingClientRect().width,
    };
  });
  element.addEventListener("pointermove", (e) => {
    if (drag && drag.id === e.pointerId && screen === "game")
      aim(
        g,
        drag.px + (e.clientX - drag.x) * drag.scale,
        drag.py + (e.clientY - drag.y) * drag.scale,
      );
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    element.addEventListener(type, () => (drag = null));
}
const directions = {
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
  ArrowUp: "up",
  w: "up",
  ArrowDown: "down",
  s: "down",
};
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    pause();
    return;
  }
  if (e.target.closest("input,a,summary")) return;
  const key = e.key.toLowerCase(),
    dir = directions[e.key] || directions[key];
  if (dir && screen === "game") {
    e.preventDefault();
    keys.add(dir);
    return;
  }
  if (e.target.closest("button") && [" ", "Enter"].includes(e.key)) return;
  if (e.repeat) return;
  if (key === "p") {
    e.preventDefault();
    pause();
  }
  if ((key === "x" || e.code === "Space") && screen === "game") {
    e.preventDefault();
    firePulse();
  }
});
addEventListener("keyup", (e) => {
  const dir = directions[e.key] || directions[e.key.toLowerCase()];
  if (dir) keys.delete(dir);
});
addEventListener("blur", () => {
  keys.clear();
  if (screen === "game") pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && screen === "game") pause();
});
$("sound").onchange = () => {
  sound = $("sound").checked;
  try {
    localStorage.setItem("taivaskipina-sound", sound ? "on" : "off");
  } catch {}
};
readBest();
choices();
layout();
show(
  "menu",
  "TAIVASKIPINÄ",
  "Lentävät saaret ovat jääneet myrskykoneiden saartamiksi. Avaa reitti viiden alueen halki Taivaan portille.",
  "Aloita lento",
);
draw();
requestAnimationFrame(frame);
