import { test } from "node:test";
import assert from "node:assert/strict";
import { validateItinerary } from "../utils/itineraryValidator.js";

const START = "2026-11-01";

const activity = (title, startTime, endTime, estimatedCost = 20, category = "sightseeing") => ({
  title,
  category,
  startTime,
  endTime,
  estimatedCost,
  location: "Test Location",
  description: "test",
});

const makeDay = (day, activities) => ({ day, date: `2026-11-0${day}`, activities });

test("clean itinerary produces no warnings and a perfect score", () => {
  const itinerary = {
    days: [
      makeDay(1, [activity("Fort Visit", "09:00", "11:00", 20), activity("Tea Lunch", "12:00", "14:00", 30, "food")]),
      makeDay(2, [activity("Museum Tour", "09:00", "11:00", 20, "culture"), activity("Night Market", "18:00", "20:00", 30, "shopping")]),
    ],
  };
  const result = validateItinerary(itinerary, { days: 2, budget: 500, startDate: START });

  assert.deepEqual(result.warnings, []);
  assert.equal(result.totalEstimatedCost, 100);
  assert.equal(result.feasibilityScore, 100);
  assert.equal(result.repairedDays.length, 2);
});

test("overlapping activities are flagged as a time conflict", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Fort Visit", "09:00", "12:00"), activity("Museum Tour", "11:00", "13:00")])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.ok(result.warnings.some((w) => w.includes("overlaps")));
  assert.equal(result.breakdown.time, 85);
  assert.ok(result.feasibilityScore < 100);
});

test("back-to-back activities (end == next start) are not a conflict", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Fort Visit", "09:00", "11:00"), activity("Museum Tour", "11:00", "13:00")])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.ok(!result.warnings.some((w) => w.includes("overlaps")));
  assert.equal(result.breakdown.time, 100);
});

test("budget overflow is detected and lowers the budget score", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Helicopter Ride", "09:00", "11:00", 400), activity("Private Dinner", "19:00", "21:00", 400, "food")])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.equal(result.totalEstimatedCost, 800);
  assert.ok(result.warnings.some((w) => w.includes("exceeds your budget")));
  assert.equal(result.breakdown.budget, 40);
});

test("spending exactly the budget is not flagged", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Fort Visit", "09:00", "11:00", 250), activity("Tea Lunch", "12:00", "14:00", 250, "food")])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.ok(!result.warnings.some((w) => w.includes("exceeds your budget")));
  assert.equal(result.breakdown.budget, 100);
});

test("duplicate activities across days are detected case-insensitively", () => {
  const itinerary = {
    days: [
      makeDay(1, [activity("Fort Visit", "09:00", "11:00"), activity("Tea Lunch", "12:00", "14:00", 20, "food")]),
      makeDay(2, [activity("fort visit", "09:00", "11:00"), activity("Night Market", "18:00", "20:00", 20, "shopping")]),
    ],
  };
  const result = validateItinerary(itinerary, { days: 2, budget: 500, startDate: START });

  assert.ok(result.warnings.some((w) => w.includes("repeated")));
  assert.equal(result.breakdown.preferences, 90);
});

test("missing days are padded and reported", () => {
  const itinerary = {
    days: [
      makeDay(1, [activity("Fort Visit", "09:00", "11:00"), activity("Tea Lunch", "12:00", "14:00", 20, "food")]),
      makeDay(2, [activity("Museum Tour", "09:00", "11:00", 20, "culture"), activity("Night Market", "18:00", "20:00", 20, "shopping")]),
    ],
  };
  const result = validateItinerary(itinerary, { days: 3, budget: 500, startDate: START });

  assert.equal(result.repairedDays.length, 3);
  assert.equal(result.repairedDays[2].activities.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("Requested 3 days but AI generated 2")));
  assert.equal(result.breakdown.coverage, 70);
});

test("extra days returned by the AI are trimmed to the requested count", () => {
  const filler = (n) => makeDay(n, [activity(`Place ${n}A`, "09:00", "11:00"), activity(`Place ${n}B`, "12:00", "14:00", 20, "food")]);
  const itinerary = { days: [filler(1), filler(2), filler(3), filler(4)] };
  const result = validateItinerary(itinerary, { days: 2, budget: 500, startDate: START });

  assert.equal(result.repairedDays.length, 2);
  assert.ok(result.warnings.some((w) => w.includes("Requested 2 days but AI generated 4")));
});

test("malformed top-level AI output never throws", () => {
  assert.doesNotThrow(() => validateItinerary(null, { days: 2, budget: 100, startDate: START }));
  assert.doesNotThrow(() => validateItinerary(undefined, { days: 2, budget: 100, startDate: START }));

  const result = validateItinerary({ days: "not-an-array" }, { days: 1, budget: 100, startDate: START });
  assert.equal(result.repairedDays.length, 1);
  assert.equal(result.repairedDays[0].activities.length, 0);
});

test("activities without a title (or null entries) are dropped", () => {
  const itinerary = {
    days: [makeDay(1, [{ startTime: "09:00" }, null, activity("Real One", "10:00", "11:00")])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.equal(result.repairedDays[0].activities.length, 1);
  assert.equal(result.repairedDays[0].activities[0].title, "Real One");
});

test("an unknown category is normalized to sightseeing", () => {
  const itinerary = { days: [makeDay(1, [activity("Mystery Spot", "09:00", "11:00", 10, "bogus")])] };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.equal(result.repairedDays[0].activities[0].category, "sightseeing");
});

test("unparseable times are skipped without crashing or inventing conflicts", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Thing A", "late", "later"), activity("Thing B", "sometime", "else")])],
  };
  let result;
  assert.doesNotThrow(() => {
    result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });
  });
  assert.ok(!result.warnings.some((w) => w.includes("overlaps")));
});

test("non-numeric costs count as zero instead of producing NaN", () => {
  const itinerary = {
    days: [makeDay(1, [activity("Free Walk", "09:00", "10:00", "free"), activity("Paid Tour", "11:00", "13:00", 30)])],
  };
  const result = validateItinerary(itinerary, { days: 1, budget: 500, startDate: START });

  assert.equal(result.totalEstimatedCost, 30);
});

test("a day with too many activities is flagged as too busy", () => {
  const hour = (h) => `${String(h).padStart(2, "0")}:00`;
  const six = Array.from({ length: 6 }, (_, i) => activity(`Stop ${i + 1}`, hour(8 + i), hour(9 + i), 5));
  const result = validateItinerary({ days: [makeDay(1, six)] }, { days: 1, budget: 500, startDate: START });

  assert.ok(result.warnings.some((w) => w.includes("too busy")));
});