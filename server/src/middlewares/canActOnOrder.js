
const asyncHandler = require('./asyncHandler');
const Order = require('../models/order.Model');
const { isAdmin } = require('../utils/permissions');

/**
 * role:
 *  - 'any'    -> buyer ή seller (ή ADMIN)
 *  - 'buyer'  -> μόνο buyer (ή ADMIN)
 *  - 'seller' -> μόνο seller (ή ADMIN)
 */
function canActOnOrder(role = 'any') {
    return asyncHandler(async (req, _res, next) => {
        // εδώ το req.params.id είναι ΗΔΗ ObjectId (από resolveOrderId)
        const order = await Order.findById(req.params.id).select('buyerId sellerId').lean();
        if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }

        const userId = String(req.user.id);
        const admin = isAdmin(req.user);

        let ok = false;
        if (admin) ok = true;
        else if (role === 'any') ok = userId === String(order.buyerId) || userId === String(order.sellerId);
        else if (role === 'buyer') ok = userId === String(order.buyerId);
        else if (role === 'seller') ok = userId === String(order.sellerId);

        if (!ok) { const e = new Error('Forbidden'); e.status = 403; throw e; }

        next();
    });
}

module.exports = { canActOnOrder };
