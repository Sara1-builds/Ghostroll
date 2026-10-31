import base64
import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

SEEN = {}


class FakeOllama(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, obj):
        body = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send({"models": [{"name": "moondream:latest"}, {"name": "fake:1b"}]})

    def do_POST(self):
        n = int(self.headers["Content-Length"])
        SEEN["req"] = json.loads(self.rfile.read(n))
        self._send({"message": {"content": "  A sunny beach.  "}})


def serve(handler):
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def post(url, obj):
    req = urllib.request.Request(url, data=json.dumps(obj).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fake = serve(FakeOllama)
        cls.fake_url = f"http://127.0.0.1:{cls.fake.server_address[1]}"
        os.environ["OLLAMA_HOST"] = cls.fake_url
        import server

        cls.server = server
        cls.app = serve(server.Handler)
        cls.base = f"http://127.0.0.1:{cls.app.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.fake.shutdown()
        cls.app.shutdown()

    def test_static_files(self):
        with urllib.request.urlopen(self.base + "/") as r:
            self.assertIn(b"Digital Attic", r.read())
        with urllib.request.urlopen(self.base + "/exif.js") as r:
            self.assertTrue(r.headers["Content-Type"].startswith("text/javascript"))

    def test_path_traversal_blocked(self):
        with self.assertRaises(urllib.error.HTTPError) as cm:
            urllib.request.urlopen(self.base + "/../server.py")
        self.assertEqual(cm.exception.code, 404)

    def test_models(self):
        with urllib.request.urlopen(self.base + "/api/models") as r:
            d = json.loads(r.read())
        self.assertTrue(d["ok"])
        self.assertIn("fake:1b", d["models"])
        self.assertEqual(d["vision"], "moondream")

    def test_caption_sends_image_to_ollama(self):
        raw = base64.b64encode(b"\xff\xd8fake-jpeg").decode()
        code, d = post(self.base + "/api/caption", {"image": "data:image/jpeg;base64," + raw})
        self.assertEqual(code, 200)
        self.assertEqual(d["text"], "A sunny beach.")
        req = SEEN["req"]
        self.assertEqual(req["model"], "moondream")
        self.assertEqual(req["messages"][0]["images"], [raw])
        self.assertFalse(req["stream"])

    def test_caption_rejects_bad_image(self):
        for bad in ("", "not base64!!"):
            code, _ = post(self.base + "/api/caption", {"image": bad})
            self.assertEqual(code, 400)

    def test_story_prompt(self):
        code, d = post(
            self.base + "/api/story",
            {"label": "July 2019", "lang": "fr", "captions": ["Two kids on a beach.", "A red kite."]},
        )
        self.assertEqual(code, 200)
        msgs = SEEN["req"]["messages"]
        self.assertIn("French", msgs[0]["content"])
        self.assertIn("July 2019", msgs[1]["content"])
        self.assertIn("- A red kite.", msgs[1]["content"])

    def test_story_validation(self):
        for bad in ([], None, ["  "], ["x"] * 61):
            code, _ = post(self.base + "/api/story", {"captions": bad})
            self.assertEqual(code, 400)

    def test_ollama_down(self):
        self.server.OLLAMA = "http://127.0.0.1:9"
        try:
            code, d = post(self.base + "/api/story", {"captions": ["x"]})
        finally:
            self.server.OLLAMA = self.fake_url
        self.assertEqual(code, 503)
        self.assertIn("ollama serve", d["error"])


if __name__ == "__main__":
    unittest.main()
