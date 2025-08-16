// src/routes/sellers.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');

const {
    sellerProfileSchema,
    sellerBillingSchema,
} = require('../api/validators/sellerSchemas');

const ctrl = require('../controllers/sellerController');

// me/profile
router.put(
    '/me/profile',
    requireAuth,
    validateBody(sellerProfileSchema),
    ctrl.saveProfile
);

// me/billing
router.put(
    '/me/billing',
    requireAuth,
    validateBody(sellerBillingSchema),
    ctrl.saveBilling
);

module.exports = router;
