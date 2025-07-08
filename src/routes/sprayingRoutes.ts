// src/routes/sprayingRoutes.ts
import { Router } from 'express';
import { getSprayingSuggestion } from '../controllers/sprayingController';

const router = Router();

// Define a POST route for getting spraying suggestions
// We use POST because it involves sending data (location, date) in the body
router.post('/', getSprayingSuggestion);

export default router;