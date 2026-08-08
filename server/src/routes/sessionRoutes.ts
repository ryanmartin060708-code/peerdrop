import { Router } from 'express';
import {
  createSession,
  getSessionByRoomCode,
  getSessionById,
  getUserHistory,
} from '../controllers/sessionController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticateJWT, createSession);
router.get('/history', authenticateJWT, getUserHistory);
router.get('/room/:roomCode', getSessionByRoomCode);
router.get('/:sessionId', getSessionById);

export default router;
