const router = require('express').Router();
const { requireAuth, requireRole} = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const  bindObjectId  = require('../middlewares/bindObjectId');
const { createOrderSchema, listOrdersQuerySchema, postMessageSchema} = require('../api/validators/orderSchemas');
const ctrl = require('../controllers/orderController');
const Listing = require('../models/listing.model');

const Order = require('../models/order.Model');
const pay = require('../controllers/orderPaymentController');
const { authorizePaymentSchema, capturePaymentSchema, refundPaymentSchema } = require('../api/validators/transactionSchemas');
const {canActOnOrder} = require("../middlewares/canActOnOrder");

router.use(requireAuth);

// List my orders
router.get('/', validateQuery(listOrdersQuerySchema), ctrl.list);

// Create order (from listing)
router.post('/',
    validateBody(createOrderSchema),
    bindObjectId('listingId', Listing, 'body', 'Listing'),
    ctrl.create
);

// Get order (buyer/seller/admin)
router.get('/:id',
    bindObjectId('id', Order, 'params', 'Order'), // FIX: ήταν Listing, να είναι Order
    canActOnOrder('any'),
    ctrl.get
);

// Seller accepts
router.patch('/:id/accept',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('seller'),
    ctrl.accept
);

// Seller declines
router.patch('/:id/decline',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('seller'),
    ctrl.decline
);

// Buyer cancels
router.patch('/:id/cancel',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('buyer'),
    ctrl.cancel
);

// Mark completed (buyer or seller)
router.patch('/:id/complete',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('any'),
    ctrl.complete
);

// Order messages (both parties)
router.get('/:id/messages',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('any'),
    ctrl.getMessages
);

router.post('/:id/messages',
    bindObjectId('id', Order, 'params', 'Order'),
    canActOnOrder('any'),
    validateBody(postMessageSchema),
    ctrl.postMessage
);

module.exports = router;
