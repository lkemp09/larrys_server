const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT) || 3000;
const rootDir = __dirname;
const projectsDir = path.join(rootDir, "projects");
const businessProjectDir = path.join(projectsDir, "business-license-search");
const businessQueryScript = path.join(businessProjectDir, "scripts", "Query-BusinessLicenses.ps1");
const businessDatabasePath = path.join(rootDir, "data", "business-licenses", "BusinessLicenses.accdb");
const powershellX86 = "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe";

const projects = [
  {
    slug: "business-license-search",
    title: "Business License Search",
    description: "Search the Alaska business license database.",
  },
  {
    slug: "house-design",
    title: "House Design",
    description: "Compact two-bedroom house layout and elevation.",
  },
  {
    slug: "abacus",
    title: "Abacus",
    description: "Interactive abacus calculator.",
  },
  {
    slug: "altitude-indicator",
    title: "Altitude Indicator",
    description: "Pointer-controlled aviation instrument demo.",
  },
  {
    slug: "ascii-art",
    title: "ASCII Art",
    description: "Browser-based ASCII art project.",
  },
  {
    slug: "avionics",
    title: "Avionics",
    description: "Avionics selector interface.",
  },
  {
    slug: "fish-packer",
    title: "Fish Packer",
    description: "Fish packing project assets.",
  },
  {
    slug: "postscript-project",
    title: "PostScript Project",
    description: "PostScript experiments and render scripts.",
  },
  {
    slug: "alaska-will-documents",
    title: "Alaska Will Documents",
    description: "Will templates and reference notes.",
  },
  {
    slug: "docs",
    title: "Docs",
    description: "Project notes and documentation.",
  },
  {
    slug: "larry-practice",
    title: "Larry Practice",
    description: "Practice notes and command references.",
  },
];

const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

const contentTypes = {
  ".accdb": "application/octet-stream",
  ".bat": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".ps": "application/postscript",
  ".ps1": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function htmlPage(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", Arial, sans-serif;
      background: #f5f6f2;
      color: #18211f;
    }

    * { box-sizing: border-box; }
    body { margin: 0; }

    main {
      margin: 0 auto;
      max-width: 1120px;
      padding: 32px 22px 48px;
    }

    header {
      align-items: end;
      border-bottom: 1px solid #d6dbd2;
      display: flex;
      gap: 18px;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 18px;
    }

    h1 {
      font-size: clamp(28px, 5vw, 46px);
      line-height: 1;
      margin: 0 0 8px;
    }

    p { margin: 0; }

    .home-link,
    .project-link,
    .file-link {
      color: #174d45;
      font-weight: 800;
      text-decoration: none;
    }

    .home-link:hover,
    .project-link:hover,
    .file-link:hover {
      text-decoration: underline;
    }

    .menu {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    }

    .project-card,
    .file-row {
      background: #ffffff;
      border: 1px solid #d8ded8;
      border-radius: 8px;
      display: grid;
      gap: 8px;
      padding: 16px;
    }

    .project-card p,
    .file-meta {
      color: #5f6b66;
      line-height: 1.45;
    }

    .file-list {
      display: grid;
      gap: 10px;
    }

    @media (max-width: 640px) {
      header {
        align-items: start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function renderHome(response) {
  const cards = projects.map((project) => `
    <article class="project-card">
      <a class="project-link" href="/projects/${project.slug}/">${escapeHtml(project.title)}</a>
      <p>${escapeHtml(project.description)}</p>
    </article>
  `).join("");

  sendHtml(response, 200, htmlPage("Larry's Server", `
    <header>
      <div>
        <h1>Larry's Server</h1>
        <p>A menu for the projects in this folder.</p>
      </div>
    </header>
    <section class="menu" aria-label="Project menu">${cards}</section>
  `));
}

function renderProjectListing(response, project, projectRoot, routePath) {
  fs.readdir(projectRoot, { withFileTypes: true }, (error, entries) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const rows = entries
      .filter((entry) => !entry.name.startsWith("."))
      .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
      .map((entry) => {
        const href = `${routePath}${encodeURIComponent(entry.name)}${entry.isDirectory() ? "/" : ""}`;
        const type = entry.isDirectory() ? "Folder" : "File";
        return `
          <article class="file-row">
            <a class="file-link" href="${href}">${escapeHtml(entry.name)}</a>
            <span class="file-meta">${type}</span>
          </article>
        `;
      }).join("");

    sendHtml(response, 200, htmlPage(project.title, `
      <header>
        <div>
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.description)}</p>
        </div>
        <a class="home-link" href="/">Menu</a>
      </header>
      <section class="file-list" aria-label="${escapeHtml(project.title)} files">${rows || "<p>No files yet.</p>"}</section>
    `));
  });
}

function sendHtml(response, statusCode, html) {
  const body = Buffer.from(html, "utf-8");
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": body.length,
  });
  response.end(body);
}

