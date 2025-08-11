const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');
const mongoose = require('mongoose');
const { findListingByAnyId } = require('../utils/findByAnyId');

async function list(query) {
    const { q, category, condition, priceMin, priceMax, sort, page = 1, limit = 20 } = query;
    const filter = { status: 'ACTIVE' };

    if (q) filter.$text = { $search: q };
    if (condition) filter.condition = condition;
    if (priceMin != null) filter.price = { ...(filter.price||{}), $gte: Number(priceMin) };
    if (priceMax != null) filter.price = { ...(filter.price||{}), $lte: Number(priceMax) };

    if (category) {
        // δέξου slug ή id της κατηγορίας
        let cat;
        if (mongoose.isValidObjectId(category)) cat = await Category.findById(category).lean();
        else cat = await Category.findOne({ slug: category }).lean();
        if (cat) filter.categoryId = cat._id;
    }

    const sortSpec = sort === 'price_asc' ? { price: 1 }
        : sort === 'price_desc' ? { price: -1 }
            : { createdAt: -1 };

    const total = await Listing.countDocuments(filter);
    const items = await Listing.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    return { items, page: Number(page), limit: Number(limit), total };
}

async function create(userId, data) {
    const doc = await Listing.create({
        sellerId: userId,
        title: data.title,
        description: data.description,
        condition: data.condition || 'GOOD',
        price: data.price,
        currency: data.currency || 'EUR',
        photos: data.photos || [],
        tags: data.tags || [],
        categoryId: data.categoryId || null
    });
    return doc.toJSON();
}

async function getByIdOrPublicId(id) {
    const doc = await findListingByAnyId(id);
    return doc;
}

async function updateListing(idOrSerialOrUuid, data, authUser) {
    // Βρες το listing: δέχεται serial | ObjectId | UUID
    let doc;
    if (/^\d+$/.test(idOrSerialOrUuid)) {
        doc = await Listing.findOne({ serial: Number(idOrSerialOrUuid) });
    } else if (mongoose.isValidObjectId(idOrSerialOrUuid)) {
        doc = await Listing.findById(idOrSerialOrUuid);
    } else {
        doc = await Listing.findOne({ publicId: idOrSerialOrUuid });
    }
    if (!doc) { const e = new Error('Listing not found'); e.status = 404; throw e; }

    // RBAC: ADMIN ή owner (SELLER του doc)
    const isAdmin = authUser.roles?.includes('ADMIN');
    if (!isAdmin && String(doc.sellerId) !== String(authUser.id)) {
        const e = new Error('Forbidden');
        e.status = 403; throw e;
    }

    // Προαιρετικά: validate ότι το categoryId υπάρχει
    if (data.categoryId) {
        const okCat = await Category.exists({ _id: data.categoryId });
        if (!okCat) { const e = new Error('Invalid categoryId'); e.status = 422; throw e; }
    }

    Object.assign(doc, data);
    await doc.save();
    return doc.toJSON();
}

async function deleteListing(idOrSerialOrUuid, authUser) {
    // Βρες το listing
    let doc;
    if (/^\d+$/.test(idOrSerialOrUuid)) {
        doc = await Listing.findOne({ serial: Number(idOrSerialOrUuid) });
    } else if (mongoose.isValidObjectId(idOrSerialOrUuid)) {
        doc = await Listing.findById(idOrSerialOrUuid);
    } else {
        doc = await Listing.findOne({ publicId: idOrSerialOrUuid });
    }
    if (!doc) { const e = new Error('Listing not found'); e.status = 404; throw e; }

    // RBAC: ADMIN ή owner
    const isAdmin = authUser.roles?.includes('ADMIN');
    if (!isAdmin && String(doc.sellerId) !== String(authUser.id)) {
        const e = new Error('Forbidden');
        e.status = 403; throw e;
    }

    await doc.deleteOne();
    return true;
}

module.exports = { list, create, getByIdOrPublicId, deleteListing, updateListing };
