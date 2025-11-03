import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PORT } from './config/environment';
import plantAnalyzerRoutes from './routes/plantAnalyzerRoutes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import sprayingRoutes from './routes/sprayingRoutes';
import locationWeatherRoutes from './routes/locationWeatherRoutes'
import config from './config/environment'; // Import your configuration

const app: Express = express();

// --- Middlewares ---
// Enable CORS for all routes and origins (customize as needed for production)
app.use(cors());

// Parse JSON request bodies (increased limit for base64 image data)
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// --- Routes ---
app.get('/', (req: Request, res: Response) => {
    res.send('Plant Analyzer Backend is running!');
});

// Mount your routes
app.use('/api/v1/chat', chatRoutes); 

app.use('/api/weather', locationWeatherRoutes);

app.use('/api/spraying-advice', sprayingRoutes);

app.use('/api/plant', plantAnalyzerRoutes); // Prefix all analysis routes with /api/plant

app.use('/api/auth', authRoutes);

// --- Error Handling Middleware ---
// Basic error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn("Warning: GEMINI_API_KEY is not set. API calls will fail.");
    }
    console.log(`OpenWeatherMap API Key: ${config.openWeatherApiKey ? 'Configured' : 'NOT CONFIGURED'}`);
    console.log(`Gemini API Key: ${config.geminiApiKey ? 'Configured' : 'NOT CONFIGURED'}`);
});