const asyncHandler = require('../middlewares/asyncHandler');
const Favorite = require('../models/favorite.Model');
const Listing = require('../models/listing.Model');

exports.add = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;
    const { listingId } = req.params;

    // βρες listing + έλεγξε ιδιοκτήτη
    const l = await Listing.findById(listingId).select('sellerId').lean();
    if (!l) return res.status(404).json({ message: 'Listing not found' });
    if (String(l.sellerId) === String(userId)) {
        return res.status(400).json({ message: 'Cannot favorite your own listing' });
    }

    try {
        await Favorite.updateOne(
            { user: userId, listing: listingId },
            { $setOnInsert: { user: userId, listing: listingId, createdAt: new Date() } },
            { upsert: true }
        );
        return res.status(201).json({ ok: true });
    } catch (err) {
        // duplicate => είμαστε ΟΚ (idempotent), απάντησε 200
        if (err && err.code === 11000) return res.status(200).json({ ok: true });
        throw err;
    }
});

exports.remove = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user._id;
    await Favorite.deleteOne({ user: userId, listing: req.params.listingId });
    res.status(204).end();
});

exports.listMine = asyncHandler(async (req, res) => {
    const items = await Favorite.find({ user: req.user.id || req.user._id }).lean();
    res.set('X-Total-Count', String(items.length || 0));
    res.json({ items });
});
