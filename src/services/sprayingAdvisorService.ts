// src/services/sprayingAdvisorService.ts
import { getForecast } from './weatherService';
import { ForecastItem, SprayingAdvice } from '../types';

// Define thresholds for spraying conditions
const SPRAYING_THRESHOLDS = {
    windSpeed: { // km/h
        optimal: { min: 5, max: 20 },
        caution: { min: 2, max: 25 },
        unsuitable: { below: 2, above: 25 }
    },
    temperature: { // Celsius
        optimal: { min: 12, max: 20 },
        caution: { min: 4, max: 25 },
        unsuitable: { below: 4, above: 25 }
    },
    humidity: { // %
        optimal: { min: 60, max: 85 },
        caution: { min: 45, max: 95 },
        unsuitable: { below: 45, above: 95 }
    },
    rainProbability: { // % (This will be inferred from description, OpenWeatherMap doesn't give direct probability in 5-day forecast)
        unsuitable: { above: 20 }, // Higher threshold for 'unsuitable'
        caution: { above: 0 }
    },
};

export async function getSprayingAdvice(location: string, date: string): Promise<SprayingAdvice | { error: string }> {
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    let daysOffset = 0;
    // Simple date parsing to determine how many days into the forecast we need
    if (requestedDate.toDateString() === today.toDateString()) {
        daysOffset = 0; // "today"
    } else {
        // Calculate difference in days. +1 because forecast[0] is often current day's first interval
        daysOffset = Math.ceil((requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOffset < 0) daysOffset = 0; // Don't look backwards
        // Limit to OpenWeatherMap's 5-day forecast (index 0 to 4)
        if (daysOffset > 4) daysOffset = 4;
    }


    const forecastResult = await getForecast(location, daysOffset + 1);

    if ('error' in forecastResult) {
        return { error: `Could not get weather data for spraying advice: ${forecastResult.error}` };
    }

    const targetForecast: ForecastItem | undefined = forecastResult.forecast[daysOffset];

    if (!targetForecast) {
        return { error: `No forecast available for ${date} in ${location}. Please ensure the date is within the next 5 days.` };
    }

    const { temperature, feels_like, humidity, wind_speed, description } = targetForecast;

    let status: 'Good' | 'Caution' | 'Unsuitable' = 'Good';
    const reasons: string[] = [];

    let rainProbability = 0;
    if (description.toLowerCase().includes('rain') || description.toLowerCase().includes('drizzle') || description.toLowerCase().includes('shower')) {
        rainProbability = 50;
    } else if (description.toLowerCase().includes('storm')) {
        rainProbability = 80;
    }


    // --- Apply Rules ---

    // 1. Wind Speed
    if (wind_speed < SPRAYING_THRESHOLDS.windSpeed.unsuitable.below || wind_speed > SPRAYING_THRESHOLDS.windSpeed.unsuitable.above) {
        status = 'Unsuitable';
        reasons.push(`Wind speed (${wind_speed} km/h) is unsuitable (ideal 5-20 km/h). Risk of drift or inversion.`);
    } else if (wind_speed < SPRAYING_THRESHOLDS.windSpeed.optimal.min || wind_speed > SPRAYING_THRESHOLDS.windSpeed.optimal.max) {
        if (status === 'Good') status = 'Caution';
        reasons.push(`Wind speed (${wind_speed} km/h) is marginal (ideal 5-20 km/h). Exercise caution.`);
    }

    // 2. Temperature
    if (temperature < SPRAYING_THRESHOLDS.temperature.unsuitable.below || temperature > SPRAYING_THRESHOLDS.temperature.unsuitable.above) {
        status = 'Unsuitable';
        reasons.push(`Temperature (${temperature}°C) is unsuitable (ideal 12-20°C). Risk of reduced efficacy or plant damage.`);
    } else if (temperature < SPRAYING_THRESHOLDS.temperature.optimal.min || temperature > SPRAYING_THRESHOLDS.temperature.optimal.max) {
        if (status === 'Good') status = 'Caution';
        reasons.push(`Temperature (${temperature}°C) is marginal (ideal 12-20°C). Exercise caution.`);
    }

    // 3. Humidity
    if (humidity < SPRAYING_THRESHOLDS.humidity.unsuitable.below || humidity > SPRAYING_THRESHOLDS.humidity.unsuitable.above) {
        status = 'Unsuitable';
        reasons.push(`Humidity (${humidity}%) is unsuitable (ideal 60-85%). Risk of rapid evaporation or excessive droplet persistence.`);
    } else if (humidity < SPRAYING_THRESHOLDS.humidity.optimal.min || humidity > SPRAYING_THRESHOLDS.humidity.optimal.max) {
        if (status === 'Good') status = 'Caution';
        reasons.push(`Humidity (${humidity}%) is marginal (ideal 60-85%). Exercise caution.`);
    }

    // 4. Rain Probability
    if (rainProbability > SPRAYING_THRESHOLDS.rainProbability.unsuitable.above) {
        status = 'Unsuitable';
        reasons.push(`High chance of rain (${rainProbability}%). Product may wash off.`);
    } else if (rainProbability > SPRAYING_THRESHOLDS.rainProbability.caution.above) {
        if (status === 'Good') status = 'Caution';
        reasons.push(`Some chance of rain (${rainProbability}%). Consider product rainfastness and forecast.`);
    }

    // 5. Temperature Inversion (Basic inference)
    const currentHour = requestedDate.getHours();
    if ((wind_speed < 5 && (currentHour >= 18 || currentHour <= 8)) ||
        (description.toLowerCase().includes('clear') && wind_speed < 5 && (currentHour >= 18 || currentHour <= 8))
    ) {
        if (status !== 'Unsuitable') status = 'Caution';
        reasons.push('Potential for temperature inversion due to calm and clear conditions. Avoid spraying if an inversion is suspected.');
    }


    if (status === 'Good' && reasons.length === 0) {
        reasons.push('All weather parameters appear within optimal ranges.');
    }


    return {
        location,
        date: targetForecast.date,
        status,
        reasons: reasons.length > 0 ? reasons : ['Conditions appear generally suitable.'],
        details: {
            temperature,
            feels_like,
            humidity,
            windSpeed: wind_speed, // Use wind_speed from forecast and map to windSpeed
            description,
            rainProbability,
        }
    };
}