// src/models/deepseekModel.ts
import { ToolConfig, DeepSeekFunctionDeclaration, DeepSeekMessage } from '../types';
import * as weatherService from '../services/weatherService';
import * as sprayingAdvisorService from '../services/sprayingAdvisorService';
import config from '../config/environment';

const OPENROUTER_API_KEY = config.openrouterApiKey;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
//const DEEPSEEK_R1_MODEL = 'deepseek/deepseek-r1'; // OpenRouter model name for DeepSeek R1
const DEEPSEEK_R1_MODEL = 'deepseek/deepseek-r1-0528-qwen3-8b:free';

// Tool configurations remain the same
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

// Extract tool declarations for OpenRouter
const toolDeclarations = Object.values(tools).map(tool => ({
    type: "function" as const,
    function: tool.declaration
}));

export async function getDeepSeekResponse(userMessage: string): Promise<string> {
    try {
        const messages: DeepSeekMessage[] = [
            {
                role: "user",
                content: userMessage
            }
        ];

        // First API call to check if function calling is needed
        const initialResponse = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': config.siteUrl || 'https://yourdomain.com', // Required by OpenRouter
                'X-Title': config.appName || 'Agriculture Assistant' // Optional but recommended
            },
            body: JSON.stringify({
                model: DEEPSEEK_R1_MODEL,
                messages: messages,
                // tools: toolDeclarations.length > 0 ? toolDeclarations : undefined,
                // tool_choice: toolDeclarations.length > 0 ? "auto" : undefined,
                // stream: false
            })
        });

        if (!initialResponse.ok) {
            const errorData = await initialResponse.json();
            throw new Error(`OpenRouter API error: ${errorData.error?.message || initialResponse.statusText}`);
        }

        const initialData = await initialResponse.json();
        const responseMessage = initialData.choices[0].message;

        // Check if the model wants to call a function
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0];
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            if (tools[functionName]) {
                // Execute the function
                const toolResponse = await tools[functionName].function(...Object.values(functionArgs));

                // Add the function response to the messages and get final response
                messages.push(responseMessage);
                messages.push({
                    role: "tool",
                    content: JSON.stringify(toolResponse),
                    tool_call_id: toolCall.id
                });

                const finalResponse = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': config.siteUrl || 'https://yourdomain.com',
                        'X-Title': config.appName || 'Agriculture Assistant'
                    },
                    body: JSON.stringify({
                        model: DEEPSEEK_R1_MODEL,
                        messages: messages,
                        stream: false
                    })
                });

                if (!finalResponse.ok) {
                    const errorData = await finalResponse.json();
                    throw new Error(`OpenRouter API error: ${errorData.error?.message || finalResponse.statusText}`);
                }

                const finalData = await finalResponse.json();
                return finalData.choices[0].message.content;
            } else {
                return `Error: Unknown function requested by DeepSeek R1: ${functionName}`;
            }
        } else {
            return responseMessage.content;
        }

    } catch (error: any) {
        console.error('Error in DeepSeek Model (OpenRouter):', error.message);
        throw new Error(`Failed to get a response from DeepSeek R1 via OpenRouter: ${error.message}`);
    }
}

// Optional: Function to get available models from OpenRouter (for debugging)
export async function getAvailableModels(): Promise<any> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching models:', error);
        return null;
    }
}