// src/controllers/adminSellerController.js
const asyncHandler = require('../middlewares/asyncHandler');
const adminSvc = require('../services/adminSellerService');

exports.approve = asyncHandler(async (req, res) => {
    const user = await adminSvc.approve(req.params.id, req.body || {});
    res.json({ user });
});
exports.reject = asyncHandler(async (req, res) => {
    const user = await adminSvc.reject(req.params.id, req.body || {});
    res.json({ user });
});
exports.needMoreInfo = asyncHandler(async (req, res) => {
    const user = await adminSvc.needMoreInfo(req.params.id, req.body || {});
    res.json({ user });
});
