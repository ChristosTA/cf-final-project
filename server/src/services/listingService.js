const mongoose = require('mongoose');
const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');
const path = require('path');
const fs = require('fs');
const { ensureOwnerOrAdmin, isAdmin } = require('../utils/permissions');
const getStorage = require('../config/storage');
const  requireObjectId = require('../utils/findByAnyId');



/* ---------- helpers ---------- */
function normalizeListing(doc) {
    if (!doc) return doc;
    const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    if (Array.isArray(o.categories)) {
        o.categories = o.categories.map(c => ({
            id: (c.id || c._id?.toString()),
            name: c.name,
            slug: c.slug,
        }));
    }
    return o;
}

function buildVariants(photo) {
    const { cloudinary } = getStorage();
    if (photo.provider !== 'cloudinary' || !cloudinary || !photo.key) return [];

    // Χρησιμοποιούμε public_id (key) για να παράγουμε URLs
    const key = photo.key;

    return [
        {
            name: 'thumb',
            url: cloudinary.url(key, {
                width: 200, height: 200, crop: 'fill', gravity: 'auto',
                quality: 'auto', fetch_format: 'auto'
            })
        },
        {
            name: 'sm',
            url: cloudinary.url(key, {
                width: 400, height: 400, crop: 'fill', gravity: 'auto',
                quality: 'auto', fetch_format: 'auto'
            })
        },
        {
            name: 'md',
            url: cloudinary.url(key, {
                width: 800, crop: 'fill', gravity: 'auto',
                quality: 'auto', fetch_format: 'auto'
            })
        }
    ];
}

function serializeListing(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    if (Array.isArray(obj.photos)) {
        obj.photos = obj.photos.map(p => ({
            ...p,
            variants: buildVariants(p)
        }));
    }
    return obj;
}

async function resolveCategoryIds({ category, categories }) {
    const input = [];
    if (category) input.push(category);
    if (Array.isArray(categories) && categories.length) input.push(...categories);
    if (!input.length) return [];

    const uniq = [...new Set(input.map(s => String(s).trim().toLowerCase()))];

    const asObjectIds = uniq.filter(mongoose.isValidObjectId);
    const asSlugs     = uniq.filter(s => !mongoose.isValidObjectId(s));

    const docs = await Category.find({
        $or: [
            { _id: { $in: asObjectIds } },
            { slug: { $in: asSlugs } }
        ]
    }).select('_id');

    return docs.map(d => d._id);
}






function baseUrlFromReq(req) {
    return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}
function filenameFromPath(p) { return path.basename(p); }



async function expandDescendantsIfNeeded(baseIds, includeChildren) {
    if (!includeChildren || !baseIds?.length) return baseIds;
    const bases = await Category.find({ _id: { $in: baseIds } }).lean();
    if (!bases.length) return baseIds;

    const slugs = bases.map(b => b.slug);
    const descendants = await Category.find({ path: { $in: slugs } }).select('_id').lean();
    const extra = descendants.map(d => d._id.toString());
    const base  = baseIds.map(x => x.toString());
    return Array.from(new Set([...base, ...extra]));
}

/* ---------- list ---------- */
async function list(query) {
    const {
        q, category, categories, categoryMode = 'any', includeChildren,
        condition, priceMin, priceMax, sort, page = 1, limit = 20,
        seller, tags, tagMode = 'all',
    } = query;

    const filter = {};

    // full-text
    if (q) filter.$text = { $search: q };

    // condition
    if (condition) filter.condition = condition;

    // price
    if (priceMin != null || priceMax != null) {
        filter.price = {
            ...(priceMin != null ? { $gte: Number(priceMin) } : {}),
            ...(priceMax != null ? { $lte: Number(priceMax) } : {}),
        };
    }

    // categories -> resolve σε ObjectIds
    const catIds = await resolveCategoryIds({ category, categories });

    if (catIds.length) {
        // includeChildren: αν έχεις path/children λογική, εδώ επεκτείνεις catIds
        filter.categories = (categoryMode === 'all')
            ? { $all: catIds }
            : { $in: catIds };
    }

    // seller (δέξου serial/uuid/_id) – αν έχεις requireObjectId util
    // const sellerId = await requireObjectId(User, seller, 'User').catch(()=>null);
    // if (sellerId) filter.sellerId = sellerId;

    // tags (αν τα χρησιμοποιείς)
    if (Array.isArray(tags) && tags.length) {
        const norm = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
        filter.tags = (tagMode === 'all') ? { $all: norm } : { $in: norm };
    }

    // sort
    const sortMap = {
        newest:     { createdAt: -1 },
        price_asc:  { price: 1 },
        price_desc: { price: -1 },
    };
    const sortStage = sortMap[sort] || sortMap.newest;

    // paginate
    const skip = (Number(page) - 1) * Number(limit);

    const cursor = Listing.find(filter)
        .sort(sortStage)
        .skip(skip)
        .limit(Number(limit))
        .populate({ path: 'categories', select: 'name slug _id' })
        .lean();

    const [items, total] = await Promise.all([
        cursor,
        Listing.countDocuments(filter),
    ]);

    return { items, page: Number(page), limit: Number(limit), total };
}


/* ---------- create ---------- */
async function create(userId, data) {
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

    const populated = await Listing.findById(doc._id)
        .populate('categories', 'name slug _id')
        .lean();

    return normalizeListing(populated);
}

