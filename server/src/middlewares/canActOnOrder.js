
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
        const orderId = req.params.id; // έχει ήδη γίνει bind σε ObjectId αν χρησιμοποιείς bindObjectId
        const order = await Order.findById(orderId).select('buyer seller').lean();
        if (!order) {
            const e = new Error('Order not found');
            e.status = 404;
            throw e;
        }

        const userId = String(req.user.id);
        const isParty = userId === String(order.buyer) || userId === String(order.seller);
        const admin = isAdmin(req.user); // ήδη υπάρχει στο utils/permissions.js :contentReference[oaicite:0]{index=0}

        let ok = false;
        if (admin) ok = true;
        else if (role === 'any') ok = isParty;
        else if (role === 'buyer') ok = userId === String(order.buyer);
        else if (role === 'seller') ok = userId === String(order.seller);

        if (!ok) {
            const e = new Error('Forbidden');
            e.status = 403;
            throw e;
        }

        // ώστε ο controller να μην ξαναδιαβάζει το order αν θέλει
        req.order = order;
        next();
    });
}

module.exports = { canActOnOrder };
