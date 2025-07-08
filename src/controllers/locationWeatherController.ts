// src/controllers/locationWeatherController.ts
import { Request, Response } from 'express';
import { getCurrentWeather } from '../services/weatherService';
import { WeatherData } from '../types';

interface GetLocationWeatherBody {
    latitude: number;
    longitude: number;
}

export const getLocationWeather = async (
    req: Request<{}, {}, GetLocationWeatherBody>,
    res: Response<WeatherData | { error: string }>
) => {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    try {
        const weather = await getCurrentWeather({ lat: latitude, lon: longitude });

        if ('error' in weather) {
            return res.status(404).json({ error: weather.error });
        }

        res.json(weather);
    } catch (error: any) {
        console.error('Error in getLocationWeather controller:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error when getting location weather.' });
    }
};