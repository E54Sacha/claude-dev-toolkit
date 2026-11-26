// Pure helpers for format.mjs, kept separate so they can be unit-tested.
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const PRETTIER_EXT = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts",
  ".json", ".css", ".scss", ".less", ".md", ".html", ".vue", ".yml", ".yaml",
]);

/** "prettier", "ruff" or null for a file path. */
export function formatterFor(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (PRETTIER_EXT.has(ext)) return "prettier";
  if (ext === ".py" || ext === ".pyi") return "ruff";
  return null;
}

/** Files we never touch, even if the extension matches. */
export function isIgnored(filePath) {
  return /[\\/](node_modules|\.git|dist|build|\.venv|venv)[\\/]/.test(filePath) || /\.min\.(js|css)$/.test(filePath);
}

/**
 * The project's own Prettier: walk up from the file's folder to find node_modules/.bin/prettier.
 * Returns the full path, or null (we never install Prettier or use a global one).
 */
export function findPrettier(filePath, platform = process.platform) {
  const bin = platform === "win32" ? "prettier.cmd" : "prettier";
  let dir = dirname(filePath);
  while (true) {
    const candidate = join(dir, "node_modules", ".bin", bin);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
