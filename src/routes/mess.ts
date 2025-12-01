import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { MessController } from '../controllers/MessController';

const router = express.Router();

router.post('/create', authMiddleware, MessController.createMess);

router.get('/:messId', authMiddleware, MessController.getMess);

// API to get current meal rate
router.get('/:messId/meal-rate', authMiddleware, MessController.getMealRate);

router.post('/:messId/add-member', authMiddleware, MessController.addMember);

// GET /mess (admin only)
router.get('/', authMiddleware, MessController.getAllMesses);

// DELETE /mess/admin/:messId
router.delete('/admin/:messId', authMiddleware, MessController.deleteMess);

// POST /mess/admin/cleanup
router.post('/admin/cleanup', authMiddleware, MessController.cleanupData);

export default router;
