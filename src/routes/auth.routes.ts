import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes
router.get('/user', protect, authController.getUser);
router.put('/update-password', protect, authController.updateUserPassword);

export default router;