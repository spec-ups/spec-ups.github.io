/* Home page: cycling headline, stats and the project grid. */
(function () {
  "use strict";

  var Lab = window.Lab;
  var projects = Lab.projects;

  /* ---------- Cycling headline ---------- */
  var WORDS = ["games", "apps", "experiments", "tiny tools", "weird ideas"];
  var typed = document.getElementById("typed");

  if (!Lab.reduceMotion) {
    var wi = 0, ci = WORDS[0].length, deleting = true;
    var tick = function () {
      var word = WORDS[wi];
      if (deleting) {
        ci--;
        typed.textContent = word.slice(0, ci);
        if (ci === 0) { deleting = false; wi = (wi + 1) % WORDS.length; return setTimeout(tick, 300); }
        return setTimeout(tick, 45);
      }
      ci++;
      typed.textContent = WORDS[wi].slice(0, ci);
      if (ci === WORDS[wi].length) { deleting = true; return setTimeout(tick, 2200); }
      setTimeout(tick, 70 + Math.random() * 60);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Stats (count up when visible) ---------- */
  function countUp(node, target) {
    if (Lab.reduceMotion || target === 0) { node.textContent = target; return; }
    var start = null, dur = 900;
    requestAnimationFrame(function step(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / dur);
      node.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    });
    // Land on the real number even if frames are throttled (e.g. background tab)
    setTimeout(function () { node.textContent = target; }, dur + 200);
  }

  var statNodes = document.querySelectorAll("[data-stat]");
  function runStats() {
    statNodes.forEach(function (node) {
      var key = node.dataset.stat;
      countUp(node, key === "all"
        ? projects.length
        : projects.filter(function (p) { return p.category === key; }).length);
    });
  }

  if ("IntersectionObserver" in window) {
    var statsObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { runStats(); statsObserver.disconnect(); }
    });
    statsObserver.observe(document.querySelector(".stats"));
  } else {
    runStats();
  }

  /* ---------- Project grid ---------- */
  var grid = document.getElementById("project-grid");
  var empty = document.getElementById("empty-state");

  function render(filter) {
    var list = projects.filter(function (p) { return filter === "all" || p.category === filter; });
    grid.replaceChildren.apply(grid, list.map(Lab.renderCard));
    empty.hidden = list.length > 0;
  }

  document.querySelectorAll(".chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".chip").forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", String(active));
      });
      render(chip.dataset.filter);
    });
  });

  render("all");
})();
