// src/routes/chatRoutes.ts
import { Router } from 'express';
import { chatWithAI } from '../controllers/chatController';

const router = Router();

router.post('/', chatWithAI);

export default router;