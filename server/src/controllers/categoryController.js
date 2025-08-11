const asyncHandler = require('../middlewares/asyncHandler');
const cats = require('../services/categoryService');

exports.list = asyncHandler(async (req, res) => {
    res.json({ items: await cats.list(req.query) });
});

exports.get = asyncHandler(async (req, res) => {
    const c = await cats.get(req.params.slugOrId);
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
});

exports.create = asyncHandler(async (req, res) => {
    const c = await cats.create(req.body);
    res.status(201).json(c);
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await cats.update(req.params.id, req.body));
});

exports.remove = asyncHandler(async (req, res) => {
    await cats.remove(req.params.id);
    res.json({ ok: true });
});
