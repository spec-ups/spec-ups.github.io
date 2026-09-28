/*
 * Bubble burst used by the easter egg (Konami code / logo clicks).
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

  window.LabBubbles = { burst: burst };
})();
