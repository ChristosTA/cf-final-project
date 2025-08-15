const asyncHandler = require('../middlewares/asyncHandler');
const svc = require('../services/orderService');
const { getMessages, addMessage } = require('../services/orderService');

exports.create = asyncHandler(async (req, res) => {
    const order = await svc.createOrder(req.user.id, req.body);
    res.status(201).json(order);
});

exports.list = asyncHandler(async (req, res) => {
    const r = await svc.listOrders(req.user, req.query);
    res.set('X-Total-Count', r.total);
    res.json({ items: r.items, page: r.page, limit: r.limit, total: r.total });
});

exports.get = asyncHandler(async (req, res) => {
    const o = await svc.getOrder(req.user, req.params.id);
    res.json(o);
});

exports.getMessages = asyncHandler(async (req, res) => {
    const msgs = await getMessages(req.params.id, req.user);
    res.json({ items: msgs });
});

exports.postMessage = asyncHandler(async (req, res) => {
    const msg = await addMessage(req.params.id, req.user, req.body.text);
    res.status(201).json(msg);
});

exports.accept   = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'accept')); });
exports.decline  = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'decline')); });
exports.cancel   = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'cancel')); });
exports.complete = asyncHandler(async (req, res) => { res.json(await svc.changeStatus(req.user, req.params.id, 'complete')); });
