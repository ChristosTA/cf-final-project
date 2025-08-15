// src/routes/listings.js
const router = require('express').Router();
const { validateBody, validateQuery } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { listQuerySchema, createListingSchema, updateListingSchema } = require('../api/validators/listingSchemas');
const ctrl = require('../controllers/listingController');
const upload = require('../middlewares/upload');

const resolveSerialFactory = require('../middlewares/resolveSerialFactory');
const resolveIdsArrayFactory = require('../middlewares/resolveIdsArrayFactory');

const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');

const resolveListingId   = resolveSerialFactory(Listing);
// Μετατρέπει body.categories (['hoodie', ...]) -> [ObjectId, ...]
const resolveBodyCategories  = resolveIdsArrayFactory(Category, 'categories', 'body');
// Μετατρέπει query.categories (π.χ. ['hoodie'] ή 'hoodie') -> [ObjectId, ...]
const resolveQueryCategories = resolveIdsArrayFactory(Category, 'categories', 'query');

router.get('/',
    validateQuery(listQuerySchema),
    resolveQueryCategories,
    ctrl.list
);

router.post('/',
    requireAuth, requireRole('SELLER','ADMIN'),
    validateBody(createListingSchema),
    resolveBodyCategories,
    ctrl.create
);

router.put('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),
    resolveListingId,
    validateBody(updateListingSchema),
    resolveBodyCategories,
    ctrl.update
);

router.get('/:id',
    resolveListingId,
    ctrl.get
);

router.post('/:id/photos',
    requireAuth,
    resolveListingId,
    upload.array('photos', 5), // <---- multipart field name: photos
    ctrl.addPhotos
);

router.delete('/:id/photos/:photoId',
    requireAuth,
    resolveListingId,
    ctrl.removePhoto
);

router.delete('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),
    resolveListingId,
    ctrl.remove
);

module.exports = router;
