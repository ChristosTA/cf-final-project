const router = require('express').Router();
const { validateBody } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { updateUserRolesSchema } = require('../api/validators/userSchemas');
const ctrl = require('../controllers/userController');
const resolveSerialFactory = require("../middlewares/resolveSerialFactory");
const User = require('../models/user.Model');

const resolveUserSerial = resolveSerialFactory(User)

router.get('/', requireAuth, requireRole('ADMIN'), ctrl.list);

router.get('/:id', resolveUserSerial, ctrl.get);

router.put('/:id/roles',
    requireAuth,
    requireRole('ADMIN'),
    resolveUserSerial,
    validateBody(updateUserRolesSchema),
    ctrl.updateRoles
);

router.delete('/:id',
    requireAuth,
    requireRole('ADMIN'),
    resolveUserSerial,
    ctrl.remove
);

module.exports = router;
