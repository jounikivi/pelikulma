import {
  W,
  LEVELS,
  createGame,
  aim,
  launch,
  armSpark,
  nextLevel,
  step,
} from "./pomppu-engine.js";

const $ = (id) => document.getElementById(id);
const canvas = $("court"),
  ctx = canvas.getContext("2d");
const colors = [
  "#ed7994",
  "#f2b866",
  "#83d4b4",
  "#91b6d1",
  "#d39ecb",
  "#e7ce80",
];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let game = createGame(),
  screen = "menu",
  last = 0,
  best = 0,
  sound = true,
  particles = [],
  trail = [],
  notice = "",
  noticeFor = 0;
const keys = new Set();
try {
  best = Math.max(0, Number(localStorage.getItem("pomppu-best")) || 0);
  sound = localStorage.getItem("pelikulma-pomppu-sound") !== "off";
} catch {}
$("sound").checked = sound;
function text(id, value) {
  if ($(id).textContent !== String(value)) $(id).textContent = value;
}
function saveBest() {
  if (game.score <= best) return;
  best = game.score;
  try {
    localStorage.setItem("pomppu-best", String(best));
  } catch {}
}
let audio;
function beep(frequency, duration = 0.06) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {}
}
function buzz() {
  try {
    if (sound) navigator.vibrate?.(15);
  } catch {}
}

function layout() {
  const stage = $("stage"),
    scale = Math.max(
      0.05,
      Math.min(
        (stage.clientWidth - 4) / W,
        (stage.clientHeight - 32) / game.height,
        1.35,
      ),
    );
  const width = Math.floor(W * scale) + 4,
    height = Math.floor(game.height * scale) + 32;
  const previous = $("playfield").getBoundingClientRect();
  if (
    screen === "game" &&
    (Math.abs(previous.width - width) > 2 ||
      Math.abs(previous.height - height) > 2)
  )
    pause();
  document.documentElement.style.setProperty("--court-width", width + "px");
  document.documentElement.style.setProperty("--court-height", height + "px");
  if (canvas.height !== game.height * 2) canvas.height = game.height * 2;
}
new ResizeObserver(layout).observe($("stage"));
matchMedia("(orientation: landscape)").addEventListener("change", () => {
  if (screen === "game") pause();
});

function ui() {
  const playing = screen === "game",
    active = playing && ["ready", "play"].includes(game.phase);
  text("score", game.score);
  text("best", Math.max(game.score, best));
  text("round", `KENTTÄ ${game.level + 1} / ${LEVELS.length}`);
  text("lives", Array.from({ length: game.lives }, () => "●").join(" ") || "—");
  $("lives").setAttribute("aria-label", `Palloja jäljellä: ${game.lives}`);
  $("pause").disabled = !active;
  $("paddle-input").disabled = !active;
  $("launch").disabled = !active;
  text("launch", game.phase === "ready" ? "Lähetä pallo ↑" : "Ⅱ Tauko");
  $("spark").disabled =
    !active || game.charge < 100 || game.armed || game.power > 0;
  $("spark").classList.toggle(
    "ready",
    active && game.charge === 100 && !game.armed && game.power === 0,
  );
  $("spark").classList.toggle("armed", game.armed);
  text(
    "spark",
    game.power > 0
      ? `Kipinä ${Math.ceil(game.power)} s`
      : game.armed
        ? "Seuraava lyönti ✦"
        : "Viritä kipinä ✦",
  );
  text("charge-label", `${game.charge} %`);
  $("charge-fill").style.width = game.charge + "%";
  $("charge-meter").setAttribute("aria-valuenow", String(game.charge));
  text(
    "status",
    noticeFor > 0
      ? notice
      : game.phase === "ready"
        ? "Liu'uta mailaa ja lähetä pallo."
        : game.power > 0
          ? "Kipinä läpäisee palikat!"
          : game.armed
            ? "Ota pallo mailaan: kipinä syttyy."
            : game.charge === 100
              ? "Kipinä valmis. Sinä päätät milloin!"
              : "Mailan reunasta saat vinoja lyöntejä.",
  );
}

