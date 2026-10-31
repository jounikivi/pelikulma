(() => {
  "use strict";
  /* ===== CONFIG: säädä tästä ===== */
  const CFG = {
    W: 360, // logiikan leveys
    orbitSpeed: 2.7, // rad/s
    launchSpeed: 430, // px/s
    ringPad: 30, // kiertoradan etäisyys planeetan pinnasta
    captureSlack: 11, // kuinka kaukaa kiertorata nappaa
    perfectBand: 7, // "täydellinen" nappaus
    planetR: [14, 26],
    gapY: [140, 205],
    marginX: 62,
    tideStart: 330, // vuoroveden etäisyys alussa
    tideBase: 26, // px/s
    tideGain: 1.1, // lisänopeus per piste
    tideMax: 120,
    shakeDecay: 9,
    trailLen: 26,
  };

  const cv = document.getElementById("c"),
    ctx = cv.getContext("2d");
  let S = 1,
    H = 640,
    W = CFG.W,
    dpr = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let state = "menu",
    t = 0,
    shake = 0,
    flash = 0;
  let planets,
    ship,
    parts,
    trail,
    stars,
    camY,
    tideY,
    score,
    combo,
    best = 0,
    newBest = false;
  try {
    best = +localStorage.getItem("loiste-best") || 0;
  } catch {}

  const $ = (id) => document.getElementById(id);
  let launched = false,
    sound = true;
  try {
    sound = localStorage.getItem("pelikulma-loiste-sound") !== "off";
  } catch {}
  $("sound").checked = sound;
  function resize() {
    const field = $("playfield");
    const width = field.clientWidth,
      height = field.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    if (
      cv.width === Math.round(width * ratio) &&
      cv.height === Math.round(height * ratio)
    )
      return;
    const previousH = H;
    dpr = ratio;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    S = Math.max(0.01, Math.min(width / W, height / 520));
    H = height / S;
    if (ship) {
      camY -= (H - previousH) * 0.62;
      if (state === "play") pause();
    }
  }
  new ResizeObserver(resize).observe($("playfield"));

  function setText(id, text) {
    if ($(id).textContent !== String(text)) $(id).textContent = text;
  }
  function ui() {
    setText("score", score);
    setText("best", Math.max(score, best));
    $("pause").disabled = state !== "play";
    $("launch").disabled = state !== "play" || ship.flying;
    setText("launch", ship.flying ? "Lennossa…" : "Lennä ↑");
    setText(
      "flight-hint",
      !launched
        ? "Tähtää rauhassa. Pimeys odottaa ensimmäistä lähtöä."
        : ship.flying
          ? "Kohti seuraavaa kiertorataa!"
          : "Odota sopivaa suuntaa ja napauta.",
    );
  }
  function show(title, message, button) {
    setText("dialog-title", title);
    setText("msg", message);
    setText("play", button);
    $("instructions").hidden = state !== "menu";
    $("result").hidden = state !== "dead";
    $("restart").hidden = state !== "pause";
    setText("result-score", score);
    setText("result-best", best);
    $("ov").classList.remove("hide");
    ui();
  }
  function start() {
    reset();
    state = "play";
    last = performance.now();
    $("ov").classList.add("hide");
    beep(440, 0.15);
    ui();
  }
  function pause() {
    if (state === "play") {
      state = "pause";
      show(
        "Tauko",
        "Jatka siitä, mihin jäit, tai aloita uusi peli.",
        "Jatka peliä",
      );
    } else if (state === "pause") {
      state = "play";
      last = performance.now();
      $("ov").classList.add("hide");
      ui();
    }
  }

  /* ===== Ääni ===== */
  let ac;
  function beep(f, d = 0.1, type = "triangle", v = 0.06) {
    if (!sound) return;
    try {
      ac ||= new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, ac.currentTime + d);
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

  /* ===== Maailma ===== */
  function addPlanet() {
    const last = planets[planets.length - 1];
    const r = rnd(...CFG.planetR);
    planets.push({
      x: rnd(CFG.marginX, W - CFG.marginX),
      y: last.y - rnd(...CFG.gapY),
      r,
      orbit: r + CFG.ringPad,
      hue: rnd(0, 360),
      pulse: 0,
    });
  }

  function reset() {
    const r = 20;
    planets = [
      { x: W / 2, y: 0, r, orbit: r + CFG.ringPad, hue: 190, pulse: 0 },
    ];
    while (planets.length < 7) addPlanet();
    ship = {
      x: W / 2 + planets[0].orbit,
      y: 0,
      vx: 0,
      vy: 0,
      planet: planets[0],
      ang: 0,
      dir: 1,
      rr: planets[0].orbit,
      ignore: null,
      flying: false,
    };
    parts = [];
    trail = [];
    stars = Array.from({ length: 70 }, () => ({
      x: rnd(0, W),
      y: rnd(0, 900),
      z: rnd(0.15, 0.8),
    }));
    camY = -H * 0.62;
    tideY = CFG.tideStart;
    score = 0;
    launched = false;
    combo = 0;
    newBest = false;
    shake = 0;
  }

  function burst(x, y, n, hue, sp = 160) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283),
        s = rnd(sp * 0.3, sp);
      parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l: 1,
        d: rnd(1.2, 2.4),
        h: hue + rnd(-20, 20),
      });
    }
  }

  function tap() {
    if (state !== "play" || ship.flying) return;
    launched = true;
    const p = ship.planet,
      tx = -Math.sin(ship.ang) * ship.dir,
      ty = Math.cos(ship.ang) * ship.dir;
    ship.vx = tx * CFG.launchSpeed;
    ship.vy = ty * CFG.launchSpeed;
    ship.flying = true;
    ship.ignore = p;
    p.pulse = 1;
    burst(ship.x, ship.y, 8, p.hue, 120);
    beep(300, 0.09, "square", 0.03);
    buzz(8);
    ui();
  }

  function die() {
    state = "dead";
    shake = 18;
    flash = 1;
    burst(ship.x, ship.y, 40, 330, 300);
    beep(150, 0.5, "sawtooth", 0.07);
    buzz(120);
    if (score > best) {
      best = score;
      newBest = true;
      try {
        localStorage.setItem("loiste-best", best);
      } catch {}
    }
    show(
      newBest ? "Uusi ennätys!" : "Sammuit",
      "Uusi lento, uusi mahdollisuus. Kokeile uudelleen!",
      "Pelaa uudelleen",
    );
  }

  function update(dt) {
    if (state === "pause") return;
    t += dt;
    shake = Math.max(0, shake - CFG.shakeDecay * dt * 3);
    flash = Math.max(0, flash - dt * 3);
    for (const p of planets) p.pulse = Math.max(0, p.pulse - dt * 3);
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.l -= p.d * dt;
    }
    parts = parts.filter((p) => p.l > 0);
    if (state !== "play") return;

    if (ship.flying) {
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      if (
        ship.ignore &&
        Math.hypot(ship.x - ship.ignore.x, ship.y - ship.ignore.y) >
          ship.ignore.orbit + 40
      )
        ship.ignore = null;
      for (const p of planets) {
        if (p === ship.ignore) continue;
        const rx = ship.x - p.x,
          ry = ship.y - p.y,
          d = Math.hypot(rx, ry);
        if (d < p.orbit + CFG.captureSlack) {
          const perfect = Math.abs(d - p.orbit) < CFG.perfectBand;
          ship.dir = rx * ship.vy - ry * ship.vx > 0 ? 1 : -1;
          ship.ang = Math.atan2(ry, rx);
          ship.rr = Math.max(d, p.r + 8);
          ship.planet = p;
          ship.flying = false;
          if (
            planets.indexOf(p) > planets.indexOf(ship.ignore || ship.planet) ||
            true
          ) {
            const idx = planets.indexOf(p),
              prev = planets.indexOf(ship.lastPlanet || planets[0]);
            if (idx > prev) {
              combo = perfect ? combo + 1 : 0;
              score += 1 + combo;
              p.pulse = 1;
              shake = Math.min(8, 2 + combo);
              burst(p.x, p.y, 14 + combo * 3, p.hue, 200);
              beep(420 + combo * 70, 0.14);
              buzz(perfect ? 20 : 10);
            }
            ship.lastPlanet = p;
          }
          break;
        }
      }
      if (ship.x < -50 || ship.x > W + 50 || ship.y > camY + H + 40)
        return die();
    } else {
      const p = ship.planet;
      ship.ang += ship.dir * CFG.orbitSpeed * dt;
      ship.rr += (p.orbit - ship.rr) * Math.min(1, dt * 8);
      ship.x = p.x + Math.cos(ship.ang) * ship.rr;
      ship.y = p.y + Math.sin(ship.ang) * ship.rr;
    }

    trail.push({ x: ship.x, y: ship.y });
    if (trail.length > CFG.trailLen) trail.shift();

    if (launched)
      tideY -= Math.min(CFG.tideMax, CFG.tideBase + score * CFG.tideGain) * dt;
    if (ship.y > tideY) return die();

    camY += (Math.min(camY, ship.y - H * 0.62) - camY) * Math.min(1, dt * 5);
    while (planets[planets.length - 1].y > camY - 300) addPlanet();
    while (
      planets.length > 4 &&
      planets[0].y > camY + H + 250 &&
      planets[0] !== ship.planet
    )
      planets.shift();
  }

  /* ===== Piirto ===== */
  const sy = (y) => y - camY;
  function glow(x, y, r, h, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${h},90%,65%,${a})`);
    g.addColorStop(1, `hsla(${h},90%,50%,0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
  }

  function text(s, x, y, size, color, align = "center", weight = 700) {
    ctx.font = `${weight} ${size}px system-ui,-apple-system,Segoe UI,sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * S, 0, 0, dpr * S, (cv.width - W * dpr * S) / 2, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b0a24");
    g.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const y = (((s.y - camY * s.z) % H) + H) % H;
      ctx.fillStyle = `rgba(200,210,255,${s.z})`;
      ctx.fillRect(s.x, y, s.z * 2.4, s.z * 2.4);
    }

    const sx = (Math.random() - 0.5) * shake,
      sh = (Math.random() - 0.5) * shake;
    ctx.save();
    ctx.translate(sx, sh);

    for (const p of planets) {
      const y = sy(p.y);
      if (y < -80 || y > H + 80) continue;
      const active = state === "play" && ship.planet === p && !ship.flying;
      glow(p.x, y, p.r * 3 + p.pulse * 30, p.hue, 0.25 + p.pulse * 0.4);
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeStyle = `hsla(${p.hue},80%,70%,${active ? 0.8 : 0.25})`;
      ctx.setLineDash(active ? [] : [4, 6]);
      ctx.beginPath();
      ctx.arc(p.x, y, p.orbit, 0, 6.283);
      ctx.stroke();
      ctx.setLineDash([]);
      const pg = ctx.createRadialGradient(
        p.x - p.r * 0.35,
        y - p.r * 0.35,
        p.r * 0.1,
        p.x,
        y,
        p.r,
      );
      pg.addColorStop(0, `hsl(${p.hue},85%,75%)`);
      pg.addColorStop(1, `hsl(${p.hue + 30},70%,28%)`);
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(p.x, y, p.r, 0, 6.283);
      ctx.fill();
    }

    if (state !== "menu") {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < trail.length; i++) {
        const k = i / trail.length,
          q = trail[i];
        glow(q.x, sy(q.y), 2 + k * 6, 185, k * 0.5);
      }
      if (state === "play" || state === "pause") {
        if (!ship.flying) {
          const tx = -Math.sin(ship.ang) * ship.dir,
            ty = Math.cos(ship.ang) * ship.dir;
          ctx.strokeStyle = "rgba(180,255,255,.25)";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 8]);
          ctx.beginPath();
          ctx.moveTo(ship.x, sy(ship.y));
          ctx.lineTo(ship.x + tx * 260, sy(ship.y + ty * 260));
          ctx.stroke();
          ctx.setLineDash([]);
        }
        glow(ship.x, sy(ship.y), 20, 185, 0.8);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ship.x, sy(ship.y), 4.5, 0, 6.283);
        ctx.fill();
      }
      for (const p of parts) glow(p.x, sy(p.y), 3 + p.l * 5, p.h, p.l);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();

    /* Vuorovesi: pimeys joka nousee */
    if (state !== "menu") {
      const ty = sy(tideY);
      ctx.beginPath();
      ctx.moveTo(0, H + 10);
      ctx.lineTo(0, ty);
      for (let x = 0; x <= W; x += 12)
        ctx.lineTo(
          x,
          ty + Math.sin(x * 0.04 + t * 2.2) * 7 + Math.sin(x * 0.1 - t * 3) * 3,
        );
      ctx.lineTo(W, H + 10);
      ctx.closePath();
      const tg = ctx.createLinearGradient(0, ty - 10, 0, ty + 160);
      tg.addColorStop(0, "rgba(255,50,140,.55)");
      tg.addColorStop(0.12, "#120418");
      tg.addColorStop(1, "#04020a");
      ctx.fillStyle = tg;
      ctx.fill();
    }

    // Menus and results are DOM controls, so their text scales and scrolls.
    if (state === "play" && combo > 1) {
      text("×" + (combo + 1) + " KOMBO", W / 2, 34, 14, "#7ff");
    }
  }

  /* ===== Silmukka & syöte ===== */
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    ui();
    draw();
    requestAnimationFrame(frame);
  }
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tap();
  });
  $("play").onclick = () => (state === "pause" ? pause() : start());
  $("restart").onclick = start;
  $("pause").onclick = pause;
  $("launch").onclick = tap;
  $("sound").onchange = () => {
    sound = $("sound").checked;
    try {
      localStorage.setItem("pelikulma-loiste-sound", sound ? "on" : "off");
    } catch {}
  };
  addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.key === "Escape" || e.key.toLowerCase() === "p") {
      e.preventDefault();
      pause();
      return;
    }
    if (e.target.closest("button,input,a,summary")) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (state === "play") tap();
      else if (state === "pause") pause();
      else start();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "play") pause();
    last = performance.now();
  });

  resize();
  reset();
  ui();
  requestAnimationFrame(frame);
})();
