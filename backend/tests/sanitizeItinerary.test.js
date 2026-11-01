import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeProposedDays } from "../utils/sanitizeItinerary.js";

const act = (overrides = {}) => ({
  title: "Fort Visit",
  category: "culture",
  startTime: "09:00",
  endTime: "11:00",
  estimatedCost: 20,
  location: "Old Fort",
  description: "A visit",
  ...overrides,
});

const oneDay = (activities) => [{ day: 7, date: "2026-11-01", activities }];

test("valid input is kept, days are renumbered, and extra fields are dropped", () => {
  const input = oneDay([act({ isReplacement: true, evil: "x" })]);
  const result = sanitizeProposedDays(input, { expectedDays: 1 });

  assert.equal(result.error, undefined);
  assert.equal(result.days[0].day, 1);
  assert.equal(result.days[0].date, "2026-11-01");
  assert.equal("isReplacement" in result.days[0].activities[0], false);
  assert.equal("evil" in result.days[0].activities[0], false);
  assert.equal(result.days[0].activities[0].title, "Fort Visit");
});

test("rejects a day count that doesn't match the trip", () => {
  const result = sanitizeProposedDays(oneDay([act()]), { expectedDays: 3 });

  assert.ok(result.error);
});

test("rejects non-arrays, empty arrays, and oversized plans", () => {
  assert.ok(sanitizeProposedDays("nope").error);
  assert.ok(sanitizeProposedDays(null).error);
  assert.ok(sanitizeProposedDays([]).error);
  assert.ok(sanitizeProposedDays(Array.from({ length: 31 }, () => ({ activities: [] }))).error);
});

test("rejects days that aren't objects with an activities array", () => {
  assert.ok(sanitizeProposedDays([null]).error);
  assert.ok(sanitizeProposedDays([{ day: 1 }]).error);
});

test("rejects a day with too many activities", () => {
  const many = Array.from({ length: 9 }, (_, i) => act({ title: `Stop ${i}` }));

  assert.ok(sanitizeProposedDays(oneDay(many)).error);
});

test("drops activities with no usable title but keeps the rest", () => {
  const result = sanitizeProposedDays(oneDay([null, { startTime: "09:00" }, act({ title: "   " }), act()]));

  assert.equal(result.days[0].activities.length, 1);
});

test("rejects invalid times", () => {
  assert.ok(sanitizeProposedDays(oneDay([act({ startTime: "25:00" })])).error);
  assert.ok(sanitizeProposedDays(oneDay([act({ endTime: "soon" })])).error);
  assert.ok(sanitizeProposedDays(oneDay([act({ startTime: undefined })])).error);
});

test("clips long text fields", () => {
  const result = sanitizeProposedDays(oneDay([act({ title: "x".repeat(500), description: "y".repeat(900) })]));

  assert.equal(result.days[0].activities[0].title.length, 120);
  assert.equal(result.days[0].activities[0].description.length, 300);
});

test("costs are sanitized: negative, non-numeric, and huge values", () => {
  const costs = [-5, "abc", 1e9, "42"].map((c) => sanitizeProposedDays(oneDay([act({ estimatedCost: c })])).days[0].activities[0].estimatedCost);

  assert.deepEqual(costs, [0, 0, 100000, 42]);
});

test("unknown categories fall back to sightseeing", () => {
  const result = sanitizeProposedDays(oneDay([act({ category: "bogus" })]));

  assert.equal(result.days[0].activities[0].category, "sightseeing");
});

test("an invalid date is omitted instead of stored", () => {
  const result = sanitizeProposedDays([{ date: "tomorrow", activities: [act()] }]);

  assert.equal("date" in result.days[0], false);
});