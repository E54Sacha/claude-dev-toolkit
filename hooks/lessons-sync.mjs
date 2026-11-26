// PostToolUse hook: when a lesson's .quiz.json is written inside the lessons repo
// (a folder with a `.lessons-repo` marker), validate it, then commit and push the lesson.
// - Not a lesson quiz → exit 0, do nothing.
// - Invalid quiz → exit 2: the errors are shown to Claude so it can fix the file.
// - Git problems (offline, no remote…) → warn on stderr, exit 0. The next lesson will push both.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { findLessonsRoot, lessonIdFromPath, markdownPathFor, readSubjects, validateQuiz } from "./lessons-lib.mjs";

function readStdin() {
  try { return JSON.parse(readFileSync(0, "utf8")); } catch { return null; }
}

const git = (root, ...args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30000 });

const event = readStdin();
const rawPath = event?.tool_input?.file_path;
if (!rawPath || !rawPath.endsWith(".quiz.json")) process.exit(0);

const quizPath = resolve(event.cwd ?? process.cwd(), rawPath);
const root = findLessonsRoot(quizPath);
if (!root) process.exit(0);

const lessonId = lessonIdFromPath(root, quizPath);
const mdPath = markdownPathFor(quizPath);
let errors;
try {
  const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
  errors = validateQuiz(quiz, lessonId, readSubjects(root));
} catch (e) {
  errors = [`could not read the quiz: ${e.message}`];
}
if (!existsSync(mdPath)) errors.push(`the lesson file ${relative(root, mdPath)} is missing: write the .md before the .quiz.json`);

if (errors.length) {
  console.error(`Lesson "${lessonId}" was NOT pushed. Fix ${relative(root, quizPath)}:\n- ${errors.join("\n- ")}`);
  process.exit(2);
}

const files = [relative(root, mdPath), relative(root, quizPath)];
const isNew = git(root, "ls-files", "--error-unmatch", files[1]).status !== 0;
git(root, "add", "--", ...files);
if (git(root, "diff", "--cached", "--quiet").status === 0) process.exit(0); // nothing changed

const commit = git(root, "commit", "-m", `${isNew ? "Add" : "Update"} lesson: ${lessonId}`);
if (commit.status !== 0) {
  console.error(`lessons-sync: commit failed: ${commit.stderr || commit.stdout}`);
  process.exit(0);
}

let push = git(root, "push");
if (push.status !== 0) {
  git(root, "pull", "--rebase", "--autostash");
  push = git(root, "push");
}
if (push.status !== 0) {
  console.error(`lessons-sync: committed "${lessonId}" but push failed (it will go with the next push): ${push.stderr.trim()}`);
  process.exit(0);
}
console.log(`lessons-sync: pushed lesson ${lessonId}`);
