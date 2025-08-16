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


// PATCH /api/reviews/:id
exports.update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await reviewService.updateReview(id, req.body);
    res.json(updated);
});

// DELETE /api/reviews/:id
exports.remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await reviewService.deleteReview(id);
    res.status(204).send();
});