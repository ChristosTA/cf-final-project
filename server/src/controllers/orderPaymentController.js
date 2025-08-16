const asyncHandler = require('../middlewares/asyncHandler');
const tx = require('../services/transactionService');

exports.authorize = asyncHandler(async (req, res) => {
    const out = await tx.authorize(req.params.id, req.user.id, req.body);
    res.status(201).json(out);
});

exports.capture = asyncHandler(async (req, res) => {
    const out = await tx.capture(req.params.id, req.user.id, req.body);
    res.json(out);
});

exports.refund = asyncHandler(async (req, res) => {
    const out = await tx.refund(req.params.id, req.user.id, req.body);
    res.json(out);
});
