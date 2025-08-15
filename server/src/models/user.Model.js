const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Counter = require('./counter.Model');

const addressSchema = new mongoose.Schema({
    fullName: { type: String, trim: true },
    line1:    { type: String, trim: true, required: true },
    line2:    { type: String, trim: true },
    city:     { type: String, trim: true, required: true },
    region:   { type: String, trim: true },         // νομός/περιφέρεια
    postalCode: { type: String, trim: true, required: true },
    country:  { type: String, trim: true, default: 'GR' }
}, { _id: false });

const sellerProfileSchema = new mongoose.Schema({
    businessName: { type: String, trim: true },     // προαιρετικό για MVP
    billingAddress: { type: addressSchema, required: false },
    approved: { type: Boolean, default: false },    // για μελλοντικό manual approval
    approvedAt: { type: Date }
}, { _id: false });


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, index: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ['USER','ADMIN','SELLER',"BUYER"], default: ['USER'], index: true },
    publicId: { type: String, unique: true, index: true },
    serial: { type: Number, unique: true, index: true }
}, { timestamps: true });

userSchema.pre('save', async function(next){
    try {
        if (!this.publicId) this.publicId = uuidv4();
        if (this.isNew && (this.serial == null)) {
            const c = await Counter.findByIdAndUpdate(
                'User',
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.serial = c.seq;
        }
        next();
    } catch (err) { next(err); }
});

userSchema.set('toJSON', {
    virtuals: true,
    transform(doc, ret) {
        ret.id = ret.publicId || ret._id?.toString();
        delete ret._id; delete ret.__v; delete ret.passwordHash; delete ret.publicId;
    }
});

userSchema.add({
    sellerProfile: { type: sellerProfileSchema, default: {} },
    // αν θέλεις και γενικές διευθύνσεις:
    addresses: { type: [addressSchema], default: [] }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.User     || mongoose.model('User', userSchema);
