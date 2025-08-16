const Order = require('../models/order.Model');
const Transaction = require('../models/transaction.Model');
const Listing = require('../models/listing.Model');

function boom(msg, status = 400) { const e = new Error(msg); e.status = status; throw e; }

async function getOrderLean(orderId) {
    const order = await Order.findById(orderId).lean();
    if (!order) boom('Order not found', 404);
    return order;
}

async function summarize(orderId) {
    const txs = await Transaction.find({ order: orderId, status: 'SUCCESS' }, { type:1, amount:1 }).lean();
    const totalAuth = txs.filter(t => t.type === 'CHARGE_AUTH').reduce((s,t)=>s+t.amount,0);
    const totalCap  = txs.filter(t => t.type === 'CAPTURE').reduce((s,t)=>s+t.amount,0);
    const totalRef  = txs.filter(t => t.type === 'REFUND').reduce((s,t)=>s+t.amount,0);
    return { totalAuth, totalCap, totalRef };
}

async function setOrderPaymentStatus(orderId, status) {
    await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: status } });
}

async function resolveAmountAndCurrency(order) {
    // 1) προτίμησε snapshot από το Order
    if (order.price && order.price > 0) return { amount: order.price, currency: order.currency || 'EUR' };
    // 2) fallback: τράβα από Listing (σε περίπτωση παλιών εγγραφών)
    const listing = await Listing.findById(order.listingId).select('price currency').lean();
    const amount = listing?.price || 0;
    const currency = listing?.currency || 'EUR';
    return { amount, currency };
}

async function authorize(orderId, actorUserId, { provider = 'mock', meta = {} } = {}) {
    const order = await Order.findById(orderId).lean();
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
    console.log('[tx.authorize] order.buyerId =', order.buyerId, ' == user? ', String(order.buyerId) === String(actorUserId));
    console.log('[tx.authorize] amount snapshot =', order.price);

    // buyer-only
    if (String(order.buyerId) !== String(actorUserId)) {
        const e = new Error('Only buyer can authorize'); e.status = 403; throw e;
    }

    if (order.paymentStatus && order.paymentStatus !== 'UNPAID') {
        const e = new Error('Order already authorized or captured'); e.status = 409; throw e;
    }

    const { amount, currency } = await resolveAmountAndCurrency(order);
    if (!amount) boom('Order amount is zero', 400);

    await Transaction.create({
        order: order._id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        type: 'CHARGE_AUTH',
        status: 'SUCCESS',
        amount,
        currency,
        provider,
        providerRef: null,
        meta: { ...meta, by: String(actorUserId) }
    });

    await setOrderPaymentStatus(order._id, 'AUTHORIZED');
    const sums = await summarize(order._id);
    return { ok: true, paymentStatus: 'AUTHORIZED', summary: sums };
}

async function capture(orderId, actorUserId, { provider = 'mock', meta = {} } = {}) {
    const order = await getOrderLean(orderId);
    if (order.paymentStatus !== 'AUTHORIZED') boom('Order is not authorized', 409);

    const { totalAuth, totalCap } = await summarize(order._id);
    const remaining = totalAuth - totalCap;
    if (remaining <= 0) boom('Nothing left to capture', 409);

    await Transaction.create({
        order: order._id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        type: 'CAPTURE',
        status: 'SUCCESS',
        amount: remaining,
        currency: order.currency || 'EUR',
        provider,
        providerRef: null,
        meta: { ...meta, by: String(actorUserId) }
    });

    await setOrderPaymentStatus(order._id, 'CAPTURED');
    const sums = await summarize(order._id);
    return { ok: true, paymentStatus: 'CAPTURED', summary: sums };
}

async function refund(orderId, actorUserId, { amount, reason, provider = 'mock', meta = {} } = {}) {
    const order = await getOrderLean(orderId);
    if (order.paymentStatus !== 'CAPTURED') boom('Order is not captured', 409);

    const { totalCap, totalRef } = await summarize(order._id);
    const refundable = totalCap - totalRef;
    if (refundable <= 0) boom('Nothing left to refund', 409);

    const refundAmount = amount ? Math.min(amount, refundable) : refundable;

    await Transaction.create({
        order: order._id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        type: 'REFUND',
        status: 'SUCCESS',
        amount: refundAmount,
        currency: order.currency || 'EUR',
        provider,
        providerRef: null,
        meta: { ...meta, reason, by: String(actorUserId) }
    });

    const left = refundable - refundAmount;
    await setOrderPaymentStatus(order._id, left > 0 ? 'CAPTURED' : 'REFUNDED');

    const sums = await summarize(order._id);
    return { ok: true, paymentStatus: left > 0 ? 'CAPTURED' : 'REFUNDED', summary: sums };
}

module.exports = { authorize, capture, refund, summarize };
