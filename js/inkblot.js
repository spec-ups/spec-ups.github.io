/*
 * Rorschach-style inkblots for the site background.
 * Each blot is random blobs on one half, roughened with an SVG noise
 * filter, then mirrored — so every visit gets new, symmetric blots.
 * The blobs drift slowly through the fixed noise field, so the ink
 * seeps and shifts while both halves stay mirrored.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var W = 400, H = 440, AXIS = W / 2;
  var uid = 0;

  // Small seeded PRNG so a blot can be reproduced from its seed
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function node(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function inkblot(seed) {
    var rand = rng(seed);
    var id = "ink" + (++uid);
    var blobs = [];

    // Each blob remembers its rest shape plus a slow, unique wobble.
    // `sway` limits sideways drift so blobs on the fold stay on it.
    function ellipse(parent, cx, cy, rx, ry, rot, sway) {
      var el = node("ellipse", {});
      parent.appendChild(el);
      blobs.push({
        el: el, cx: cx, cy: cy, rx: rx, ry: ry, rot: rot,
        ax: (3 + rand() * 9) * (sway == null ? 1 : sway),
        ay: 4 + rand() * 10,
        ar: 0.06 + rand() * 0.12,
        speed: 0.12 + rand() * 0.25,
        phase: rand() * Math.PI * 2,
        spin: -6 + rand() * 12
      });
    }
    var svg = node("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "xMidYMid meet" });

    // Noise-displaced edges, then a hard alpha threshold for crisp ink,
    // merged over a softer "bleed" halo like ink soaking into paper
    var filter = node("filter", { id: id, x: "-25%", y: "-25%", width: "150%", height: "150%" });
    filter.appendChild(node("feTurbulence", {
      type: "fractalNoise", baseFrequency: (0.025 + rand() * 0.02).toFixed(3),
      numOctaves: "3", seed: String(Math.floor(rand() * 1000)), result: "noise"
    }));
    filter.appendChild(node("feDisplacementMap", {
      "in": "SourceGraphic", in2: "noise", scale: String(24 + Math.floor(rand() * 16)),
      xChannelSelector: "R", yChannelSelector: "G", result: "rough"
    }));
    filter.appendChild(node("feGaussianBlur", { "in": "rough", stdDeviation: "4", result: "soft" }));
    var crisp = node("feComponentTransfer", { "in": "soft", result: "crisp" });
    crisp.appendChild(node("feFuncA", { type: "linear", slope: "14", intercept: "-6" }));
    filter.appendChild(crisp);
    var bleed = node("feComponentTransfer", { "in": "soft", result: "bleed" });
    bleed.appendChild(node("feFuncA", { type: "linear", slope: "1.2", intercept: "-0.05" }));
    filter.appendChild(bleed);
    var merge = node("feMerge", {});
    merge.appendChild(node("feMergeNode", { "in": "bleed" }));
    merge.appendChild(node("feMergeNode", { "in": "crisp" }));
    filter.appendChild(merge);

    var defs = node("defs", {});
    defs.appendChild(filter);
    svg.appendChild(defs);

    var half = node("g", {});
    var i, dx, cy, r;

    // Spine: blobs on the fold so the two halves join
    for (i = 0; i < 5; i++) {
      cy = 70 + rand() * 300;
      r = 14 + rand() * 30;
      ellipse(half, AXIS - rand() * 10, cy, r * 0.8, r * (1 + rand() * 0.6), 0, 0.2);
    }

    // Body: clustered masses that thin out away from the fold
    for (i = 0; i < 12; i++) {
      dx = Math.pow(rand(), 1.4) * 120;
      cy = 60 + rand() * 320;
      r = (16 + rand() * 42) * (1 - dx / 220);
      ellipse(half, AXIS - dx, cy, r * (0.7 + rand() * 0.6), r * (0.7 + rand() * 0.6), rand() * 180);
    }

    // Wings: a few large, angled lobes
    for (i = 0; i < 2 + Math.floor(rand() * 2); i++) {
      dx = 60 + rand() * 80;
      cy = 90 + rand() * 260;
      ellipse(half, AXIS - dx, cy, 30 + rand() * 40, 14 + rand() * 20, -60 + rand() * 120);
    }

    // Splatter: small drops flung outward
    for (i = 0; i < 10 + Math.floor(rand() * 8); i++) {
      dx = 110 + rand() * 80;
      cy = 30 + rand() * 380;
      r = 2 + rand() * 6;
      ellipse(half, AXIS - dx, cy, r, r * (0.8 + rand() * 0.5), 0);
    }

    var halfId = id + "h";
    half.setAttribute("id", halfId);
    var blot = node("g", { filter: "url(#" + id + ")", fill: "currentColor" });
    blot.appendChild(half);
    blot.appendChild(node("use", { href: "#" + halfId, transform: "translate(" + W + " 0) scale(-1 1)" }));
    svg.appendChild(blot);

    // Pose every blob at time t (seconds). `grow` (0..1) scales the ink
    // up from a small drop, for the spread-in when the page loads.
    function draw(t, grow) {
      blobs.forEach(function (b) {
        var a = t * b.speed + b.phase;
        var s = grow * (1 + b.ar * Math.sin(a * 1.3));
        var cx = b.cx + b.ax * Math.sin(a);
        var cy = b.cy + b.ay * Math.cos(a * 0.8);
        // pull blobs toward the middle of the fold while they grow
        cx = AXIS + (cx - AXIS) * (0.4 + 0.6 * grow);
        cy = H / 2 + (cy - H / 2) * (0.5 + 0.5 * grow);
        b.el.setAttribute("cx", cx.toFixed(1));
        b.el.setAttribute("cy", cy.toFixed(1));
        b.el.setAttribute("rx", Math.max(0, b.rx * s).toFixed(1));
        b.el.setAttribute("ry", Math.max(0, b.ry * s * (1 - b.ar * 0.5 * Math.sin(a))).toFixed(1));
        b.el.setAttribute("transform", "rotate(" + (b.rot + b.spin * Math.sin(a * 0.6)).toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")");
      });
    }

    draw(0, 1);
    return { svg: svg, draw: draw };
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SPREAD = 2.6; // seconds for the ink to spread in on load
  var FRAME = 1000 / 24; // the ink moves slowly, so 24fps is plenty

  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }

  // Blots are scattered down the whole page, one every GAP pixels on
  // alternating sides, and more are added as the page grows. The seed and
  // elapsed time are kept for the session, so moving between pages carries
  // on with the same blots mid-drift instead of spreading in new ones.
  var KEY = "inkblots";
  var GAP = 640;

  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY));
      if (s && typeof s.seed === "number" && typeof s.t === "number") return s;
    } catch (e) {}
    return null;
  }

  document.querySelectorAll("[data-inkblots]").forEach(function (host) {
    var saved = load();
    var seed = saved ? saved.seed : Math.floor(Math.random() * 1e9);
    var t = saved ? saved.t : 0;
    var blots = [], onScreen = [];
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.inkblot.visible = e.isIntersecting; });
      onScreen = blots.filter(function (b) { return b.visible; });
    }, { rootMargin: "200px 0px" }) : null;

    function pose(time, list) {
      var grow = easeOut(Math.min(1, time / SPREAD));
      list.forEach(function (b) { b.draw(time, grow); });
    }

    // Blot i always gets the same shape and spot, whichever page it's on
    function add(i) {
      var rand = rng(seed + i * 7919);
      var blot = inkblot(Math.floor(rand() * 1e9));
      var side = i % 2 ? "left" : "right";
      var svg = blot.svg;
      svg.setAttribute("class", "inkblot inkblot-" + side);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.style.top = Math.round(i * GAP + (i ? rand() * GAP * 0.4 : 24)) + "px";
      svg.style.setProperty("--size", (0.55 + rand() * 0.45).toFixed(2));
      svg.style.setProperty("--tilt", (-12 + rand() * 24).toFixed(1) + "deg");
      svg.style.setProperty("--fade", (0.6 + rand() * 0.4).toFixed(2));
      svg.inkblot = blot;
      blot.visible = !io;
      host.appendChild(svg);
      pose(t, [blot]);
      if (io) io.observe(svg); else onScreen.push(blot);
      blots.push(blot);
    }

    function fill() {
      var need = Math.ceil(host.offsetHeight / GAP);
      while (blots.length < need) add(blots.length);
    }

    function save() {
      try { sessionStorage.setItem(KEY, JSON.stringify({ seed: seed, t: t })); } catch (e) {}
    }

    if (reduceMotion) t = Math.max(t, SPREAD); // stay as still blots
    fill();
    if ("ResizeObserver" in window) new ResizeObserver(fill).observe(document.body);
    save();
    if (reduceMotion) return;

    var t0 = t, start = 0, last = 0, raf = 0, running = false;

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME) return;
      last = now;
      t = t0 + (now - start) / 1000;
      pose(t, onScreen);
    }

    // Only animate while the tab is visible; the clock pauses while hidden
    function update() {
      if (!document.hidden && !running) {
        t0 = t;
        start = performance.now();
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (document.hidden && running) {
        running = false;
        cancelAnimationFrame(raf);
        save();
      }
    }

    document.addEventListener("visibilitychange", update);
    window.addEventListener("pagehide", save);
    update();
  });

  window.LabInkblot = inkblot;
})();
