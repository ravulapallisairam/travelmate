// Real Total Trip Cost Estimator — combines the AI-planned activity costs
// (already validated) with categories the itinerary never accounts for:
// flights, visa, and local transit. All estimates are clearly labeled as
// rough/optional so users understand what's verified vs. approximate.

export const estimateTotalTripCost = (activityCost, destination, days, travelers) => {
  const breakdown = {
    activities: {
      label: "Planned Activities",
      amount: activityCost,
      confidence: "estimated", // comes from AI itinerary, itself an estimate
      note: "From your generated itinerary",
    },
  };

  let additionalTotal = 0;

  if (destination.estimatedFlightCostUSD) {
    const flightCost = destination.estimatedFlightCostUSD * travelers;
    breakdown.flights = {
      label: "Round-trip Flights",
      amount: flightCost,
      confidence: "rough",
      note: "Rough estimate — actual fares vary by origin, season, and booking time",
    };
    additionalTotal += flightCost;
  }

  if (destination.localTransitDailyCostUSD) {
    const transitCost = destination.localTransitDailyCostUSD * days;
    breakdown.localTransit = {
      label: "Local Transit",
      amount: transitCost,
      confidence: "rough",
      note: `~$${destination.localTransitDailyCostUSD}/day for taxis, metro, or rideshare`,
    };
    additionalTotal += transitCost;
  }

  if (destination.visaRequired === "yes") {
    breakdown.visa = {
      label: "Visa Fee",
      amount: null, // we don't fabricate a specific fee, just flag it
      confidence: "unknown",
      note: destination.visaNotes || "Visa required — check official government sources for current fees",
    };
  } else if (destination.visaRequired === "visa_on_arrival") {
    breakdown.visa = {
      label: "Visa on Arrival",
      amount: null,
      confidence: "unknown",
      note: destination.visaNotes || "Visa available on arrival — fee varies, check official sources",
    };
  }

  const contingency = Math.round((activityCost + additionalTotal) * 0.1);
  breakdown.contingency = {
    label: "Contingency Buffer (10%)",
    amount: contingency,
    confidence: "buffer",
    note: "Recommended cushion for unexpected costs",
  };

  const grandTotal = activityCost + additionalTotal + contingency;

  return {
    breakdown,
    activityCost,
    additionalCost: additionalTotal,
    contingency,
    grandTotal,
    disclaimer: "Flight, visa, and transit costs are rough estimates only — verify current prices before booking.",
  };
};