function show(kind, title, message, button) {
  screen = kind;
  keys.clear();
  saveBest();
  text("dialog-title", title);
  text("msg", message);
  text("play", button);
  $("instructions").hidden = kind !== "menu";
  $("result").hidden = ["menu", "pause"].includes(kind);
  text("result-score", game.score);
  text("result-best", best);
  $("restart").hidden = kind !== "pause";
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
  const stage = $("stage"),
    scale = Math.max(0.05, Math.min((stage.clientWidth - 4) / W, 1.35));
  game = createGame({ height: Math.round((stage.clientHeight - 32) / scale) });
  layout();
  particles = [];
  trail = [];
  noticeFor = 0;
  $("paddle-input").value = String(game.targetX);
  hide();
  beep(440, 0.1);
}
function pause() {
  if (screen === "game")
    show(
      "pause",
      "Tauko",
      "Maila ja pallo odottavat. Jatka, kun olet valmis.",
      "Jatka peliä",
    );
  else if (screen === "pause") hide();
}
function send() {
  if (screen === "game" && launch(game)) {
    trail = [];
    noticeFor = 0;
    beep(400);
    ui();
  }
}
function spark() {
  if (screen === "game" && armSpark(game)) {
    beep(760, 0.12);
    buzz();
    ui();
  }
}
function setPaddle(x) {
  if (screen !== "game") return;
  aim(game, x);
  $("paddle-input").value = String(game.targetX);
}

function handle(events) {
  let sounded = false;
  for (const event of events) {
    if (event.type === "brick") {
      if (!sounded) {
        beep(500 + event.row * 60);
        sounded = true;
      }
      if (!reducedMotion && event.broken)
        for (let i = 0; i < 6; i++)
          particles.push({
            x: event.x,
            y: event.y,
            vx: (Math.random() - 0.5) * 110,
            vy: (Math.random() - 0.7) * 100,
            life: 0.5,
            color: colors[event.row % colors.length],
          });
      saveBest();
    } else if (event.type === "paddle") beep(280);
    else if (event.type === "spark") {
      beep(900, 0.15);
      buzz();
    } else if (event.type === "lost") {
      trail = [];
      beep(130, 0.2);
      buzz();
      notice = `Pallo karkasi. Vielä ${game.lives} jäljellä.`;
      noticeFor = 3;
      if (game.phase === "over")
        show(
          "over",
          "Uusi yritys?",
          "Pallot loppuivat. Seuraava ennätys odottaa jo.",
          "Pelaa uudelleen",
        );
    } else if (event.type === "level") {
      trail = [];
      beep(780, 0.16);
      show(
        "level",
        "Kenttä läpi!",
        "Hyvä pomppu! Kenttäbonusta 100 pistettä. Pallot ja lataus siirtyvät seuraavaan kenttään.",
        "Seuraava kenttä →",
      );
    } else if (event.type === "win")
      show(
        "win",
        "Kaikki murskattu!",
        "Kuusi kenttää, yksi hieno pelituokio. Saatko seuraavalla kerralla vielä enemmän pisteitä?",
        "Pelaa uudelleen",
      );
  }
  if (particles.length > 100) particles = particles.slice(-100);
}

