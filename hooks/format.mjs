// PostToolUse hook: after Claude writes or edits a file, format it with the project's formatter.
// - JS/TS/JSON/CSS/Markdown/HTML/YAML → the project's own Prettier (node_modules/.bin), if installed
// - Python → Ruff (`ruff format`), if it's on the PATH
// - Anything else, or no formatter → do nothing
// It ALWAYS exits 0: a formatting problem must never interrupt the work.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { findPrettier, formatterFor, isIgnored } from "./format-lib.mjs";

const done = (msg) => {
  if (msg) console.error(`format: ${msg}`);
  process.exit(0);
};

let event = null;
try { event = JSON.parse(readFileSync(0, "utf8")); } catch { done(); }

const rawPath = event?.tool_input?.file_path;
if (!rawPath) done();
const file = resolve(event.cwd ?? process.cwd(), rawPath);
if (!existsSync(file) || isIgnored(file)) done();

const tool = formatterFor(file);
if (!tool) done();

let result;
if (tool === "prettier") {
  const prettier = findPrettier(file);
  if (!prettier) done(); // project has no Prettier: leave the file as it is
  // .cmd files on Windows must run through a shell; quote both paths.
  result = spawnSync(`"${prettier}" --write "${file}"`, { shell: true, cwd: dirname(file), encoding: "utf8", timeout: 10000 });
} else {
  const probe = spawnSync("ruff", ["--version"], { encoding: "utf8", timeout: 5000 });
  if (probe.error || probe.status !== 0) done(); // Ruff not installed
  result = spawnSync("ruff", ["format", file], { cwd: dirname(file), encoding: "utf8", timeout: 10000 });
}

if (result.error || result.status !== 0) {
  done(`${tool} could not format ${file}: ${(result.error?.message || result.stderr || "").trim().split("\n")[0]}`);
}
done();
