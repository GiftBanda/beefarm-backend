// src/routes/locationWeatherRoutes.ts
import { Router } from 'express';
import { getLocationWeather } from '../controllers/locationWeatherController';

const router = Router();

router.post('/', getLocationWeather);

export default router;