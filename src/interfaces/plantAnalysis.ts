export interface PlantAnalysisRequest {
    imageData: string; // Base64 encoded image string
    mimeType: string;  // e.g., "image/jpeg", "image/png"
}

export interface GeminiResponsePart {
    text?: string;
    // Add other potential part types if needed
}

export interface GeminiContent {
    parts: GeminiResponsePart[];
    role?: string;
}

export interface GeminiCandidate {
    content: GeminiContent;
    // Add other candidate properties if needed (finishReason, safetyRatings, etc.)
}

export interface GeminiApiResponse {
    candidates?: GeminiCandidate[];
    // Add promptFeedback or other top-level properties if needed
}

export interface PlantAnalysisResult {
    plantName: string;
    identifiedIssue: string;
    symptomsDescription: string;
    suggestedActions: string[];
    disclaimer: string;
}
