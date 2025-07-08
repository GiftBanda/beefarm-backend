// src/controllers/sprayingController.ts
import { Request, Response } from 'express';
import { getSprayingAdvice } from '../services/sprayingAdvisorService';
import { SprayingAdvice } from '../types';

// Define the expected request body for this controller
interface GetSprayingAdviceRequestBody {
    location: string;
    date: string; // e.g., "today", "tomorrow", "2025-07-08"
}

/**
 * Handles requests to get spraying advice based on location and date.
 * @param req Express Request object with a body containing location and date.
 * @param res Express Response object to send back spraying advice or an error.
 */
export const getSprayingSuggestion = async (
    req: Request<{}, {}, GetSprayingAdviceRequestBody>,
    res: Response<SprayingAdvice | { error: string }>
) => {
    const { location, date } = req.body;

    // Basic input validation
    if (!location || !date) {
        return res.status(400).json({ error: "Location and date are required in the request body." });
    }

    try {
        const advice = await getSprayingAdvice(location, date);

        // Check if the service returned an error object
        if ('error' in advice) {
            return res.status(404).json({ error: advice.error });
        }

        // If successful, send the spraying advice
        res.json(advice);
    } catch (error: any) {
        console.error('Error in getSprayingSuggestion controller:', error.message);
        // Send a generic 500 error for unexpected issues
        res.status(500).json({ error: error.message || 'Internal Server Error when getting spraying advice.' });
    }
};