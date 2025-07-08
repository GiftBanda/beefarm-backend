// src/services/weatherService.ts
import axios from 'axios';
import { WeatherData, ForecastData, ForecastItem } from '../types';
import config from '../config/environment'; // Import config

const OPENWEATHER_API_KEY = config.openWeatherApiKey;

export async function getCurrentWeather(
    params: { location?: string; lat?: number; lon?: number },
    unit: 'metric' | 'imperial' = 'metric'
): Promise<WeatherData | { error: string }> {
    if (!OPENWEATHER_API_KEY) {
        return { error: "OpenWeatherMap API key is not configured." };
    }

    let apiUrl = `http://api.openweathermap.org/data/2.5/weather?appid=${OPENWEATHER_API_KEY}&units=${unit}`;

    if (params.location) {
        apiUrl += `&q=${params.location}`;
    } else if (params.lat !== undefined && params.lon !== undefined) {
        apiUrl += `&lat=${params.lat}&lon=${params.lon}`;
    } else {
        return { error: "Either 'location' or 'lat' and 'lon' must be provided." };
    }

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;
        return {
            location: data.name,
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            description: data.weather[0].description,
            wind_speed: data.wind.speed,
            unit: unit === 'metric' ? 'Celsius' : 'Fahrenheit'
        };
    } catch (error: any) {
        console.error(`Error fetching current weather for ${params.location || `lat:${params.lat},lon:${params.lon}`}:`, error.message);
        if (error.response && error.response.status === 404) {
            return { error: `Location not found. Please check the spelling or coordinates.` };
        }
        return { error: `Could not fetch current weather. Please try again later.` };
    }
}


// export async function getCurrentWeather(location: string, unit: 'metric' | 'imperial' = 'metric'): Promise<WeatherData | { error: string }> {
//     if (!OPENWEATHER_API_KEY) {
//         return { error: "OpenWeatherMap API key is not configured." };
//     }
//     const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${OPENWEATHER_API_KEY}&units=${unit}`;

//     try {
//         const response = await axios.get(apiUrl);
//         const data = response.data;
//         return {
//             location: data.name,
//             temperature: data.main.temp,
//             feels_like: data.main.feels_like,
//             humidity: data.main.humidity,
//             description: data.weather[0].description,
//             wind_speed: data.wind.speed,
//             unit: unit === 'metric' ? 'Celsius' : 'Fahrenheit'
//         };
//     } catch (error: any) {
//         console.error(`Error fetching current weather for ${location}:`, error.message);
//         if (error.response && error.response.status === 404) {
//             return { error: `City '${location}' not found. Please check the spelling.` };
//         }
//         return { error: `Could not fetch current weather for ${location}. Please try again later.` };
//     }
// }

export async function getForecast(location: string, days: number = 1, unit: 'metric' | 'imperial' = 'metric'): Promise<ForecastData | { error: string }> {
    if (!OPENWEATHER_API_KEY) {
        return { error: "OpenWeatherMap API key is not configured." };
    }
    // OpenWeatherMap's 5-day / 3-hour forecast API
    const apiUrl = `http://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${OPENWEATHER_API_KEY}&units=${unit}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        const dailyForecasts: ForecastItem[] = [];
        const addedDates: Set<string> = new Set();

        for (const forecastItem of data.list) {
            const forecastDate = new Date(forecastItem.dt * 1000);
            const dateString = forecastDate.toDateString();

            if (!addedDates.has(dateString) && dailyForecasts.length < days) {
                // Aim for midday data for a daily summary
                if (forecastDate.getHours() >= 10 && forecastDate.getHours() <= 14) {
                    dailyForecasts.push({
                        date: dateString,
                        temperature: forecastItem.main.temp,
                        feels_like: forecastItem.main.feels_like,
                        description: forecastItem.weather[0].description,
                        unit: unit === 'metric' ? 'Celsius' : 'Fahrenheit',
                        humidity: forecastItem.main.humidity,
                        wind_speed: forecastItem.wind.speed
                    });
                    addedDates.add(dateString);
                }
            }
            if (dailyForecasts.length >= days) {
                break;
            }
        }

        return {
            location: data.city.name,
            forecast: dailyForecasts
        };

    } catch (error: any) {
        console.error(`Error fetching forecast for ${location}:`, error.message);
        if (error.response && error.response.status === 404) {
            return { error: `City '${location}' not found. Please check the spelling.` };
        }
        return { error: `Could not fetch forecast for ${location}. Please try again later.` };
    }
}