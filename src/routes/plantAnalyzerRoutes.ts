import { Router } from 'express';
import { analyzePlantImage } from '../controllers/plantAnalyzerController';

const router = Router();

// POST /api/analyze
router.post('/analyze', analyzePlantImage);

export default router;