/* Project page: renders project.html?id=<id> from js/projects.js */
(function () {
  "use strict";

  var Lab = window.Lab, el = Lab.el;
  var main = document.getElementById("project");
  var id = new URLSearchParams(location.search).get("id");
  var p = Lab.findProject(id);

  function section(title, className) {
    var s = el("section", "detail-section reveal" + (className ? " " + className : ""));
    s.appendChild(el("h2", null, title));
    return s;
  }

  function list(items, tag) {
    var ul = el(tag || "ul", "detail-list");
    items.forEach(function (t) { ul.appendChild(el("li", null, t)); });
    return ul;
  }

  if (!p) {
    document.title = "Project not found — AI Lab";
    var missing = el("div", "container detail-missing");
    missing.appendChild(el("h1", null, "Project not found"));
    missing.appendChild(el("p", null, "That project doesn't exist, or it has moved."));
    var back = el("a", "btn btn-primary", "See all projects");
    back.href = "index.html#projects";
    missing.appendChild(back);
    main.appendChild(missing);
    return;
  }

  // A project can swap the inkblots for its own background
  var backgrounds = { bubbles: window.LabBubbles, slimes: window.LabSlimes };
  var background = backgrounds[p.background];
  if (background) {
    var ink = document.querySelector("[data-inkblots]");
    if (ink) ink.remove();
    background.field();
  }

  var d = p.details || {};
  document.title = p.title + " — AI Lab";
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = p.description;

  var wrap = el("div", "container");

  /* ---------- Hero ---------- */
  var crumb = el("a", "crumb", "← All projects");
  crumb.href = "index.html#projects";
  wrap.appendChild(crumb);

  var hero = el("div", "detail-hero");
  var info = el("div", "detail-info reveal");
  var badges = el("div", "detail-badges");
  badges.appendChild(el("span", "pill", Lab.labels[p.category] || p.category));
  if (p.status) badges.appendChild(el("span", "pill pill-accent", p.status));
  info.appendChild(badges);
  info.appendChild(el("h1", null, p.title));
  info.appendChild(el("p", "lede", p.description));

  if (p.tags && p.tags.length) {
    var tags = el("ul", "tags");
    p.tags.forEach(function (t) { tags.appendChild(el("li", null, t)); });
    info.appendChild(tags);
  }

  var actions = el("div", "hero-actions");
  var play = el("button", "btn btn-primary", Lab.canEmbed(p) ? (p.category === "game" ? "▶  Play here" : "▶  Try it here") : "Open project");
  play.type = "button";
  play.setAttribute("data-play", p.id);
  play.setAttribute("data-magnetic", "");
  actions.appendChild(play);
  if (Lab.canEmbed(p)) {
    var full = el("a", "btn btn-ghost", "Open full screen ↗");
    full.href = p.url;
    full.target = "_blank";
    full.rel = "noopener";
    full.setAttribute("data-magnetic", "");
    actions.appendChild(full);
  }
  info.appendChild(actions);
  hero.appendChild(info);

  var media = Lab.thumbFor(p, "detail-media reveal");
  media.style.setProperty("--d", "120ms");
  if (p.preview) {
    var video = el("video", "card-preview is-playing");
    video.src = p.preview;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = !Lab.reduceMotion;
    video.setAttribute("aria-hidden", "true");
    media.appendChild(video);
  }
  hero.appendChild(media);
  wrap.appendChild(hero);

  /* ---------- Content ---------- */
  var body = el("div", "detail-body");

  if (d.intro && d.intro.length) {
    var about = section("About");
    d.intro.forEach(function (t) { about.appendChild(el("p", null, t)); });
    body.appendChild(about);
  }

  if (d.howTo && d.howTo.length) {
    var how = section(d.howToTitle || "How to play");
    how.appendChild(list(d.howTo, "ol"));
    body.appendChild(how);
  }

  if (d.features && d.features.length) {
    var feats = section(d.featuresTitle || "Features");
    var fgrid = el("div", "feature-grid");
    d.features.forEach(function (f) {
      var card = el("div", "feature");
      card.appendChild(el("h3", null, f.name));
      card.appendChild(el("p", null, f.text));
      fgrid.appendChild(card);
    });
    feats.appendChild(fgrid);
    body.appendChild(feats);
  }

  if (d.highlights && d.highlights.length) {
    var hl = section("Highlights");
    hl.appendChild(list(d.highlights));
    body.appendChild(hl);
  }

  if (d.build) {
    var build = section("Behind the build", "detail-build");
    (d.build.notes || []).forEach(function (t) { build.appendChild(el("p", null, t)); });
    if (d.build.prompts && d.build.prompts.length) {
      build.appendChild(el("h3", null, "Prompts I used"));
      d.build.prompts.forEach(function (t) { build.appendChild(el("blockquote", "prompt", t)); });
    }
    body.appendChild(build);
  }

  wrap.appendChild(body);

  /* ---------- More projects ---------- */
  var others = Lab.projects.filter(function (o) { return o !== p; });
  if (others.length) {
    var more = el("section", "detail-more");
    more.appendChild(el("h2", "reveal", "More from the lab"));
    var grid = el("div", "grid");
    others.slice(0, 3).forEach(function (o, i) { grid.appendChild(Lab.renderCard(o, i)); });
    more.appendChild(grid);
    wrap.appendChild(more);
  }

  main.appendChild(wrap);
  main.querySelectorAll(".reveal").forEach(Lab.reveal);
  main.querySelectorAll("[data-magnetic]").forEach(Lab.magnetize);
})();
