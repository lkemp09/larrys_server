const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

const port = Number(process.env.PORT) || 3000;
const rootDir = __dirname;
const projectsDir = path.join(rootDir, "projects");
let businessPool;

const projects = [
  {
    slug: "alaska-ferry-days",
    title: "Alaska Ferry Days",
    description: "Find published Alaska ferry sailing dates by departure and destination.",
  },
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

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
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

function getBusinessPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!businessPool) {
    businessPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return businessPool;
}

function addFilter(filters, values, sql, value) {
  values.push(value);
  filters.push(sql.replace("?", `$${values.length}`));
}

function parseOptionalInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error("License number must be a whole number.");
  }

  return parsed;
}

function parseOptionalDate(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  return value;
}

function cleanText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value).trim();
  return cleaned || null;
}

function normalizeLicenseInput(input) {
  const row = {
    owners: cleanText(input.owners),
    license_number: parseOptionalInteger(input.licenseNumber),
    business_name: cleanText(input.businessName),
    status: cleanText(input.status),
    issue_date: parseOptionalDate(input.issueDate, "Issue date"),
    renew_date: parseOptionalDate(input.renewDate, "Renew date"),
    expire_date: parseOptionalDate(input.expireDate, "Expire date"),
    has_telemedicine: cleanText(input.hasTelemedicine),
    physical_city: cleanText(input.physicalCity),
    physical_country: cleanText(input.physicalCountry),
    physical_line1: cleanText(input.physicalLine1),
    physical_line2: cleanText(input.physicalLine2),
    physical_state: cleanText(input.physicalState),
    physical_zip: cleanText(input.physicalZip),
    physical_zip_plus: cleanText(input.physicalZipPlus),
    mailing_city: cleanText(input.mailingCity),
    mailing_country: cleanText(input.mailingCountry),
    mailing_line1: cleanText(input.mailingLine1),
    mailing_line2: cleanText(input.mailingLine2),
    mailing_state: cleanText(input.mailingState),
    mailing_zip: cleanText(input.mailingZip),
    mailing_zip_plus: cleanText(input.mailingZipPlus),
  };

  if (!row.business_name) {
    throw new Error("Business name is required.");
  }

  return row;
}

function licenseSelectSql() {
  return `
    SELECT
      id,
      owners,
      license_number AS "licenseNumber",
      business_name AS "businessName",
      status,
      to_char(issue_date, 'YYYY-MM-DD') AS "issueDate",
      to_char(renew_date, 'YYYY-MM-DD') AS "renewDate",
      to_char(expire_date, 'YYYY-MM-DD') AS "expireDate",
      has_telemedicine AS "hasTelemedicine",
      physical_city AS "physicalCity",
      physical_country AS "physicalCountry",
      physical_line1 AS "physicalLine1",
      physical_line2 AS "physicalLine2",
      physical_state AS "physicalState",
      physical_zip AS "physicalZip",
      physical_zip_plus AS "physicalZipPlus",
      mailing_city AS "mailingCity",
      mailing_country AS "mailingCountry",
      mailing_line1 AS "mailingLine1",
      mailing_line2 AS "mailingLine2",
      mailing_state AS "mailingState",
      mailing_zip AS "mailingZip",
      mailing_zip_plus AS "mailingZipPlus"
    FROM bus_lic.business_licenses
  `;
}

async function createBusinessLicense(response, request) {
  const input = normalizeLicenseInput(await readJsonBody(request));
  const columns = Object.keys(input);
  const values = Object.values(input);
  const placeholders = values.map((_, index) => `$${index + 1}`);
  const pool = getBusinessPool();

  const result = await pool.query(`
    INSERT INTO bus_lic.business_licenses (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING id
  `, values);

  const rowResult = await pool.query(`${licenseSelectSql()} WHERE id = $1`, [result.rows[0].id]);
  sendJson(response, 201, rowResult.rows[0]);
}

