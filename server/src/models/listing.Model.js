const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Counter = require('./counter.Model');


const listingSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    condition: { type: String, enum: ['NEW_WITH_TAGS','NEW','EXCELLENT','GOOD','FAIR'], default: 'GOOD' },
    price: { type: Number, required: true }, // euros
    currency: { type: String, default: 'EUR' },
    photos: [{ url: String, isCover: Boolean }],
    tags: [String],
    status: { type: String, enum: ['ACTIVE','RESERVED','SOLD','HIDDEN'], default: 'ACTIVE', index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
    publicId: { type: String, unique: true, index: true },
    serial: { type: Number, unique: true, index: true }
}, { timestamps: true });

listingSchema.pre('save', async function(next){
    try {
        if (!this.publicId) this.publicId = uuidv4();
        if (this.isNew && (this.serial == null)) {
            const c = await Counter.findByIdAndUpdate(
                'Listing',
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.serial = c.seq;
        }
        next();
    } catch (err) {
        next(err);
    }
});

listingSchema.index({ title: 'text', description: 'text', tags: 'text' }, {
    weights: { title: 5, tags: 3, description: 1 }
});

listingSchema.set('toJSON', {
    virtuals: true,
    transform(doc, ret) {
        ret.id = ret.publicId || ret._id?.toString();
        delete ret._id; delete ret.__v; delete ret.publicId;
    }
});
listingSchema.set('toObject', { virtuals: true });



module.exports = mongoose.model('Listing', listingSchema);
