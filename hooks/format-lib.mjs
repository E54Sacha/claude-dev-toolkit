// Pure helpers for format.mjs, kept separate so they can be unit-tested.
import { existsSync, readFileSync, statSync } from "node:fs";
import { delimiter, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";

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

/** True if `file` is `root` itself or somewhere inside it. */
export function isInside(root, file) {
  const rel = relative(resolve(root), resolve(file));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * The project's own Prettier, as the path of its JavaScript entry file (run with `node`, no shell).
 * Walks up from the file's folder, but never above `projectRoot`, so a node_modules planted in a
 * parent folder (e.g. the user's home) is never used. Returns null if not found.
 */
export function findPrettier(filePath, projectRoot) {
  if (!projectRoot || !isInside(projectRoot, filePath)) return null;
  const root = resolve(projectRoot);
  let dir = dirname(resolve(filePath));
  while (true) {
    const pkgFile = join(dir, "node_modules", "prettier", "package.json");
    if (existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
        const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.prettier;
        if (bin) {
          const entry = resolve(dirname(pkgFile), bin);
          if (isInside(dirname(pkgFile), entry) && existsSync(entry)) return entry;
        }
      } catch { /* unreadable package.json: keep looking */ }
    }
    if (dir === root) return null;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Absolute path of a program found on the PATH, checking only absolute PATH entries that are
 * outside `untrustedDir` (the project), so a `ruff.exe` dropped in the repo is never picked.
 * On Windows only `.exe` files are accepted, so no shell is ever needed to run them.
 */
export function findOnPath(name, untrustedDir, env = process.env, platform = process.platform) {
  const pathVar = env.PATH ?? env.Path ?? "";
  const exe = platform === "win32" ? `${name}.exe` : name;
  for (const entry of pathVar.split(delimiter)) {
    if (!entry || !isAbsolute(entry)) continue;
    if (untrustedDir && isInside(untrustedDir, entry)) continue;
    const candidate = join(entry, exe);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch { /* not here */ }
  }
  return null;
}
