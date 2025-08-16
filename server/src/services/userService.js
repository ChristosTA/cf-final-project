const User = require('../models/user.Model');
const { isAdmin } = require('../utils/permissions');
const { isSellerApproved } = require('../utils/isSellerApproved');

/* helpers */
function toPublicUser(u) {
    const obj = u?.toObject ? u.toObject() : u;
    return {
        id: obj?.publicId || obj?._id?.toString(),
        username: obj?.username,
        name: obj?.name || null,
        roles: obj?.roles,
        serial: obj?.serial || undefined,
        createdAt: obj?.createdAt
    };
}

function pick(obj, keys) {
    const out = {};
    for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
    return out;
}
function toSafe(u) {
    return u?.toJSON ? u.toJSON() : u;
}

/* me */
async function getMe(userId) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
    return toSafe(user);
}
async function updateMe(userId, data) {
    const patch = {};
    if (data.name) patch.name = data.name;

    const updated = await User.findByIdAndUpdate(userId, { $set: patch }, { new: true });
    if (!updated) { const e = new Error('User not found'); e.status = 404; throw e; }
    return toSafe(updated);
}

/* users admin */
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
    if (!u) { const e = new Error('Not found'); e.status = 404; throw e; }   // ✅ avoid undefined
    return toPublicUser(u);
}
async function updateRoles(objectId, roles, currentUser) {
    if (!isAdmin(currentUser)) { const e = new Error('Forbidden'); e.status = 403; throw e; }
    const updated = await User.findByIdAndUpdate(
        objectId,
        { $set: { roles } },
        { new: true, projection: { email:1, username:1, name:1, roles:1, serial:1, publicId:1, createdAt:1, updatedAt:1 } }
    ).lean();
    if (!updated) { const e = new Error('Not found'); e.status = 404; throw e; }
    return toPublicUser(updated);
}
async function removeUser(objectId, currentUser) {
    if (!isAdmin(currentUser)) { const e = new Error('Forbidden'); e.status = 403; throw e; }
    const r = await User.findByIdAndDelete(objectId);
    if (!r) { const e = new Error('Not found'); e.status = 404; throw e; }
    return true;
}

/* seller profile */
async function updateSellerProfile(userId, payload) {
    const user = await User.findById(userId, { sellerStatus: 1, sellerProfile: 1 }).lean();
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const profileUpdate = pick(payload, ['shopName', 'description', 'phone', 'addresses']);

    const currentProfile = (user.sellerProfile && user.sellerProfile.profile) ? user.sellerProfile.profile : {};
    const set = {
        'sellerProfile.profile': { ...currentProfile, ...profileUpdate },
        'sellerProfile.profileUpdatedAt': new Date()
    };

    // αν ήταν NONE, πάει DRAFT με το πρώτο profile update
    if (user.sellerStatus === 'NONE' || !user.sellerStatus) set['sellerStatus'] = 'DRAFT';

    await User.updateOne({ _id: userId }, { $set: set });
    return await User.findById(userId, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
}

/** Προϋποθέσεις upgrade:
 * 1) Admin APPROVED
 * 2) Συμπληρωμένο billing (legalName + billingAddress)
 */
async function upgradeToSeller(userId) {
    const u = await User.findById(userId);
    if (!u) { const e = new Error('User not found'); e.status = 404; throw e; }

    const approved = isSellerApproved(u);                 // ✅ χρησιμοποίησε το helper
    const hasBilling = !!u.sellerProfile?.billing?.legalName
        && !!u.sellerProfile?.billing?.billingAddress?.line1;

    if (!approved) { const e = new Error('Admin approval required'); e.status = 400; throw e; }
    if (!hasBilling) { const e = new Error('Billing info required'); e.status = 400; throw e; }

    if (!Array.isArray(u.roles)) u.roles = [];
    if (!u.roles.includes('SELLER')) {
        u.roles.push('SELLER');
        u.sellerProfile = u.sellerProfile || {};
        u.sellerProfile.activatedAt = new Date();
        await u.save();
    }
    return u.toObject();
}

async function getSellerSummary(id) {
    const user = await User.findById(id, {
        email: 1, username: 1, roles: 1, sellerStatus: 1, sellerProfile: 1, serial: 1, publicId: 1
    }).lean();
    if (!user) { const e = new Error('Not found'); e.status = 404; throw e; }
    return user;
}

module.exports = {
    listUsers,
    getUser,
    updateRoles,
    removeUser,
    getMe,
    updateMe,
    getSellerSummary,
    upgradeToSeller,
    updateSellerProfile
};