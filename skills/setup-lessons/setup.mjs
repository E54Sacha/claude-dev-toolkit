// Usage: node setup.mjs <folder>
// - If <folder> already is a lessons repo (has .lessons-repo): only saves it in ~/.claude/lessons.json.
// - Otherwise: creates it from the template next to the toolkit (templates/lessons-repo), git init + first commit,
//   then saves it in ~/.claude/lessons.json.
// Prints one JSON line: { path, created, config, git }.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { configFile, writeLessonsConfig } from "../../hooks/lessons-config.mjs";

const target = process.argv[2];
if (!target || !isAbsolute(target)) {
  console.error("Usage: node setup.mjs <absolute folder path>");
  process.exit(1);
}
const dir = resolve(target);
const template = fileURLToPath(new URL("../../templates/lessons-repo/", import.meta.url));

let created = false;
let git = "skipped";
if (!existsSync(join(dir, ".lessons-repo"))) {
  if (existsSync(dir) && readdirSync(dir).length > 0) {
    console.error(`${dir} is not empty and is not a lessons repo. Pick an empty or new folder.`);
    process.exit(1);
  }
  cpSync(template, dir, { recursive: true });
  writeFileSync(
    join(dir, "README.md"),
    `# ${basename(dir)}\n\nShort illustrated lessons with quizzes, written by the \`tutor\` subagent of ` +
      `[claude-dev-toolkit](https://github.com/E54Sacha/claude-dev-toolkit).\n\nOpen \`index.html\` to browse them.\n`,
  );
  created = true;
  const run = (...args) => spawnSync("git", args, { cwd: dir, encoding: "utf8" });
  if (run("--version").status === 0) {
    run("init", "-b", "main");
    run("add", "-A");
    const c = run("commit", "-m", "Set up lessons repo");
    git = c.status === 0 ? "initialised, first commit done (no remote yet)" : `init ok, commit failed: ${c.stderr.trim()}`;
  } else {
    git = "git not found: lessons will be saved but not committed";
  }
}

writeLessonsConfig(dir);
console.log(JSON.stringify({ path: dir.split("\\").join("/"), created, config: configFile().split("\\").join("/"), git }));
