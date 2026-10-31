import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 5173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  try {
    const url = new URL(req.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const publicPath =
      pathname === "/" ||
      pathname === "/index.html" ||
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/games/");
    if (!publicPath || pathname.includes("\\")) throw new Error("Not public");
    let target = path.resolve(root, `.${pathname}`);
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
        return res.end();
      }
      target = path.join(target, "index.html");
    }
    target = await realpath(target);
    const relative = path.relative(root, target);
    if (
      relative.startsWith("..") ||
      path.isAbsolute(relative) ||
      !mime[path.extname(target)]
    ) {
      throw new Error("Not public");
    }
    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(target)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(req.method === "HEAD" ? undefined : "Sivua ei löytynyt.");
  }
});

server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Portti ${port} on käytössä. Sulje aiempi palvelin tai valitse PORT-ympäristömuuttujalla toinen portti.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Pelikulma: http://localhost:${port}\nLopeta painamalla Ctrl+C.`);
});
