// server/src/services/orderService.js
const mongoose = require('mongoose');
const Order = require('../models/order.Model');
const Listing = require('../models/listing.Model'); // ✅ σωστό path/case
const { isAdmin, isOwner } = require('../utils/permissions');
const { requireObjectId } = require('../utils/resolveId');

function boom(msg, status = 400) { const e = new Error(msg); e.status = status; throw e; }
const isNumeric = s => /^\d+$/.test(String(s));

async function findOrderByAnyId(id){
    if (isNumeric(id)) return Order.findOne({ serial: Number(id) });
    if (mongoose.isValidObjectId(id)) return Order.findById(id);
    return Order.findOne({ publicId: id });
}

// Create request to buy
async function createOrder(buyerId, { listingId, listing }) {
    const lid = listingId || listing; // δέξου και listing (compat με schema normalize)
    if (!lid) boom('listingId is required', 422);

    const doc = await Listing.findById(lid).select('_id sellerId price currency status').lean();
    if (!doc) boom('Listing not found', 404);
    // Αν δεν έχεις status στο Listing schema, αυτός ο έλεγχος δεν μπλοκάρει
    if (doc.status && doc.status !== 'ACTIVE') boom('Listing not available', 409);
    if (String(doc.sellerId) === String(buyerId)) boom('Cannot buy your own listing', 400);

    // one active order per listing (REQUESTED or ACCEPTED)
    const activeOrder = await Order.findOne({ listingId: doc._id, status: { $in: ['REQUESTED','ACCEPTED'] } }).lean();
    if (activeOrder) boom('Listing already reserved or in progress', 409);

    // snapshot τιμής (για payments)
    const order = await Order.create({
        listingId: doc._id,
        sellerId: doc.sellerId,
        buyerId: buyerId,
        price: doc.price,                     // αν το schema δεν έχει price, αφαίρεσέ το
        currency: doc.currency || 'EUR',
        status: 'REQUESTED'
    });

    // reserve listing (αν χρησιμοποιείς status στο Listing)
    if (doc.status) {
        await Listing.updateOne({ _id: doc._id }, { $set: { status: 'RESERVED' } });
    }

    // Επέστρεψε και _id και publicId για να δουλέψουν τα payments με οποιοδήποτε id
    return {
        _id: order._id,
        id: order.publicId,
        publicId: order.publicId,
        serial: order.serial,
        status: order.status,
        paymentStatus: order.paymentStatus,
    };
}

async function listOrders(user, { role, status, page=1, limit=20 } = {}) {
    if (!user?.id) boom('Unauthorized', 401);

    const filter = {};
    if (!role) filter.$or = [{ sellerId: user.id }, { buyerId: user.id }];
    else if (role === 'seller') filter.sellerId = user.id;
    else if (role === 'buyer')  filter.buyerId  = user.id;

    if (status) filter.status = status;

    page = Number(page); limit = Math.min(Number(limit), 50);

    const [items, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        Order.countDocuments(filter)
    ]);
    return { items, page, limit, total };
}

async function getOrder(user, id) {
    const o = await findOrderByAnyId(id);
    if (!o) boom('Order not found', 404);

    const participant = isOwner(user, o.sellerId) || isOwner(user, o.buyerId);
    if (!participant && !isAdmin(user)) boom('Forbidden', 403);

    return o.toJSON();
}

function ensureOrderParticipant(order, userId) {
    const u = String(userId);
    if (String(order.buyerId) !== u && String(order.sellerId) !== u) boom('Forbidden', 403);
}

async function getMessages(idOrAny, currentUser) {
    const _id = await requireObjectId(Order, idOrAny, 'Order');
    const order = await Order.findById(_id).select({ messages: 1, buyerId: 1, sellerId: 1 });
    if (!order) boom('Not found', 404);
    ensureOrderParticipant(order, currentUser.id);
    return order.messages || [];
}

async function addMessage(idOrAny, currentUser, text) {
    if (!text || !text.trim()) boom('Text required', 422);
    const _id = await requireObjectId(Order, idOrAny, 'Order');
    const order = await Order.findById(_id).select({ messages: 1, buyerId: 1, sellerId: 1 });
    if (!order) boom('Not found', 404);
    ensureOrderParticipant(order, currentUser.id);

    order.messages.push({ senderId: currentUser.id, text: text.trim(), createdAt: new Date() });
    await order.save();
    return order.messages[order.messages.length - 1];
}

async function changeStatus(user, id, action) {
    const o = await findOrderByAnyId(id);
    if (!o) boom('Order not found', 404);

    const seller = isOwner(user, o.sellerId);
    const buyer  = isOwner(user, o.buyerId);
    const admin  = isAdmin(user);

    const guard = (cond, msg, status=403) => { if (!cond) boom(msg, status); };

    // Αν στο Listing έχεις status, το διαχειριζόμαστε
    const listing = await Listing.findById(o.listingId);

    switch (action) {
        case 'accept':
            guard(seller || admin, 'Only seller can accept');
            guard(o.status === 'REQUESTED', 'Invalid state', 409);
            o.status = 'ACCEPTED';
            break;
        case 'decline':
            guard(seller || admin, 'Only seller can decline');
            guard(o.status === 'REQUESTED', 'Invalid state', 409);
            o.status = 'DECLINED';
            if (listing) { listing.status = 'ACTIVE'; await listing.save(); }
            break;
        case 'cancel':
            guard(buyer || admin, 'Only buyer can cancel');
            guard(o.status === 'REQUESTED', 'Invalid state', 409);
            o.status = 'CANCELLED';
            if (listing) { listing.status = 'ACTIVE'; await listing.save(); }
            break;
        case 'complete':
            guard(seller || admin, 'Only seller can complete');
            guard(o.status === 'ACCEPTED', 'Invalid state', 409);
            o.status = 'COMPLETED';
            if (listing) { listing.status = 'SOLD'; await listing.save(); }
            break;
        default:
            boom('Unknown action', 400);
    }

    await o.save();
    return o.toJSON();
}

module.exports = {
    createOrder,
    listOrders,
    getOrder,
    changeStatus,
    getMessages,
    addMessage,
};
