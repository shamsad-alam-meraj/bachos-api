import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { DepositController } from '../controllers/DepositController';

const router = express.Router();

// Create a new deposit - Only managers can create deposits
router.post('/', authMiddleware, DepositController.createDeposit);

// Get deposits with flexible filtering
router.get('/', authMiddleware, DepositController.getAllDeposits);

// Get all deposits for a mess with filtering
router.get('/mess/:messId', authMiddleware, DepositController.getDeposits);

// Get deposits for a specific user in a mess
router.get('/mess/:messId/user/:userId', authMiddleware, DepositController.getUserDeposits);

// Get deposit statistics for a mess
router.get('/mess/:messId/stats', authMiddleware, DepositController.getDepositStats);

// Update a deposit - Only managers can update deposits
router.put('/:depositId', authMiddleware, DepositController.updateDeposit);

// Delete a deposit (manager only)
router.delete('/:depositId', authMiddleware, DepositController.deleteDeposit);

export default router;
