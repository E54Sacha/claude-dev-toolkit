// Where the user's lessons repo lives: ~/.claude/lessons.json → { "path": "C:/Users/me/lessons" }
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

export const configFile = (home = homedir()) => join(home, ".claude", "lessons.json");

/** { ok: true, path } when the config points to a folder with a .lessons-repo marker, else { ok: false, reason }. */
export function readLessonsConfig(file = configFile()) {
  if (!existsSync(file)) return { ok: false, reason: "missing" };
  let path;
  try {
    path = JSON.parse(readFileSync(file, "utf8")).path;
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (typeof path !== "string" || !isAbsolute(path)) return { ok: false, reason: "path must be an absolute folder path" };
  if (!existsSync(join(path, ".lessons-repo"))) return { ok: false, reason: `no .lessons-repo marker in ${path}` };
  return { ok: true, path: resolve(path).split("\\").join("/") };
}

export function writeLessonsConfig(path, file = configFile()) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ path: resolve(path).split("\\").join("/") }, null, 2) + "\n");
}
