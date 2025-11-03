import dotenv from 'dotenv';

dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const PORT = process.env.PORT || 3001;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
export const COOKIE_EXPIRES_IN = process.env.COOKIE_EXPIRES_IN || 90;

interface AppConfig {
    port: number;
    geminiApiKey: string;
    openWeatherApiKey: string;
    openrouterApiKey: string;
    siteUrl: string;
    appName: string;
}

const config: AppConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    siteUrl: process.env.SITE_URL || 'https://yourapp.com',
    appName: process.env.APP_NAME || 'Agriculture Assistant',
};


// if (!GEMINI_API_KEY) {
//     console.error("FATAL ERROR: GEMINI_API_KEY is not defined in .env file.");
//     // process.exit(1); // Uncomment this to make the app exit if key is missing
// }

// Validate essential configurations
if (!config.geminiApiKey) {
    console.error("Fatal Error: GEMINI_API_KEY is not set.");
    process.exit(1);
}
if (!config.openWeatherApiKey) {
    console.error("Fatal Error: OPENWEATHER_API_KEY is not set.");
    // In a real app, you might only warn if weather is optional.
    // For this example, it's essential, so we'll exit.
    process.exit(1);
}

export default config;