import { advanceSnake, wouldHitSelf, bonusDue } from "./mato-rules.js";

(() => {
  "use strict";
  /* ===== CONFIG ===== */
  const CFG = {
    N: 20,
    baseMs: { easy: 200, normal: 160, hard: 115 },
    minMs: 80,
    speedUpPerLevel: 6,
    fruitsPerLevel: 5,
    bonusLife: 8, // s
    enemyEvery: 4,
    enemyMax: 4,
    enemyStepTicks: 2,
    shieldCost: 40,
    slowCost: 55,
    slowFactor: 1.7,
    slowSecs: 5.5,
    timeAttack: 90,
    mazeSafe: 6,
  };

  const $ = (id) => document.getElementById(id);
  const cv = $("cv"),
    ctx = cv.getContext("2d");
  const N = CFG.N;
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const inside = (p) => p.x >= 0 && p.y >= 0 && p.x < N && p.y < N;
  const rnd = (n) => Math.floor(Math.random() * n);

  let mode = "classic",
    diff = "normal",
    state = "menu",
    sound = true,
    wrap = false;
  let snake, dir, queue, food, bonus, bonusT, obstacles, enemies;
  let score,
    level,
    eaten,
    energy,
    shield,
    elapsed,
    slowUntil,
    acc,
    last = 0;
  const size = N * 8;
  let displaySize = 0,
    notice = "",
    noticeUntil = 0;
  const MODES = {
    classic: {
      name: "PERINTEINEN",
      help: "Syö omenoita, kasva ja väistä seiniä sekä omaa häntääsi.",
    },
    twist: {
      name: "TASKUTWIST",
      help: "Joka viides omena tuo katkaisupalan (X). Nappaa se 8 sekunnissa: +30 pistettä ja neljä häntäruutua pois. Vähintään neljä ruutua jää.",
    },
    arcade: {
      name: "ARCADE",
      help: "Kerää energiaa ja väistä liikkuvia vihollisia. Kilpi ja hidastus auttavat selviytymään.",
    },
    maze: {
      name: "SOKKELO",
      help: "Tuttu mato, mutta reitillä on myös seiniä. Sokkelot vaihtuvat tasojen mukana.",
    },
    time: {
      name: "AIKAHAASTE",
      help: "Kuinka monta pistettä keräät 90 sekunnissa? Törmäys päättää tämänkin pelin.",
    },
  };
  function text(id, value) {
    if ($(id).textContent !== String(value)) $(id).textContent = value;
  }

  /* The LCD is drawn at a fixed pixel resolution and scaled without smoothing. */
  function layout() {
    const stage = $("stage"),
      handset = $("handset");
    const widthOverhead = handset.offsetWidth - $("wrap").clientWidth;
    const heightOverhead = handset.offsetHeight - $("wrap").clientHeight;
    const bs = Math.max(
      1,
      Math.floor(
        Math.min(
          stage.clientWidth - widthOverhead,
          stage.clientHeight - heightOverhead,
          480,
        ),
      ),
    );
    if (displaySize && displaySize !== bs && state === "play") pause();
    displaySize = bs;
    document.documentElement.style.setProperty("--bs", bs + "px");
    if (cv.width !== size) {
      cv.width = size;
      cv.height = size;
    }
  }
  new ResizeObserver(layout).observe($("stage"));

  // Preferences have their own key; existing high scores stay intact.
  try {
    const prefs = JSON.parse(
      localStorage.getItem("pelikulma-mato-settings") || "{}",
    );
    if (["classic", "twist", "arcade", "maze", "time"].includes(prefs.mode))
      mode = prefs.mode;
    if (["easy", "normal", "hard"].includes(prefs.diff)) diff = prefs.diff;
    if (typeof prefs.sound === "boolean") sound = prefs.sound;
    if (typeof prefs.wrap === "boolean") wrap = prefs.wrap;
    if (typeof prefs.dpad === "boolean") $("show-dpad").checked = prefs.dpad;
  } catch {}
  function savePreferences() {
    try {
      localStorage.setItem(
        "pelikulma-mato-settings",
        JSON.stringify({
          mode,
          diff,
          sound,
          wrap,
          dpad: $("show-dpad").checked,
        }),
      );
    } catch {}
  }
  function syncPreferences() {
    for (const [selector, value, key] of [
      ["[data-m]", mode, "m"],
      ["[data-d]", diff, "d"],
    ]) {
      document.querySelectorAll(selector).forEach((button) => {
        const selected = button.dataset[key] === value;
        button.classList.toggle("on", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }
    $("snd").checked = sound;
    $("wrp").checked = wrap;
    $("dpad").hidden = !$("show-dpad").checked;
    $("control-hint").textContent = $("show-dpad").checked
      ? "Pyyhkäise tai ohjaa näppäimillä 2 · 4 · 6 · 8."
      : "Pyyhkäise kenttää tai käytä näppäimiä 2, 4, 6 ja 8.";
    text("mode-help", MODES[mode].help);
    document.querySelector(".extra-modes").open = ![
      "classic",
      "twist",
    ].includes(mode);
  }

  /* ===== Storage / audio ===== */
  const key = () => `mato2-${mode}-${diff}`;
  const best = () => {
    try {
      return +localStorage.getItem(key()) || 0;
    } catch {
      return 0;
    }
  };
  const saveBest = () => {
    if (score > best())
      try {
        localStorage.setItem(key(), score);
      } catch {}
  };
  let ac;
  function beep(f, d = 0.07, type = "square", v = 0.035) {
    if (!sound) return;
    try {
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(v, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + d);
    } catch {}
  }
  const buzz = (ms) => {
    try {
      sound && navigator.vibrate && navigator.vibrate(ms);
    } catch {}
  };

  /* ===== Game logic ===== */
  function emptyCell(minDist = 0) {
    const c = [];
    for (let y = 1; y < N - 1; y++)
      for (let x = 1; x < N - 1; x++) {
        const p = { x, y };
        if (
          minDist &&
          Math.abs(x - snake[0].x) + Math.abs(y - snake[0].y) < minDist
        )
          continue;
        if (
          snake.some((s) => same(s, p)) ||
          obstacles.some((s) => same(s, p)) ||
          enemies.some((e) => same(e.p, p)) ||
          same(food, p) ||
          same(bonus, p)
        )
          continue;
        c.push(p);
      }
    return c.length ? c[rnd(c.length)] : null;
  }

  function reset() {
    snake = [
      { x: 6, y: 10 },
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    queue = [];
    obstacles = [];
    enemies = [];
    food = null;
    bonus = null;
    bonusT = 0;
    notice = "";
    noticeUntil = 0;
    score = 0;
    level = 1;
    eaten = 0;
    energy = 0;
    shield = false;
    elapsed = 0;
    slowUntil = 0;
    acc = 0;
    if (mode === "maze") createMaze();
    food = emptyCell();
    ui();
  }

  function createMaze() {
    const P = [
      [
        [4, 4, 4, 9],
        [15, 10, 15, 15],
      ],
      [
        [3, 5, 8, 5],
        [11, 14, 16, 14],
      ],
      [
        [4, 3, 4, 7],
        [15, 12, 15, 16],
        [8, 3, 12, 3],
      ],
    ];
    obstacles = [];
    for (const [x1, y1, x2, y2] of P[(level - 1) % P.length])
      for (let y = y1; y <= y2; y++)
        for (let x = x1; x <= x2; x++) {
          const p = { x, y };
          // ei madon lähelle, ei hedelmien päälle
          if (
            Math.abs(x - snake[0].x) + Math.abs(y - snake[0].y) <
            CFG.mazeSafe
          )
            continue;
          if (snake.some((s) => same(s, p)) || same(food, p) || same(bonus, p))
            continue;
          obstacles.push(p);
        }
  }

  function ui() {
    text("score", String(score).padStart(4, "0"));
    text("best", String(Math.max(score, best())).padStart(4, "0"));
    text("mode-label", MODES[mode].name);
    $("lvl").textContent =
      mode === "time"
        ? Math.ceil(Math.max(0, CFG.timeAttack - elapsed)) + " s"
        : "TASO " + level;
    const ar = mode === "arcade";
    $("arcade-controls").hidden = !ar;
    $("pause").disabled = state !== "play";
    $("key-pause").disabled = state !== "play";
    document
      .querySelectorAll("[data-dir]")
      .forEach((button) => (button.disabled = state !== "play"));
    $("eni").style.width = energy + "%";
    $("shield").disabled =
      !ar || state !== "play" || energy < CFG.shieldCost || shield;
    $("slow").disabled = !ar || state !== "play" || energy < CFG.slowCost;
    $("shield").textContent = shield
      ? "Kilpi aktiivinen"
      : `Kilpi (${CFG.shieldCost})`;
    text(
      "effect-hint",
      mode === "twist"
        ? elapsed < noticeUntil
          ? notice
          : bonus
            ? `X KATKAISUPALA ${Math.ceil(bonusT)} s`
            : `KATKAISUPALA ${5 - (eaten % 5)} OMENAN PÄÄSTÄ`
        : mode === "arcade"
          ? `ENERGIA ${energy}/100`
          : "SYÖ. KASVA. SELVIYDY.",
    );
  }

  function show(title, msg, btn) {
    $("ov").querySelector("h1").textContent = title;
    $("msg").textContent = msg;
    $("play").textContent = btn;
    $("setup").hidden = state !== "menu";
    $("difficulty-settings").hidden = state !== "menu";
    $("wrap-setting").hidden = state !== "menu";
    $("restart").hidden = state !== "pause";
    $("change-mode").hidden = state !== "over";
    $("result").hidden = state !== "over";
    $("result-score").textContent = score;
    $("result-best").textContent = best();
    $("settings").open = false;
    $("ov").classList.remove("hide");
  }
  function start() {
    state = "play";
    reset();
    last = performance.now();
    $("ov").classList.add("hide");
    ui();
  }
  function finish(msg) {
    if (state !== "play") return;
    state = "over";
    saveBest();
    beep(160, 0.35, "sawtooth", 0.06);
    buzz(120);

    setTimeout(() => {
      if (state === "over") show("Peli päättyi", msg, "Pelaa uudelleen");
    }, 650);
    ui();
  }
  let pausedAt = 0;
  function pause() {
    if (state === "play") {
      state = "pause";
      pausedAt = performance.now();
      show("Tauko", "Peli on pysäytetty.", "Jatka");
    } else if (state === "pause") {
      state = "play";
      if (slowUntil > pausedAt) slowUntil += performance.now() - pausedAt;
      last = performance.now();
      $("ov").classList.add("hide");
    }
    ui();
  }
  function turn(x, y) {
    if (state !== "play") return;
    const p = queue.length ? queue[queue.length - 1] : dir;
    if ((x === -p.x && y === -p.y) || (x === p.x && y === p.y)) return;
    if (queue.length < 2) queue.push({ x, y });
  }

  // palauttaa true jos törmäys jäi voimaan (peli päättyi)
  function hit(enemy) {
    if (mode === "arcade" && shield) {
      shield = false;
      beep(240, 0.15);
      buzz(40);
      if (enemy) {
        enemies = enemies.filter((e) => e !== enemy);
      }
      ui();
      return false;
    }
    finish(enemy ? "Vihollinen sai sinut!" : "Törmäsit!");
    return true;
  }

  function moveEnemies() {
    for (const e of enemies) {
      e.t++;
      if (e.t % CFG.enemyStepTicks) continue;
      const opts = Object.values(DIRS)
        .map((d) => ({ p: { x: e.p.x + d.x, y: e.p.y + d.y }, d }))
        .filter(
          (o) =>
            inside(o.p) &&
            !obstacles.some((p) => same(p, o.p)) &&
            !enemies.some((q) => q !== e && same(q.p, o.p)),
        );
      if (!opts.length) continue;
      const fw = opts.find((o) => o.d.x === e.d.x && o.d.y === e.d.y);
      const c = fw && Math.random() < 0.75 ? fw : opts[rnd(opts.length)];
      e.p = c.p;
      e.d = c.d;
    }
  }

  function tick() {
    if (queue.length) dir = queue.shift();
    const h = snake[0];
    const next = { x: h.x + dir.x, y: h.y + dir.y };
    if (wrap) {
      next.x = (next.x + N) % N;
      next.y = (next.y + N) % N;
    }

    const cutting = mode === "twist" && same(next, bonus);
    const grow = same(next, food) || (same(next, bonus) && !cutting);
    const en = enemies.find((e) => same(e.p, next));
    if (
      !inside(next) ||
      wouldHitSelf(snake, next, grow) ||
      obstacles.some((p) => same(p, next)) ||
      en
    ) {
      if (hit(en)) return;
      if (!en) return; // kilpi imaisi törmäyksen seinään: pysy paikallaan
    }

    const previousLength = snake.length;
    snake = advanceSnake(snake, next, { grow, cut: cutting ? 4 : 0 });

    if (same(next, food)) {
      score += 10;
      eaten++;
      energy = Math.min(100, energy + 12);
      beep(620, 0.06);
      buzz(8);

      food = null;
      if (eaten % CFG.fruitsPerLevel === 0) {
        level++;
        beep(900, 0.14);
        if (mode === "maze") createMaze();
      }
      if (
        mode === "arcade" &&
        eaten % CFG.enemyEvery === 0 &&
        enemies.length < CFG.enemyMax
      ) {
        const p = emptyCell(5);
        if (p) enemies.push({ p, d: DIRS.left, t: 0 });
      }
      if (bonusDue(mode, eaten)) {
        bonus = emptyCell();
        bonusT = CFG.bonusLife;
      }
      food = emptyCell();
      if (!food) {
        finish("Täytit koko kentän!");
        return;
      }
    } else if (same(next, bonus)) {
      score += 30;
      energy = Math.min(100, energy + 25);
      bonus = null;
      if (cutting) {
        const removed = previousLength - snake.length;
        notice = removed
          ? `HÄNTÄ -${removed} / +30 PISTETTÄ`
          : "+30 / HÄNTÄ JO LYHYT";
        noticeUntil = elapsed + 2;
      }
      beep(820, 0.12);
      buzz(15);
    }

    if (mode === "arcade") {
      moveEnemies();
      const en2 = enemies.find((e) => snake.some((s) => same(s, e.p))); // vihollinen liikkui madon päälle
      if (en2 && hit(en2)) return;
    }
    ui();
  }

  function speed(now) {
    let v = Math.max(
      CFG.minMs,
      CFG.baseMs[diff] - (level - 1) * CFG.speedUpPerLevel,
    );
    if (mode === "arcade" && now < slowUntil) v *= CFG.slowFactor;
    return v;
  }

  function ability(t) {
    if (mode !== "arcade" || state !== "play") return;
    if (t === "shield" && energy >= CFG.shieldCost && !shield) {
      energy -= CFG.shieldCost;
      shield = true;
      beep(780);
      buzz(20);
    }
    if (t === "slow" && energy >= CFG.slowCost) {
      energy -= CFG.slowCost;
      slowUntil = performance.now() + CFG.slowSecs * 1000;
      beep(350);
    }
    ui();
  }

  /* ===== Monochrome, deliberately stepped LCD rendering ===== */
  function draw() {
    const u = 8,
      ink = "#283b20",
      mid = "#607847",
      glass = "#a7b681";
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#9eaf79";
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) ctx.fillRect(x * u + 3, y * u + 3, 1, 1);
    if (!wrap) {
      ctx.strokeStyle = mid;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
    }
    for (const cell of obstacles) {
      ctx.fillStyle = mid;
      ctx.fillRect(cell.x * u + 1, cell.y * u + 1, 6, 6);
      ctx.fillStyle = ink;
      ctx.fillRect(cell.x * u + 2, cell.y * u + 2, 4, 4);
    }
    if (food) {
      const x = food.x * u,
        y = food.y * u;
      ctx.fillStyle = ink;
      ctx.fillRect(x + 2, y + 3, 4, 4);
      ctx.fillRect(x + 1, y + 4, 6, 2);
      ctx.fillRect(x + 4, y + 1, 1, 2);
    }
    if (bonus) {
      const x = bonus.x * u,
        y = bonus.y * u;
      ctx.strokeStyle = ink;
      ctx.strokeRect(x + 0.5, y + 0.5, 7, 7);
      ctx.fillStyle = ink;
      if (mode === "twist") {
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 2 + i, y + 2 + i, 1, 1);
          ctx.fillRect(x + 5 - i, y + 2 + i, 1, 1);
        }
      } else {
        ctx.fillRect(x + 3, y + 2, 2, 4);
        ctx.fillRect(x + 2, y + 3, 4, 2);
      }
      ctx.fillStyle = mid;
      ctx.fillRect(x, y + 7, Math.ceil((8 * bonusT) / CFG.bonusLife), 1);
    }
    for (const enemy of enemies) {
      const x = enemy.p.x * u,
        y = enemy.p.y * u;
      ctx.fillStyle = ink;
      ctx.fillRect(x + 2, y + 1, 4, 6);
      ctx.fillRect(x + 1, y + 2, 6, 4);
      ctx.fillStyle = glass;
      ctx.fillRect(x + 2, y + 3, 1, 1);
      ctx.fillRect(x + 5, y + 3, 1, 1);
    }
    ctx.fillStyle = ink;
    for (const cell of snake)
      ctx.fillRect(cell.x * u + 1, cell.y * u + 1, 6, 6);
    const head = snake[0],
      x = head.x * u,
      y = head.y * u;
    ctx.fillStyle = glass;
    const px = -dir.y,
      py = dir.x;
    for (const side of [-1, 1])
      ctx.fillRect(
        Math.round(x + 3.5 + dir.x * 2 + px * side * 1.5),
        Math.round(y + 3.5 + dir.y * 2 + py * side * 1.5),
        1,
        1,
      );
    if (shield) {
      ctx.strokeStyle = mid;
      ctx.strokeRect(x + 0.5, y + 0.5, 7, 7);
    }
  }

  function frame(now) {
    const dt = Math.min(60, now - (last || now));
    last = now;
    if (state === "play") {
      elapsed += dt / 1000;
      if (bonus) {
        bonusT -= dt / 1000;
        if (bonusT <= 0) bonus = null;
      }
      if (mode === "time") {
        ui();
        if (elapsed >= CFG.timeAttack) finish("Aika loppui!");
      }
      acc += dt;
      let c = 0;
      while (state === "play" && acc >= speed(now) && c < 3) {
        acc -= speed(now);
        tick();
        c++;
      }
    }
    draw();
    requestAnimationFrame(frame);
  }

  /* ===== Input ===== */
  const KM = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    2: "up",
    4: "left",
    6: "right",
    8: "down",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  addEventListener("keydown", (e) => {
    const interactive = e.target.closest("button,input,summary,a");
    const shortcut =
      KM[e.key] ||
      KM[e.key.toLowerCase()] ||
      ["5", "p", "1", "3"].includes(e.key);
    if (e.key !== "Escape" && interactive && !(state === "play" && shortcut))
      return;
    if (e.repeat && [" ", "Escape", "p", "Enter", "5"].includes(e.key)) return;
    const d = KM[e.key] || KM[e.key.toLowerCase()];
    if (d) {
      e.preventDefault();
      turn(DIRS[d].x, DIRS[d].y);
    } else if (
      e.key === "p" ||
      e.key === " " ||
      e.key === "Escape" ||
      e.key === "5"
    ) {
      e.preventDefault();
      pause();
    } else if (e.key === "Enter" && state !== "play") {
      state === "pause" ? pause() : start();
    } else if (e.key === "1") ability("shield");
    else if (e.key === "3") ability("slow");
  });

  // Listen only on the canvas, so swiping settings scrolls the dialog normally.
  let tp = null;
  cv.addEventListener("pointerdown", (e) => {
    if (state !== "play") return;
    tp = { x: e.clientX, y: e.clientY };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!tp || state !== "play") return;
    const dx = e.clientX - tp.x,
      dy = e.clientY - tp.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    Math.abs(dx) > Math.abs(dy)
      ? turn(Math.sign(dx), 0)
      : turn(0, Math.sign(dy));
    tp = { x: e.clientX, y: e.clientY };
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((event) =>
    cv.addEventListener(event, () => (tp = null)),
  );
  document.querySelectorAll("[data-dir]").forEach((button) => {
    const steer = () => {
      const direction = DIRS[button.dataset.dir];
      turn(direction.x, direction.y);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      steer();
    });
    button.addEventListener("click", (event) => {
      if (event.detail === 0) steer();
    });
  });
  function menu() {
    state = "menu";
    reset();
    show(
      "MATO",
      "Vanhan puhelimen fiilis, vielä yksi yritys. Valitse tuttu klassikko tai oma Taskutwistimme.",
      "Aloita peli",
    );
    ui();
  }
  document.querySelectorAll("[data-m]").forEach(
    (button) =>
      (button.onclick = () => {
        mode = button.dataset.m;
        syncPreferences();
        savePreferences();
        menu();
      }),
  );
  document.querySelectorAll("[data-d]").forEach(
    (button) =>
      (button.onclick = () => {
        diff = button.dataset.d;
        syncPreferences();
        savePreferences();
        reset();
      }),
  );
  $("snd").onchange = () => {
    sound = $("snd").checked;
    savePreferences();
  };
  $("wrp").onchange = () => {
    wrap = $("wrp").checked;
    savePreferences();
  };
  $("show-dpad").onchange = () => {
    syncPreferences();
    savePreferences();
  };
  $("play").onclick = () => (state === "pause" ? pause() : start());
  $("restart").onclick = start;
  $("change-mode").onclick = menu;
  $("pause").onclick = pause;
  $("key-pause").onclick = pause;
  $("shield").onclick = () => ability("shield");
  $("slow").onclick = () => ability("slow");
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "play") pause();
  });
  matchMedia("(orientation: landscape)").addEventListener("change", () => {
    if (state === "play") pause();
  });

  syncPreferences();
  layout();
  menu();
  requestAnimationFrame(frame);
})();
