const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { bindObjectId } = require('../middlewares/bindObjectId');
const { createOrderSchema, listOrdersQuerySchema, postMessageSchema} = require('../api/validators/orderSchemas');
const ctrl = require('../controllers/orderController');
const Listing = require('../models/listing.model');

const resolveSerialFactory = require('../middlewares/resolveSerialFactory');
const Order = require('../models/order.Model');

router.use(requireAuth);

router.get('/', validateQuery(listOrdersQuerySchema), ctrl.list);

router.post('/',
    validateBody(createOrderSchema),
    bindObjectId('listingId', Listing, 'body', 'Listing'),
    ctrl.create
);
router.get('/:id',
    bindObjectId('id', Listing, 'params', 'Listing'), // <-- μετατρέπει σε Mongo _id
    ctrl.get // εδώ το req.params.id είναι πλέον το _id
);
router.patch('/:id/accept',
    bindObjectId('id', Order, 'params', 'Order'),
    ctrl.accept
);

router.patch('/:id/decline',
    bindObjectId('id', Order, 'params', 'Order'),
    ctrl.decline
);

router.patch('/:id/cancel',
    bindObjectId('id', Order, 'params', 'Order'),
    ctrl.cancel
);

router.patch('/:id/complete',
    bindObjectId('id', Order, 'params', 'Order'),
    ctrl.complete
);

router.get('/:id/messages', requireAuth, ctrl.getMessages);
router.post('/:id/messages', requireAuth, validateBody(postMessageSchema), ctrl.postMessage);


module.exports = router;
