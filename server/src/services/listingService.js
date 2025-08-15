const mongoose = require('mongoose');
const Listing = require('../models/listing.Model');
const Category = require('../models/category.Model');
const path = require('path');
const fs = require('fs');
const { ensureOwnerOrAdmin, isAdmin } = require('../utils/permissions');
const getStorage = require('../config/storage');
const { requireObjectId } = require('../utils/findByAnyId');



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
            ...(priceMax != null ? { $lte: priceMax } : {}),
        };
    }

    // αναμένουμε ObjectId( s ) από το resolver
    let catIds = [];
    if (category) catIds.push(category);
    if (categories) catIds.push(...(Array.isArray(categories) ? categories : [categories]));

    if (catIds.length) {
        const expanded = await expandDescendantsIfNeeded(catIds, includeChildren);
        filter.categories = (categoryMode === 'all') ? { $all: expanded } : { $in: expanded };
    }
    if (qry.seller) {
        const sellerObjId = await requireObjectId(require('../models/user.Model'), qry.seller, 'User');
        filter.sellerId = sellerObjId;
    }

    const projection = q ? { score: { $meta: 'textScore' } } : undefined;

    const cursor = Listing.find(filter, projection)
        .populate('categories', 'name slug _id');

    if (q) cursor.sort({ score: { $meta: 'textScore' } });
    else if (sort === 'price_asc') cursor.sort({ price: 1 });
    else if (sort === 'price_desc') cursor.sort({ price: -1 });
    else cursor.sort({ createdAt: -1 });

    const skip = (Number(page) - 1) * Number(limit);

    const [itemsRaw, total] = await Promise.all([
        cursor.skip(skip).limit(Number(limit)).lean(),
        Listing.countDocuments(filter)
    ]);

    return {
        items: itemsRaw.map(normalizeListing),
        page: Number(page),
        limit: Number(limit),
        total
    };
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
