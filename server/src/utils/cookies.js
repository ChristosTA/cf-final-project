const PROD = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_NAME  = process.env.ACCESS_COOKIE_NAME  || 'accessToken';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';

const ACCESS_MAX_AGE_SEC  = parseInt(process.env.ACCESS_MAX_AGE_SEC  || '900',     10); // 15m
const REFRESH_MAX_AGE_SEC = parseInt(process.env.REFRESH_MAX_AGE_SEC || '2592000', 10); // 30d

function cookieBase() {
    const secure = PROD || String(process.env.COOKIE_SECURE).toLowerCase() === 'true';
    const sameSite = process.env.COOKIE_SAMESITE || 'lax'; // 'lax' ok για SSR
    const domain   = process.env.COOKIE_DOMAIN || undefined; // π.χ. .myapp.com σε prod
    return { httpOnly: true, secure, sameSite, domain, path: '/' };
}

function setAuthCookies(res, { accessToken, refreshToken }) {
    const base = cookieBase();
    res.cookie(ACCESS_COOKIE_NAME,  accessToken,  { ...base, maxAge: ACCESS_MAX_AGE_SEC  * 1000 });
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, { ...base, maxAge: REFRESH_MAX_AGE_SEC * 1000 });
}

function clearAuthCookies(res) {
    const base = cookieBase();
    res.clearCookie(ACCESS_COOKIE_NAME,  base);
    res.clearCookie(REFRESH_COOKIE_NAME, base);
}

module.exports = {
    setAuthCookies,
    clearAuthCookies,
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
};
