/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get all non-admin users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of non-admin users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [user, manager, admin]
 */
router.get('/all', authMiddleware, UserController.getAllNonAdminUsers);

/**
 * @swagger
 * /api/users/all-users:
 *   get:
 *     summary: Get all users (including admins)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/all-users', authMiddleware, UserController.getAllUsers);

/**
 * @swagger
 * /api/users/admins:
 *   get:
 *     summary: Get only admin users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 */
router.get('/admins', authMiddleware, UserController.getAdmins);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search and filter users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, manager, admin]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Filtered users
 */
router.get('/search', authMiddleware, UserController.searchAndFilterUsers);

/**
 * @swagger
 * /api/users/stats/overview:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats/overview', authMiddleware, UserController.getUserStatistics);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', authMiddleware, UserController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               profileImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', authMiddleware, UserController.updateProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', authMiddleware, UserController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, manager, admin]
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', authMiddleware, UserController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user permanently
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', authMiddleware, UserController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/soft:
 *   delete:
 *     summary: Soft delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User soft deleted
 */
router.delete('/:id/soft', authMiddleware, UserController.softDeleteUser);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   put:
 *     summary: Restore soft deleted user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored
 */
router.put('/:id/restore', authMiddleware, UserController.restoreUser);

/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: boolean
 *               language:
 *                 type: string
 *               theme:
 *                 type: string
 *                 enum: [light, dark]
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put('/preferences', authMiddleware, UserController.updateUserPreferences);

export default router;
