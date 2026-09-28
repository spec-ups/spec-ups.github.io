# "Ask the lab" chat backend

A small Cloudflare Worker that answers visitor questions about your projects using Claude.
It exists so your Anthropic API key stays secret. GitHub Pages can only serve public files.

## Setup (one time)

You need [Node.js](https://nodejs.org), a free [Cloudflare account](https://dash.cloudflare.com/sign-up),
and an Anthropic API key from <https://platform.claude.com>.

```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY   # paste your key when asked
npx wrangler deploy
```

`deploy` prints a URL like `https://ai-lab-chat.<you>.workers.dev`. Put it in `js/config.js`:

```js
window.LAB_CONFIG = {
  chatEndpoint: "https://ai-lab-chat.<you>.workers.dev"
};
```

The "Ask the lab" button appears once that's set.

## Settings

- **Allowed sites:** `ALLOWED_ORIGINS` in `wrangler.toml` lists the sites allowed to use the chat.
  It's set to `https://spec-ups.github.io`. Add `http://localhost:3000` (or wherever you test) while developing.
- **Model:** `MODEL` in `src/index.js` (Claude Opus 5 by default). It uses low effort to keep answers quick,
  and falls back to another model automatically if a request is declined.
- **Costs:** every question is a paid API call. Set a monthly spend limit in the Claude Console,
  and consider [Cloudflare rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
  if the site gets busy.
