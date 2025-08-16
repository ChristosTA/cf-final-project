// server/src/middlewares/resolveOrderId.js
const { requireObjectId } = require('../utils/resolveId');
const Order = require('../models/order.Model');

module.exports = async function resolveOrderId(req, res, next) {
    try {
        req.params.id = await requireObjectId(Order, req.params.id, 'Order');
        next();
    } catch (err) {
        next(err);
    }
};
