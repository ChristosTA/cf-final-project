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

async function updateProfile(userId, payload) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const set = {
        'sellerProfile.legalName': payload.legalName,
        'sellerProfile.phone': payload.phone,
        'sellerProfile.addresses': payload.addresses,
        'sellerProfile.updatedAt': new Date()
    };

    // αν ήταν NONE/REJECTED, στείλ' το ξανά για έγκριση
    if (!user.sellerStatus || user.sellerStatus === 'NONE' || user.sellerStatus === 'REJECTED') {
        set['sellerStatus'] = 'PENDING';
        set['sellerProfile.approved'] = false;
        set['sellerProfile.approvedAt'] = null;
    }

    await User.updateOne({ _id: userId }, { $set: set });

    return await User.findById(userId, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
}

async function updateBilling(userId, payload) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    // ΑΠΑΓΟΡΕΥΣΗ χωρίς approval (403 όπως θες στα tests)
    if (!isSellerApproved(user)) {
        const e = new Error('Billing can be added only after admin approval');
        e.status = 403;
        throw e;
    }

    const ibanNorm = payload.iban ? normalizeIban(payload.iban) : null;

    const set = {
        'sellerProfile.billing.legalName': payload.legalName,
        'sellerProfile.billing.taxId': payload.taxId,
        'sellerProfile.billing.address': payload.address,
        'sellerProfile.billing.updatedAt': new Date()
    };

    if (ibanNorm) {
        set['sellerProfile.billing.ibanLast4'] = ibanLast4(ibanNorm);
        set['sellerProfile.billing.ibanHash'] = sha256(ibanNorm);
    }

    await User.updateOne({ _id: userId }, { $set: set });

    return await User.findById(userId, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
}

module.exports = { getMe, updateProfile, updateBilling };
