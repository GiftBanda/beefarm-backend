// src/controllers/sprayingController.ts
import { Request, Response } from 'express';
import { getSprayingAdvice } from '../services/sprayingAdvisorService';
import { SprayingAdvice } from '../types';

// Define the expected request body for this controller
interface GetSprayingAdviceRequestBody {
    location?: string; // Optional: for manual city input, if you want to keep that option
    latitude?: number; // New: for current location
    longitude?: number; // New: for current location
    date: string; // e.g., "today", "tomorrow", "2025-07-08"
}

/**
 * Handles requests to get spraying advice based on location string OR coordinates and date.
 * @param req Express Request object with a body containing location OR coordinates and date.
 * @param res Express Response object to send back spraying advice or an error.
 */
export const getSprayingSuggestion = async (
    req: Request<{}, {}, GetSprayingAdviceRequestBody>,
    res: Response<SprayingAdvice | { error: string }>
) => {
    const { location, latitude, longitude, date } = req.body;

    // Validate inputs: either location OR (latitude AND longitude) must be provided
    if (!date) {
        return res.status(400).json({ error: "Date is required in the request body." });
    }
    if (!(location || (latitude !== undefined && longitude !== undefined))) {
        return res.status(400).json({ error: "Either 'location' or both 'latitude' and 'longitude' are required." });
    }
    // If both are provided, prioritize coordinates for more precise advice
    if (location && latitude !== undefined && longitude !== undefined) {
        console.warn("Both location string and coordinates provided for spraying advice. Prioritizing coordinates.");
    }

    try {
        let advice;
        if (latitude !== undefined && longitude !== undefined) {
            advice = await getSprayingAdvice({ lat: latitude, lon: longitude, locationName: location }, date);
        } else if (location) {
            // If only location string is provided, you might need a geocoding step here
            // For simplicity, for now, let's assume we'll always get lat/lon from the frontend
            // If you truly want to support *only* city name, you'd need a geocoding API call here
            // to convert location string to lat/lon before calling getSprayingAdvice
            return res.status(400).json({ error: "Location string is not currently supported for spraying advice directly. Please provide coordinates." });
            // Alternatively, if weatherService.getForecast supported string, you'd call:
            // advice = await getSprayingAdvice({ locationName: location }, date); // This would need getSprayingAdvice to handle string location
        } else {
             // This case should ideally be caught by the earlier validation, but as a fallback
             return res.status(400).json({ error: "Invalid input: missing location or coordinates." });
        }


        // Check if the service returned an error object
        if ('error' in advice) {
            return res.status(404).json({ error: advice.error });
        }

        // If successful, send the spraying advice
        res.json(advice);
    } catch (error: any) {
        console.error('Error in getSprayingSuggestion controller:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error when getting spraying advice.' });
    }
};