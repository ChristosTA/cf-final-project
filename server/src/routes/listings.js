const router = require('express').Router();
const { validateBody, validateQuery } = require('../middlewares/validate');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { listQuerySchema, createListingSchema, updateListingSchema} = require('../api/validators/listingSchemas');
const ctrl = require('../controllers/listingController');
const resolveSerialFactory = require('../middlewares/resolveSerialFactory');
const Listing = require('../models/listing.Model');

const resolveListingSerial = resolveSerialFactory(Listing);

router.get('/', validateQuery(listQuerySchema), ctrl.list);

router.post('/',
    requireAuth,
    requireRole('SELLER','ADMIN'),
    validateBody(createListingSchema),
    ctrl.create
);

router.delete('/:id',
    requireAuth,
    requireRole('SELLER','ADMIN'),
    resolveListingSerial,
    ctrl.remove
);

router.get('/:id', resolveListingSerial, ctrl.get);

router.put('/:id',
    requireAuth,
    requireRole('SELLER','ADMIN'),
    resolveListingSerial,
    validateBody(updateListingSchema),
    ctrl.update
);


module.exports = router;
