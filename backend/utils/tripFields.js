// Whitelist of fields a client may set on a Trip. Anything else (user, _id,
// createdAt, __v, or any unknown key) is ignored. This prevents mass-assignment:
// a client can never change a trip's owner or database-managed fields.
export const TRIP_FIELDS = [
  "name",
  "destination",
  "startDate",
  "endDate",
  "days",
  "travelers",
  "budget",
  "travelStyle",
  "itinerary",
  "budgetBreakdown",
];

export const pickTripFields = (body) => {
  const source = body && typeof body === "object" ? body : {};
  const picked = {};

  for (const key of TRIP_FIELDS) {
    // Own properties only, so inherited or prototype keys can't slip through.
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      picked[key] = source[key];
    }
  }

  return picked;
};