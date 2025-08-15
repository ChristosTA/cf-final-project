
const mongoose = require('mongoose');
const User = require('../models/user.Model');
const { isAdmin } = require('../utils/permissions');


/* helpers */
function toPublicUser(doc) {
    if (!doc) return doc;
    const u = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
        id: u.publicId || u.id,   // public UUID
        serial: u.serial,
        email: u.email,
        username: u.username,
        name: u.name,
        roles: u.roles,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
    };
}

function toPublicUser(u) {
    const obj = u.toObject ? u.toObject() : u;
    return {
        id: obj.publicId || obj._id?.toString(),
        username: obj.username,
        name: obj.name || null,
        roles: obj.roles,
        serial: obj.serial || undefined,
        createdAt: obj.createdAt
    };
}

function toSafe(u) {
    // Mongoose toJSON transform ήδη κρύβει passwordHash και γυρίζει id=publicId
    return u?.toJSON ? u.toJSON() : u;
}

async function getMe(userId) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
    return toSafe(user);
}

async function updateMe(userId, data) {
    const patch = {};
    if (data.name) patch.name = data.name;

    const updated = await User.findByIdAndUpdate(
        userId,
        { $set: patch },
        { new: true }
    );
    if (!updated) { const e = new Error('User not found'); e.status = 404; throw e; }
    return toSafe(updated);
}



async function listUsers() {
    const rows = await User.find({}, { email:1, username:1, name:1, roles:1, serial:1, publicId:1, createdAt:1, updatedAt:1 })
        .sort({ createdAt: -1 })
        .lean();
    return rows.map(toPublicUser);
}

async function getUser(objectId) {
    const u = await User.findById(objectId)
        .select('email username name roles serial publicId createdAt updatedAt')
        .lean();
    return toPublicUser(u);
}

async function updateRoles(objectId, roles, currentUser) {
    if (!isAdmin(currentUser)) {
        const e = new Error('Forbidden');
        e.status = 403;
        throw e;
    }

    const updated = await User.findByIdAndUpdate(
        objectId,
        { $set: { roles } },
        { new: true, projection: { email:1, username:1, name:1, roles:1, serial:1, publicId:1, createdAt:1, updatedAt:1 } }
    ).lean();
    if (!updated) { const e = new Error('Not found'); e.status = 404; throw e; }
    return toPublicUser(updated);
}

async function removeUser(objectId, currentUser) {
    if (!isAdmin(currentUser)) {
        const e = new Error('Forbidden');
        e.status = 403;
        throw e;
    }
    const r = await User.findByIdAndDelete(objectId);
    if (!r) { const e = new Error('Not found'); e.status = 404; throw e; }
    return true;
}

async function getSellerSummary(idOrAny) {
    const _id = await requireObjectId(User, idOrAny, 'User');
    const user = await User.findById(_id).select({ username:1, name:1, roles:1, createdAt:1, publicId:1, serial:1 });
    if (!user) { const e = new Error('Not found'); e.status = 404; throw e; }

    const [activeCount, rating] = await Promise.all([
        Listing.countDocuments({ sellerId: _id, status: 'ACTIVE' }),
        getSellerRating(_id)
    ]);

    return {
        seller: toPublicUser(user),
        stats: { activeListings: activeCount, rating }
    };
}

async function updateSellerProfile(userId, data) {
    const update = {
        ...(data.businessName ? { 'sellerProfile.businessName': data.businessName } : {}),
        ...(data.billingAddress ? { 'sellerProfile.billingAddress': data.billingAddress } : {}),
    };

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true, projection: { email:1, username:1, roles:1, sellerProfile:1 } }
    ).lean();

    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    return user;
}

// μετατροπή σε SELLER (αν έχει billingAddress)
async function upgradeToSeller(userId) {
    const user = await User.findById(userId).lean();
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const hasBilling = !!user.sellerProfile?.billingAddress?.line1;
    if (!hasBilling) {
        const e = new Error('Billing address is required before upgrading to SELLER');
        e.status = 400;
        throw e;
    }

    if (!user.roles?.includes('SELLER')) {
        await User.updateOne({ _id: userId }, { $addToSet: { roles: 'SELLER' } });
    }

    const updated = await User.findById(userId, { email:1, username:1, roles:1, sellerProfile:1 }).lean();
    return updated;
}

module.exports = { listUsers, getUser, updateRoles, removeUser,getMe, updateMe, getSellerSummary, upgradeToSeller, updateSellerProfile };
