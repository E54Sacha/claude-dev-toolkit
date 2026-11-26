// Pure helpers for lessons-sync.mjs, kept separate so they can be unit-tested.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse, relative, sep } from "node:path";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TYPES = ["open", "true_false", "multiple_choice", "fill_blank"];
const LEVELS = ["beginner", "intermediate", "advanced"];

/** Walk up from a file to the folder holding the `.lessons-repo` marker, or null. */
export function findLessonsRoot(filePath) {
  let dir = dirname(filePath);
  while (true) {
    if (existsSync(join(dir, ".lessons-repo"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** "cs/claude-code/skills" for <root>/cs/claude-code/skills.quiz.json */
export function lessonIdFromPath(root, quizPath) {
  return relative(root, quizPath).split(sep).join("/").replace(/\.quiz\.json$/, "");
}

/**
 * Check a quiz object. Returns a list of human-readable errors (empty = valid).
 * `expectedId` is the lesson id implied by the file location, `subjects` the allowed subject keys.
 */
export function validateQuiz(quiz, expectedId, subjects) {
  const errors = [];
  const parts = expectedId.split("/");
  if (parts.length !== 3) {
    errors.push(`file must be at <subject>/<topic>/<lesson>.quiz.json, got "${expectedId}.quiz.json"`);
    return errors;
  }
  const [subject, topic, slug] = parts;
  if (!subjects.includes(subject)) errors.push(`subject folder "${subject}" is not in subjects.json (${subjects.join(", ")})`);
  if (!SLUG.test(topic)) errors.push(`topic "${topic}" must be lowercase-with-hyphens`);
  if (!SLUG.test(slug)) errors.push(`lesson name "${slug}" must be lowercase-with-hyphens`);

  for (const key of ["lesson", "title", "subject", "topic", "difficulty", "created", "questions"]) {
    if (quiz[key] === undefined) errors.push(`missing field "${key}"`);
  }
  if (quiz.lesson !== undefined && quiz.lesson !== expectedId) errors.push(`"lesson" is "${quiz.lesson}" but the file is at "${expectedId}"`);
  if (quiz.subject !== undefined && quiz.subject !== subject) errors.push(`"subject" is "${quiz.subject}" but the folder is "${subject}"`);
  if (quiz.topic !== undefined && quiz.topic !== topic) errors.push(`"topic" is "${quiz.topic}" but the folder is "${topic}"`);
  if (quiz.difficulty !== undefined && !LEVELS.includes(quiz.difficulty)) errors.push(`"difficulty" must be one of ${LEVELS.join(", ")}`);
  if (quiz.created !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(quiz.created)) errors.push(`"created" must be YYYY-MM-DD`);

  if (quiz.questions !== undefined) {
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      errors.push(`"questions" must be a non-empty array`);
    } else {
      quiz.questions.forEach((q, i) => {
        const at = `question ${i + 1}`;
        for (const key of ["id", "type", "question", "answer", "explanation"]) {
          if (q[key] === undefined || q[key] === "") errors.push(`${at}: missing "${key}"`);
        }
        if (q.id !== undefined && q.id !== `q${i + 1}`) errors.push(`${at}: "id" should be "q${i + 1}"`);
        if (q.type !== undefined && !TYPES.includes(q.type)) errors.push(`${at}: "type" must be one of ${TYPES.join(", ")}`);
        if (q.type === "true_false" && typeof q.answer !== "boolean") errors.push(`${at}: true_false "answer" must be true or false`);
        if (q.type === "multiple_choice") {
          if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${at}: multiple_choice needs exactly 4 "options"`);
          if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${at}: multiple_choice "answer" must be the index 0-3`);
        }
        if (q.type === "fill_blank") {
          if (typeof q.answer !== "string") errors.push(`${at}: fill_blank "answer" must be the missing word`);
          if (typeof q.question === "string" && !q.question.includes("_____")) errors.push(`${at}: fill_blank "question" must contain _____`);
        }
        if (q.type === "open" && typeof q.answer !== "string") errors.push(`${at}: open "answer" must be text`);
      });
    }
  }
  return errors;
}

export function readSubjects(root) {
  return Object.keys(JSON.parse(readFileSync(join(root, "subjects.json"), "utf8")).subjects);
}

export function markdownPathFor(quizPath) {
  const { dir, base } = parse(quizPath);
  return join(dir, base.replace(/\.quiz\.json$/, ".md"));
}
