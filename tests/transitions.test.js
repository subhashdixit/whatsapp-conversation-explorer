import test from "node:test";
import assert from "node:assert/strict";
import { analyzeChat } from "../site/engine.js";
test("turns exclude self messages, long idle and reversed clocks", () => {
  const r = analyzeChat(
    "01/01/2024, 09:00 - A: hi\n01/01/2024, 09:02 - A: detail\n01/01/2024, 09:05 - B: ok\n01/01/2024, 09:09 - A: bye\n01/01/2024, 12:00 - B: again\n01/01/2024, 11:59 - A: bad clock",
  );
  assert.equal(r.transitions.sessions, 3);
  assert.equal(r.transitions.outOfOrder, 1);
  assert.deepEqual(r.transitions.edges, [
    { from: "p1", to: "p2", count: 1, medianMinutes: 3 },
    { from: "p2", to: "p1", count: 1, medianMinutes: 4 },
  ]);
});
test("even-count median and iOS timestamps are exact", () => {
  const r = analyzeChat(
    "[01/01/24, 09:00:00] A: hi\n[01/01/24, 09:01:00] B: hi\n[01/01/24, 09:03:00] A: ok\n[01/01/24, 09:06:00] B: ok",
  );
  assert.equal(r.transitions.edges[0].medianMinutes, 2);
});
