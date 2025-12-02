import express from 'express';
import { MessController } from '../controllers/MessController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/', authMiddleware, MessController.createMess);

router.get('/:messId', authMiddleware, MessController.getMess);

router.put('/:messId', authMiddleware, MessController.updateMess);

// API to get current meal rate
router.get('/:messId/meal-rate', authMiddleware, MessController.getMealRate);

router.post('/:messId/members', authMiddleware, MessController.addMember);

router.delete('/:messId/members/:userId', authMiddleware, MessController.removeMember);

// GET /mess (admin only)
router.get('/', authMiddleware, MessController.getAllMesses);

// DELETE /mess/:messId
router.delete('/:messId', authMiddleware, MessController.deleteMess);

// POST /mess/admin/cleanup
router.post('/admin/cleanup', authMiddleware, MessController.cleanupData);

export default router;
