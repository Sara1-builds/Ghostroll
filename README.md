# Ghostroll

Open the trunk of photos you forgot you kept. Pick some old pictures and a local open-weight
vision model describes each one, then a local text model writes a short, nostalgic chapter for every
period. You get a polaroid-style album on a timeline that you can correct, print, or download as one
self-contained HTML file.

Built for the Hacktoberfest Open-Source AI Challenge, week 4: **Ghost in the Machine**. The ghosts here are
the memories sitting forgotten on your disk.

## Why local and open

- **Private.** Your photos never leave your computer. The Python server binds to `127.0.0.1` and its only
  outbound call is to your own Ollama. The page loads nothing from the internet (no CDN, no fonts, no analytics).
- **Offline.** It works with the Wi-Fi off.
- **Swappable.** Two dropdowns let you change the vision model and the text model at any time.
- **Not locked in.** The exported album is plain HTML with the photos inside it.

## Run it

1. Install [Ollama](https://ollama.com), then pull one vision model and one text model:
   ```bash
   ollama pull moondream
   ollama pull llama3.2:3b
   ```
2. Start the app (Python 3.8+, no dependencies):
   ```bash
   python3 server.py
   ```
   On Windows use `py server.py`.
3. Open http://127.0.0.1:8000, choose your photos, and click **Open the attic**.

Environment variables: `ATTIC_VISION_MODEL` (default `moondream`), `ATTIC_TEXT_MODEL` (default `llama3.2:3b`),
`OLLAMA_HOST`, `PORT`.

### Low on RAM?

Only the models use significant memory, not the app itself. To keep usage down:

- Use small models (`moondream` is tiny; try `llama3.2:1b` as the text model).
- Make Ollama keep a single model in memory and release it right away:
  ```bash
  OLLAMA_MAX_LOADED_MODELS=1 OLLAMA_KEEP_ALIVE=0 ollama serve
  ```
  On Windows PowerShell: `$env:OLLAMA_MAX_LOADED_MODELS=1; $env:OLLAMA_KEEP_ALIVE=0; ollama serve`.
  Models are then reloaded between photos and chapters, which is slower but light on memory.

## How it works

1. The browser reads each photo, extracts its capture date from the EXIF data (`static/exif.js`; it falls
   back to the file date) and shrinks it to a 512 px thumbnail.
2. `server.py` sends each thumbnail to Ollama's `/api/chat` with a vision model and asks for one plain,
   factual sentence.
3. Photos are sorted by date and grouped by month (or by year when they span more than 10 months).
4. For each group, the text model writes 2 to 3 sentences using only the descriptions, in English, French,
   Spanish or Arabic.
5. Everything is rendered with the DOM API and stays editable until you download it.

Descriptions are always in English, because small vision models describe photos better in English.

## Test

```bash
python3 -I -m unittest discover -s tests   # server, against a stub Ollama
node --test tests/exif.test.js              # EXIF date reader
```

## Honest limits

Small vision models make mistakes (wrong objects, wrong activity), which is why every description and chapter
is editable before you save. Photos from phones in HEIC format cannot be read by browsers; export them as JPG first.