function sendJson(response, statusCode, data) {
  const body = Buffer.from(JSON.stringify(data), "utf-8");
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
  });
  response.end(body);
}

function sendText(response, statusCode, text) {
  const body = Buffer.from(text, "utf-8");
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": body.length,
  });
  response.end(body);
}

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": contents.length,
    });
    response.end(contents);
  });
}

function resolveProjectPath(projectRoot, routeParts) {
  const routePath = routeParts.map((part) => decodeURIComponent(part)).join("/");
  const requestedPath = routePath || ".";
  const normalizedPath = path.normalize(path.join(projectRoot, requestedPath));

  if (!normalizedPath.startsWith(projectRoot)) {
    return null;
  }

  return normalizedPath;
}

function handleBusinessApi(response, searchParams) {
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    businessQueryScript,
    "-DatabasePath",
    businessDatabasePath,
    "-Search",
    searchParams.get("search") || "",
    "-Status",
    searchParams.get("status") || "",
    "-City",
    searchParams.get("city") || "",
    "-State",
    searchParams.get("state") || "",
    "-Limit",
    searchParams.get("limit") || "50",
  ];

  const child = spawn(powershellX86, args, { windowsHide: true });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  child.on("error", (error) => {
    sendJson(response, 500, { error: error.message });
  });

  child.on("close", (code) => {
    if (code !== 0) {
      sendJson(response, 500, { error: stderr.trim() || stdout.trim() || `Query failed with exit code ${code}.` });
      return;
    }

    try {
      sendJson(response, 200, JSON.parse(stdout));
    } catch (error) {
      sendJson(response, 500, { error: `Could not parse query output: ${error.message}` });
    }
  });
}

function handleProject(requestUrl, response) {
  const parts = requestUrl.pathname.split("/").filter(Boolean);
  const slug = parts[1];
  const project = projectBySlug.get(slug);

  if (!project) {
    sendText(response, 404, "Project not found");
    return;
  }

  if (slug === "business-license-search" && parts[2] === "api" && parts[3] === "licenses") {
    handleBusinessApi(response, requestUrl.searchParams);
    return;
  }

  const projectRoot = path.join(projectsDir, slug);
  const filePath = resolveProjectPath(projectRoot, parts.slice(2));

  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      fs.stat(indexPath, (indexError, indexStat) => {
        if (!indexError && indexStat.isFile()) {
          sendFile(response, indexPath);
          return;
        }

        const routePath = requestUrl.pathname.endsWith("/") ? requestUrl.pathname : `${requestUrl.pathname}/`;
        renderProjectListing(response, project, filePath, routePath);
      });
      return;
    }

    sendFile(response, filePath);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  if (requestUrl.pathname === "/") {
    renderHome(response);
    return;
  }

  if (requestUrl.pathname === "/projects") {
    response.writeHead(308, { Location: "/" });
    response.end();
    return;
  }

  if (requestUrl.pathname.startsWith("/projects/")) {
    handleProject(requestUrl, response);
    return;
  }

  sendText(response, 404, "Not found");
});

server.listen(port, () => {
  console.log(`Larry's Server running at http://localhost:${port}`);
});
