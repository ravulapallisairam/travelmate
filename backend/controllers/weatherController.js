import Destination from "../models/Destination.js";
import { getWeatherForDate } from "../services/weatherService.js";
import { detectDayImpact } from "../utils/weatherImpact.js";

export const checkItineraryWeather = async (req, res) => {
    try {
        const { destinationId, days } = req.body;

        if (!destinationId || !Array.isArray(days)) {
            return res.status(400).json({ message: "Missing destinationId or days." });
        }

        const destination = await Destination.findById(destinationId);
        if (!destination?.coordinates?.lat || !destination?.coordinates?.lng) {
            return res.json({
                available: false,
                message: "Live weather information is temporarily unavailable for this destination.",
                dayAlerts: [],
            });
        }

        const { lat, lng } = destination.coordinates;
        const dayAlerts = [];
        let anyWeatherFetched = false;

        for (const day of days) {
            if (!day.date) continue;
            try {
                const weather = await getWeatherForDate(lat, lng, day.date);
                anyWeatherFetched = true;
                const impact = detectDayImpact(day, weather);
                if (impact.hasAlert) {
                    dayAlerts.push({ day: day.day, date: day.date, ...impact });
                }
            } catch (err) {
                // Beyond 5-day forecast range, or provider hiccup - just skip this
                // day silently rather than failing the whole request.
                console.log(`Weather unavailable for day ${day.day} (${day.date}): ${err.message}`);
            }
        }

        res.json({
            available: anyWeatherFetched,
            message: anyWeatherFetched ? null : "Live weather information is temporarily unavailable.",
            dayAlerts,
        });
    } catch (error) {
        console.error("Weather check error:", error.message);
        res.status(200).json({
            available: false,
            message: "Live weather information is temporarily unavailable.",
            dayAlerts: [],
        });
    }
};
export const suggestItineraryChanges = async (req, res) => {
    try {
        const { destinationId, days, dayAlerts } = req.body;

        if (!destinationId || !Array.isArray(days) || !Array.isArray(dayAlerts)) {
            return res.status(400).json({ message: "Missing required fields for replanning." });
        }

        const User = (await import("../models/User.js")).default;
        const destination = await Destination.findById(destinationId);
        if (!destination) return res.status(404).json({ message: "Destination not found" });

        const user = await User.findById(req.user._id);
        const { suggestReplacement } = await import("../utils/alternativeSuggestions.js");

        const alertedDayNumbers = new Set(dayAlerts.map((a) => a.day));
        const usedTitles = days.flatMap((d) => (d.activities || []).map((a) => a.title.toLowerCase()));

        const suggestedDays = days.map((day) => {
            if (!alertedDayNumbers.has(day.day)) return day;

            const alert = dayAlerts.find((a) => a.day === day.day);
            const affectedTitles = new Set(alert.affectedActivities.map((a) => a.title));

            const newActivities = day.activities.map((activity) => {
                if (!affectedTitles.has(activity.title)) return activity;

                const replacement = suggestReplacement(activity, destination, user.preferences, usedTitles);
                if (replacement) {
                    usedTitles.push(replacement.title.toLowerCase());
                    return replacement;
                }
                return activity; // no safe replacement found, keep original rather than break the day
            });

            return { ...day, activities: newActivities };
        });

        res.json({
            originalDays: days,
            suggestedDays,
            changesCount: dayAlerts.reduce((sum, a) => sum + a.affectedActivities.length, 0),
        });
    } catch (error) {
        console.error("Replanning error:", error.message);
        res.status(500).json({ message: "Couldn't generate suggested changes right now." });
    }
};