// src/services/adminSellerService.js
const User = require('../models/user.Model');

async function approve(userId, body = {}) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const noteVal = (typeof body.note === 'string' && body.note.trim()) || undefined;

    user.sellerStatus = 'APPROVED';
    user.sellerProfile = user.sellerProfile || {};
    user.sellerProfile.approved = true;
    user.sellerProfile.approvedAt = new Date();
    user.sellerProfile.reviewNote = noteVal ?? user.sellerProfile.reviewNote ?? null;

    if (!Array.isArray(user.roles)) user.roles = [];
    if (!user.roles.includes('SELLER')) user.roles.push('SELLER');

    await user.save();
    return user.toObject();
}

async function reject(userId, body = {}) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const reason = (typeof body.reason === 'string' && body.reason.trim()) || 'Rejected';

    user.sellerStatus = 'REJECTED';
    user.sellerProfile = user.sellerProfile || {};
    user.sellerProfile.approved = false;
    user.sellerProfile.reviewNote = reason;
    user.sellerProfile.rejectedAt = new Date();

    await user.save();
    return user.toObject();
}

async function needMoreInfo(userId, body = {}) {
    const msg = (typeof body.message === 'string' && body.message.trim()) || 'Please provide more info';

    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    user.sellerStatus = 'NEEDS_MORE_INFO';
    user.sellerProfile = user.sellerProfile || {};
    user.sellerProfile.approved = false;
    user.sellerProfile.reviewNote = msg;
    user.sellerProfile.needsMoreInfoAt = new Date();

    await user.save();
    return user.toObject();
}

module.exports = { approve, reject, needMoreInfo };
