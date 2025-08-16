// server/src/controllers/orderController.js
const asyncHandler = require('../middlewares/asyncHandler');
const svc = require('../services/orderService');

// CREATE via service (snapshot από Listing, buyer = req.user.id)
exports.create = asyncHandler(async (req, res) => {
    const dto = await svc.createOrder(req.user?.id, req.body);
    // Επιστρέφουμε και _id και publicId ώστε τα επόμενα calls (payments) να δουλεύουν με ό,τι id θες
    res.status(201).json(dto);
});

// LIST my orders (buyer/seller/all)
exports.list = asyncHandler(async (req, res) => {
    const r = await svc.listOrders(req.user, req.query);
    res.set('X-Total-Count', r.total);
    res.status(200).json({ items: r.items, total: r.total, page: r.page, limit: r.limit });
});

// GET by id (αν ήδη κάνεις resolve σε ObjectId στο route, ok)
exports.get = asyncHandler(async (req, res) => {
    const o = await svc.getOrder(req.user, req.params.id);
    res.json(o);
});

// messages
exports.getMessages = asyncHandler(async (req, res) => {
    const msgs = await svc.getMessages(req.params.id, req.user);
    res.json({ items: msgs });
});

exports.postMessage = asyncHandler(async (req, res) => {
    const msg = await svc.addMessage(req.params.id, req.user, req.body.text);
    res.status(201).json(msg);
});

// order status transitions
exports.accept   = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'accept')); });
exports.decline  = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'decline')); });
exports.cancel   = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'cancel')); });
exports.complete = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'complete')); });

// ⚠️ ΜΗΝ κρατάς εδώ authorize/capture/refund – αυτά ανήκουν στο orderPaymentController
