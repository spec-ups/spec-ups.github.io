/*
 * Bubble burst used by the easter egg (Konami code / logo clicks), and a
 * field of poppable bubbles that project pages can use as their background.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Bubble tints come from --bubble-1..3 (space-separated RGB) so they follow the theme
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    return ["--bubble-1", "--bubble-2", "--bubble-3"].map(function (v) {
      return cs.getPropertyValue(v).trim() || "150 120 200";
    });
  }

  function rgba(c, a) { return "rgb(" + c + " / " + a + ")"; }

  function drawBubble(ctx, b, palette) {
    var c = palette[b.tint];
    var g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
    g.addColorStop(0, rgba(c, 0.04 * b.alpha));
    g.addColorStop(0.7, rgba(c, 0.12 * b.alpha));
    g.addColorStop(1, rgba(c, 0.38 * b.alpha));
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgba(c, 0.55 * b.alpha);
    ctx.stroke();
    // specular highlight
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, Math.PI * 1.05, Math.PI * 1.6);
    ctx.lineWidth = Math.max(1.2, b.r * 0.1);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, " + (0.7 * b.alpha) + ")";
    ctx.stroke();
  }

  function makePop(b) {
    var drops = [];
    var n = 6 + Math.floor(b.r / 8);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      var s = 1.2 + Math.random() * 2.2;
      drops.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1 + Math.random() * 2 });
    }
    return { x: b.x, y: b.y, r: b.r, tint: b.tint, t: 0, drops: drops };
  }

  function drawPop(ctx, p, palette) {
    var c = palette[p.tint];
    var k = p.t / 28;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (1 + k * 0.8), 0, Math.PI * 2);
    ctx.lineWidth = 2 * (1 - k);
    ctx.strokeStyle = rgba(c, 0.6 * (1 - k));
    ctx.stroke();
    p.drops.forEach(function (d) {
      d.x += d.vx; d.y += d.vy; d.vy += 0.08;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (1 - k), 0, Math.PI * 2);
      ctx.fillStyle = rgba(c, 0.8 * (1 - k));
      ctx.fill();
    });
    p.t++;
    return p.t < 28;
  }

  function sizeCanvas(canvas, ctx, w, h) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Full-screen burst ---------- */
  function burst(originX, originY) {
    if (reduceMotion) return;
    var canvas = document.createElement("canvas");
    canvas.className = "burst-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = window.innerWidth, H = window.innerHeight, palette = readPalette();
    sizeCanvas(canvas, ctx, W, H);

    var x0 = originX != null ? originX : W / 2;
    var y0 = originY != null ? originY : H / 2;
    var bubbles = [], pops = [];
    for (var i = 0; i < 90; i++) {
      var a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 9;
      bubbles.push({
        x: x0, y: y0, r: 6 + Math.random() * 26,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3,
        life: 50 + Math.random() * 90, tint: i % 3, alpha: 1
      });
    }

    (function frame() {
      ctx.clearRect(0, 0, W, H);
      bubbles = bubbles.filter(function (b) {
        b.vx *= 0.97; b.vy = b.vy * 0.97 - 0.06;
        b.x += b.vx; b.y += b.vy;
        if (--b.life <= 0) { pops.push(makePop(b)); return false; }
        drawBubble(ctx, b, palette);
        return true;
      });
      pops = pops.filter(function (p) { return drawPop(ctx, p, palette); });
      if (bubbles.length || pops.length) requestAnimationFrame(frame);
      else canvas.remove();
    })();
  }

  /* ---------- Poppable background field ---------- */
  // Bubbles rise slowly behind the page; tap one, or swipe through a few,
  // to pop it. Popped bubbles come back from the bottom.
  // Where the page has something solid or clickable, clicks go to that instead.
  var SOLID = "a, button, input, textarea, select, label, dialog, video, iframe, " +
    ".detail-section, .card, .detail-media, .site-header, .site-footer";

  function field() {
    var canvas = document.createElement("canvas");
    canvas.className = "bubble-field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, palette = readPalette();
    var bubbles = [], pops = [], raf = 0, last = 0, dragging = false;

    // (Re)start a bubble: anywhere on screen, or just below the bottom edge
    function spawn(b, anywhere) {
      b = b || {};
      b.r = 8 + Math.pow(Math.random(), 1.5) * 30;
      b.baseX = Math.random() * W;
      b.x = b.baseX;
      b.y = anywhere ? Math.random() * H : H + b.r + Math.random() * H * 0.3;
      b.vy = 14 + b.r * 1.1 + Math.random() * 14; // px per second; big ones rise faster
      b.phase = Math.random() * Math.PI * 2;
      b.freq = 0.6 + Math.random() * 0.8;
      b.sway = 4 + Math.random() * 12;
      b.tint = Math.floor(Math.random() * 3);
      b.alpha = 0.45 + Math.random() * 0.3;
      return b;
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      sizeCanvas(canvas, ctx, W, H);
      var n = Math.max(10, Math.min(32, Math.round(W * H / 55000)));
      while (bubbles.length < n) bubbles.push(spawn(null, true));
      bubbles.length = n;
      bubbles.forEach(function (b) { if (b.baseX > W) b.baseX = Math.random() * W; });
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      bubbles.forEach(function (b) { drawBubble(ctx, b, palette); });
      pops = pops.filter(function (p) { return drawPop(ctx, p, palette); });
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      bubbles.forEach(function (b) {
        b.y -= b.vy * dt;
        b.phase += b.freq * dt;
        b.x = b.baseX + Math.sin(b.phase) * b.sway;
        if (b.y < -b.r) spawn(b, false);
      });
      draw();
    }

    // Topmost bubble under a point, with a little slack for fingers
    function hit(x, y) {
      for (var i = bubbles.length - 1; i >= 0; i--) {
        var b = bubbles[i], dx = x - b.x, dy = y - b.y, r = b.r + 4;
        if (dx * dx + dy * dy < r * r) return b;
      }
      return null;
    }

    function pop(b) {
      if (reduceMotion) { spawn(b, true); draw(); return; }
      pops.push(makePop(b));
      spawn(b, false);
    }

    function target(e) {
      var free = !(e.target.closest && e.target.closest(SOLID));
      return free ? hit(e.clientX, e.clientY) : null;
    }

    document.addEventListener("pointerdown", function (e) {
      var b = target(e);
      dragging = true;
      if (b) pop(b);
    });
    document.addEventListener("pointermove", function (e) {
      var b = target(e);
      document.documentElement.classList.toggle("over-bubble", !!b);
      if (b && dragging && e.buttons) pop(b);
    });
    ["pointerup", "pointercancel"].forEach(function (type) {
      document.addEventListener(type, function () { dragging = false; });
    });

    // Follow the theme's bubble tints
    new MutationObserver(function () {
      palette = readPalette();
      draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("resize", resize);
    resize();
    if (reduceMotion) return; // still bubbles, popped without animation

    function update() {
      cancelAnimationFrame(raf);
      last = 0;
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", update);
    update();
  }

  window.LabBubbles = { burst: burst, field: field };
})();
