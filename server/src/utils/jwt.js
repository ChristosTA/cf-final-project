const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TTL = process.env.ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TTL || '30d';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh';

function signAccessToken(user) {
    return jwt.sign(
        { sub: String(user._id), roles: user.roles || [], serial: user.serial, publicId: user.publicId },
        ACCESS_SECRET,
        { expiresIn: ACCESS_TTL }
    );
}
function signRefreshToken(payload) { // { sub, jti }
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}
function verifyRefresh(token) { return jwt.verify(token, REFRESH_SECRET); }

function sha256(s) { return crypto.createHash('sha256').update(String(s)).digest('hex'); }
function randomId(bytes = 16) { return crypto.randomBytes(bytes).toString('hex'); }

module.exports = { signAccessToken, signRefreshToken, verifyRefresh, sha256, randomId, ACCESS_TTL, REFRESH_TTL };
