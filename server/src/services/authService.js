const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.Model');

const SALT_ROUNDS = 10;

function sanitize(u) {
    const obj = u.toObject();
    delete obj.passwordHash; delete obj.__v;
    obj.id = obj.id || obj.publicId || obj._id?.toString();
    delete obj._id; delete obj.publicId;
    return obj;
}

async function register({ email, username, password, name }) {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) { const e = new Error('Email ή username υπάρχει ήδη'); e.status = 409; throw e; }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, username, passwordHash, roles: ['USER'], name });
    return sanitize(user);
}

async function login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) { const e = new Error('Λάθος στοιχεία'); e.status = 401; throw e; }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) { const e = new Error('Λάθος στοιχεία'); e.status = 401; throw e; }
    const accessToken = jwt.sign({ sub: user._id.toString(), roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user: sanitize(user), accessToken };
}

async function changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) { const e = new Error('Current password is incorrect'); e.status = 401; throw e; }
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
    return true;
}

module.exports = { register, login, changePassword };
