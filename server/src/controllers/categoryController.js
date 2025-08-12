const asyncHandler = require('../middlewares/asyncHandler');
const cats = require('../services/categoryService');

exports.list = asyncHandler(async (req, res) => {
    res.json({ items: await cats.list(req.query) });
});

exports.get = asyncHandler(async (req, res) => {
    const c = await cats.get(req.params.slugOrId);
    if (!c) return res.status(404).json({ message: 'Not found' });
    const out = { ...c, id: (c.id || c._id?.toString()) };
    delete out._id; delete out.__v;
    res.json(out);
});

exports.create = asyncHandler(async (req, res) => {
    const c = await cats.create(req.body); // αν επιστρέφει lean()
    // normalize (αν χρειάζεται)
    const out = { ...c, id: (c.id || c._id?.toString()) };
    delete out._id; delete out.__v;
    res.status(201).json(out);
});

exports.update = asyncHandler(async (req, res) => {
    res.json(await cats.update(req.params.id, req.body));
});

exports.remove = asyncHandler(async (req, res) => {
    await cats.remove(req.params.id);
    res.json({ ok: true });
});
