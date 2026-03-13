# Squigglebug 🐛

A magical drawing app for babies and toddlers. Touch the screen, make colorful trails, shake to clear. That's it.

- **Multi-touch** — every finger gets its own colour
- **Speed-sensitive lines** — slow = thick, fast = thin
- **Sparkles** on every touch
- **Shake to clear** (or double-tap)
- **Trails fade** after 5 seconds
- **Offline-ready** PWA with a service worker

MIT licensed. Free forever.

---

## Running locally

No build step, no dependencies. Just serve the `web/` folder over HTTP:

```bash
# Python (built-in)
python -m http.server 8080 --directory web

# Node (npx)
npx serve web
```

Then open `http://localhost:8080` in your browser.

> **Note:** The service worker requires HTTPS or `localhost` — it won't register over plain HTTP on any other host.

---

## Analytics (optional)

Analytics are **disabled by default**. The committed `web/analytics.js` is a safe no-op stub.

To enable your own Google Analytics 4 tracking:

1. Copy `web/analytics.example.js` → `web/analytics.js`
2. Replace `G-XXXXXXXXXX` with your [GA4 Measurement ID](https://support.google.com/analytics/answer/9539598)
3. To stop git tracking your local changes: `git update-index --skip-worktree web/analytics.js`

The config already includes COPPA-compliant settings (`allow_google_signals: false`, `restricted_data_processing: true`) required for apps targeting children.

---

## Deployment

Deploy the contents of `web/` to any static host (Netlify, Vercel, GitHub Pages, Firebase Hosting, etc.).

**GitHub Pages (project site):** The service worker uses relative paths so it works at any URL path — no config needed.

---

## Roadmap

- [ ] Android app via [Capacitor](https://capacitorjs.com/)
- [ ] iOS app via Capacitor
- [ ] Sound effects (optional toggle)
- [ ] Save / share drawing

## Contributing

PRs welcome. The whole app is vanilla JS + Canvas API in `web/app.js` (~300 lines). No framework, no build step.

## License

[MIT](LICENSE)
