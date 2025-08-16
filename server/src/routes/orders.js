const router = require('express').Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateBody, validateQuery } = require('../middlewares/validate');
const bindObjectId = require('../middlewares/bindObjectId');
const resolveOrderId = require('../middlewares/resolveOrderId');
const { canActOnOrder } = require('../middlewares/canActOnOrder'); // ή από utils αν εκεί το έχεις

const { createOrderSchema, listOrdersQuerySchema, postMessageSchema } = require('../api/validators/orderSchemas');
const orderCtrl = require('../controllers/orderController');
const paymentCtrl = require('../controllers/orderPaymentController');

const Listing = require('../models/listing.Model');

router.use(requireAuth);

router.get('/', validateQuery(listOrdersQuerySchema), orderCtrl.list);

router.post('/',
    validateBody(createOrderSchema),
    bindObjectId('listingId', Listing, 'body', 'Listing'),
    orderCtrl.create
);

router.get('/:id', resolveOrderId, orderCtrl.get);
router.patch('/:id/accept',   resolveOrderId, orderCtrl.accept);
router.patch('/:id/decline',  resolveOrderId, orderCtrl.decline);
router.patch('/:id/cancel',   resolveOrderId, orderCtrl.cancel);
router.patch('/:id/complete', resolveOrderId, orderCtrl.complete);

router.get('/:id/messages',   resolveOrderId, orderCtrl.getMessages);
router.post('/:id/messages',  resolveOrderId, validateBody(postMessageSchema), orderCtrl.postMessage);

// Payments
router.post(
    '/:id/payments/authorize',
    resolveOrderId,            // ΠΡΩΤΑ λύσε το id
    canActOnOrder('buyer'),    // μετά έλεγξε ότι είναι ο buyer (ή ADMIN)
    paymentCtrl.authorize
);

router.post(
    '/:id/payments/capture',
    resolveOrderId,
    requireRole('ADMIN'),
    paymentCtrl.capture
);

router.post(
    '/:id/payments/refund',
    resolveOrderId,
    requireRole('ADMIN'),
    paymentCtrl.refund
);

module.exports = router;
