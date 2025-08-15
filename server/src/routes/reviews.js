const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { createReviewSchema } = require('../api/validators/reviewSchemas');
const ctrl = require('../controllers/reviewController');

router.post('/', requireAuth, validateBody(createReviewSchema), ctrl.create);
router.get('/seller/:id', ctrl.listSeller);

module.exports = router;
