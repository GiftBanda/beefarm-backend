// src/controllers/chatController.ts
import { Request, Response } from 'express';
import { getGeminiResponse } from '../models/geminiModel'; // Import the model
import { ChatRequestBody, ChatResponse } from '../types';

export const chatWithGemini = async (req: Request<{}, {}, ChatRequestBody>, res: Response<ChatResponse | { error: string }>) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        const geminiTextResponse = await getGeminiResponse(userMessage);
        res.json({ response: geminiTextResponse });
    } catch (error: any) {
        console.error('Error in chat controller:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};