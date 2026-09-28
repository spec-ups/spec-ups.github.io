# index.html
Home Website — a personal lab for AI-built games, apps and experiments.

Plain HTML/CSS/JS with no build step, so it runs as-is on GitHub Pages.

## Structure

```
index.html          home page
project.html        project page (project.html?id=<id>), built from js/projects.js
css/styles.css      styles + light/dark theme tokens
js/config.js        site settings (chat endpoint)
js/projects.js      your project list (edit this to add projects)
js/main.js          shared: theme, cards, player pop-up, effects, chat
js/home.js          home page: bubble hero, headline, stats, grid
js/project.js       project page rendering
js/bubbles.js       bubble background + easter-egg burst
projects/           each self-contained project in its own folder
worker/             optional "Ask the lab" chat backend (see worker/README.md)
```

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

## Theme

Light and dark palettes are defined as CSS variables at the top of `css/styles.css`.
The site follows the visitor's OS setting until they use the toggle; their choice is then remembered.

## Secrets

Try the Konami code (↑ ↑ ↓ ↓ ← → ← → B A), or click the logo five times on the home page.

## Running locally

Open `index.html` in a browser, or serve the folder (e.g. `npx serve .`).

## Publishing

On GitHub: **Settings → Pages → Deploy from branch → `main` / root**.
The chat needs its own deploy step, described in [worker/README.md](worker/README.md).
