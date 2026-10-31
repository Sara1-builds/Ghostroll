   # 👻 Ghostroll

**Wake up the photos sleeping on your hard drive.** Pick old pictures, and two open-weight models running on your own laptop describe each one and write a short, warm chapter for every period of your life, as a polaroid album on a timeline. No cloud, no account, no API key. Works with the Wi-Fi off.

> Built for the **Hacktoberfest 2026 Open-Source AI Challenge, Week 4: Ghost in the Machine**.
> The "ghosts" are the memories nobody looks at anymore.

<!-- Add your demo video link here -->
**Demo video:**    {% embed https://youtu.be/RfDWvNV5_Ds %}

---

## How it works

```
 your photos ──▶ Moondream (the eyes) ──▶ one plain sentence per photo
                                                    │
 dates from EXIF (exif.js) ── sort by time ─────────┤
                                                    ▼
                          Llama 3.2 (the writer) ──▶ a short chapter per period
                                                    │
                                                    ▼
                      polaroid album ──▶ edit anything ──▶ download as ONE .html file
```

1. **Moondream** (tiny vision model) looks at each photo and describes only what is visible, in one sentence.
2. **A small EXIF reader written from scratch** (`static/exif.js`, no libraries) reads the capture date hidden in each JPEG so the album follows the real timeline. If there is no EXIF date, it falls back to the file date.
3. **Llama 3.2 3B** reads *only* those descriptions and writes 2–3 warm sentences per period, in English, French, Spanish or Arabic.
4. You **click any text to correct it**, then **download the album as a single self-contained HTML file** that will still open in years.

## Why local?

Your photos are some of the most private data you have: family, home, places. Cloud "memories" features need you to upload them. Here:

- 🔒 The server binds to `127.0.0.1`, and its only outbound call is to **your own Ollama**.
- 🚫 No account, no API key, no per-image cost, no telemetry, no CDN, no web fonts.
- ✈️ Works fully offline once the models are pulled.
- 📦 The exported album is plain HTML with the photos embedded. No service to shut down.

**The honest trade-off:** a small local model on a laptop is slower and less accurate than a cloud service. In my test run on a regular laptop, 4 photos plus one chapter took about a minute (roughly 9 s per photo, about 24 s for the chapter). Descriptions can be wrong (Moondream once called a sandy beach "urns of water"), so every sentence is editable before you save.

## Quick start

You need [Ollama](https://ollama.com) and Python 3.9+. No `pip install` needed.

```bash
# 1. Pull the two open-weight models (one time, needs internet)
ollama pull moondream
ollama pull llama3.2:3b

# 2. Start the app
python server.py          # Windows: py server.py

# 3. Open it
#    http://127.0.0.1:8000
```

> Note: `http://127.0.0.1:11434` is Ollama itself ("Ollama is running"). Ghostroll lives on port **8000**.

Pick up to 30 JPG/PNG photos, choose the models and the language, and press **Open the attic**. 

## Configuration

| Variable | Default | What it does |
|---|---|---|
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Where your Ollama runs |
| `ATTIC_VISION_MODEL` | `moondream` | Model that describes photos |
| `ATTIC_TEXT_MODEL` | `llama3.2:3b` | Model that writes chapters |
| `PORT` | `8000` | Port for the web page |

Both models are also dropdowns in the interface, so you can swap in bigger ones for better results.

**Low on RAM?** Keep a single model loaded at a time:

```bash
OLLAMA_MAX_LOADED_MODELS=1 ollama serve      # Windows PowerShell: $env:OLLAMA_MAX_LOADED_MODELS=1; ollama serve
```

## Design choices

- **Prompts that refuse to invent.** Photo descriptions are short and factual (no guessing names, ages or places). The chapter prompt uses *only* those descriptions and treats them as data, not instructions.
- **Safe rendering.** The album is built with the DOM API, so nothing from a model is injected as HTML.
- **Tiny stack.** About 170 lines of standard-library Python plus vanilla HTML/JS/CSS. Photos are shrunk to thumbnails in the browser with Canvas.
- **Everything editable**, because small models make mistakes.

## Project layout

```
server.py            # local HTTP server: /api/models, /api/caption, /api/story
static/index.html    # the whole interface
static/exif.js       # from-scratch EXIF date reader
tests/test_server.py # Python tests against a stub Ollama
tests/exif.test.js   # Node tests for the EXIF reader
```

## Tests

```bash
python -m unittest discover tests     # server, prompts, errors, path traversal (stub Ollama)
node --test tests/                    # EXIF reader
```

I also ran the whole flow in a headless browser with a fake model, checking the album, the export, and that the page makes no external requests. I have not benchmarked the real models beyond my own laptop run above.

## Roadmap

- Better captions (prompt tuning for Moondream, optional bigger vision models)
- Face-free "people" wording and album themes
- Folder import instead of file picker

## Credits

Open-weight models: [Moondream](https://moondream.ai) and [Llama 3.2](https://www.llama.com/), served by [Ollama](https://ollama.com). 
## License

MIT. Add a `LICENSE` file to the repo to match.
