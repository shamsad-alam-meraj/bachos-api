import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all non-admin users
router.get('/all', authMiddleware, UserController.getAllNonAdminUsers);

// Get all users (including admins)
router.get('/all-users', authMiddleware, UserController.getAllUsers);

// Get only admin users
router.get('/admins', authMiddleware, UserController.getAdmins);

// Search and filter users (Admin only)
router.get('/search', authMiddleware, UserController.searchAndFilterUsers);

// Get user statistics (Admin only)
router.get('/stats/overview', authMiddleware, UserController.getUserStatistics);

router.get('/profile', authMiddleware, UserController.getProfile);

router.put('/profile', authMiddleware, UserController.updateProfile);

router.get('/:id', authMiddleware, UserController.getUserById);

router.put('/:id', authMiddleware, UserController.updateUser);

router.delete('/:id', authMiddleware, UserController.deleteUser);

router.delete('/:id/soft', authMiddleware, UserController.softDeleteUser);

router.put('/:id/restore', authMiddleware, UserController.restoreUser);

router.put('/preferences', authMiddleware, UserController.updateUserPreferences);

export default router;
