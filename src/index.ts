import * as http from "http";
import * as fs from "fs";
import * as path from "path";

// IISNode provides a named-pipe path in process.env.PORT;
// direct Azure deployment provides a numeric string.
// Do NOT cast to number — pass the raw value to server.listen().
const PORT: string | number = process.env.PORT || 3978;

const CLIENT_DIR = path.join(__dirname, "client");
const BASE_PATH = "/tabs/home";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".svg":  "image/svg+xml",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
};

const server = http.createServer((req, res) => {
  let urlPath = (req.url || "/").split("?")[0];

  // Strip /tabs/home prefix
  if (urlPath === BASE_PATH) {
    res.writeHead(301, { Location: BASE_PATH + "/" });
    return res.end();
  }
  if (urlPath.startsWith(BASE_PATH + "/")) {
    urlPath = urlPath.slice(BASE_PATH.length);
  }

  if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;

  const filePath = path.join(CLIENT_DIR, urlPath);

  // Prevent directory traversal
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // SPA fallback
      const index = path.join(CLIENT_DIR, "index.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(index).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  const addr = server.address();
  console.log(`Tab server listening on ${typeof addr === "string" ? addr : `port ${addr?.port}`}`);
});
