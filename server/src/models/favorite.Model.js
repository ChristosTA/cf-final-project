const mongoose = require('mongoose');
const favoriteSchema = new mongoose.Schema({
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    listingId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing', index: true, required: true },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
