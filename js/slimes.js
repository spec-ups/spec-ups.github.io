/*
 * Mini slimes that drop from the sky behind a project page, land with a
 * squish, hop about a little and fade away. Tap one to bounce it back up.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Where the page has something solid or clickable, clicks go to that instead
  var SOLID = "a, button, input, textarea, select, label, dialog, video, iframe, " +
    ".detail-section, .card, .detail-media, .site-header, .site-footer";

  // Slime tints come from --bubble-1..3 (space-separated RGB) so they follow the theme
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    return ["--bubble-1", "--bubble-2", "--bubble-3"].map(function (v) {
      return cs.getPropertyValue(v).trim() || "150 120 200";
    });
  }

  function rgba(c, a) { return "rgb(" + c + " / " + a + ")"; }
  // Dark faces on light jelly, light faces on the darkest tints
  function faceFor(c) {
    var v = c.split(/\s+/).map(Number);
    return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 < 0.42 ? "#F6EAF2" : "#24163A";
  }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // A little jelly cube, drawn from its bottom centre and squashed by `q`
  function drawSlime(ctx, m, palette) {
    var c = palette[m.tint], s = m.size;
    var sy = 1 + m.q, sx = 1 / Math.sqrt(Math.max(0.3, sy));
    var w = s * sx, h = s * 0.9 * sy;
    ctx.save();
    ctx.globalAlpha = m.alpha;
    ctx.translate(m.x, m.y);
    ctx.rotate(m.tilt);

    var body = ctx.createLinearGradient(0, -h, 0, 0);
    body.addColorStop(0, rgba(c, 0.5));
    body.addColorStop(1, rgba(c, 0.85));
    roundRect(ctx, -w / 2, -h, w, h, s * 0.34);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(c, 0.95);
    ctx.stroke();

    // soft core and a shine
    roundRect(ctx, -w * 0.22, -h * 0.62, w * 0.44, h * 0.4, s * 0.1);
    ctx.fillStyle = rgba(c, 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-w * 0.22, -h * 0.76, s * 0.12, s * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    // face: "^ ^" when happy or squished, round eyes otherwise; "o" mouth while falling
    var ey = -h * 0.42, ex = w * 0.17, er = Math.max(1.3, s * 0.06), face = faceFor(c);
    ctx.fillStyle = face;
    ctx.strokeStyle = face;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1, s * 0.045);
    [-1, 1].forEach(function (d) {
      ctx.beginPath();
      if (m.happy > 0 || m.q < -0.15) {
        ctx.arc(d * ex, ey + er, er * 1.3, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else {
        ctx.arc(d * ex, ey, er, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(d * ex - er * 0.3, ey - er * 0.35, er * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.fillStyle = face;
      }
    });
    ctx.beginPath();
    if (m.state === "fall") {
      ctx.arc(0, ey + er * 2.4, er * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.arc(0, ey + er * 1.2, er * 1.1, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 150, 185, 0.45)";
    [-1, 1].forEach(function (d) {
      ctx.beginPath();
      ctx.ellipse(d * ex * 1.75, ey + er * 1.5, er * 1.1, er * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function sizeCanvas(canvas, ctx, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function field() {
    var canvas = document.createElement("canvas");
    canvas.className = "slime-field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, palette = readPalette(), slimes = [], raf = 0, last = 0;
    var GRAVITY = 900, MAX_FALL = 460;

    // (Re)start a slime above the top of the screen; `spread` staggers the first batch
    function spawn(m, spread) {
      m = m || {};
      m.size = 16 + Math.pow(Math.random(), 1.4) * 26;
      m.x = rand(m.size, W - m.size);
      m.y = reduceMotion ? H : -m.size - (spread ? Math.random() * H * 1.5 : Math.random() * 120);
      m.vx = rand(-15, 15);
      m.vy = rand(60, 140);
      m.q = 0; m.qv = 0;
      m.tilt = reduceMotion ? 0 : rand(-0.2, 0.2);
      m.spin = rand(-0.6, 0.6);
      m.tint = Math.floor(Math.random() * 3);
      m.alpha = 0.85;
      m.state = reduceMotion ? "rest" : "fall";
      m.hops = Math.floor(rand(1, 4));
      m.rest = 0; m.t = 0; m.happy = 0;
      return m;
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      sizeCanvas(canvas, ctx, W, H);
      var n = Math.max(6, Math.min(20, Math.round(W * H / 70000)));
      while (slimes.length < n) slimes.push(spawn(null, true));
      slimes.length = n;
      slimes.forEach(function (m) { if (m.x > W) m.x = rand(m.size, W - m.size); if (m.state === "rest") m.y = H; });
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      slimes.forEach(function (m) { drawSlime(ctx, m, palette); });
    }

    function hop(m, vy) {
      m.state = "hop";
      m.vy = vy;
      m.vx = (Math.random() < 0.5 ? -1 : 1) * rand(30, 80);
      m.qv += 2.5;
    }

    function step(dt) {
      slimes.forEach(function (m) {
        m.t += dt;
        m.happy -= dt;
        m.qv += (-260 * m.q - 9 * m.qv) * dt;
        m.q = Math.max(-0.5, Math.min(0.6, m.q + m.qv * dt));

        if (m.state === "fall" || m.state === "hop") {
          m.vy = Math.min(MAX_FALL, m.vy + GRAVITY * dt);
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.state === "fall") {
            m.tilt += m.spin * dt;
            m.x += Math.sin(m.t * 2 + m.size) * 14 * dt; // drift as it falls
          }
          if (m.x < m.size / 2 || m.x > W - m.size / 2) {
            m.x = Math.max(m.size / 2, Math.min(W - m.size / 2, m.x));
            m.vx = -m.vx;
          }
          if (m.y >= H) {
            // Land: squish, and bounce if it came down hard
            var impact = m.vy;
            m.y = H;
            m.tilt = 0;
            m.qv -= impact * 0.006;
            if (m.state === "fall" && impact > 260) {
              m.state = "hop";
              m.vy = -impact * 0.35;
              m.vx *= 0.6;
            } else {
              m.state = "rest";
              m.vx = m.vy = 0;
              m.rest = rand(0.3, 1.1);
            }
          }
        } else if (m.state === "rest") {
          m.rest -= dt;
          if (m.rest <= 0) {
            if (m.hops > 0) { m.hops--; hop(m, -rand(160, 280)); }
            else m.state = "fade";
          }
        } else {
          m.alpha -= dt * 1.2;
          if (m.alpha <= 0) spawn(m, false);
        }
      });
    }

    function frame(t) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      step(dt);
      draw();
    }

    // Topmost slime under a point
    function hit(x, y) {
      for (var i = slimes.length - 1; i >= 0; i--) {
        var m = slimes[i];
        if (m.alpha > 0.2 && Math.abs(x - m.x) < m.size * 0.6 && y < m.y + 4 && y > m.y - m.size * 1.05) return m;
      }
      return null;
    }
    function target(e) {
      var free = !(e.target.closest && e.target.closest(SOLID));
      return free ? hit(e.clientX, e.clientY) : null;
    }

    document.addEventListener("pointerdown", function (e) {
      var m = target(e);
      if (!m) return;
      m.happy = 1;
      m.alpha = 0.85;
      m.hops = Math.max(m.hops, 1);
      if (reduceMotion) { draw(); return; }
      hop(m, -rand(420, 540));
      m.qv -= 3;
    });
    document.addEventListener("pointermove", function (e) {
      document.documentElement.classList.toggle("over-slime", !!target(e));
    });

    // Follow the theme's tints
    new MutationObserver(function () {
      palette = readPalette();
      draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("resize", resize);
    resize();
    if (reduceMotion) return; // resting slimes along the bottom, no animation

    function update() {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", update);
    update();
  }

  window.LabSlimes = { field: field };
})();
