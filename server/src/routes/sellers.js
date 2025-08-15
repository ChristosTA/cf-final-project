const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { updateSellerProfileSchema } = require('../api/validators/userSchemas');
const ctrl = require('../controllers/sellerController');

router.get('/:id', ctrl.summary); // δημόσιο


// Ο authenticated χρήστης ορίζει seller profile (με billingAddress)
router.put('/me/profile',
    requireAuth,
    validateBody(updateSellerProfileSchema),
    ctrl.updateMySellerProfile
);

// Γίνεται SELLER (αν υπάρχει billingAddress)
router.post('/me/upgrade',
    requireAuth,
    ctrl.upgradeMeToSeller
);


module.exports = router;
