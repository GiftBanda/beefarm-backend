// src/controllers/chatController.ts
// src/controllers/chatController.ts
import { Request, Response } from 'express';
import { getDeepSeekResponse } from '../models/deepseekModel'; // Import the new DeepSeek model
import { ChatRequestBody, ChatResponse } from '../types';

export const chatWithAI = async (req: Request<{}, {}, ChatRequestBody>, res: Response<ChatResponse | { error: string }>) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        const aiResponse = await getDeepSeekResponse(userMessage);
        res.json({ response: aiResponse });
    } catch (error: any) {
        console.error('Error in chat controller:', error.message);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};