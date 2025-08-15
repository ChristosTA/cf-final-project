const asyncHandler = require('../middlewares/asyncHandler');
const { getSellerSummary } = require('../services/userService');

exports.summary = asyncHandler(async (req, res) => {
    const data = await getSellerSummary(req.params.id);
    res.json(data);
});
