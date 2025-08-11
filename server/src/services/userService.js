const User = require('../models/user.Model');
const mongoose = require('mongoose');

async function listUsers() {
    return User.find({}, { email: 1, username: 1, roles: 1, createdAt: 1, serial: 1 })
        .sort({ createdAt: -1 })
        .lean();
}

async function getUser(idOrUuidOrSerial) {
    // Μπορεί να είναι serial, ObjectId ή publicId
    if (/^\d+$/.test(idOrUuidOrSerial)) {
        return User.findOne({ serial: Number(idOrUuidOrSerial) }, { passwordHash: 0 }).lean();
    }
    if (mongoose.isValidObjectId(idOrUuidOrSerial)) {
        return User.findById(idOrUuidOrSerial, { passwordHash: 0 }).lean();
    }
    return User.findOne({ publicId: idOrUuidOrSerial }, { passwordHash: 0 }).lean();
}

async function updateRoles(idOrUuid, roles) {
    const filter = mongoose.isValidObjectId(idOrUuid)
        ? { _id: idOrUuid }
        : /^\d+$/.test(idOrUuid)
            ? { serial: Number(idOrUuid) }
            : { publicId: idOrUuid };

    const updated = await User.findOneAndUpdate(
        filter,
        { $set: { roles } },
        { new: true, projection: { email: 1, username: 1, roles: 1, serial: 1 } }
    ).lean();

    if (!updated) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
    }
    return updated;
}

async function removeUser(idOrUuid) {
    const filter = mongoose.isValidObjectId(idOrUuid)
        ? { _id: idOrUuid }
        : /^\d+$/.test(idOrUuid)
            ? { serial: Number(idOrUuid) }
            : { publicId: idOrUuid };

    const deleted = await User.findOneAndDelete(filter).lean();
    if (!deleted) {
        const e = new Error('User not found');
        e.status = 404;
        throw e;
    }
    return true;
}

module.exports = { listUsers, getUser, updateRoles, removeUser };
