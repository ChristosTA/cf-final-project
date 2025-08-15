const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate'); // ✅ σωστό import
const sellerCtrl = require('../controllers/sellerController');
const { updateSellerProfileSchema, sellerProfileSchema, updateBillingSchema} = require('../api/validators/sellerSchemas'); // εκεί που το έβαλες

router.use(requireAuth);

router.get('/me', sellerCtrl.me);

router.put('/me/billing', requireAuth, validateBody(updateBillingSchema), sellerCtrl.updateMyBilling);


router.put('/me/profile', requireAuth, validateBody(updateSellerProfileSchema), sellerCtrl.updateMySellerProfile);

router.post('/me/upgrade', requireAuth, sellerCtrl.upgradeMeToSeller);

module.exports = router;
