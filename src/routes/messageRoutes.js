import express from 'express';
import { sendMessage, getMyMessages, markAsRead } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to send a message
router.post('/', sendMessage);

// Private routes for item owners
router.get('/', protect, getMyMessages);
router.put('/:id/read', protect, markAsRead);

export default router;
