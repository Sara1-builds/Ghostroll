---
title: Ghostroll: a private photo album written by local open-source AI
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

## What I Built

Ghostroll opens the trunk of photos you forgot you kept. You pick some old pictures, a local vision model describes each one, and a local language model writes a short nostalgic chapter for every period of your life. The result is a polaroid-style album on a timeline that you can correct, print, or download as a single HTML file.

For the theme, the "ghosts" are the memories sleeping on your hard drive: thousands of photos nobody looks at anymore. The tool brings them back, gently.

## Demo

<!-- TODO: add a short video or GIF. Tip: switch Wi-Fi off before recording to show it works offline. -->

## Code

<!-- TODO: embed the GitHub repo here, e.g. {% github your-username/digital-attic %} -->

## How I Built It

- **Models:** [Ollama](https://ollama.com) serves two open-weight models: `moondream` (a tiny vision model) to describe photos, and `llama3.2:3b` to write the chapters. Both are chosen from dropdowns, so they can be swapped for bigger ones.
- **Server:** about 170 lines of standard-library Python bound to `127.0.0.1`. It only forwards requests to your own Ollama.
- **Dates:** a small EXIF reader (`exif.js`) pulls the capture date from each JPEG, so the album follows the real timeline, with the file date as a fallback.
- **Prompting:** photo descriptions are short and factual (no guessing names or places), and the chapter prompt tells the model to use only those descriptions and never invent events or feelings.
- **Interface:** one HTML page with no CDN and no web fonts. Photos are shrunk to thumbnails in the browser, and the album is built with the DOM API, so nothing is injected as HTML. Every description and chapter stays editable, because small models make mistakes.
- **Low memory mode:** documented settings keep a single model loaded at a time so it runs on modest laptops.
- **Tests:** Python tests run the server against a stub Ollama, Node tests cover the EXIF reader, and I ran the whole flow in a headless browser with a fake model, checking the album, the export and that the page makes no external requests.

<!-- TODO: add your own notes: what hardware you used, how long it took per photo, and how good the descriptions were with the real models. -->

## Why Does Open Innovation Matter?

Personal photos are among the most private data we have: faces of family, homes, places. Cloud "memories" features need you to upload them to someone else's servers. With open-weight models running locally, the photos never leave the machine, there is no account or API key, nothing is billed per image, and the whole thing works offline.

It is also not locked in. The vision model and the text model are two dropdowns, and the exported album is plain HTML with the photos embedded, so it will still open decades from now, long after any hosted service has disappeared.

<!-- TODO: if you compared with a closed API, say where the local setup was better or worse. Be honest: small local vision models are less accurate, which is why everything is editable. -->

## My Agent Session

<!-- Optional: save your session with DevRelay (https://devrelay.com/) and embed or link it here, or remove this section. -->

## The Spirit of It

<!-- Optional: this is the place for a real moment. What did you find in your own attic? Remove this section if you have nothing to say. -->

## Prize Categories

<!-- List the partner categories you are entering, or remove this section. -->
