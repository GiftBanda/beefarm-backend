// src/types/index.ts

import { FunctionDeclaration, Part } from '@google/generative-ai'; // Import FunctionDeclaration from the SDK

// src/types/index.ts

// src/types/index.ts
export interface DeepSeekMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
}

export interface DeepSeekFunctionDeclaration {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface DeepSeekTool {
    type: "function";
    function: DeepSeekFunctionDeclaration;
}

export interface ToolConfig {
    function: (...args: any[]) => Promise<any>;
    declaration: DeepSeekFunctionDeclaration;
}

export interface WeatherData {
    location: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    description: string;
    wind_speed: number;
    unit: 'Celsius' | 'Fahrenheit';
    iconUrl: string; // <-- NEW
}

export interface ForecastItem {
    date: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    unit: 'Celsius' | 'Fahrenheit';
    iconUrl: string; // <-- NEW
}

export interface ForecastData {
    location: string;
    forecast: ForecastItem[];
}

export interface SprayingAdvice {
    location: string;
    date: string;
    status: 'Good' | 'Caution' | 'Unsuitable';
    reasons: string[];
    details: {
        temperature: number;
        feels_like: number;
        humidity: number;
        windSpeed: number;
        description: string;
        rainProbability: number;
        iconUrl: string; // <-- NEW, nested within details
    };
}

// --- Spraying Advice Types ---
export interface SprayingAdvice {
    location: string;
    date: string;
    status: 'Good' | 'Caution' | 'Unsuitable';
    reasons: string[];
    details: { // Made 'details' non-optional and added all relevant weather fields
        temperature: number;
        feels_like: number;
        humidity: number;
        windSpeed: number; // Sticking to camelCase for consistency in the response
        description: string;
        rainProbability: number;
        iconUrl: string;
        // deltaT?: number; // Keep this optional if not always available
    };
}

// --- Gemini Tooling Types ---
// This interface defines the structure of the function declaration that Gemini expects
// It mirrors the structure of GoogleGenerativeAI.FunctionDeclaration's 'parameters' part
// We use FunctionDeclaration from the SDK directly for the overall tool structure
export interface GeminiToolFunction { // Renamed from ToolDeclaration for better clarity
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            [key: string]: {
                type: string;
                description: string;
                enum?: string[];
                default?: any;
            };
        };
        required: string[];
    };
}

// This interface combines the actual function implementation with its Gemini declaration
export interface ToolConfig {
    function: (...args: any[]) => Promise<any>;
    declaration: GeminiToolFunction; // Now using the exported interface
}

// --- Request/Response Types ---
export interface ChatRequestBody {
    message: string;
}

export interface ChatResponse {
    response: string;
}

// We can directly use FunctionDeclaration from '@google/generative-ai'
// for the array that gets passed to chat.startChat({ tools: ... })
export type GeminiFunctionDeclaration = FunctionDeclaration; // Alias for clarity

export type GeminiMessagePart = Part; // Alias for clarity