const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { createReviewSchema, updateReviewSchema} = require('../api/validators/reviewSchemas');
const { ensureCanEditFactory } = require('../middlewares/ensureCanEdit');
const { reviewOwnerResolver } = require('../middlewares/canEditResolvers');
const ensureReviewOwner = ensureCanEditFactory(reviewOwnerResolver);
const ctrl = require('../controllers/reviewController');

router.post('/', requireAuth, validateBody(createReviewSchema), ctrl.create);
router.get('/seller/:id', ctrl.listSeller);

router.patch('/:id',
    requireAuth,
    validateBody(updateReviewSchema),
    ensureReviewOwner,
    ctrl.update
);

router.delete('/:id',
    requireAuth,
    ensureReviewOwner,
    ctrl.remove
);

module.exports = router;
