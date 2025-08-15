const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const  bindObjectId  = require('../middlewares/bindObjectId');
const Listing = require('../models/listing.Model');
const ctrl = require('../controllers/favoriteController');

router.use(requireAuth);

// Προσθήκη σε favorites (δέχεται serial | uuid | _id στο {id})
router.post('/listings/:id/favorite',
    bindObjectId('id', Listing, 'params', 'Listing'),
    ctrl.add
);

// Αφαίρεση από favorites
router.delete('/listings/:id/favorite',
    bindObjectId('id', Listing, 'params', 'Listing'),
    ctrl.remove
);

// Λίστα των favorites του χρήστη
router.get('/me/favorites', ctrl.listMine);

module.exports = router;
