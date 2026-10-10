import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDayImpact } from "../utils/weatherImpact.js";

const act = (title, category) => ({ title, category, startTime: "09:00", endTime: "11:00", estimatedCost: 20 });
const rain = (rainProbability, temperature = 24) => ({ condition: "rain", rainProbability, temperature });
const clear = (temperature) => ({ condition: "clear", rainProbability: 0, temperature });
const dayWith = (...activities) => ({ day: 1, activities });

test("outdoor activity in heavy rain is a HIGH impact alert", () => {
  const result = detectDayImpact(dayWith(act("Jungle Trek", "adventure")), rain(80));

  assert.equal(result.hasAlert, true);
  assert.equal(result.affectedActivities.length, 1);
  assert.equal(result.affectedActivities[0].impactLevel, "high");
  assert.equal(result.affectedActivities[0].title, "Jungle Trek");
});

test("rain probability thresholds map to the right impact level", () => {
  const level = (prob) => {
    const r = detectDayImpact(dayWith(act("Trek", "adventure")), rain(prob));
    return r.hasAlert ? r.affectedActivities[0].impactLevel : "none";
  };

  assert.equal(level(75), "high");
  assert.equal(level(74), "medium");
  assert.equal(level(55), "medium");
  assert.equal(level(54), "low");
  assert.equal(level(30), "low");
  assert.equal(level(29), "none");
});

test("indoor-safe categories are never flagged for rain", () => {
  for (const category of ["food", "culture", "shopping", "relaxation"]) {
    const result = detectDayImpact(dayWith(act("Indoor Thing", category)), rain(95));
    assert.equal(result.hasAlert, false, `${category} should not be affected by rain`);
  }
});

test("a mixed day only flags the weather-sensitive activities", () => {
  const result = detectDayImpact(
    dayWith(act("Trek", "adventure"), act("Lunch", "food"), act("Viewpoint", "sightseeing")),
    rain(80)
  );

  const titles = result.affectedActivities.map((a) => a.title).sort();
  assert.deepEqual(titles, ["Trek", "Viewpoint"]);
});

test("extreme heat and cold affect outdoor activities at the documented boundaries", () => {
  const level = (temp) => {
    const r = detectDayImpact(dayWith(act("Trek", "adventure")), clear(temp));
    return r.hasAlert ? r.affectedActivities[0].impactLevel : "none";
  };

  assert.equal(level(40), "medium");
  assert.equal(level(39), "none");
  assert.equal(level(2), "medium");
  assert.equal(level(3), "none");

  const heat = detectDayImpact(dayWith(act("Trek", "adventure")), clear(42));
  assert.ok(heat.affectedActivities[0].reason.includes("Extreme temperature"));

  const indoorHeat = detectDayImpact(dayWith(act("Lunch", "food")), clear(42));
  assert.equal(indoorHeat.hasAlert, false);
});

test("snow is treated like rain for outdoor activities", () => {
  const result = detectDayImpact(dayWith(act("Trek", "adventure")), { condition: "snow", rainProbability: 80, temperature: 1 });

  assert.equal(result.affectedActivities[0].impactLevel, "high");
});

test("missing weather data produces no alert instead of a fabricated one", () => {
  const result = detectDayImpact(dayWith(act("Trek", "adventure")), null);

  assert.equal(result.hasAlert, false);
  assert.deepEqual(result.affectedActivities, []);
});

test("a day with no activities produces no alert", () => {
  const result = detectDayImpact({ day: 1 }, rain(90));

  assert.equal(result.hasAlert, false);
  assert.deepEqual(result.affectedActivities, []);
});