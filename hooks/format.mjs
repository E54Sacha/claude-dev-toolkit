// PostToolUse hook: after Claude writes or edits a file, format it with the project's formatter.
// - JS/TS/JSON/CSS/Markdown/HTML/YAML → the project's own Prettier (node_modules/prettier), if installed
// - Python → Ruff (`ruff format`), if it's installed on the PATH
// - Anything else, or no formatter → do nothing
// It ALWAYS exits 0: a formatting problem must never interrupt the work.
//
// Safety: no shell is ever used (paths are passed as separate arguments, so a file name can't inject
// commands); Prettier is only taken from inside the project; Ruff only from absolute PATH entries
// outside the project, and it runs from the temp folder, not from the repo.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { findOnPath, findPrettier, formatterFor, isIgnored, isInside } from "./format-lib.mjs";

const done = (msg) => {
  if (msg) console.error(`format: ${msg}`);
  process.exit(0);
};

let event = null;
try { event = JSON.parse(readFileSync(0, "utf8")); } catch { done(); }

const rawPath = event?.tool_input?.file_path;
if (!rawPath) done();
const projectRoot = resolve(process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd());
const file = resolve(event.cwd ?? process.cwd(), rawPath);
if (!existsSync(file) || isIgnored(file) || !isInside(projectRoot, file)) done();

const tool = formatterFor(file);
if (!tool) done();

let result;
if (tool === "prettier") {
  const prettier = findPrettier(file, projectRoot);
  if (!prettier) done(); // project has no Prettier: leave the file as it is
  result = spawnSync(process.execPath, [prettier, "--write", file], { cwd: dirname(file), encoding: "utf8", timeout: 10000 });
} else {
  const ruff = findOnPath("ruff", projectRoot);
  if (!ruff) done(); // Ruff not installed
  // Ruff finds the project's config from the file's location, so it can safely run from the temp folder.
  result = spawnSync(ruff, ["format", file], { cwd: tmpdir(), encoding: "utf8", timeout: 10000 });
}

if (result.error || result.status !== 0) {
  const why = (result.error?.message || result.stderr || "").trim().split(/\r?\n/)[0];
  done(`${tool} could not format ${file}: ${why}`);
}
done();
