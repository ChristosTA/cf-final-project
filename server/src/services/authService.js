const bcrypt = require('bcrypt');
const User = require('../models/user.Model');
const RefreshToken = require('../models/refreshToken.Model');
const PasswordReset = require('../models/passwordReset.Model');
const { signAccessToken, signRefreshToken, verifyRefresh, sha256, randomId } = require('../utils/jwt');

const SALT_ROUNDS = 10;
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d
const RESET_TTL_MS = 1000 * 60 * 15;             // 15m

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

    const accessToken = signAccessToken(user);

    const jti = randomId();
    const refreshToken = signRefreshToken({ sub: String(user._id), jti });
    await RefreshToken.create({
        user: user._id,
        jti,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    });

    return { user: sanitize(user), accessToken, refreshToken };
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

async function refresh({ refreshToken }) {
    let payload;
    try { payload = verifyRefresh(refreshToken); }
    catch { const e = new Error('Invalid refresh token'); e.status = 401; throw e; }

    const doc = await RefreshToken.findOne({ jti: payload.jti, tokenHash: sha256(refreshToken), revokedAt: null });
    if (!doc || doc.expiresAt < new Date()) {
        const e = new Error('Refresh token not active'); e.status = 401; throw e;
    }

    // rotate
    doc.revokedAt = new Date();
    const newJti = randomId();
    doc.replacedByJti = newJti;
    await doc.save();

    const user = await User.findById(payload.sub);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    const newRefresh = signRefreshToken({ sub: String(user._id), jti: newJti });
    await RefreshToken.create({
        user: user._id, jti: newJti, tokenHash: sha256(newRefresh),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    });

    const accessToken = signAccessToken(user);
    return { accessToken, refreshToken: newRefresh };
}

async function logout({ refreshToken }) {
    try {
        const { jti } = verifyRefresh(refreshToken);
        await RefreshToken.updateOne(
            { jti, tokenHash: sha256(refreshToken), revokedAt: null },
            { $set: { revokedAt: new Date() } }
        );
    } catch { /* idempotent */ }
    return { ok: true };
}

// === Recovery ===
async function requestRecovery({ email }) {
    const user = await User.findOne({ email });
    if (!user) return { ok: true }; // privacy

    const raw = randomId(24);
    await PasswordReset.create({
        user: user._id,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + RESET_TTL_MS)
    });

    // DEV: επιστρέφω το token για δοκιμές (σε prod -> στείλε email)
    return { ok: true, token: raw };
}

async function confirmRecovery({ token, password }) {
    const rec = await PasswordReset.findOne({ tokenHash: sha256(token) });
    if (!rec || rec.usedAt || rec.expiresAt < new Date()) {
        const e = new Error('Invalid or expired token'); e.status = 400; throw e;
    }
    const user = await User.findById(rec.user);
    if (!user) { const e = new Error('User not found'); e.status = 404; throw e; }

    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await user.save();

    rec.usedAt = new Date();
    await rec.save();

    // ασφάλεια: revoke όλα τα ενεργά refresh
    await RefreshToken.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });

    return { ok: true };
}

module.exports = { register, login, changePassword, refresh, logout, requestRecovery, confirmRecovery };
