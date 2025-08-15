const router = require('express').Router();
const { validateBody, validateQuery } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const bindObjectId = require('../middlewares/bindObjectId');
const resolveIdsArray = require('../middlewares/resolveIdsArrayFactory');

const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');

const { createListingSchema, updateListingSchema, listQuerySchema } = require('../api/validators/listingSchemas');
const ctrl = require('../controllers/listingController');


// LIST
router.get('/',
    validateQuery(listQuerySchema),
    // αν θέλεις να δίνεις και εδώ slugs/serials:
    resolveIdsArray('query', 'categories', Category, 'Category'),
    // αν κρατήσεις και 'category' σαν μονό:
    // resolveIdsArray('query','category', Category, 'Category'),
    ctrl.list
);

// CREATE (SELLER/ADMIN)
router.post('/',
    requireAuth, requireRole('SELLER','ADMIN'),
    validateBody(createListingSchema),
    resolveIdsArray('body','categories', Category, 'Category'),
    ctrl.create
);

// READ by id (serial/uuid/_id → _id)
router.get('/:id',
    bindObjectId('id', Listing, 'params', 'Listing'),
    ctrl.get
);

// UPDATE
router.put('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    validateBody(updateListingSchema),
    resolveIdsArray('body','categories', Category, 'Category'),
    ctrl.update
);

// DELETE
router.delete('/:id',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ctrl.remove
);

// Upload photos (multipart)
const upload = require('../middlewares/upload'); // το δικό σου (multer/whatever)
router.post('/:id/photos',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    upload.array('photos', 6),
    ctrl.addPhotos
);

router.delete('/:id/photos/:photoId',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ctrl.removePhoto
);

router.patch('/:id/photos/:photoId/cover',
    requireAuth, requireRole('SELLER','ADMIN'),
    bindObjectId('id', Listing),
    ctrl.setCoverPhoto
);

module.exports = router;
