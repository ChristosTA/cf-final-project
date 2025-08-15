const asyncHandler = require('../middlewares/asyncHandler');
const { getSellerSummary } = require('../services/userService');
const userSvc = require('../services/userService');
const sellerSvc = require('../services/sellerService');


exports.summary = asyncHandler(async (req, res) => {
    const data = await getSellerSummary(req.params.id);
    res.json(data);
});

exports.updateMySellerProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await userSvc.updateSellerProfile(userId, req.body);
    res.json({ user: result });
});

exports.upgradeMeToSeller = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await userSvc.upgradeToSeller(userId);
    res.json({ user: result });
});

exports.me = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await sellerSvc.getMe(userId);
    res.json(data);
});

exports.updateMyBilling = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const payload = req.body; // ✅ το validateBody ήδη έγραψε τα parsed data εδώ
    const result = await sellerSvc.updateBilling(userId, payload);
    res.json({ user: result });
});