async function updateBusinessLicense(response, request, id) {
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    sendJson(response, 400, { error: "License id is invalid." });
    return;
  }

  const input = normalizeLicenseInput(await readJsonBody(request));
  const columns = Object.keys(input);
  const values = Object.values(input);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  values.push(parsedId);
  const pool = getBusinessPool();

  const result = await pool.query(`
    UPDATE bus_lic.business_licenses
    SET ${assignments.join(", ")}
    WHERE id = $${values.length}
    RETURNING id
  `, values);

  if (!result.rows.length) {
    sendJson(response, 404, { error: "License not found." });
    return;
  }

  const rowResult = await pool.query(`${licenseSelectSql()} WHERE id = $1`, [parsedId]);
  sendJson(response, 200, rowResult.rows[0]);
}

async function handleBusinessApi(response, searchParams) {
  let limit = Number(searchParams.get("limit") || "50");
  if (!Number.isFinite(limit)) {
    limit = 50;
  }
  if (limit < 1) { limit = 1; }
  if (limit > 250) { limit = 250; }

  const filters = [];
  const values = [];
  const search = (searchParams.get("search") || "").trim();
  const status = (searchParams.get("status") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const state = (searchParams.get("state") || "").trim();

  if (search) {
    const pattern = `%${search}%`;
    values.push(pattern);
    const placeholder = `$${values.length}`;
    filters.push(`(
      business_name ILIKE ${placeholder}
      OR owners ILIKE ${placeholder}
      OR license_number::text ILIKE ${placeholder}
      OR physical_line1 ILIKE ${placeholder}
      OR mailing_line1 ILIKE ${placeholder}
    )`);
  }

  if (status) {
    addFilter(filters, values, "status = ?", status);
  }

  if (city) {
    addFilter(filters, values, "physical_city ILIKE ?", `%${city}%`);
  }

  if (state) {
    addFilter(filters, values, "upper(physical_state) = upper(?)", state);
  }

  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const pool = getBusinessPool();

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM bus_lic.business_licenses ${whereSql}`,
    values,
  );

  const queryValues = [...values, limit];
  const limitPlaceholder = `$${queryValues.length}`;
  const rowsResult = await pool.query(`
    ${licenseSelectSql()}
    ${whereSql}
    ORDER BY business_name, license_number
    LIMIT ${limitPlaceholder}
  `, queryValues);

  sendJson(response, 200, {
    total: countResult.rows[0].total,
    returned: rowsResult.rows.length,
    limit,
    rows: rowsResult.rows,
  });
}

function handleProject(request, requestUrl, response) {
  const parts = requestUrl.pathname.split("/").filter(Boolean);
  const slug = parts[1];
  const project = projectBySlug.get(slug);

  if (!project) {
    sendText(response, 404, "Project not found");
    return;
  }

  if (slug === "business-license-search" && parts[2] === "api" && parts[3] === "licenses") {
    if (request.method === "GET" && !parts[4]) {
      handleBusinessApi(response, requestUrl.searchParams).catch((error) => {
        sendJson(response, 500, { error: error.message });
      });
      return;
    }

    if (request.method === "POST" && !parts[4]) {
      createBusinessLicense(response, request).catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
      return;
    }

    if (request.method === "PUT" && parts[4]) {
      updateBusinessLicense(response, request, parts[4]).catch((error) => {
        sendJson(response, 400, { error: error.message });
      });
      return;
    }

    sendText(response, 405, "Method not allowed");
    return;
  }

  if (request.method !== "GET") {
    sendText(response, 405, "Method not allowed");
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

  if (!["GET", "POST", "PUT"].includes(request.method)) {
    sendText(response, 405, "Method not allowed");
    return;
  }

  if (request.method !== "GET" && !requestUrl.pathname.startsWith("/projects/business-license-search/api/")) {
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
    handleProject(request, requestUrl, response);
    return;
  }

  sendText(response, 404, "Not found");
});

server.listen(port, () => {
  console.log(`Larry's Server running at http://localhost:${port}`);
});
