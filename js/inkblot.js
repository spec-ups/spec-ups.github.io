/*
 * Rorschach-style inkblots for the hero background.
 * Each blot is random blobs on one half, roughened with an SVG noise
 * filter, then mirrored — so every visit gets a new, symmetric blot.
 * Static: nothing here animates.
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

  function ellipse(parent, cx, cy, rx, ry, rot) {
    parent.appendChild(node("ellipse", {
      cx: cx.toFixed(1), cy: cy.toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1),
      transform: "rotate(" + rot.toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")"
    }));
  }

  function inkblot(seed) {
    var rand = rng(seed);
    var id = "ink" + (++uid);
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
      ellipse(half, AXIS - rand() * 10, cy, r * 0.8, r * (1 + rand() * 0.6), 0);
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
    return svg;
  }

  document.querySelectorAll("[data-inkblots]").forEach(function (host) {
    ["inkblot inkblot-a", "inkblot inkblot-b"].forEach(function (cls) {
      var svg = inkblot(Math.floor(Math.random() * 1e9));
      svg.setAttribute("class", cls);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      host.appendChild(svg);
    });
  });

  window.LabInkblot = inkblot;
})();
