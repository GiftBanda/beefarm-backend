import { Request, Response } from 'express';
import { PlantAnalysisRequest } from '../interfaces/plantAnalysis';
import { analyzePlantWithGemini } from '../services/geminiService';

export const analyzePlantImage = async (req: Request, res: Response) => {
    // If using multer for direct file uploads, req.file would be available.
    // For base64, we expect it in the body.
    const { imageData, mimeType } = req.body as PlantAnalysisRequest;

    if (!imageData || !mimeType) {
        return res.status(400).json({
            message: "Missing imageData (base64) or mimeType in request body.",
        });
    }

    // Basic validation for base64 (not exhaustive)
    if (typeof imageData !== 'string' || imageData.length < 100) { // Arbitrary short length check
        return res.status(400).json({ message: "Invalid imageData format or too short." });
    }
    if (!mimeType.startsWith('image/')) {
         return res.status(400).json({ message: "Invalid mimeType. Should be like 'image/jpeg'." });
    }


    try {
        console.log(`Received analysis request for mimeType: ${mimeType}, data length (approx): ${imageData.length}`);
        const analysisResult = await analyzePlantWithGemini(imageData, mimeType);
        res.status(200).json(analysisResult);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error in analyzePlantImage controller:", errorMessage);
        res.status(500).json({ message: "Failed to analyze plant image.", error: errorMessage });
    }
};