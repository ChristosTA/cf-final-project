// src/routes/users.js
const router = require('express').Router();
const { validateBody } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { updateUserRolesSchema } = require('../api/validators/userSchemas');
const ctrl = require('../controllers/userController');

const resolveSerialFactory = require('../middlewares/resolveSerialFactory');
const User = require('../models/user.Model');
const resolveUserSerial = resolveSerialFactory(User);

// Admin-only λίστα
router.get('/', requireAuth, requireRole('ADMIN'), ctrl.list);

// Get by id (serial | uuid | _id) – δεν απαιτεί admin (μπορεί να το περιορίσεις αν θέλεις)
router.get('/:id', requireAuth, resolveUserSerial, ctrl.get);

// Update roles (ADMIN)
router.put('/:id/roles',
    requireAuth,
    requireRole('ADMIN'),
    resolveUserSerial,
    validateBody(updateUserRolesSchema),
    ctrl.updateRoles
);

// Delete user (ADMIN)
router.delete('/:id',
    requireAuth,
    requireRole('ADMIN'),
    resolveUserSerial,
    ctrl.remove
);

module.exports = router;
