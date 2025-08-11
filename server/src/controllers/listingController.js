const asyncHandler = require('../middlewares/asyncHandler');
const listings = require('../services/listingService');

exports.list = asyncHandler(async (req, res) => {
    const r = await listings.list(req.query);
    res.set('X-Total-Count', r.total);
    res.json({ items: r.items, page: r.page, limit: r.limit, total: r.total });
});

exports.create = asyncHandler(async (req, res) => {
    const item = await listings.create(req.user.id, req.body);
    res.status(201).json(item);
});

exports.get = asyncHandler(async (req, res) => {
    const it = await listings.getByIdOrPublicId(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    res.json(it);
});

exports.remove = asyncHandler(async (req, res) => {
    await listings.deleteListing(req.params.id);
    res.json({ ok: true });
});

exports.update = asyncHandler(async (req, res) => {
    const updated = await listings.updateListing(req.params.id, req.body, req.user);
    res.json(updated);
});


