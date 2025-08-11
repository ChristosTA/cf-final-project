const mongoose = require('mongoose');

function isNumeric(str) { return /^[0-9]+$/.test(String(str)); }

async function findListingByAnyId(idOrUuidOrSerial, projection){
    const Listing = require('../models/listing.Model');
    if (isNumeric(idOrUuidOrSerial)) {
        return Listing.findOne({ serial: Number(idOrUuidOrSerial) }, projection);
    }
    if (mongoose.isValidObjectId(idOrUuidOrSerial)) {
        return Listing.findById(idOrUuidOrSerial, projection);
    }
    return Listing.findOne({ publicId: idOrUuidOrSerial }, projection);
}

module.exports = { findListingByAnyId };
