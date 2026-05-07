const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "..", "testweb");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function getElapsedMs(startTime) {
  return Number(process.hrtime.bigint() - startTime) / 1_000_000;
}

function getDisplayPath(filePath) {
  if (!filePath) {
    return "blocked";
  }

  return `/${path.relative(publicDir, filePath).replaceAll(path.sep, "/")}`;
}

function logResponse(request, response, filePath, startTime) {
  const elapsedMs = getElapsedMs(startTime).toFixed(1);
  const contentType = response.getHeader("Content-Type") || "unknown";
  const contentLength = response.getHeader("Content-Length");
  const size = contentLength ? `${contentLength}b` : "unknown-size";
  const servedPath = getDisplayPath(filePath);

  console.log(
    `${request.method} ${request.url} -> ${servedPath} ${response.statusCode} ${contentType} ${size} ${elapsedMs}ms`,
  );
}

function getFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const hasExtension = path.extname(requestedPath) !== "";
  const fileRequestPath = hasExtension ? requestedPath : path.join(requestedPath, "index.html");
  const filePath = path.normalize(path.join(publicDir, fileRequestPath));

  if (!filePath.startsWith(publicDir)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((request, response) => {
  const startTime = process.hrtime.bigint();
  const filePath = getFilePath(request.url || "/");

  response.once("finish", () => logResponse(request, response, filePath, startTime));

  if (!filePath) {
    response.statusCode = 403;
    response.setHeader("Content-Length", Buffer.byteLength("Forbidden"));
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.statusCode = 404;
      response.setHeader("Content-Length", Buffer.byteLength("Not found"));
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.end("Not found");
      return;
    }

    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.statusCode = 200;
    response.setHeader("Content-Length", contents.length);
    response.setHeader("Content-Type", contentType);
    response.end(contents);
  });
});

server.listen(port, () => {
  console.log(`Abacus server running at http://localhost:${port}`);
});
