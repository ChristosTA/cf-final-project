const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const bindObjectId = require('../middlewares/bindObjectId');
const Listing = require('../models/listing.Model');
const ctrl = require('../controllers/favoriteController');

router.use(requireAuth);

router.post('/:listingId', requireAuth, ctrl.add);
router.delete('/:listingId', requireAuth, ctrl.remove);
router.get('/', requireAuth, ctrl.listMine);

module.exports = router;
