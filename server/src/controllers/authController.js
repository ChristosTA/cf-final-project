const asyncHandler = require('../middlewares/asyncHandler');
const auth = require('../services/authService');
const { setAuthCookies, clearAuthCookies, REFRESH_COOKIE_NAME } = require('../utils/cookies');

exports.register = asyncHandler(async (req, res) => {
    const user = await auth.register(req.body);
    res.status(201).json({ user });
});

exports.login = asyncHandler(async (req, res) => {
    const r = await auth.login(req.body);
    res.json(r);
});

exports.changePassword = asyncHandler(async (req, res) => {
    await auth.changePassword(req.user.id, req.body);
    res.json({ message: 'Password changed' });
});

// === ΝΕΑ ===
exports.refresh = asyncHandler(async (req, res) => {
    const out = await auth.refresh(req.body);
    res.json(out);
});

exports.logout = asyncHandler(async (req, res) => {
    await auth.logout(req.body || {});
    res.status(204).send();
});

exports.requestRecovery = asyncHandler(async (req, res) => {
    const out = await auth.requestRecovery(req.body);
    res.json(out); // σε DEV θα δεις { token }
});

exports.confirmRecovery = asyncHandler(async (req, res) => {
    await auth.confirmRecovery(req.body);
    res.json({ ok: true });
});

exports.loginCookie = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await auth.login(req.body);
    setAuthCookies(res, { accessToken, refreshToken });
    // Προαιρετικά: μην στέλνεις tokens στο body όταν δουλεύεις με cookies
    res.json({ user });
});

// POST /api/auth/refresh-cookie
exports.refreshCookie = asyncHandler(async (req, res) => {
    // παίρνουμε refreshToken από cookie (ή fallback από body)
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    const token = tokenFromCookie || req.body?.refreshToken;
    if (!token) { const e = new Error('Missing refresh token'); e.status = 401; throw e; }

    const { accessToken, refreshToken } = await auth.refresh({ refreshToken: token });
    setAuthCookies(res, { accessToken, refreshToken });
    res.json({ ok: true });
});

// POST /api/auth/logout-cookie
exports.logoutCookie = asyncHandler(async (req, res) => {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    const token = tokenFromCookie || req.body?.refreshToken;
    if (token) await auth.logout({ refreshToken: token }); // idempotent
    clearAuthCookies(res);
    res.status(204).send();
});