const { Types } = require('mongoose');
const Listing = require('../models/listing.Model');
const Review  = require('../models/review.Model');
const Order   = require('../models/order.Model');
const { findByAnyId } = require('../utils/findByAnyId'); // το έχεις ήδη

// Listing: owner = seller
async function listingOwnerResolver(req) {
    const id = req.params.id;
    const doc = await findByAnyId(Listing, id, { select: 'seller', lean: true });
    return doc?.seller ? String(doc.seller) : null;
}

// Review: owner = user (δημιουργός)
async function reviewOwnerResolver(req) {
    const id = req.params.id;
    const doc = await findByAnyId(Review, id, { select: 'user', lean: true });
    return doc?.user ? String(doc.user) : null;
}

// Order: owner = buyer ή seller (άρα ο έλεγχος γίνεται αλλιώς συνήθως)
// Εδώ δίνουμε τον buyer ως "editor" για order update, ενώ για actions υπάρχει το canActOnOrder middleware σου.
async function orderOwnerResolver(req) {
    const id = req.params.id;
    const doc = await findByAnyId(Order, id, { select: 'buyer seller', lean: true });
    // Αν θες μόνο buyer ως editor, επέστρεψε buyer. Αλλιώς μπορείς να χειριστείς ξεχωριστό middleware.
    return doc?.buyer ? String(doc.buyer) : null;
}

module.exports = { listingOwnerResolver, reviewOwnerResolver, orderOwnerResolver };
