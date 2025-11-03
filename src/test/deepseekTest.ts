// src/test/deepseekTest.ts
import { getDeepSeekResponse, getAvailableModels } from '../models/deepseekModel';

async function testDeepSeek() {
    try {
        // Test basic response
        const response = await getDeepSeekResponse("What's the weather in Tokyo?");
        console.log('DeepSeek R1 Response:', response);
        
        // Optional: Check available models
        const models = await getAvailableModels();
        console.log('Available models:', models.data.map((m: any) => m.id));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testDeepSeek();
}