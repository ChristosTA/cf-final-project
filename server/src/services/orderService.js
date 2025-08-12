const mongoose = require('mongoose');
const Order = require('../models/order.Model');
const Listing = require('../models/listing.model');
const { isAdmin, isOwner } = require('../utils/permissions');


function isNumeric(s){ return /^\d+$/.test(String(s)); }

async function findOrderByAnyId(id){
    if (isNumeric(id)) return Order.findOne({ serial: Number(id) });
    if (mongoose.isValidObjectId(id)) return Order.findById(id);
    return Order.findOne({ publicId: id });
}

// Create request to buy
async function createOrder(buyerId, { listingId }){
    const listing = await Listing.findById(listingId);
    if (!listing) { const e = new Error('Listing not found'); e.status = 404; throw e; }
    if (listing.status !== 'ACTIVE') { const e = new Error('Listing not available'); e.status = 409; throw e; }
    if (String(listing.sellerId) === String(buyerId)) { const e = new Error('Cannot buy your own listing'); e.status = 400; throw e; }

    // one active order per listing (REQUESTED or ACCEPTED)
    const activeOrder = await Order.findOne({ listingId: listing._id, status: { $in: ['REQUESTED','ACCEPTED'] } });
    if (activeOrder) { const e = new Error('Listing already reserved or in progress'); e.status = 409; throw e; }

    const order = await Order.create({
        listingId: listing._id,
        sellerId: listing.sellerId,
        buyerId: buyerId,
        status: 'REQUESTED'
    });

    // reserve the listing
    listing.status = 'RESERVED';
    await listing.save();

    return order.toJSON();
}

async function listOrders(user, { role, status, page=1, limit=20 }){
    const filter = {};
    if (!role) {
        filter.$or = [{ sellerId: user.id }, { buyerId: user.id }];
    } else if (role === 'seller') filter.sellerId = user.id;
    else if (role === 'buyer') filter.buyerId = user.id;
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(),
        Order.countDocuments(filter)
    ]);
    return { items, page: Number(page), limit: Number(limit), total };
}

async function getOrder(user, id){
    const o = await findOrderByAnyId(id);
    if (!o) { const e = new Error('Order not found'); e.status = 404; throw e; }

    const participant = isOwner(user, o.sellerId) || isOwner(user, o.buyerId);
    if (!participant && !isAdmin(user)) { const e = new Error('Forbidden'); e.status = 403; throw e; }

    return o.toJSON();
}


async function changeStatus(user, id, action){
    const o = await findOrderByAnyId(id);
    if (!o) { const e = new Error('Order not found'); e.status = 404; throw e; }

    const seller = isOwner(user, o.sellerId);
    const buyer  = isOwner(user, o.buyerId);
    const admin  = isAdmin(user);

    const guard = (cond, msg, status=403) => { if(!cond){ const e = new Error(msg); e.status = status; throw e; } };

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
        { const e = new Error('Unknown action'); e.status = 400; throw e; }
    }

    await o.save();
    return o.toJSON();
}


module.exports = { createOrder, listOrders, getOrder, changeStatus };
