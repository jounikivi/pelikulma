import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let failures = 0;
let count = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await check(file);
      continue;
    }
    if (/\.(js|mjs)$/.test(file)) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      count++;
      if (result.status !== 0) {
        console.error(result.stderr);
        failures++;
      }
    }
    if (!file.endsWith(".html")) continue;
    const html = await readFile(file, "utf8");
    for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
      count++;
      try {
        const target = path.resolve(
          path.dirname(file),
          reference.split(/[?#]/)[0],
        );
        if (path.relative(root, target).startsWith(".."))
          throw new Error("outside project");
        const info = await stat(target);
        if (info.isDirectory()) await stat(path.join(target, "index.html"));
      } catch {
        failures++;
        console.error(
          `Puuttuva linkin kohde: ${path.relative(root, file)} -> ${reference}`,
        );
      }
    }
  }
}
await check(root);
console.log(`${count} tarkistusta, ${failures} virhettä.`);
process.exitCode = failures ? 1 : 0;
