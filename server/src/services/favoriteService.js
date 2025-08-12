const Favorite = require('../models/favorite.Model');
const Listing = require('../models/listing.Model');

async function addFavorite(userId, listingObjectId) {
    // upsert: αν δεν υπάρχει, δημιουργεί
    const res = await Favorite.updateOne(
        { userId, listingId: listingObjectId },
        { $setOnInsert: { userId, listingId: listingObjectId } },
        { upsert: true }
    );

    // αν πραγματικά δημιουργήθηκε νέο (upserted), αύξησε counter
    if (res.upsertedCount === 1) {
        await Listing.updateOne({ _id: listingObjectId }, { $inc: { 'metrics.favoritesCount': 1 } });
    }
    return { ok: true };
}

async function removeFavorite(userId, listingObjectId) {
    const del = await Favorite.deleteOne({ userId, listingId: listingObjectId });
    if (del.deletedCount === 1) {
        await Listing.updateOne({ _id: listingObjectId }, { $inc: { 'metrics.favoritesCount': -1 } });
    }
    return { ok: true };
}

async function listFavorites(userId, { page = 1, limit = 20 } = {}) {
    const skip = (Number(page) - 1) * Number(limit);

    // φέρε τα favorites και κάνε populate τα listings
    const [items, total] = await Promise.all([
        Favorite.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate({ path: 'listingId', select: 'publicId serial title price currency status photos metrics' })
            .lean(),
        Favorite.countDocuments({ userId })
    ]);

    // μετονόμασε το listingId -> listing για πιο καθαρό response
    const mapped = items.map(f => ({
        id: f._id.toString(),
        createdAt: f.createdAt,
        listing: f.listingId
    }));

    return { items: mapped, page: Number(page), limit: Number(limit), total };
}

module.exports = { addFavorite, removeFavorite, listFavorites };
