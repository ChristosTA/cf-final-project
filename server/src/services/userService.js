
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

module.exports = { listUsers, getUser, updateRoles, removeUser,getMe, updateMe };
