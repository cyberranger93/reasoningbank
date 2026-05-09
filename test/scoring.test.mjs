import assert from "node:assert/strict";
import test from "node:test";
import { scoreTextOverlap, tokenize } from "../dist/scoring.js";

test("tokenize drops short words and lowercases content", () => {
  assert.deepEqual(tokenize("Research LLM pricing for AGENTS"), [
    "research",
    "pricing",
    "agents",
  ]);
});

test("scoreTextOverlap rewards similar task descriptions", () => {
  const similar = scoreTextOverlap(
    "research LLM pricing options",
    "compare pricing options for LLM providers"
  );
  const unrelated = scoreTextOverlap(
    "research LLM pricing options",
    "rotate browser screenshots for QA"
  );

  assert.ok(similar > unrelated);
  assert.ok(similar > 0);
});
