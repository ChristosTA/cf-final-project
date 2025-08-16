const Review = require('../models/review.Model');
const Order  = require('../models/order.Model');
const { requireObjectId } = require('../utils/resolveId');

async function createReview({ orderId, rating, comment }, currentUser) {
    const _id = await requireObjectId(Order, orderId, 'Order');
    const order = await Order.findById(_id).select({ status:1, buyerId:1, sellerId:1 });
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }

    // μόνο buyer
    if (String(order.buyerId) !== String(currentUser.id)) {
        const e = new Error('Forbidden'); e.status = 403; throw e;
    }

    // μόνο σε COMPLETED
    if (order.status !== 'COMPLETED') {
        const e = new Error('You can review only completed orders'); e.status = 400; throw e;
    }

    const doc = await Review.create({
        orderId: order._id,
        sellerId: order.sellerId,
        buyerId:  currentUser.id,
        rating,
        comment
    });
    return doc.toObject();
}

async function listSellerReviews(sellerIdOrAny) {
    const sellerId = await requireObjectId(require('../models/user.Model'), sellerIdOrAny, 'User');
    return Review.find({ sellerId }).sort({ createdAt: -1 }).lean();
}

async function getSellerRating(sellerId) {
    const r = await Review.aggregate([
        { $match: { sellerId } },
        { $group: { _id: '$sellerId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    return r[0] ? { avg: r[0].avg, count: r[0].count } : { avg: 0, count: 0 };
}

async function updateReview(reviewId, payload) {
    const patch = {};
    if (typeof payload.rating !== 'undefined') patch.rating = payload.rating;
    if (typeof payload.comment !== 'undefined') patch.comment = payload.comment;

    const updated = await Review.findByIdAndUpdate(
        reviewId,
        { $set: patch },
        { new: true, runValidators: true, projection: { __v: 0 } }
    ).lean();

    if (!updated) {
        const e = new Error('Review not found');
        e.status = 404;
        throw e;
    }
    return updated;
}

// Διαγραφή review
async function deleteReview(reviewId) {
    const r = await Review.findByIdAndDelete(reviewId);
    if (!r) {
        const e = new Error('Review not found');
        e.status = 404;
        throw e;
    }
    return true;
}

module.exports = { createReview, listSellerReviews, getSellerRating, deleteReview, updateReview };
