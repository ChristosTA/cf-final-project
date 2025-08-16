// src/controllers/sellerController.js
const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/user.Model');
const state = require('../services/sellerStateService');

// helpers για safe set
const arr = (v) => Array.isArray(v) ? v : [];
const obj = (v) => (v && typeof v === 'object') ? v : {};

exports.saveProfile = asyncHandler(async (req, res) => {
    const uId = req.user._id;
    const body = res.locals?.validated || req.body;

    const update = {
        $set: {
            'sellerProfile.legalName': body.legalName ?? '',
            'sellerProfile.phone': body.phone ?? '',
            'sellerProfile.addresses': arr(body.addresses),
        },
        $addToSet: { roles: 'SELLER' },
    };

    // Μην σκάσεις από validators/casting στο nested – το zod έχει κάνει τον έλεγχο ήδη.
    await User.updateOne({ _id: uId }, update, { runValidators: false });
    const fresh = await User.findById(uId).select('_id email roles sellerStatus sellerProfile').lean();
    res.json(fresh);
});

exports.saveBilling = asyncHandler(async (req, res) => {
    const me = await User.findById(req.user._id).select('sellerStatus').lean();
    if (!me) return res.status(404).json({ message: 'User not found' });
    if (me.sellerStatus !== 'APPROVED') {
        return res.status(403).json({ message: 'Seller not approved' });
    }

    const body = res.locals?.validated || req.body;
    const billing = obj(body.address);

    const update = {
        $set: {
            'sellerProfile.billing.legalName': body.legalName ?? '',
            'sellerProfile.billing.taxId': body.taxId ?? '',
            'sellerProfile.billing.address': {
                line1: billing.line1 ?? '',
                city: billing.city ?? '',
                country: billing.country ?? '',
                postalCode: billing.postalCode ?? '',
            },
        },
    };

    await User.updateOne({ _id: req.user._id }, update, { runValidators: false });
    const fresh = await User.findById(req.user._id).select('_id sellerProfile sellerStatus').lean();
    res.json(fresh);
});

exports.adminApprove = asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.params.id }, { $set: { sellerStatus: 'APPROVED' } });
    const fresh = await User.findById(req.params.id).select('_id sellerStatus').lean();
    res.json(fresh);
});

exports.adminReject = asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.params.id }, { $set: { sellerStatus: 'REJECTED' } });
    const fresh = await User.findById(req.params.id).select('_id sellerStatus').lean();
    res.json(fresh);
});
