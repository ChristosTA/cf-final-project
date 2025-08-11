const Category = require('../models/category.Model');
const { isValidObjectId } = require('mongoose');

async function list({ parent, q }) {
    const filter = {};
    if (parent === 'root') filter.parentId = null;
    else if (parent) filter.parentId = parent;
    if (q) filter.name = { $regex: q, $options: 'i' };
    return Category.find(filter).sort({ name:1 }).lean();
}

async function get(slugOrId) {
    return (isValidObjectId(slugOrId))
        ? Category.findById(slugOrId).lean()
        : Category.findOne({ slug: slugOrId }).lean();
}

async function create({ name, slug, parentId }) {
    const cat = await Category.create({ name, slug, parentId: parentId || null });
    const path = [];
    if (cat.parentId) {
        const parent = await Category.findById(cat.parentId).lean();
        if (!parent) { const e = new Error('Invalid parentId'); e.status = 400; throw e; }
        path.push(...parent.path, parent.slug);
    }
    await Category.updateOne({ _id: cat._id }, { $set: { path } });
    return Category.findById(cat._id).lean();
}

async function update(id, data) {
    const updated = await Category.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    if (!updated) { const e = new Error('Not found'); e.status = 404; throw e; }
    return updated;
}

async function remove(id) {
    const children = await Category.countDocuments({ parentId: id });
    if (children > 0) { const e = new Error('Category has children'); e.status = 400; throw e; }
    const r = await Category.findByIdAndDelete(id);
    if (!r) { const e = new Error('Not found'); e.status = 404; throw e; }
    return true;
}

module.exports = { list, get, create, update, remove };
