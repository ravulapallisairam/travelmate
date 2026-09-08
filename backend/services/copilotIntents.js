export const INTENTS = [
  { name: "GET_TRIP", description: "User wants to see their current trip or itinerary details", tools: ["getCurrentTrip"], requiresApproval: false },
  { name: "GET_BUDGET", description: "User asks about budget, spending, or remaining money", tools: ["getCurrentTrip", "checkBudget"], requiresApproval: false },
  { name: "CHECK_WEATHER", description: "User asks about weather for their trip or a specific day", tools: ["getCurrentTrip", "checkItineraryWeatherImpact"], requiresApproval: false },
  { name: "ADAPT_ITINERARY", description: "User wants to change/adapt their plan due to weather or other issues", tools: ["getCurrentTrip", "checkItineraryWeatherImpact", "getUserPreferences"], requiresApproval: true, actionType: "WEATHER_REPLAN" },
  { name: "OPTIMIZE_BUDGET", description: "User wants to reduce costs, make the trip cheaper, or optimize their remaining budget", tools: ["getCurrentTrip", "checkBudget"], requiresApproval: true, actionType: "OPTIMIZE" },
  { name: "GET_RECOMMENDATIONS", description: "User wants suggestions for destinations to visit", tools: ["getRecommendations"], requiresApproval: false },
  { name: "DESTINATION_INFO", description: "User wants general tips, recommendations, attractions, or food suggestions about a destination (e.g. 'what should I see', 'what food should I try', 'give me tips')", tools: ["getDestinationInfo"], requiresApproval: false },
  { name: "VERIFY_CURRENT_INFO", description: "User asks a factual question requiring verification from a real source — history, opening hours, closures, current prices, entry/visa rules, or 'tell me about/explain the history of' a specific attraction or landmark", tools: ["verifyCurrentInfo"], requiresApproval: false },
  { name: "CHECK_DISRUPTIONS", description: "User wants to check their whole trip for any problems, risks, or issues — weather disruptions, closures, or anything that might affect their plan", tools: ["checkItineraryDisruptions"], requiresApproval: false },
  { name: "UNKNOWN", description: "Request doesn't match any known travel-related action", tools: [], requiresApproval: false },
];