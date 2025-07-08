// src/models/geminiModel.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, FunctionCall, Part, Tool } from '@google/generative-ai'; // Import 'Tool'
import { ToolConfig, GeminiToolFunction, GeminiFunctionDeclaration, GeminiMessagePart } from '../types';
import * as weatherService from '../services/weatherService';
import * as sprayingAdvisorService from '../services/sprayingAdvisorService';
import config from '../config/environment';

const GEMINI_API_KEY = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-pro" });

// Configure safety settings
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

const tools: { [key: string]: ToolConfig } = {
    getCurrentWeather: {
        function: weatherService.getCurrentWeather,
        declaration: {
            name: "getCurrentWeather",
            description: "Gets the current weather for a specified location.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city name for which to get the weather."
                    },
                    unit: {
                        type: "string",
                        enum: ["metric", "imperial"],
                        description: "The unit system to use (metric for Celsius, imperial for Fahrenheit). Defaults to metric."
                    }
                },
                required: ["location"]
            }
        }
    },
    getForecast: {
        function: weatherService.getForecast,
        declaration: {
            name: "getForecast",
            description: "Gets the weather forecast for a specified number of days in a location. Limited to a maximum of 5 days.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city name for which to get the forecast."
                    },
                    days: {
                        type: "number",
                        description: "The number of days for the forecast (e.g., 1 for tomorrow, up to 5 days).",
                        default: 1
                    },
                    unit: {
                        type: "string",
                        enum: ["metric", "imperial"],
                        description: "The unit system to use (metric for Celsius, imperial for Fahrenheit). Defaults to metric."
                    }
                },
                required: ["location"]
            }
        }
    },
    getSprayingAdvice: {
        function: sprayingAdvisorService.getSprayingAdvice,
        declaration: {
            name: "getSprayingAdvice",
            description: "Checks if it's a good day to spray a crop field based on weather conditions like wind, temperature, humidity, and rain for a specified location and date.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city or area name for which to check spraying conditions."
                    },
                    date: {
                        type: "string",
                        description: "The specific date for the check (e.g., 'today', 'tomorrow', '2025-07-08')."
                    }
                },
                required: ["location", "date"]
            }
        }
    }
};

// Extract tool declarations and cast to the SDK's Tool type
const toolDeclarations: Tool[] = Object.values(tools).map(tool => ({
    function_declarations: [tool.declaration] // Wrap in function_declarations array
})) as Tool[];


export async function getGeminiResponse(userMessage: string): Promise<string> {
    try {
        const chat = model.startChat({
            tools: toolDeclarations,
            safetySettings,
        });

        const initialResult = await chat.sendMessage([
            { text: userMessage }
        ] as GeminiMessagePart[]);

        const response = initialResult.response;

        if (typeof response.functionCalls === 'function' && response.functionCalls() && response.functionCalls()!.length > 0) {
            const functionCall: FunctionCall = response.functionCalls()![0];
            const functionName: string = functionCall.name;
            const functionArgs: Record<string, any> = functionCall.args;

            console.log(`Gemini requested function call: ${functionName} with args:`, functionArgs);

            if (tools[functionName]) {
                const toolResponse = await tools[functionName].function(...Object.values(functionArgs));
                console.log("Tool response:", toolResponse);

                const finalResult = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: functionName,
                            response: toolResponse,
                        },
                    },
                ] as GeminiMessagePart[]);
                return finalResult.response.text();
            } else {
                return `Error: Unknown function requested by Gemini: ${functionName}`;
            }
        } else {
            return response.text();
        }

    } catch (error: any) {
        console.error('Error in Gemini Model:', error.message);
        if (error.response && error.response.data) {
            console.error('Gemini API error details:', error.response.data);
            throw new Error(`Gemini API Error: ${error.response.data.message || 'Unknown API error'}`);
        }
        throw new Error(`Failed to get a response from Gemini: ${error.message}`);
    }
}