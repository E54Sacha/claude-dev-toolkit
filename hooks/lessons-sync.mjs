// PostToolUse hook: when a lesson's .quiz.json is written inside the lessons repo
// (a folder with a `.lessons-repo` marker), validate it, rebuild index.html, then commit and push the lesson.
// - Not a lesson quiz → exit 0, do nothing.
// - Invalid quiz → exit 2: the errors are shown to Claude so it can fix the file.
// - Git problems (offline, no remote…) → warn on stderr, exit 0. The next lesson will push both.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { collectLessons, findLessonsRoot, lessonIdFromPath, pagePathFor, readSubjectInfo, readSubjects, renderIndex, validateQuiz } from "./lessons-lib.mjs";

function readStdin() {
  try { return JSON.parse(readFileSync(0, "utf8")); } catch { return null; }
}

// Exit-0 output is hidden from Claude unless sent as JSON "additionalContext".
const tellClaude = (text) =>
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } }));

const git = (root, ...args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8", timeout: 30000 });

const event = readStdin();
const rawPath = event?.tool_input?.file_path;
if (!rawPath || !rawPath.endsWith(".quiz.json")) process.exit(0);

const quizPath = resolve(event.cwd ?? process.cwd(), rawPath);
const root = findLessonsRoot(quizPath);
if (!root) process.exit(0);

const lessonId = lessonIdFromPath(root, quizPath);
const pagePath = pagePathFor(quizPath);
let errors;
try {
  const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
  errors = validateQuiz(quiz, lessonId, readSubjects(root));
} catch (e) {
  errors = [`could not read the quiz: ${e.message}`];
}
if (!existsSync(pagePath)) errors.push(`the lesson page ${relative(root, pagePath)} is missing: write the .html before the .quiz.json`);

if (errors.length) {
  console.error(`Lesson "${lessonId}" was NOT pushed. Fix ${relative(root, quizPath)}:\n- ${errors.join("\n- ")}`);
  process.exit(2);
}

// Rebuild the home page so it lists every lesson
const subjectInfo = readSubjectInfo(root);
writeFileSync(join(root, "index.html"), renderIndex(collectLessons(root, Object.keys(subjectInfo)), subjectInfo));

const files = [relative(root, pagePath), relative(root, quizPath), "index.html"];
const isNew = git(root, "ls-files", "--error-unmatch", files[1]).status !== 0;
git(root, "add", "--", ...files);
if (git(root, "diff", "--cached", "--quiet").status === 0) {
  tellClaude(`lessons-sync: lesson ${lessonId} is valid and already committed (no changes to push).`);
  process.exit(0);
}

const commit = git(root, "commit", "-m", `${isNew ? "Add" : "Update"} lesson: ${lessonId}`);
if (commit.status !== 0) {
  tellClaude(`lessons-sync: lesson ${lessonId} is valid but the commit failed: ${(commit.stderr || commit.stdout).trim()}`);
  process.exit(0);
}

let push = git(root, "push");
if (push.status !== 0) {
  git(root, "pull", "--rebase", "--autostash");
  push = git(root, "push");
}
if (push.status !== 0) {
  tellClaude(`lessons-sync: committed lesson ${lessonId} locally, but the push failed (it will go with the next push): ${push.stderr.trim()}`);
  process.exit(0);
}
tellClaude(`lessons-sync: lesson ${lessonId} is valid, committed and pushed to GitHub.`);