/* ---------- update ---------- */
async function updateListing(id, data, user) {
    const existing = await Listing.findById(id).select('sellerId');
    if (!existing) { const e = new Error('Not found'); e.status = 404; throw e; }
    ensureOwnerOrAdmin(user, listing.sellerId);

    const update = {
        ...(data.title        ? { title: data.title }           : {}),
        ...(data.description  ? { description: data.description }: {}),
        ...(data.condition    ? { condition: data.condition }   : {}),
        ...(data.price != null? { price: data.price }           : {}),
        ...(data.currency     ? { currency: data.currency }     : {}),
        ...(data.tags         ? { tags: data.tags }             : {}),
        ...(data.status       ? { status: data.status }         : {}),
        ...(Array.isArray(data.categories) ? { categories: data.categories } : {})
    };

    const updated = await Listing
        .findByIdAndUpdate(id, { $set: update }, { new: true })
        .populate('categories', 'name slug _id')
        .lean();

    if (!updated) { const e = new Error('Not found'); e.status = 404; throw e; }
    return normalizeListing(updated);
}

/* ---------- read (w/ view increment) ---------- */
async function getAndIncrementViews(objectId) {
    const doc = await Listing.findOneAndUpdate(
        { _id: objectId },
        { $inc: { 'metrics.views': 1 } },
        { new: true }
    )
        .populate('categories', 'name slug _id')
        .lean();

    return normalizeListing(doc);
}

/* ---------- read by any id (χωρίς increment) ---------- */
async function getByIdOrPublicId(idOrUuid) {
    let doc;
    if (mongoose.isValidObjectId(idOrUuid)) {
        doc = await Listing.findById(idOrUuid)
            .populate('categories', 'name slug _id').lean();
    } else {
        const maybeSerial = Number(idOrUuid);
        const filter = Number.isNaN(maybeSerial)
            ? { publicId: idOrUuid }
            : { $or: [{ serial: maybeSerial }, { publicId: idOrUuid }] };

        doc = await Listing.findOne(filter)
            .populate('categories', 'name slug _id').lean();
    }
    return normalizeListing(doc);
}

/* ---------- delete ---------- */
async function deleteListing(id, user) {
    const doc = await Listing.findById(id).select('sellerId');
    if (!doc) { const e = new Error('Not found'); e.status = 404; throw e; }
    ensureOwnerOrAdmin(user, listing.sellerId);
    await doc.deleteOne();
    return true;
}


async function addPhotos(listingId, files, currentUser) {
    const listing = await Listing.findById(listingId);
    if (!listing) { const e = new Error('Not found'); e.status = 404; throw e; }

    ensureOwnerOrAdmin(currentUser, listing.sellerId);

    const { mapFile } = getStorage();
    if (!Array.isArray(files) || !files.length) {
        const e = new Error('No files'); e.status = 400; throw e;
    }

    const newPhotos = files.map(f => {
        const m = mapFile(f); // provider,url,key πάντα από adapter
        // extra safety: αν (κακώς) γύρισε absolute path, κάν’ το relative για local
        if (m.provider === 'local' && !isHttp(m.url)) {
            m.url = `/uploads/${path.basename(m.url)}`;
            m.key = path.basename(m.key || m.url);
        }
        return { url: m.url, key: m.key, provider: m.provider, isCover: false };
    });

    listing.photos.push(...newPhotos);
    if (listing.photos.length && !listing.photos.some(p => p.isCover)) {
        listing.photos[0].isCover = true;
    }

    await listing.save();
    return serializeListing(listing);
}

async function removePhoto(listingId, photoId, currentUser) {
    const listing = await Listing.findById(listingId);
    if (!listing) { const e = new Error('Not found'); e.status = 404; throw e; }

    ensureOwnerOrAdmin(currentUser, listing.sellerId);

    const photo = listing.photos.id(photoId);
    if (!photo) { const e = new Error('Photo not found'); e.status = 404; throw e; }

    // Διαγραφή από storage (best-effort)
    try {
        const { cloudinary } = getStorage();
        if (photo.provider === 'cloudinary' && cloudinary) {
            await cloudinary.uploader.destroy(photo.key); // public_id
        } else if (photo.provider === 'local' && photo.key) {
            const uploadDir = process.env.UPLOAD_DIR || 'uploads';
            await fs.unlink(path.join(__dirname, '..', '..', uploadDir, photo.key));
        }
    } catch {
        // ignore
    }

    photo.deleteOne();
    if (!listing.photos.some(p => p.isCover) && listing.photos.length) {
        listing.photos[0].isCover = true;
    }

    await listing.save();
    return serializeListing(listing);
}

async function setCoverPhoto(user, listingId, photoId) {
    const listing = await Listing.findById(listingId);
    if (!listing) { const e = new Error('Not found'); e.status = 404; throw e; }
    ensureOwnerOrAdmin(user, listing.sellerId);

    const photo = listing.photos.id(photoId);
    if (!photo) { const e = new Error('Photo not found'); e.status = 404; throw e; }

    listing.photos.forEach(p => { p.isCover = p._id.equals(photoId); });
    await listing.save();

    const saved = await Listing.findById(listing._id).lean();
    return normalizeListing(saved);
}

module.exports = {
    list,
    create,
    updateListing,
    getAndIncrementViews,
    getByIdOrPublicId,
    deleteListing,
    addPhotos,
    removePhoto,
    setCoverPhoto,
};
