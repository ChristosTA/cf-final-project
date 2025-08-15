const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    buyerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
    rating:   { type: Number, min: 1, max: 5, required: true },
    comment:  { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ orderId: 1, buyerId: 1 }, { unique: true }); // 1 review ανά order/buyer

module.exports = mongoose.model('Review', reviewSchema);
