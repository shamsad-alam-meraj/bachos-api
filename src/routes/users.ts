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

router.get('/profile', authMiddleware, UserController.getProfile);

router.put('/profile', authMiddleware, UserController.updateProfile);

router.get('/:id', authMiddleware, UserController.getUserById);

router.put('/:id', authMiddleware, UserController.updateUser);

router.delete('/:id', authMiddleware, UserController.deleteUser);

export default router;
