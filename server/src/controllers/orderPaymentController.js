const asyncHandler = require('../middlewares/asyncHandler');
const tx = require('../services/transactionService');

exports.authorize = asyncHandler(async (req, res) => {
    const out = await tx.authorize(req.params.id, req.user.id, req.body);
    console.log('[authorize] params.id =', req.params.id);
    console.log('[authorize] req.user.id =', req.user?.id);
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
