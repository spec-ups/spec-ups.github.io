/*
 * Shared behaviour for every page: theme, cards, player pop-up, scroll
 * reveal, magnetic buttons, cursor spotlight, easter egg and the chat.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var projects = window.PROJECTS || [];
  var config = window.LAB_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function findProject(id) {
    for (var i = 0; i < projects.length; i++) if (projects[i].id === id) return projects[i];
    return null;
  }

  function isExternal(url) { return /^https?:\/\//.test(url || ""); }
  function canEmbed(p) { return p.embed != null ? p.embed : !isExternal(p.url); }

  /* ---------- Theme ---------- */
  var toggle = document.querySelector(".theme-toggle");

  function setTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (toggle) toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    if (persist) {
      try { localStorage.setItem("theme", theme); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  setTheme(root.getAttribute("data-theme") || "light", false);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      if (!document.startViewTransition || reduceMotion) { setTheme(next, true); return; }

      // Reveal the new theme as a circle growing out of the toggle
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("theme-switching");
      var t = document.startViewTransition(function () { setTheme(next, true); });
      t.ready.then(function () {
        root.animate(
          { clipPath: ["circle(0 at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
          { duration: 600, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
        );
      });
      t.finished.then(function () { root.classList.remove("theme-switching"); });
    });
  }

  // Follow the OS setting until the visitor picks a theme themselves
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (err) {}
    if (!saved) setTheme(e.matches ? "dark" : "light", false);
  });

  /* ---------- Scroll reveal ---------- */
  var revealObserver = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;

  function reveal(node) {
    if (revealObserver) revealObserver.observe(node);
    else node.classList.add("is-visible");
  }

  document.querySelectorAll(".reveal").forEach(reveal);

  /* ---------- Magnetic buttons ---------- */
  function magnetize(node) {
    if (!finePointer || reduceMotion) return;
    node.addEventListener("pointermove", function (e) {
      var r = node.getBoundingClientRect();
      node.style.setProperty("--tx", ((e.clientX - r.left - r.width / 2) * 0.25) + "px");
      node.style.setProperty("--ty", ((e.clientY - r.top - r.height / 2) * 0.35) + "px");
    });
    node.addEventListener("pointerleave", function () {
      node.style.setProperty("--tx", "0px");
      node.style.setProperty("--ty", "0px");
    });
  }

  document.querySelectorAll("[data-magnetic]").forEach(magnetize);

  /* ---------- Cursor spotlight ---------- */
  if (finePointer && !reduceMotion) {
    var spot = el("div", "spotlight");
    spot.setAttribute("aria-hidden", "true");
    document.body.appendChild(spot);
    var sx = 0, sy = 0, pending = false;
    window.addEventListener("pointermove", function (e) {
      sx = e.clientX; sy = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        spot.style.setProperty("--x", sx + "px");
        spot.style.setProperty("--y", sy + "px");
        spot.classList.add("is-on");
        pending = false;
      });
    }, { passive: true });
    document.addEventListener("pointerleave", function () { spot.classList.remove("is-on"); });
  }

  /* ---------- Player pop-up ---------- */
  var player = null;

  function buildPlayer() {
    player = el("dialog", "player");
    player.setAttribute("aria-labelledby", "player-title");
    player.innerHTML =
      '<div class="player-bar">' +
        '<span class="player-title" id="player-title"></span>' +
        '<a class="player-open" target="_blank" rel="noopener">Open full screen <span aria-hidden="true">↗</span></a>' +
        '<button class="player-close" type="button" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="player-frame"><iframe allow="autoplay; fullscreen; gamepad; clipboard-write"></iframe></div>';
    document.body.appendChild(player);

    player.querySelector(".player-close").addEventListener("click", function () { player.close(); });
    // Click on the backdrop closes it
    player.addEventListener("click", function (e) { if (e.target === player) player.close(); });
    // Unload the project so its sound stops
    player.addEventListener("close", function () {
      player.querySelector("iframe").src = "about:blank";
      document.body.classList.remove("no-scroll");
    });
  }

  function openPlayer(id) {
    var p = findProject(id);
    if (!p) return;
    if (!canEmbed(p) || typeof HTMLDialogElement === "undefined") {
      window.open(p.url, "_blank", "noopener");
      return;
    }
    if (!player) buildPlayer();
    player.querySelector(".player-title").textContent = p.title;
    player.querySelector(".player-open").href = p.url;
    var frame = player.querySelector("iframe");
    frame.title = p.title;
    frame.src = p.url;
    document.body.classList.add("no-scroll");
    player.showModal();
    frame.focus();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-play]");
    if (!btn) return;
    e.preventDefault();
    openPlayer(btn.getAttribute("data-play"));
  });

  /* ---------- Project cards ---------- */
  var LABELS = { game: "Game", app: "App", experiment: "Experiment" };

  // Palette-derived gradients for thumbnails without an image
  var GRADIENTS = [
    "linear-gradient(135deg, #6D6CD0, #7537B0)",
    "linear-gradient(135deg, #7537B0, #D68B8A)",
    "linear-gradient(135deg, #724B91, #DFBED3)",
    "linear-gradient(135deg, #D68B8A, #6D6CD0)",
    "linear-gradient(135deg, #1C1A23, #724B91)"
  ];

  function thumbFor(p, className) {
    var i = Math.max(0, projects.indexOf(p));
    var thumb = el("div", className);
    if (p.image) {
      var img = el("img");
      img.src = p.image;
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
    } else {
      thumb.style.background = GRADIENTS[i % GRADIENTS.length];
      thumb.appendChild(el("span", "emoji", p.emoji || "✨"));
    }
    return thumb;
  }

  function projectHref(p) { return "project.html?id=" + encodeURIComponent(p.id); }

  function renderCard(p, i) {
    var wrap = el("div", "card-wrap reveal");
    wrap.style.setProperty("--d", (i * 70) + "ms");

    var card = el("article", "card");
    var thumb = thumbFor(p, "card-thumb");

    if (p.preview) {
      var video = el("video", "card-preview");
      video.src = p.preview;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("aria-hidden", "true");
      thumb.appendChild(video);
      card.addEventListener("pointerenter", function () {
        var play = video.play();
        if (play && play.then) play.then(function () { video.classList.add("is-playing"); }).catch(function () {});
      });
      card.addEventListener("pointerleave", function () {
        video.pause();
        video.classList.remove("is-playing");
      });
    }

    thumb.appendChild(el("span", "badge", LABELS[p.category] || p.category));
    if (p.status) thumb.appendChild(el("span", "badge badge-status", p.status));
    card.appendChild(thumb);

    var body = el("div", "card-body");
    var h3 = el("h3");
    var link = el("a", "card-link", p.title);
    link.href = projectHref(p);
    h3.appendChild(link);
    body.appendChild(h3);
    body.appendChild(el("p", null, p.description));

    if (p.tags && p.tags.length) {
      var tags = el("ul", "tags");
      p.tags.forEach(function (t) { tags.appendChild(el("li", null, t)); });
      body.appendChild(tags);
    }

    var actions = el("div", "card-actions");
    var play = el("button", "btn-play");
    play.type = "button";
    play.setAttribute("data-play", p.id);
    play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
    play.appendChild(document.createTextNode(canEmbed(p) ? (p.category === "game" ? "Play here" : "Try it here") : "Open"));
    play.setAttribute("aria-label", (canEmbed(p) ? "Play " : "Open ") + p.title);
    actions.appendChild(play);
    actions.appendChild(el("span", "card-more", "Details →"));
    body.appendChild(actions);

    card.appendChild(body);
    card.appendChild(el("span", "card-shine"));

    // Tilt toward the cursor, with a highlight that follows it
    if (finePointer && !reduceMotion) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", ((0.5 - py) * 10).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((px - 0.5) * 12).toFixed(2) + "deg");
        card.style.setProperty("--px", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--py", (py * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    }

    wrap.appendChild(card);
    reveal(wrap);
    return wrap;
  }

  /* ---------- Easter egg ---------- */
  function celebrate(x, y) {
    if (window.LabBubbles) window.LabBubbles.burst(x, y);
    toast("🫧 You found the secret bubbles!");
  }

  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiPos = 0;
  document.addEventListener("keydown", function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = key === KONAMI[konamiPos] ? konamiPos + 1 : (key === KONAMI[0] ? 1 : 0);
    if (konamiPos === KONAMI.length) { konamiPos = 0; celebrate(); }
  });

  // Clicking the logo five times on the home page (where it just scrolls to the top)
  var brand = document.querySelector(".brand");
  if (brand && document.getElementById("hero")) {
    var clicks = [];
    brand.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var now = Date.now();
      clicks = clicks.filter(function (t) { return now - t < 2000; });
      clicks.push(now);
      if (clicks.length >= 5) {
        clicks = [];
        var r = brand.getBoundingClientRect();
        celebrate(r.left + 14, r.top + r.height / 2);
      }
    });
  }

  var toastEl = null, toastTimer = 0;
  function toast(message) {
    if (!toastEl) {
      toastEl = el("div", "toast");
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2800);
  }

  /* ---------- Ask the lab (chat) ---------- */
  function buildChat(endpoint) {
    var history = [];
    var busy = false;

    var launcher = el("button", "chat-launcher");
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Ask the lab");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/></svg><span>Ask the lab</span>';

    var panel = el("section", "chat-panel");
    panel.setAttribute("aria-label", "Ask the lab");
    panel.hidden = true;
    panel.innerHTML =
      '<header class="chat-head"><strong>Ask the lab</strong><span>Questions about the projects? Ask away.</span>' +
      '<button type="button" class="chat-close" aria-label="Close chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form"><label class="sr-only" for="chat-input">Your question</label>' +
      '<input id="chat-input" type="text" maxlength="1000" autocomplete="off" placeholder="What should I play first?">' +
      '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var log = panel.querySelector(".chat-log");
    var form = panel.querySelector(".chat-form");
    var input = panel.querySelector("input");

    function addMessage(role, text) {
      var m = el("div", "chat-msg chat-" + role, text);
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }

    addMessage("assistant", "Hi! I can tell you about the games, apps and experiments here. What are you curious about?");

    function setOpen(open) {
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", String(open));
      launcher.classList.toggle("is-open", open);
      if (open) input.focus();
    }

    launcher.addEventListener("click", function () { setOpen(panel.hidden); });
    panel.querySelector(".chat-close").addEventListener("click", function () { setOpen(false); launcher.focus(); });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); launcher.focus(); } });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      input.value = "";
      busy = true;
      addMessage("user", text);
      history.push({ role: "user", content: text });
      var pending = addMessage("assistant", "");
      pending.classList.add("is-typing");
      pending.innerHTML = "<i></i><i></i><i></i>";

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12),
          projects: projects.map(function (p) {
            return {
              title: p.title, category: p.category, description: p.description,
              tags: p.tags || [], details: p.details || null
            };
          })
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error(data.error || "Something went wrong.");
            return data;
          });
        })
        .then(function (data) {
          pending.classList.remove("is-typing");
          pending.textContent = data.reply;
          history.push({ role: "assistant", content: data.reply });
        })
        .catch(function (err) {
          pending.classList.remove("is-typing");
          pending.classList.add("chat-error");
          pending.textContent = err.message || "Couldn't reach the lab right now.";
          history.pop(); // drop the unanswered question so the history stays valid
        })
        .then(function () {
          busy = false;
          log.scrollTop = log.scrollHeight;
        });
    });
  }

  if (config.chatEndpoint) buildChat(config.chatEndpoint);

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  window.Lab = {
    projects: projects,
    findProject: findProject,
    canEmbed: canEmbed,
    renderCard: renderCard,
    thumbFor: thumbFor,
    projectHref: projectHref,
    openPlayer: openPlayer,
    reveal: reveal,
    magnetize: magnetize,
    labels: LABELS,
    reduceMotion: reduceMotion,
    el: el
  };
})();