function draw() {
  const H = game.height;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = "#131829";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2e3045";
  for (let y = 16; y < H; y += 20)
    for (let x = 12; x < W; x += 24) ctx.fillRect(x, y, 1, 1);
  ctx.fillStyle = "#3a3447";
  ctx.fillRect(4, 4, W - 8, 2);
  ctx.fillRect(3, 4, 2, H - 20);
  ctx.fillRect(W - 5, 4, 2, H - 20);
  ctx.fillStyle = "#b67970";
  ctx.fillRect(6, H - 13, W - 12, 1);
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#9b8690";
  ctx.fillText("POMPPU / PELIKULMA", W / 2, 31);
  for (const brick of game.bricks) {
    if (brick.hp <= 0) continue;
    const color = colors[brick.row % colors.length];
    ctx.fillStyle = "#090d19";
    ctx.fillRect(brick.x + 2, brick.y + 3, brick.w, brick.h);
    ctx.fillStyle = color;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.fillStyle = "#ffffff55";
    ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 2);
    ctx.fillStyle = "#18172a66";
    ctx.fillRect(brick.x + 2, brick.y + brick.h - 3, brick.w - 4, 2);
    if (brick.hp === 2) {
      ctx.strokeStyle = "#171c30";
      ctx.lineWidth = 2;
      ctx.strokeRect(brick.x + 5, brick.y + 5, brick.w - 10, brick.h - 10);
    } else if (brick.maxHp === 2) {
      ctx.fillStyle = "#171c30";
      ctx.fillRect(brick.x + brick.w / 2, brick.y + 4, 2, 10);
    }
  }
  if (!reducedMotion)
    for (let i = 0; i < trail.length; i++) {
      ctx.globalAlpha = (i / trail.length) * 0.35;
      ctx.fillStyle = game.power > 0 ? "#ffd34b" : "#bceade";
      ctx.fillRect(
        Math.round(trail[i].x) - 2,
        Math.round(trail[i].y) - 2,
        4,
        4,
      );
    }
  ctx.globalAlpha = 1;
  const left = Math.round(game.paddleX - game.paddleW / 2),
    paddleColor = game.armed ? "#ffd34b" : "#83d4b4";
  ctx.fillStyle = "#080d18";
  ctx.fillRect(left + 2, game.paddleY + 3, game.paddleW, 10);
  ctx.fillStyle = paddleColor;
  ctx.fillRect(left, game.paddleY, game.paddleW, 9);
  ctx.fillStyle = "#f7efd6";
  ctx.fillRect(left + 3, game.paddleY + 1, game.paddleW - 6, 2);
  ctx.fillStyle = "#467b73";
  ctx.fillRect(left + game.paddleW / 2 - 1, game.paddleY + 4, 2, 4);
  if (!["over", "win"].includes(game.phase)) {
    const ball = game.ball;
    if (game.power > 0) {
      ctx.fillStyle = "#8d632e";
      ctx.fillRect(Math.round(ball.x) - 7, Math.round(ball.y) - 7, 14, 14);
    }
    ctx.fillStyle = game.power > 0 ? "#ffd34b" : "#fff2d2";
    ctx.fillRect(Math.round(ball.x) - 4, Math.round(ball.y) - 5, 8, 10);
    ctx.fillRect(Math.round(ball.x) - 5, Math.round(ball.y) - 3, 10, 6);
  }
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life * 2);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  if (game.phase === "ready") {
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#d6c9b9";
    ctx.fillText("LÄHETÄ PALLO ↑", W / 2, H - 75);
  }
}
function frame(now) {
  const dt = Math.min(0.04, (now - (last || now)) / 1000);
  last = now;
  if (screen === "game") {
    if (keys.has("left") !== keys.has("right"))
      setPaddle(game.targetX + (keys.has("left") ? -1 : 1) * 330 * dt);
    handle(step(game, dt));
    noticeFor = Math.max(0, noticeFor - dt);
    if (game.phase === "play" && !reducedMotion) {
      trail.push({ x: game.ball.x, y: game.ball.y });
      if (trail.length > 10) trail.shift();
    }
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);
  }
  ui();
  draw();
  requestAnimationFrame(frame);
}

$("play").onclick = () => {
  if (screen === "pause") hide();
  else if (screen === "level") {
    nextLevel(game);
    trail = [];
    noticeFor = 0;
    $("paddle-input").value = String(game.targetX);
    hide();
  } else start();
};
$("restart").onclick = start;
$("pause").onclick = pause;
$("launch").onclick = () => (game.phase === "play" ? pause() : send());
$("spark").onclick = spark;
$("paddle-input").addEventListener("input", (event) =>
  setPaddle(Number(event.target.value)),
);
let dragging = false;
function point(event) {
  const rect = canvas.getBoundingClientRect();
  setPaddle(((event.clientX - rect.left) / rect.width) * W);
}
canvas.addEventListener("pointerdown", (event) => {
  if (screen !== "game") return;
  event.preventDefault();
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  point(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (dragging || event.pointerType === "mouse") point(event);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(type, () => (dragging = false));
const direction = (key) =>
  ["ArrowLeft", "a", "A"].includes(key)
    ? "left"
    : ["ArrowRight", "d", "D"].includes(key)
      ? "right"
      : null;
addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    pause();
    return;
  }
  if (event.target.closest("a,summary")) return;
  const input = event.target.closest("input");
  if (input && input.id !== "paddle-input") return;
  const dir = direction(event.key);
  if (input && dir) return;
  if (dir && screen === "game") {
    event.preventDefault();
    keys.add(dir);
    return;
  }
  if (event.target.closest("button") && [" ", "Enter"].includes(event.key))
    return;
  if (event.repeat) return;
  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    pause();
  } else if (event.code === "Space" && screen === "game") {
    event.preventDefault();
    send();
  } else if (event.key.toLowerCase() === "k") {
    event.preventDefault();
    spark();
  }
});
addEventListener("keyup", (event) => {
  const dir = direction(event.key);
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
    localStorage.setItem("pelikulma-pomppu-sound", sound ? "on" : "off");
  } catch {}
};
layout();
ui();
draw();
requestAnimationFrame(frame);
