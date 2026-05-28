# Password Generator M01

A clean, secure, single-file Chrome extension for generating strong passwords.

![Light mode — Password tab](docs/screenshot-light.jpeg)

![Light mode — Options tab](docs/screenshot-light-options.jpeg)

![Dark mode — Options tab](docs/screenshot-dark.jpeg)

---

## Why this exists

Chrome's built-in password generator works well inside forms, but it has two limitations that pushed me to build this. First, it isn't always triggered — it only appears on certain input fields and many sites don't activate it at all. Second, when it does appear, the generated passwords aren't customisable: you can't control length, choose whether to include symbols, or adjust character composition to meet a specific site's requirements.

This extension puts a configurable password generator one click away, available on any page, any time, regardless of what the form underneath is doing.

---

## The process

This project was also a deliberate end-to-end exercise. I wanted to go through the full cycle of building and shipping a small product — not just writing code, but making design decisions, running QA and security testing, debugging in a real browser context, and setting up a public GitHub repository from scratch.

The entire extension was built in a single session using Claude. Every design decision, every usability issue, every security consideration was worked through in conversation — from the entropy-based strength model to the Manifest V3 CSP constraints to the typewriter animation speed. The result is a tool I actually use, built through a process I learned from.

---

## Features

- **Cryptographically secure** — uses `crypto.getRandomValues`, never `Math.random`
- **8-tier strength analysis** — entropy-based scoring from Weak to Bonkers (≥350 bits)
- **Configurable** — length 6–64 with snap points at every 8 characters, toggle numbers / symbols / mixed case
- **Typewriter animation** — visual confirmation every time a new password generates
- **Light / Dark / System theme** — follows your OS or set manually
- **No data collected** — passwords never leave your device, no network requests
- **No ads, no tracking, no accounts**
- **Fully self-contained** — IBM Plex Mono embedded, no external dependencies

## Strength scale

| Level | Entropy | Example configuration |
|---|---|---|
| Weak | < 35 bits | 6 chars, lowercase only |
| Fair | < 50 bits | 8 chars, lowercase only |
| Moderate | < 70 bits | 12 chars, mixed case |
| Strong | < 90 bits | 12 chars, all options |
| Very Strong | < 115 bits | 16 chars, all options |
| Excellent | < 256 bits | 24–32 chars, all options |
| 256-bit | < 350 bits | ~40 chars, all options (AES-256 equivalent) |
| Bonkers | ≥ 350 bits | 48–64 chars, all options |

## Installation (Chrome)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `passgen-m01` folder
5. The extension icon appears in your toolbar

> Chrome Web Store release coming soon.

## Tech stack

- Vanilla HTML, CSS, JavaScript — zero dependencies, zero build step
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) — IBM — SIL Open Font License

## Credits

Designed & directed by **Themis Chapsis**
Built with [Claude](https://claude.ai) — Anthropic
Released May 2026

## License

MIT License — see [LICENSE](LICENSE)
