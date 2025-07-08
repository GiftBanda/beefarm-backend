// src/routes/chatRoutes.ts
import { Router } from 'express';
import { chatWithGemini } from '../controllers/chatController';

const router = Router();

router.post('/', chatWithGemini);

export default router;