const asyncHandler = require('../middlewares/asyncHandler');
const { getSellerSummary } = require('../services/userService');
const userSvc = require('../services/userService');

exports.summary = asyncHandler(async (req, res) => {
    const data = await getSellerSummary(req.params.id);
    res.json(data);
});


exports.updateMySellerProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id; // από requireAuth
    const result = await userSvc.updateSellerProfile(userId, req.body);
    res.json({ user: result });
});

exports.upgradeMeToSeller = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await userSvc.upgradeToSeller(userId);
    res.json({ user: result });
});
