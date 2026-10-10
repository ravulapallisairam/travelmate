import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTripFields, TRIP_FIELDS } from "../utils/tripFields.js";

test("keeps every allowed field", () => {
  const body = {
    name: "Rome Trip",
    destination: "Rome",
    startDate: "2026-11-01",
    endDate: "2026-11-05",
    days: 5,
    travelers: 2,
    budget: 1500,
    travelStyle: "Adventure",
    itinerary: { days: [] },
    budgetBreakdown: { food: 100 },
  };

  assert.deepEqual(pickTripFields(body), body);
});

test("drops ownership and database-managed fields", () => {
  const result = pickTripFields({
    name: "x",
    user: "someone-else",
    _id: "abc",
    createdAt: "now",
    updatedAt: "now",
    __v: 3,
    isAdmin: true,
  });

  assert.deepEqual(result, { name: "x" });
});

test("ignores undefined values but keeps real falsy values", () => {
  const result = pickTripFields({ name: undefined, travelers: 0, destination: "" });

  assert.deepEqual(result, { travelers: 0, destination: "" });
});

test("returns an empty object for missing or non-object bodies", () => {
  assert.deepEqual(pickTripFields(undefined), {});
  assert.deepEqual(pickTripFields(null), {});
  assert.deepEqual(pickTripFields("a string"), {});
  assert.deepEqual(pickTripFields(42), {});
});

test("does not mutate the input", () => {
  const body = { name: "x", user: "u" };
  const copy = { ...body };

  pickTripFields(body);

  assert.deepEqual(body, copy);
});

test("ignores inherited properties", () => {
  const body = Object.create({ name: "inherited" });

  assert.deepEqual(pickTripFields(body), {});
});

test("a __proto__ key in a JSON body cannot pollute anything", () => {
  const body = JSON.parse('{"__proto__": {"polluted": true}, "name": "x"}');
  const result = pickTripFields(body);

  assert.deepEqual(result, { name: "x" });
  assert.equal({}.polluted, undefined);
  assert.equal(result.polluted, undefined);
});

test("the whitelist never includes the owner or the id", () => {
  assert.equal(TRIP_FIELDS.includes("user"), false);
  assert.equal(TRIP_FIELDS.includes("_id"), false);
});