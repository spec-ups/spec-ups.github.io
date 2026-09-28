# spec-ups.github.io

AI Lab: a personal site for the games, apps and experiments I build with AI.
Live at **https://spec-ups.github.io**.

Plain HTML/CSS/JS with no build step, published straight from `main` by GitHub Pages.

## Features

- Light and dark themes (follows the system setting until you pick one), with a circular reveal when switching
- Rorschach-style inkblots scattered down every page: generated fresh on every visit, mirrored,
  and slowly seeping and shifting, carried on unbroken as you move between pages
- Project pages can swap the inkblots for their own background: Surface Tension has
  rising bubbles you can tap or swipe to pop (`background` in `js/projects.js`)
- A headline that cycles through "games", "apps", "experiments" and more
- Project cards that tilt toward the cursor, with a "Play here" button that opens the project
  in a pop-up without leaving the site
- A page for each project (`project.html?id=...`) with how to play, modes and highlights
- Optional "Ask the lab" chat, powered by Claude (see [worker/README.md](worker/README.md))
- Respects "reduce motion": animations turn off for visitors who ask for that

## Structure

```
index.html          home page
project.html        project page (project.html?id=<id>), built from js/projects.js
css/styles.css      styles + light/dark theme tokens
js/config.js        site settings (chat endpoint)
js/projects.js      your project list (edit this to add projects)
js/main.js          shared: theme, cards, player pop-up, effects, chat
js/home.js          home page: headline, stats, grid
js/project.js       project page rendering
js/inkblot.js       animated Rorschach inkblots scattered down every page
js/bubbles.js       easter-egg bubble burst
projects/           each self-contained project in its own folder
worker/             optional "Ask the lab" chat backend (see worker/README.md)
```

## Projects

| Project | Type | Link |
| --- | --- | --- |
| Surface Tension | Game | [Play](https://spec-ups.github.io/projects/surface-tension/index.html) |

## Adding a project

1. Drop the project in its own folder, e.g. `projects/neon-snake/index.html`.
2. Add an entry to `js/projects.js`. The comment at the top of that file lists every field.
   The key ones are:

```js
{
  id: "neon-snake",                    // used in the project page URL
  title: "Neon Snake",
  description: "Classic snake with a synthwave twist.",
  category: "game",                    // "game" | "app" | "experiment"
  url: "projects/neon-snake/index.html",
  image: "projects/neon-snake/screenshot.png", // optional
  preview: "projects/neon-snake/preview.mp4",  // optional clip, plays on card hover
  emoji: "🐍",
  tags: ["Canvas", "JavaScript"],
  details: { intro: ["..."], howTo: ["..."] }  // optional project page content
}
```

For hover previews, a 5–10 second muted clip under ~2 MB works well (`.mp4` or `.webm`).

## Customising

- **Colours:** the light and dark palettes are CSS variables at the top of `css/styles.css`.
- **Inkblots:** `--ink` and `--ink-opacity` in the same place set their colour and strength;
  the shapes and movement are in `js/inkblot.js`.
- **Headline words:** the `WORDS` list in `js/home.js`.

## Secrets

Try the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or click the logo five times on the home page.

## Running locally

Open `index.html` in a browser, or serve the folder (e.g. `npx serve .`).

## Publishing

Pushing to `main` publishes the site. The repo must be public, with
**Settings → Pages → Deploy from a branch → `main` / root** turned on.
The chat needs its own deploy step, described in [worker/README.md](worker/README.md).
