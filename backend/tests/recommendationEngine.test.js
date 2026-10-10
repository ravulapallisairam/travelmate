import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreDestinations } from "../utils/recommendationEngine.js";

const prefs = {
  budgetStyle: "budget",
  preferredDuration: 4,
  interests: { nature: 5, luxury: 0 },
};

const beach = { _id: "a", name: "Beach Town", category: "Beach", price: 600, duration: "4 Days", rating: 4.5 };
const resort = { _id: "b", name: "Luxury Resort", category: "Luxury", price: 2000, duration: "7 Days", rating: 4.5 };

test("destinations matching interests, budget and duration rank first", () => {
  const results = scoreDestinations([resort, beach], prefs);

  assert.equal(results[0].destination._id, "a");
  assert.equal(results[0].matchScore, 98);
  assert.ok(results[0].matchScore > results[1].matchScore);
  assert.ok(results[0].reasons.includes("Matches your nature preference"));
});

test("favorited destinations are excluded from recommendations", () => {
  const results = scoreDestinations([beach, resort], prefs, [{ _id: "a" }]);

  assert.deepEqual(results.map((r) => r.destination._id), ["b"]);
});

// Mid-scoring destination, so feedback adjustments don't hit the 0-100 clamp.
const mid = { _id: "c", name: "Mid Place", category: "Beach", price: 2000, duration: "9 Days", rating: 4.0 };
const midPrefs = { budgetStyle: "budget", preferredDuration: 4, interests: { nature: 3 } };
const feedback = (targetId, rating, type = "recommendation") => ({ type, targetId, rating });

test("positive feedback raises a destination's score by 15 and explains why", () => {
  const baseline = scoreDestinations([mid], midPrefs)[0];
  const boosted = scoreDestinations([mid], midPrefs, [], [feedback("c", "useful")])[0];

  assert.equal(boosted.matchScore - baseline.matchScore, 15);
  assert.ok(boosted.reasons.includes("You liked similar recommendations before"));
});

test("negative feedback lowers a destination's score by 15", () => {
  const baseline = scoreDestinations([mid], midPrefs)[0];
  const penalized = scoreDestinations([mid], midPrefs, [], [feedback("c", "not_useful")])[0];

  assert.equal(baseline.matchScore - penalized.matchScore, 15);
});

test("itinerary feedback and feedback for other destinations are ignored", () => {
  const baseline = scoreDestinations([mid], midPrefs)[0].matchScore;

  const wrongType = scoreDestinations([mid], midPrefs, [], [feedback("c", "useful", "itinerary")])[0].matchScore;
  const otherTarget = scoreDestinations([mid], midPrefs, [], [feedback("zzz", "useful")])[0].matchScore;

  assert.equal(wrongType, baseline);
  assert.equal(otherTarget, baseline);
});

test("scores always stay within 0-100", () => {
  const manyLikes = Array.from({ length: 3 }, () => feedback("a", "useful"));
  const top = scoreDestinations([beach], prefs, [], manyLikes)[0];
  assert.equal(top.matchScore, 100);

  const manyDislikes = Array.from({ length: 3 }, () => feedback("b", "not_useful"));
  const bottom = scoreDestinations([resort], prefs, [], manyDislikes)[0];
  assert.equal(bottom.matchScore, 0);
});