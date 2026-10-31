(() => {
  "use strict";
  /* ===== CONFIG ===== */
  const CFG = {
    N: 20,
    baseMs: { easy: 170, normal: 130, hard: 95 },
    minMs: 62,
    speedUpPerLevel: 7,
    fruitsPerLevel: 5,
    bonusEvery: 6,
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
    shakeAmt: 7,
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
  let snake,
    dir,
    queue,
    food,
    bonus,
    bonusT,
    obstacles,
    enemies,
    popped,
    prevHead;
  let score,
    level,
    eaten,
    energy,
    shield,
    elapsed,
    slowUntil,
    acc,
    last = 0;
  let parts = [],
    shake = 0,
    T = 0,
    size = 0;

  /* ===== Layout ===== */
  function layout() {
    const bs = Math.max(220, Math.min(innerWidth - 24, innerHeight - 230, 560));
    document.documentElement.style.setProperty("--bs", bs + "px");
    const dpr = Math.min(devicePixelRatio || 1, 2.5);
    size = Math.round(bs * dpr);
    cv.width = size;
    cv.height = size;
  }
  addEventListener("resize", layout);

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
    popped = null;
    prevHead = { ...snake[0] };
    parts = [];
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
    $("score").textContent = score;
    $("best").textContent = Math.max(score, best());
    $("lvl").textContent =
      mode === "time"
        ? Math.ceil(Math.max(0, CFG.timeAttack - elapsed)) + " s"
        : "TASO " + level;
    const ar = mode === "arcade";
    $("abil").classList.toggle("off", !ar);
    $("en").style.visibility = ar ? "visible" : "hidden";
    $("eni").style.width = energy + "%";
    $("shield").disabled =
      !ar || state !== "play" || energy < CFG.shieldCost || shield;
    $("slow").disabled = !ar || state !== "play" || energy < CFG.slowCost;
    $("shield").textContent = shield
      ? "🛡 Kilpi aktiivinen"
      : `🛡 Kilpi (${CFG.shieldCost})`;
  }

  function show(title, msg, btn) {
    $("ov").querySelector("h1").textContent = title;
    $("msg").textContent = msg;
    $("play").textContent = btn;
    $("ov").classList.remove("hide");
  }
  function start() {
    reset();
    state = "play";
    last = performance.now();
    $("ov").classList.add("hide");
    ui();
  }
  function finish(msg) {
    if (state !== "play") return;
    state = "over";
    saveBest();
    shake = CFG.shakeAmt * 1.6;
    beep(160, 0.35, "sawtooth", 0.06);
    buzz(120);
    burst(snake[0], 36, "#ff4f9a", 5);
    setTimeout(() => {
      if (state === "over")
        show(
          "Peli päättyi",
          `${msg} Pisteet ${score} · Ennätys ${best()}`,
          "Pelaa uudelleen",
        );
    }, 650);
    ui();
  }
  function pause() {
    if (state === "play") {
      state = "pause";
      show("Tauko", "Peli on pysäytetty.", "Jatka");
    } else if (state === "pause") {
      state = "play";
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

  function burst(p, n, color, sp = 3) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283,
        s = (0.3 + Math.random()) * sp;
      parts.push({
        x: p.x + 0.5,
        y: p.y + 0.5,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l: 1,
        c: color,
      });
    }
  }

  // palauttaa true jos törmäys jäi voimaan (peli päättyi)
  function hit(enemy) {
    if (mode === "arcade" && shield) {
      shield = false;
      shake = CFG.shakeAmt;
      beep(240, 0.15);
      buzz(40);
      if (enemy) {
        burst(enemy.p, 16, "#b678ff");
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

    const grow = same(next, food) || same(next, bonus);
    const body = snake.slice(0, grow ? snake.length : snake.length - 1);
    const en = enemies.find((e) => same(e.p, next));
    if (
      !inside(next) ||
      body.some((p) => same(p, next)) ||
      obstacles.some((p) => same(p, next)) ||
      en
    ) {
      if (hit(en)) return;
      if (!en) return; // kilpi imaisi törmäyksen seinään: pysy paikallaan
    }

    prevHead = { ...h };
    snake.unshift(next);

    if (same(next, food)) {
      score += 10;
      eaten++;
      energy = Math.min(100, energy + 12);
      beep(620, 0.06);
      buzz(8);
      burst(next, 12, "#3dffb0");
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
      if (mode !== "classic" && eaten % CFG.bonusEvery === 0) {
        bonus = emptyCell();
        bonusT = CFG.bonusLife;
      }
      food = emptyCell();
      popped = snake[snake.length - 1];
      if (!food) {
        finish("Täytit koko kentän!");
        return;
      }
    } else if (same(next, bonus)) {
      score += 30;
      energy = Math.min(100, energy + 25);
      bonus = null;
      beep(820, 0.12);
      buzz(15);
      burst(next, 18, "#ffd36b", 4);
      popped = snake[snake.length - 1];
    } else popped = snake.pop();

    if (mode === "arcade") {
      moveEnemies();
      const hd = snake[0];
      const en2 = enemies.find((e) => snake.some((s) => same(s, e.p))); // vihollinen liikkui madon päälle
      if (en2 && hit(en2)) return;
      void hd;
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

  /* ===== Rendering ===== */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  }

  function draw(alpha) {
    const u = size / N;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#0b1424");
    g.addColorStop(1, "#0a0f1c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const sx = (Math.random() - 0.5) * shake * u * 0.12,
      sy = (Math.random() - 0.5) * shake * u * 0.12;
    ctx.translate(sx, sy);

    // ruudukko
    ctx.fillStyle = "rgba(120,160,220,.10)";
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        ctx.beginPath();
        ctx.arc((x + 0.5) * u, (y + 0.5) * u, u * 0.045, 0, 6.283);
        ctx.fill();
      }

    // seinät (jos ei läpikulkua)
    if (!wrap) {
      ctx.strokeStyle = "rgba(255,79,154,.25)";
      ctx.lineWidth = u * 0.12;
      ctx.strokeRect(u * 0.06, u * 0.06, size - u * 0.12, size - u * 0.12);
    }

    // esteet
    for (const p of obstacles) {
      ctx.fillStyle = "#1c2a44";
      roundRect(
        p.x * u + u * 0.07,
        p.y * u + u * 0.07,
        u * 0.86,
        u * 0.86,
        u * 0.2,
      );
      ctx.fill();
      ctx.strokeStyle = "rgba(74,216,255,.35)";
      ctx.lineWidth = u * 0.05;
      ctx.stroke();
    }

    // hedelmät
    const pulse = 1 + Math.sin(T * 6) * 0.08;
    const orb = (p, c1, c2, r) => {
      const cx = (p.x + 0.5) * u,
        cy = (p.y + 0.5) * u;
      ctx.shadowColor = c1;
      ctx.shadowBlur = u * 0.9;
      const rg = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r,
      );
      rg.addColorStop(0, c2);
      rg.addColorStop(1, c1);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 6.283);
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    if (food) orb(food, "#ff4f9a", "#ffd0e4", u * 0.32 * pulse);
    if (bonus) {
      const frac = bonusT / CFG.bonusLife;
      if (frac > 0.3 || Math.sin(T * 18) > 0) {
        orb(bonus, "#ffb938", "#fff2b0", u * 0.38 * pulse);
        ctx.strokeStyle = "rgba(255,211,107,.8)";
        ctx.lineWidth = u * 0.08;
        ctx.beginPath();
        ctx.arc(
          (bonus.x + 0.5) * u,
          (bonus.y + 0.5) * u,
          u * 0.5,
          -Math.PI / 2,
          -Math.PI / 2 + 6.283 * frac,
        );
        ctx.stroke();
      }
    }

    // viholliset
    for (const e of enemies) {
      const cx = (e.p.x + 0.5) * u,
        cy = (e.p.y + 0.5) * u,
        r = u * 0.42;
      ctx.shadowColor = "#b678ff";
      ctx.shadowBlur = u * 0.8;
      ctx.fillStyle = "#8a4dff";
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - r * 0.4, cy - r * 0.12, r * 0.25, r * 0.25);
      ctx.fillRect(cx + r * 0.15, cy - r * 0.12, r * 0.25, r * 0.25);
    }

    // mato: pehmeä interpolointi
    const lerp = (a, b) => {
      if (Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1)
        return { x: b.x, y: b.y };
      return { x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha };
    };
    const hp = lerp(prevHead, snake[0]);
    const tl = snake[snake.length - 1];
    const tp = popped ? lerp(popped, tl) : tl;
    const pts = [hp, ...snake.slice(1, -1), tp];
    if (snake.length > 1) {
      const path = () => {
        ctx.beginPath();
        pts.forEach((p, i) => {
          const x = (p.x + 0.5) * u,
            y = (p.y + 0.5) * u;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
      };
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const sg = ctx.createLinearGradient(
        hp.x * u,
        hp.y * u,
        tp.x * u,
        tp.y * u,
      );
      sg.addColorStop(0, "#3dffb0");
      sg.addColorStop(1, "#2a9d8f");
      ctx.shadowColor = "#3dffb0";
      ctx.shadowBlur = u * 0.9;
      ctx.strokeStyle = sg;
      ctx.lineWidth = u * 0.74;
      path();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.lineWidth = u * 0.22;
      path();
      ctx.stroke();
    }
    // pää + silmät
    const hx = (hp.x + 0.5) * u,
      hy = (hp.y + 0.5) * u;
    ctx.fillStyle = "#7dffd0";
    ctx.beginPath();
    ctx.arc(hx, hy, u * 0.42, 0, 6.283);
    ctx.fill();
    if (shield) {
      ctx.strokeStyle = "#ffd36b";
      ctx.lineWidth = u * 0.1;
      ctx.shadowColor = "#ffd36b";
      ctx.shadowBlur = u * 0.6;
      ctx.beginPath();
      ctx.arc(hx, hy, u * 0.65, 0, 6.283);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    const px = -dir.y,
      py = dir.x;
    ctx.fillStyle = "#04201a";
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        hx + dir.x * u * 0.14 + px * s * u * 0.17,
        hy + dir.y * u * 0.14 + py * s * u * 0.17,
        u * 0.08,
        0,
        6.283,
      );
      ctx.fill();
    }

    // partikkelit
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.l);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x * u, p.y * u, u * 0.09 * p.l + 1, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // hidastuksen sävy
    if (mode === "arcade" && performance.now() < slowUntil) {
      ctx.fillStyle = "rgba(74,216,255,.07)";
      ctx.fillRect(0, 0, size, size);
    }
  }

  function frame(now) {
    const dt = Math.min(60, now - (last || now));
    last = now;
    T += dt / 1000;
    shake = Math.max(0, shake - dt * 0.03);
    for (const p of parts) {
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.l -= dt / 700;
    }
    parts = parts.filter((p) => p.l > 0);

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
    draw(state === "play" ? Math.min(1, acc / speed(now)) : 1);
    requestAnimationFrame(frame);
  }

  /* ===== Input ===== */
  const KM = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  addEventListener("keydown", (e) => {
    const d = KM[e.key] || KM[e.key.toLowerCase()];
    if (d) {
      e.preventDefault();
      turn(DIRS[d].x, DIRS[d].y);
    } else if (e.key === "p" || e.key === " " || e.key === "Escape") {
      e.preventDefault();
      pause();
    } else if (e.key === "Enter" && state !== "play") {
      state === "pause" ? pause() : start();
    } else if (e.key === "1") ability("shield");
    else if (e.key === "2") ability("slow");
  });

  // pyyhkäisy: reagoi heti kun sormi liikkuu tarpeeksi (nopea ohjaus)
  let tp = null;
  addEventListener(
    "touchstart",
    (e) => {
      if (e.target.closest("button")) return;
      tp = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true },
  );
  addEventListener(
    "touchmove",
    (e) => {
      if (!tp) return;
      const dx = e.touches[0].clientX - tp.x,
        dy = e.touches[0].clientY - tp.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      Math.abs(dx) > Math.abs(dy)
        ? turn(Math.sign(dx), 0)
        : turn(0, Math.sign(dy));
      tp = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    { passive: true },
  );
  addEventListener(
    "touchend",
    () => {
      tp = null;
    },
    { passive: true },
  );

  document.querySelectorAll("[data-m]").forEach(
    (b) =>
      (b.onclick = () => {
        mode = b.dataset.m;
        document
          .querySelectorAll("[data-m]")
          .forEach((i) => i.classList.toggle("on", i === b));
        state = "menu";
        reset();
      }),
  );
  document.querySelectorAll("[data-d]").forEach(
    (b) =>
      (b.onclick = () => {
        diff = b.dataset.d;
        document
          .querySelectorAll("[data-d]")
          .forEach((i) => i.classList.toggle("on", i === b));
        state = "menu";
        reset();
      }),
  );
  $("snd").onclick = () => {
    sound = !sound;
    $("snd").classList.toggle("on", sound);
    $("snd").textContent = "Äänet: " + (sound ? "päällä" : "pois");
  };
  $("wrp").onclick = () => {
    wrap = !wrap;
    $("wrp").classList.toggle("on", wrap);
    $("wrp").textContent = "Seinän läpi: " + (wrap ? "päällä" : "pois");
  };
  $("play").onclick = () => (state === "pause" ? pause() : start());
  $("pause").onclick = pause;
  $("shield").onclick = () => ability("shield");
  $("slow").onclick = () => ability("slow");
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "play") pause();
  });

  layout();
  reset();
  requestAnimationFrame(frame);
})();
