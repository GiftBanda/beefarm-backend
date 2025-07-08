import axios from 'axios';
import { GEMINI_API_KEY } from '../config/environment';
import { GeminiApiResponse, PlantAnalysisResult } from '../interfaces/plantAnalysis';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function analyzePlantWithGemini(
    base64ImageData: string,
    mimeType: string
): Promise<PlantAnalysisResult> {
    if (!GEMINI_API_KEY) {
        throw new Error("Gemini API key is not configured on the server.");
    }

    const prompt = `You are an expert plant pathologist and horticulturalist. Analyze the provided image of a plant.
Your goal is to identify the plant (be general, e.g., 'Rose bush', 'Tomato plant', 'Indoor Pothos'), detect any visible signs of diseases, pests, or nutrient deficiencies, describe these symptoms clearly, and provide actionable, step-by-step suggestions for treatment or management.

If the image is unclear, not a plant, or if you cannot confidently make a diagnosis, state that clearly.

Structure your response ONLY as a valid JSON object with the following keys and value types:
- "plantName": (string) The common name of the plant, or "Unknown Plant" if not identifiable.
- "identifiedIssue": (string) The primary issue detected (e.g., "Powdery Mildew", "Aphid Infestation", "Nitrogen Deficiency", "No issue detected", "Analysis inconclusive due to image quality").
- "symptomsDescription": (string) A detailed description of the observed symptoms. If no issue, state "Plant appears healthy" or similar.
- "suggestedActions": (array of strings) A list of concrete, actionable steps for the user to take. If no issue, suggest general care tips. If inconclusive, suggest taking a clearer photo.
- "disclaimer": (string) Always include this: "This AI analysis provides suggestions based on the visual information. For a definitive diagnosis and treatment plan, consult a local horticultural expert or agricultural extension office."`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64ImageData,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            responseMimeType: "application/json",
        },
    };

    try {
        const response = await axios.post<GeminiApiResponse>(GEMINI_API_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (
            response.data.candidates &&
            response.data.candidates.length > 0 &&
            response.data.candidates[0].content &&
            response.data.candidates[0].content.parts &&
            response.data.candidates[0].content.parts.length > 0 &&
            response.data.candidates[0].content.parts[0].text
        ) {
            const rawJsonText = response.data.candidates[0].content.parts[0].text;
            // Clean potential markdown formatting around the JSON
            const cleanedJsonText = rawJsonText.replace(/^```json\s*|```$/g, '').trim();
            const analysisResult: PlantAnalysisResult = JSON.parse(cleanedJsonText);
            return analysisResult;
        } else {
            console.error("Unexpected Gemini API response structure:", response.data);
            throw new Error("Received an unexpected response structure from the AI.");
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Axios error calling Gemini API:", error.response?.data || error.message);
            throw new Error(
                `Error calling Gemini API: ${error.response?.status || error.message}`
            );
        }
        console.error("Generic error calling Gemini API:", error);
        throw new Error("An unexpected error occurred while analyzing the plant.");
    }
}