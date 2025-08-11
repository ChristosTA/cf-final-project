const Category = require('../models/category.Model');

async function seedCategories() {
    const count = await Category.countDocuments();
    if (count > 0) return { skipped: true, count };

    const base = await Category.insertMany([
        { name: 'Women', slug: 'women', parentId: null },
        { name: 'Men', slug: 'men', parentId: null },
        { name: 'Kids', slug: 'kids', parentId: null }
    ]);

    const women = base.find(c => c.slug === 'women');
    const men = base.find(c => c.slug === 'men');

    await Category.insertMany([
        { name: 'Shoes', slug: 'women-shoes', parentId: women._id, path: ['women'] },
        { name: 'Bags', slug: 'women-bags', parentId: women._id, path: ['women'] },
        { name: 'Shoes', slug: 'men-shoes', parentId: men._id, path: ['men'] }
    ]);

    // rebuild paths (ασφαλώς)
    const all = await Category.find().lean();
    const map = new Map(all.map(c => [String(c._id), c]));
    const build = (c) => {
        const p = [];
        let cur = c;
        while (cur && cur.parentId) {
            const par = map.get(String(cur.parentId));
            if (!par) break;
            p.unshift(par.slug);
            cur = par;
        }
        return p;
    };
    await Promise.all(all.map(c => Category.updateOne({ _id: c._id }, { $set: { path: build(c) } })));

    return { seeded: true };
}

module.exports = { seedCategories };
