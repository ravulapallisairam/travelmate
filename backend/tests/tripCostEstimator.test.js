import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateTotalTripCost } from "../utils/tripCostEstimator.js";

test("full cost data produces the expected labeled breakdown", () => {
  const destination = { estimatedFlightCostUSD: 650, localTransitDailyCostUSD: 20, visaRequired: "visa_on_arrival" };
  const result = estimateTotalTripCost(400, destination, 5, 2);

  assert.equal(result.breakdown.activities.amount, 400);
  assert.equal(result.breakdown.activities.confidence, "estimated");
  assert.equal(result.breakdown.flights.amount, 1300); // 650 x 2 travelers
  assert.equal(result.breakdown.flights.confidence, "rough");
  assert.equal(result.breakdown.localTransit.amount, 100); // 20 x 5 days
  assert.equal(result.breakdown.contingency.amount, 180); // 10% of (400 + 1400)
  assert.equal(result.breakdown.contingency.confidence, "buffer");
  assert.equal(result.additionalCost, 1400);
  assert.equal(result.grandTotal, 1980);
  assert.ok(result.disclaimer.length > 0);
});

test("visa fees are never invented, only flagged", () => {
  const onArrival = estimateTotalTripCost(400, { visaRequired: "visa_on_arrival" }, 5, 1);
  assert.equal(onArrival.breakdown.visa.amount, null);
  assert.equal(onArrival.breakdown.visa.confidence, "unknown");

  const required = estimateTotalTripCost(400, { visaRequired: "yes" }, 5, 1);
  assert.equal(required.breakdown.visa.amount, null);
  assert.ok(required.breakdown.visa.note.includes("Visa required"));
});

test("destinations without cost data get only activities and contingency", () => {
  const result = estimateTotalTripCost(400, {}, 5, 1);

  assert.deepEqual(Object.keys(result.breakdown), ["activities", "contingency"]);
  assert.equal(result.breakdown.contingency.amount, 40);
  assert.equal(result.grandTotal, 440);
});

test("contingency is rounded to a whole number", () => {
  const result = estimateTotalTripCost(333, {}, 3, 1);

  assert.equal(result.breakdown.contingency.amount, 33);
  assert.equal(result.grandTotal, 366);
});

test("no visa line appears when no visa is needed or the status is unknown", () => {
  for (const visaRequired of ["no", "unknown", undefined]) {
    const result = estimateTotalTripCost(400, { visaRequired }, 5, 1);
    assert.equal("visa" in result.breakdown, false, `visaRequired=${visaRequired} should not add a visa line`);
  }
});