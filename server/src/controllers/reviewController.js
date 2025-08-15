const asyncHandler = require('../middlewares/asyncHandler');
const svc = require('../services/reviewService');

exports.create = asyncHandler(async (req, res) => {
    const doc = await svc.createReview(req.body, req.user);
    res.status(201).json(doc);
});

exports.listSeller = asyncHandler(async (req, res) => {
    const items = await svc.listSellerReviews(req.params.id);
    res.json({ items });
});
