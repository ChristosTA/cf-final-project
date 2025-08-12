const mongoose = require('mongoose');
const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');

// Helper: κάνε normalize ένα listing ώστε categories => [{id,name,slug}]
function normalizeListing(doc) {
    if (!doc) return doc;
    const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    if (Array.isArray(o.categories)) {
        o.categories = o.categories.map(c => ({
            id: (c.id || c._id?.toString()),
            name: c.name,
            slug: c.slug
        }));
    }
    return o;
}

async function expandDescendantsIfNeeded(baseIds, includeChildren) {
    if (!includeChildren || !baseIds?.length) return baseIds;

    const bases = await Category.find({ _id: { $in: baseIds } }).lean();
    if (!bases.length) return baseIds;

    // Απλοποιημένη λογική με path/slug — προσαρμόζεις αν έχεις άλλη δομή
    // Εδώ, θεωρούμε ότι για έναν γονέα, τα παιδιά έχουν path που περιέχει το slug του γονέα
    const slugs = bases.map(b => b.slug);
    const descendants = await Category.find({ path: { $in: slugs } }).select('_id').lean();

    const extra = descendants.map(d => d._id.toString());
    const base = baseIds.map(x => x.toString());
    return Array.from(new Set([...base, ...extra]));
}

async function list(query) {
    const {
        q, condition, priceMin, priceMax, sort,
        page = 1, limit = 20,
        categories, category, categoryMode = 'any', includeChildren = false
    } = query;

    const filter = {};

    if (q) filter.$text = { $search: q };
    if (condition) filter.condition = condition;
    if (priceMin != null || priceMax != null) {
        filter.price = {
            ...(priceMin != null ? { $gte: priceMin } : {}),
            ...(priceMax != null ? { $lte: priceMax } : {})
        };
    }

    // categories: περιμένουμε ήδη ObjectIds από το resolver middleware
    let catIds = [];
    if (category) catIds.push(category);
    if (categories) catIds.push(...(Array.isArray(categories) ? categories : [categories]));

    if (catIds.length) {
        const expanded = await expandDescendantsIfNeeded(catIds, includeChildren);
        filter.categories = (categoryMode === 'all') ? { $all: expanded } : { $in: expanded };
    }

    const projection = q ? { score: { $meta: 'textScore' } } : undefined;

    const cursor = Listing
        .find(filter, projection)
        .populate('categories', 'name slug _id');

    if (q) cursor.sort({ score: { $meta: 'textScore' } });
    else if (sort === 'price_asc') cursor.sort({ price: 1 });
    else if (sort === 'price_desc') cursor.sort({ price: -1 });
    else cursor.sort({ createdAt: -1 });

    const skip = (Number(page) - 1) * Number(limit);

    const [rawItems, total] = await Promise.all([
        cursor.skip(skip).limit(Number(limit)).lean(),
        Listing.countDocuments(filter)
    ]);

    const items = rawItems.map(normalizeListing);

    return { items, page: Number(page), limit: Number(limit), total };
}

async function create(userId, data) {
    // Προσοχή: περιμένουμε ότι το resolver έχει ήδη μετατρέψει data.categories -> ObjectId[]
    const doc = await Listing.create({
        sellerId: userId,
        title: data.title,
        description: data.description,
        condition: data.condition,
        price: data.price,
        currency: data.currency || 'EUR',
        tags: data.tags || [],
        categories: data.categories || []
    });

    // φέρε και categories με populate για ομοιομορφία στο response
    const populated = await Listing.findById(doc._id)
        .populate('categories', 'name slug _id')
        .lean();

    return normalizeListing(populated);
}

async function updateListing(id, data, user) {
    const update = {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.condition ? { condition: data.condition } : {}),
        ...(data.price != null ? { price: data.price } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(Array.isArray(data.categories) ? { categories: data.categories } : {})
    };

    const updated = await Listing.findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate('categories', 'name slug _id')
        .lean();

    if (!updated) {
        const e = new Error('Not found');
        e.status = 404;
        throw e;
    }
    return normalizeListing(updated);
}

async function getByIdOrPublicId(idOrUuid) {
    let doc;
    if (mongoose.isValidObjectId(idOrUuid)) {
        doc = await Listing.findById(idOrUuid)
            .populate('categories', 'name slug _id')
            .lean();
    } else {
        // serial ή publicId
        const maybeSerial = Number(idOrUuid);
        const filter = Number.isNaN(maybeSerial)
            ? { publicId: idOrUuid }
            : { $or: [{ serial: maybeSerial }, { publicId: idOrUuid }] };

        doc = await Listing.findOne(filter)
            .populate('categories', 'name slug _id')
            .lean();
    }
    if (!doc) return null;
    return normalizeListing(doc);
}

async function deleteListing(id) {
    await Listing.findByIdAndDelete(id);
    return true;
}



async function getAndIncrementViews(objectId) {
    try {
        await Listing.updateOne(
            { _id: listingId },
            { $inc: { 'metrics.views': 1 } }
        ).exec();
    } catch (e) {
        // προαιρετικά log, αλλά μην σπας το request
        console.error('incrementViews failed:', e.message);
    }
    return Listing.findOneAndUpdate(
        { _id: objectId },
        { $inc: { 'metrics.views': 1 } },
        { new: true }        // φέρνει το updated doc
    ).lean();              // ή άστο χωρίς lean αν θέλεις toJSON transforms
}

module.exports = { list, create, updateListing, getByIdOrPublicId, deleteListing, getAndIncrementViews };
