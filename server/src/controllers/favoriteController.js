const asyncHandler = require('../middlewares/asyncHandler');
const svc = require('../services/favoriteService');

exports.add = asyncHandler(async (req, res) => {
    await svc.addFavorite(req.user.id, req.params.id);
    res.json({ ok: true });
});

exports.remove = asyncHandler(async (req, res) => {
    await svc.removeFavorite(req.user.id, req.params.id);
    res.json({ ok: true });
});

exports.listMine = asyncHandler(async (req, res) => {
    const r = await svc.listFavorites(req.user.id, req.query);
    res.set('X-Total-Count', r.total);
    res.json(r);
});
