import json
import subprocess
from html import escape
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
QUERY_SCRIPT = ROOT / "scripts" / "Query-BusinessLicenses.ps1"
DATABASE_PATH = ROOT.parents[1] / "data" / "business-licenses" / "BusinessLicenses.accdb"
POWERSHELL_X86 = Path(r"C:\Windows\SysWOW64\WindowsPowerShell\v1.0\powershell.exe")


def run_query(params):
    args = [
        str(POWERSHELL_X86),
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(QUERY_SCRIPT),
        "-DatabasePath",
        str(DATABASE_PATH),
        "-Search",
        params.get("search", [""])[0],
        "-Status",
        params.get("status", [""])[0],
        "-City",
        params.get("city", [""])[0],
        "-State",
        params.get("state", [""])[0],
        "-Limit",
        params.get("limit", ["50"])[0],
    ]
    completed = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
    return json.loads(completed.stdout)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.render_index()
            return
        if parsed.path == "/api/licenses":
            self.render_api(parsed.query)
            return
        super().do_GET()

    def render_api(self, query_string):
        try:
            data = run_query(parse_qs(query_string))
            body = json.dumps(data).encode("utf-8")
            self.send_response(200)
        except Exception as exc:
            body = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(500)

        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def render_index(self):
        missing = "" if DATABASE_PATH.exists() else (
            "<p class='warning'>Database not found. Run "
            "<code>scripts\\Import-BusinessLicenses.ps1</code> from 32-bit PowerShell first.</p>"
        )
        html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Business License Search</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
  <main>
    <header class="topbar">
      <div>
        <h1>Business License Search</h1>
        <p>Querying <code>{escape(str(DATABASE_PATH))}</code></p>
      </div>
      <div class="stat" id="count">Ready</div>
    </header>
    {missing}
    <form id="filters" class="filters">
      <label>Search
        <input name="search" placeholder="Business, owner, license, address">
      </label>
      <label>Status
        <select name="status">
          <option value="">Any</option>
          <option>Active</option>
          <option>Expired</option>
          <option>Cancelled</option>
        </select>
      </label>
      <label>City
        <input name="city" placeholder="Anchorage">
      </label>
      <label>State
        <input name="state" maxlength="2" placeholder="AK">
      </label>
      <label>Limit
        <select name="limit">
          <option>25</option>
          <option selected>50</option>
          <option>100</option>
          <option>250</option>
        </select>
      </label>
      <div class="actions">
        <button type="submit">Search</button>
        <button type="button" id="clearFilters" class="secondary">Clear</button>
      </div>
    </form>
    <section id="results" class="results"></section>
  </main>
  <script src="/static/app.js"></script>
</body>
</html>"""
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8088), Handler)
    print("Business license app running at http://127.0.0.1:8088")
    server.serve_forever()
