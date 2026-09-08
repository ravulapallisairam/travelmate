import { aggregateGroupPreferences } from "./utils/groupPreferenceEngine.js";

const owner = {
  interests: { nature: 2, food: 4, culture: 3, adventure: 5, luxury: 1, relaxation: 1 },
};

const companions = [
  { name: "Alex", interests: { nature: 4, food: 3, culture: 3, adventure: 1, luxury: 1, relaxation: 5 } },
];

const result = aggregateGroupPreferences(owner, companions);
console.log(JSON.stringify(result, null, 2));