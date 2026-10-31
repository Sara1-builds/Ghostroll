---
title: Ghostroll: a private photo album written by local open-source AI
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

## What I Built

Ghostroll opens the trunk of photos you forgot you kept. You pick some old pictures, a local vision model describes each one, and a local language model writes a short nostalgic chapter for every period. The result is a polaroid-style album on a timeline that you can correct, print, or download as a single HTML file. (The interface still shows its working title, "Digital Attic".)

For the theme, the "ghosts" are the memories sleeping on your hard drive: thousands of photos nobody looks at anymore. The tool brings them back, gently.

## Demo

<!-- Upload ghostroll-demo-nomusic.mp4 to YouTube (or drag it into the dev.to editor) and paste the link below, e.g. {% embed https://www.youtube.com/watch?v=XXXX %} -->

The video was recorded with my Wi-Fi switched off, so you can see it working offline.

## Code

{% github Sara1-builds/Ghostroll %}

## How I Built It

- **Models:** [Ollama](https://ollama.com) serves two open-weight models: `moondream` (a tiny vision model) to describe photos, and `llama3.2:3b` to write the chapters. Both are chosen from dropdowns, so they can be swapped for bigger ones.
- **Server:** about 170 lines of standard-library Python bound to `127.0.0.1`. It only forwards requests to your own Ollama.
- **Dates:** a small EXIF reader (`exif.js`), written from scratch, pulls the capture date from each JPEG, so the album follows the real timeline, with the file date as a fallback.
- **Prompting:** photo descriptions are short and factual (no guessing names or places), and the chapter prompt tells the model to use only those descriptions and never invent events or feelings.
- **Interface:** one HTML page with no CDN and no web fonts. Photos are shrunk to thumbnails in the browser, and the album is built with the DOM API, so nothing is injected as HTML. Every description and chapter stays editable, because small models make mistakes.
- **Low memory mode:** documented settings keep a single model loaded at a time so it runs on modest laptops.
- **Tests:** Python tests run the server against a stub Ollama, Node tests cover the EXIF reader, and I ran the whole flow in a headless browser with a fake model, checking the album, the export and that the page makes no external requests.

**How it performed on my laptop (a regular Windows laptop, no GPU setup):** in my recording, 4 photos plus one chapter took about a minute: roughly 9 seconds per photo and about 24 seconds for the chapter. Moondream's descriptions were rough. On my test photos it described a sand beach as "urns of water, boat, people, sunset, sky", and the chapter picked up the mistake. That is why every sentence is editable before you save.

## Why Does Open Innovation Matter?

Personal photos are among the most private data we have: faces of family, homes, places. Cloud "memories" features need you to upload them to someone else's servers. With open-weight models running locally, the photos never leave the machine, there is no account or API key, nothing is billed per image, and the whole thing works offline.

It is also not locked in. The vision model and the text model are two dropdowns, and the exported album is plain HTML with the photos embedded, so it will still open decades from now, long after any hosted service has disappeared.

The trade-off is honest: a small local model on a laptop is slower and less accurate than a cloud service. For photos like these, I'll take that trade for privacy.

*Disclosure: the voice in the demo video is AI-generated (ElevenLabs).*
