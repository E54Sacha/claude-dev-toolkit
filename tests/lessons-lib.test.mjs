import { test } from "node:test";
import assert from "node:assert/strict";
import { validateQuiz } from "../hooks/lessons-lib.mjs";

const subjects = ["cs", "maths"];
const good = () => ({
  lesson: "cs/claude-code/skills", title: "Skills", subject: "cs", topic: "claude-code",
  difficulty: "beginner", created: "2026-11-26",
  questions: [
    { id: "q1", type: "open", question: "What?", answer: "This.", explanation: "Because." },
    { id: "q2", type: "true_false", question: "Is it true that x?", answer: false, explanation: "No." },
    { id: "q3", type: "multiple_choice", question: "Which?", options: ["a", "b", "c", "d"], answer: 2, explanation: "C." },
    { id: "q4", type: "fill_blank", question: "A _____ here.", answer: "word", explanation: "Yes." },
  ],
});

test("valid quiz has no errors", () => {
  assert.deepEqual(validateQuiz(good(), "cs/claude-code/skills", subjects), []);
});

test("unknown subject folder is rejected", () => {
  const q = { ...good(), lesson: "history/x/y", subject: "history", topic: "x" };
  assert.match(validateQuiz(q, "history/x/y", subjects).join(), /not in subjects.json/);
});

test("wrong depth is rejected", () => {
  assert.match(validateQuiz(good(), "cs/skills", subjects).join(), /<subject>\/<topic>\/<lesson>/);
});

test("lesson field must match the file location", () => {
  assert.match(validateQuiz(good(), "cs/claude-code/other", subjects).join(), /"lesson" is/);
});

test("type-specific answers are checked", () => {
  const q = good();
  q.questions[1].answer = "false";
  q.questions[2].answer = 4;
  q.questions[3].question = "No blank";
  const errors = validateQuiz(q, "cs/claude-code/skills", subjects).join("\n");
  assert.match(errors, /true_false/);
  assert.match(errors, /index 0-3/);
  assert.match(errors, /must contain _____/);
});

test("index lists lessons grouped by subject and topic", async () => {
  const { renderIndex } = await import("../hooks/lessons-lib.mjs");
  const html = renderIndex(
    [{ id: "maths/linear-algebra/matrices", title: "Matrices", subject: "maths", topic: "linear-algebra", created: "2026-11-26", questions: 11 }],
    { cs: "Computer science", maths: "Mathematics" },
  );
  assert.match(html, /href="maths\/linear-algebra\/matrices.html"/);
  assert.match(html, /Linear algebra/);
  assert.match(html, /11 quiz questions/);
  assert.doesNotMatch(html, /id="cs"/); // empty subjects are hidden
});
