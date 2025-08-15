const User = require('../models/user.Model');
const { normalizeIban, ibanLast4, sha256 } = require('../utils/security');
const { isSellerApproved } = require('../utils/isSellerApproved');

async function getMe(userId) {
    const user = await User.findById(userId, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
    return user;
}

async function updateBilling(userId, payload) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    if (!isSellerApproved(user)) {
        const e = new Error('Billing can be added only after admin approval'); e.status = 400; throw e;
    }

    const ibanNorm = normalizeIban(payload.iban);
    const set = {
        'sellerProfile.billing.legalName': payload.legalName,
        'sellerProfile.billing.vatNumber': payload.vatNumber,
        'sellerProfile.billing.billingAddress': payload.billingAddress,
        'sellerProfile.billing.ibanLast4': ibanLast4(ibanNorm),
        'sellerProfile.billing.ibanHash': sha256(ibanNorm),
        'sellerProfile.billing.updatedAt': new Date()
    };

    await User.updateOne({ _id: userId }, { $set: set });
    return await User.findById(userId, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
}

module.exports = { getMe, updateBilling };
