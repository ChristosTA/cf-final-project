const crypto = require('crypto');
const { ACCESS_COOKIE_NAME } = require('../utils/cookies');

const PROD = process.env.NODE_ENV === 'production';

function issueCsrfToken(req, res) {
    const token = crypto.randomBytes(16).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, sameSite: 'lax', secure: PROD, path: '/'
    });
    res.json({ csrfToken: token });
}

// apply μόνο όταν αυθεντικοποιούμαστε με cookie (όχι με Bearer)
function csrfIfCookieAuth(req, res, next) {
    const unsafe = !['GET','HEAD','OPTIONS'].includes(req.method);
    const hasBearer = (req.headers.authorization || '').startsWith('Bearer ');
    const hasAccessCookie = !!req.cookies?.[ACCESS_COOKIE_NAME];

    if (!unsafe || hasBearer || !hasAccessCookie) return next();

    const cookie = req.cookies['XSRF-TOKEN'];
    const header = req.get('x-csrf-token');
    if (!cookie || !header || cookie !== header) {
        const e = new Error('Invalid CSRF token'); e.status = 403; throw e;
    }
    return next();
}

module.exports = { csrfIfCookieAuth, issueCsrfToken };
