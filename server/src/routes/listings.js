const router = require('express').Router();
const { validateBody, validateQuery } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { apparelFilters } = require('../middlewares/filterMapping');

const { ensureCanEditFactory } = require('../middlewares/ensureCanEdit');
const { listingOwnerResolver } = require('../middlewares/canEditResolvers');
const ensureListingOwner = ensureCanEditFactory(listingOwnerResolver);

const bindObjectId = require('../middlewares/bindObjectId');
const resolveIdsArray = require('../middlewares/resolveIdsArrayFactory');

const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');

const { createListingSchema, updateListingSchema, listQuerySchema } = require('../api/validators/listingSchemas');
const ctrl = require('../controllers/listingController');

// LIST
router.get('/',
    apparelFilters({ normalizer: v => String(v).trim() }),   // <<< brand/size/color -> tags
    validateQuery(listQuerySchema),
    resolveIdsArray('query', 'categories', Category, 'Category'),
    ctrl.list
);

// CREATE (SELLER/ADMIN)
router.post('/',
    requireAuth, requireRole('SELLER','ADMIN'),
    validateBody(createListingSchema),
    resolveIdsArray('body','categories', Category, 'Category'),
    ctrl.create
);

// READ by id
router.get('/:id',
    bindObjectId('id', Listing, 'params', 'Listing'),
    ctrl.get
);

// UPDATE (owner OR admin)
router.put('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),     // πρέπει να είναι seller ή admin
    bindObjectId('id', Listing),
    validateBody(updateListingSchema),
    resolveIdsArray('body','categories', Category, 'Category'),
    ensureListingOwner,                              // και να είναι ο ιδιοκτήτης (ή admin)
    ctrl.update
);

// DELETE (owner OR admin)
router.delete('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ensureListingOwner,
    ctrl.remove
);

// PHOTOS
const upload = require('../middlewares/upload'); // το δικό σου
router.post('/:id/photos',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    upload.array('photos', 6),
    ensureListingOwner,                              // owner check
    ctrl.addPhotos
);

router.delete('/:id/photos/:photoId',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ensureListingOwner,
    ctrl.removePhoto
);

router.patch('/:id/photos/:photoId/cover',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ensureListingOwner,
    ctrl.setCoverPhoto
);

module.exports = router;
